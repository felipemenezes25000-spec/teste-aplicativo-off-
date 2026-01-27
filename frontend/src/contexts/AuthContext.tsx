import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.multiRemove(['token', 'user']);
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
      const response = await authAPI.login(email, password);
      
      await AsyncStorage.setItem('token', response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authAPI.googleAuth(idToken);
      
      await AsyncStorage.setItem('token', response.access_token);
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
      const response = await authAPI.register(data);
      
      await AsyncStorage.setItem('token', response.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao criar conta';
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
      
      await AsyncStorage.setItem('token', response.access_token);
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
      
      await AsyncStorage.setItem('token', response.access_token);
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
      await AsyncStorage.multiRemove(['token', 'user']);
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
