/**
 * 🌙 Theme Context - Dark Mode Support
 * RenoveJá+ Telemedicina
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundDark: string;
  card: string;
  cardElevated: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  
  // Borders
  border: string;
  borderLight: string;
  
  // Primary colors (same for both themes)
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Specific
  headerGradient: [string, string];
  inputBackground: string;
  shadowColor: string;
}

const lightColors: ThemeColors = {
  background: '#F8FAFB',
  backgroundDark: '#F1F5F7',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  
  textPrimary: '#1A3A4A',
  textSecondary: '#6B7C85',
  textMuted: '#9BA7AF',
  textWhite: '#FFFFFF',
  
  border: '#E4E9EC',
  borderLight: '#F1F5F7',
  
  primary: '#00B4CD',
  primaryLight: '#E6F7FA',
  secondary: '#1A3A4A',
  accent: '#10B981',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  headerGradient: ['#1A3A4A', '#2D5A6B'],
  inputBackground: '#F8FAFB',
  shadowColor: '#1A3A4A',
};

const darkColors: ThemeColors = {
  background: '#0F172A',
  backgroundDark: '#1E293B',
  card: '#1E293B',
  cardElevated: '#334155',
  
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textWhite: '#FFFFFF',
  
  border: '#334155',
  borderLight: '#1E293B',
  
  primary: '#22D3EE',
  primaryLight: '#164E63',
  secondary: '#E2E8F0',
  accent: '#34D399',
  
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  headerGradient: ['#0F172A', '#1E293B'],
  inputBackground: '#1E293B',
  shadowColor: '#000000',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('themeMode', newMode);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for easy color access
export function useColors() {
  const { colors } = useTheme();
  return colors;
}

export { lightColors, darkColors };
export type { ThemeColors, ThemeMode };
