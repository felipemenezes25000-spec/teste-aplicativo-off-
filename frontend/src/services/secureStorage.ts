import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * SecureStorage service that uses SecureStore on mobile and AsyncStorage on web
 * Provides a unified interface for secure token storage across platforms
 */
class SecureStorage {
  /**
   * Check if SecureStore is available on current platform
   */
  private get isSecureStoreAvailable() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Save a value securely
   * Uses SecureStore on mobile platforms and AsyncStorage on web
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // On web, use AsyncStorage with a prefix to indicate sensitive data
        await AsyncStorage.setItem(`@secure_${key}`, value);
      }
    } catch (error) {
      console.error(`Error saving secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureStoreAvailable) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(`@secure_${key}`);
      }
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a value
   */
  async deleteItem(key: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(`@secure_${key}`);
      }
    } catch (error) {
      console.error(`Error deleting secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple values
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.deleteItem(key)));
    } catch (error) {
      console.error('Error deleting multiple secure items:', error);
      throw error;
    }
  }

  /**
   * Migrate existing AsyncStorage tokens to SecureStore
   * This should be run once when updating the app
   */
  async migrateFromAsyncStorage(): Promise<void> {
    if (!this.isSecureStoreAvailable) {
      // No need to migrate on web
      return;
    }

    try {
      // Check if migration already done
      const migrated = await AsyncStorage.getItem('@migrated_to_secure_store');
      if (migrated === 'true') {
        return;
      }

      // Migrate token
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await this.setItem('token', token);
        await AsyncStorage.removeItem('token');
      }

      // Migrate refresh token if exists
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await this.setItem('refresh_token', refreshToken);
        await AsyncStorage.removeItem('refresh_token');
      }

      // Mark migration as complete
      await AsyncStorage.setItem('@migrated_to_secure_store', 'true');
    } catch (error) {
      console.error('Error migrating to secure storage:', error);
      // Don't throw - app should continue working even if migration fails
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Export convenience functions
export default {
  setToken: (token: string) => secureStorage.setItem('token', token),
  getToken: () => secureStorage.getItem('token'),
  deleteToken: () => secureStorage.deleteItem('token'),
  setRefreshToken: (token: string) => secureStorage.setItem('refresh_token', token),
  getRefreshToken: () => secureStorage.getItem('refresh_token'),
  deleteRefreshToken: () => secureStorage.deleteItem('refresh_token'),
  clearAuth: () => secureStorage.deleteMultiple(['token', 'refresh_token']),
  migrate: () => secureStorage.migrateFromAsyncStorage(),
};