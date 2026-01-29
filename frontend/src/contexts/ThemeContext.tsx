/**
 * 🌙 Dark Mode Context
 * Gerencia tema claro/escuro do app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cores do tema
export const lightTheme = {
  mode: 'light' as const,
  colors: {
    // Backgrounds
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Primary (verde saúde)
    primary: '#10B981',
    primaryLight: '#D1FAE5',
    primaryDark: '#059669',
    
    // Text
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    
    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Input
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    
    // Special
    overlay: 'rgba(0,0,0,0.5)',
    skeleton: '#E5E7EB',
    skeletonHighlight: '#F3F4F6',
  }
};

export const darkTheme = {
  mode: 'dark' as const,
  colors: {
    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    
    // Primary (verde saúde)
    primary: '#10B981',
    primaryLight: '#064E3B',
    primaryDark: '#34D399',
    
    // Text
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Borders
    border: '#334155',
    borderLight: '#1E293B',
    
    // Input
    inputBackground: '#1E293B',
    inputBorder: '#475569',
    
    // Special
    overlay: 'rgba(0,0,0,0.7)',
    skeleton: '#334155',
    skeletonHighlight: '#475569',
  }
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@renoveja_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferência salva
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemeModeState(saved as ThemeMode);
      }
      setIsLoaded(true);
    });
  }, []);

  // Salvar preferência
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  // Toggle simples
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Determinar tema atual
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  if (!isLoaded) {
    return null; // Ou splash screen
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Hook para cores direto
export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}
