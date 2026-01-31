import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureStorage from '../services/secureStorage';
import { authAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  registerDoctor: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    crm: string;
    crm_state: string;
    specialty: string;
  }) => Promise<{ success: boolean; error?: string }>;
  registerNurse: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    coren: string;
    coren_state: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // Migrate tokens from AsyncStorage to SecureStore if needed
      await secureStorage.migrate();
      
      const storedToken = await secureStorage.getToken();
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Verify token is still valid
        try {
          const userData = await authAPI.getMe();
          // Preserve doctor_profile and nurse_profile from stored data if not in response
          if (parsedUser.doctor_profile && !userData.doctor_profile) {
            userData.doctor_profile = parsedUser.doctor_profile;
          }
          if (parsedUser.nurse_profile && !userData.nurse_profile) {
            userData.nurse_profile = parsedUser.nurse_profile;
          }
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Token invalid, clear storage
          await secureStorage.deleteToken();
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Normalize email to lowercase
      const response = await authAPI.login(email.toLowerCase().trim(), password);
      
      await secureStorage.setToken(response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      // Don't expose detailed error messages that could help attackers
      const message = error.response?.data?.detail || 'Email ou senha incorretos';
      // Log error for debugging (remove in production or use proper logging)
      if (__DEV__) {
        console.log('Login error:', error.response?.status);
      }
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authAPI.googleAuth(idToken);
      
      await secureStorage.setToken(response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao fazer login com Google';
      return { success: false, error: message };
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      // Normalize email to lowercase
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
      };
      const response = await authAPI.register(normalizedData);
      
      await secureStorage.setToken(response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      // Provide user-friendly error messages
      const message = error.response?.data?.detail || 'Erro ao criar conta. Tente novamente.';
      return { success: false, error: message };
    }
  };

  const registerDoctor = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    crm: string;
    crm_state: string;
    specialty: string;
  }) => {
    try {
      const response = await authAPI.registerDoctor(data);
      
      await secureStorage.setToken(response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao criar conta médica';
      return { success: false, error: message };
    }
  };

  const registerNurse = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    coren: string;
    coren_state: string;
  }) => {
    try {
      const response = await authAPI.registerNurse(data);
      
      await secureStorage.setToken(response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao criar conta de enfermeiro';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      await secureStorage.clearAuth();
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        registerDoctor,
        registerNurse,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
