import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Background
  background: string;
  backgroundDark: string;
  cardBackground: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  
  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Health colors
  healthGreen: string;
  healthOrange: string;
  healthPurple: string;
  healthRed: string;
  
  // Border
  border: string;
  borderLight: string;
  
  // Shadow
  shadow: string;
}

const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  cardBackground: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  healthGreen: '#059669',
  healthOrange: '#EA580C',
  healthPurple: '#7C3AED',
  healthRed: '#DC2626',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: '#000000',
};

const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  background: '#0F172A',
  backgroundDark: '#1E293B',
  cardBackground: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textWhite: '#FFFFFF',
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  healthGreen: '#10B981',
  healthOrange: '#FB923C',
  healthPurple: '#A78BFA',
  healthRed: '#F87171',
  border: '#334155',
  borderLight: '#1E293B',
  shadow: '#000000',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) {
        setModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('theme_mode', newMode);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const isDark = mode === 'system' 
    ? systemColorScheme === 'dark' 
    : mode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
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

export { lightColors, darkColors };
export type { ThemeColors };
