/**
 * SecureStorage Service Tests
 * Tests for secure token storage functionality
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '../src/services/secureStorage';

// Mock dependencies
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('SecureStorage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform OS for each test
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true
    });
  });

  describe('setItem', () => {
    it('should use SecureStore on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      await secureStorage.setItem('test_key', 'test_value');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', 'test_value');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use SecureStore on Android', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      await secureStorage.setItem('test_key', 'test_value');
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', 'test_value');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should use AsyncStorage with prefix on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      await secureStorage.setItem('test_key', 'test_value');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@secure_test_key', 'test_value');
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(secureStorage.setItem('test_key', 'test_value')).rejects.toThrow('Storage error');
    });
  });

  describe('getItem', () => {
    it('should use SecureStore on mobile platforms', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored_value');
      
      const result = await secureStorage.getItem('test_key');
      
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test_key');
      expect(result).toBe('stored_value');
    });

    it('should use AsyncStorage with prefix on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored_value');
      
      const result = await secureStorage.getItem('test_key');
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@secure_test_key');
      expect(result).toBe('stored_value');
    });

    it('should return null on error', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      const result = await secureStorage.getItem('test_key');
      
      expect(result).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('should use SecureStore on mobile platforms', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      await secureStorage.deleteItem('test_key');
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test_key');
    });

    it('should use AsyncStorage on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      await secureStorage.deleteItem('test_key');
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@secure_test_key');
    });
  });

  describe('migrateFromAsyncStorage', () => {
    it('should skip migration on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      await secureStorage.migrateFromAsyncStorage();
      
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should skip if already migrated', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@migrated_to_secure_store') return Promise.resolve('true');
        return Promise.resolve(null);
      });
      
      await secureStorage.migrateFromAsyncStorage();
      
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should migrate existing tokens', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@migrated_to_secure_store') return Promise.resolve(null);
        if (key === 'token') return Promise.resolve('existing_token');
        if (key === 'refresh_token') return Promise.resolve('existing_refresh');
        return Promise.resolve(null);
      });
      
      await secureStorage.migrateFromAsyncStorage();
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'existing_token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'existing_refresh');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@migrated_to_secure_store', 'true');
    });

    it('should not throw on migration error', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(secureStorage.migrateFromAsyncStorage()).resolves.not.toThrow();
    });
  });
});