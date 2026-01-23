export const COLORS = {
  // Primary colors
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryLight: '#38BDF8',
  
  // Health theme colors
  healthGreen: '#22C55E',
  healthGreenLight: '#4ADE80',
  healthTeal: '#14B8A6',
  healthBlue: '#3B82F6',
  healthPurple: '#8B5CF6',
  healthOrange: '#F97316',
  
  // Background colors
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  
  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const SIZES = {
  // Padding & Margin
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Border radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
  
  // Font sizes
  fontXs: 10,
  fontSm: 12,
  fontMd: 14,
  fontLg: 16,
  fontXl: 18,
  font2xl: 20,
  font3xl: 24,
  font4xl: 32,
};

export const PRESCRIPTION_TYPES = [
  { id: 'simple', name: 'Receita Simples', price: 49.90, description: 'Medicamentos comuns sem retenção' },
  { id: 'controlled', name: 'Receita Controlada', price: 69.90, description: 'Medicamentos com retenção de receita' },
  { id: 'blue', name: 'Receita Azul', price: 89.90, description: 'Medicamentos especiais (tarja azul)' },
];

export const EXAM_TYPES = [
  { id: 'laboratory', name: 'Exames Laboratoriais', price: 39.90, description: 'Hemograma, glicemia, colesterol, etc.' },
  { id: 'imaging', name: 'Exames de Imagem', price: 59.90, description: 'Raio-X, ultrassom, ressonância, etc.' },
];

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  analyzing: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Recusado',
  completed: 'Concluído',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  analyzing: COLORS.info,
  approved: COLORS.success,
  rejected: COLORS.error,
  completed: COLORS.healthGreen,
};
