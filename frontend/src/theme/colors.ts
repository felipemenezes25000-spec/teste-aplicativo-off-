/**
 * 🎨 RenoveJá+ Design System - Colors
 * Paleta moderna e minimalista para saúde
 */

export const colors = {
  // ============== PRIMARY ==============
  primary: {
    50: '#E6F7FA',
    100: '#CCF0F5',
    200: '#99E1EB',
    300: '#66D2E1',
    400: '#33C3D7',
    500: '#00B4CD', // Main primary
    600: '#0090A4',
    700: '#006C7B',
    800: '#004852',
    900: '#002429',
  },

  // ============== SECONDARY (Teal/Navy) ==============
  secondary: {
    50: '#E8F4F6',
    100: '#D1E9ED',
    200: '#A3D3DB',
    300: '#75BDC9',
    400: '#47A7B7',
    500: '#1A91A5',
    600: '#157484',
    700: '#105763',
    800: '#0A3A42',
    900: '#051D21',
  },

  // ============== ACCENT (Gradient tones) ==============
  accent: {
    cyan: '#4AC5E0',
    teal: '#1A3A4A',
    sky: '#7DD3E8',
    mint: '#A8E6CF',
  },

  // ============== NEUTRALS ==============
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFB',
    100: '#F1F5F7',
    200: '#E4E9EC',
    300: '#CDD5DA',
    400: '#9BA7AF',
    500: '#6B7C85',
    600: '#4A5960',
    700: '#333F44',
    800: '#1E2629',
    900: '#0F1315',
  },

  // ============== SEMANTIC ==============
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DFF7FB',
    main: '#00B4CD', // Aligned with primary
    dark: '#0A9BB0',
  },

  // ============== GRADIENTS ==============
  gradients: {
    primary: ['#4AC5E0', '#00B4CD'],
    secondary: ['#1A91A5', '#1A3A4A'],
    sky: ['#E6F7FA', '#CCF0F5'],
    card: ['#FFFFFF', '#F8FAFB'],
  },

  // ============== DARK MODE ==============
  dark: {
    background: '#0F1315',
    surface: '#1E2629',
    card: '#252D31',
    border: '#333F44',
    text: '#F1F5F7',
    textSecondary: '#9BA7AF',
  },
};

// ============== THEME TOKENS ==============
export const lightTheme = {
  background: colors.neutral[50],
  surface: colors.neutral[0],
  card: colors.neutral[0],
  border: colors.neutral[200],
  text: colors.neutral[900],
  textSecondary: colors.neutral[500],
  textMuted: colors.neutral[400],
  primary: colors.primary[500],
  primaryLight: colors.primary[100],
  gradient: colors.gradients.primary,
};

export const darkTheme = {
  background: colors.dark.background,
  surface: colors.dark.surface,
  card: colors.dark.card,
  border: colors.dark.border,
  text: colors.dark.text,
  textSecondary: colors.dark.textSecondary,
  textMuted: colors.neutral[600],
  primary: colors.primary[400],
  primaryLight: colors.secondary[800],
  gradient: colors.gradients.secondary,
};
