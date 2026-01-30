export const COLORS = {
  // Primary colors - RenoveJá+ Cyan
  primary: '#00B4CD',
  primaryDark: '#0A9BB0',
  primaryLight: '#4AC5E0',
  
  // Health theme colors
  healthGreen: '#10B981',
  healthGreenLight: '#34D399',
  healthTeal: '#14B8A6',
  healthBlue: '#00B4CD', // Aligned with primary
  healthPurple: '#8B5CF6',
  healthOrange: '#F59E0B',
  healthPink: '#EC4899',
  
  // Background colors
  background: '#F8FAFB',
  backgroundDark: '#F1F5F9',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#1A3A4A',
  textSecondary: '#6B7C85',
  textMuted: '#9BA7AF',
  textWhite: '#FFFFFF',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#00B4CD', // Aligned with primary
  
  // Border colors
  border: '#E4E9EC',
  borderLight: '#F1F5F9',
  
  // Shadow
  shadow: 'rgba(26, 58, 74, 0.1)',
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
  fontXxl: 20,
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
  // New workflow status
  submitted: 'Aguardando análise',
  in_review: 'Em análise médica',
  approved_pending_payment: 'Aguardando pagamento',
  paid: 'Pago - Aguardando assinatura',
  signed: 'Receita pronta!',
  delivered: 'Entregue',
  rejected: 'Recusado',
  // Nursing workflow status
  in_nursing_review: 'Em triagem (Enfermagem)',
  approved_by_nursing_pending_payment: 'Aprovado - Aguard. pagamento',
  in_medical_review: 'Aguardando validação médica',
  // Legacy status
  pending: 'Pendente',
  analyzing: 'Em Análise',
  approved: 'Aprovado',
  completed: 'Concluído',
  in_progress: 'Em Andamento',
};

export const STATUS_COLORS: Record<string, string> = {
  // New workflow status
  submitted: COLORS.warning,
  in_review: COLORS.info,
  approved_pending_payment: COLORS.healthGreen,
  paid: COLORS.healthPurple,
  signed: COLORS.healthGreen,
  delivered: COLORS.healthGreen,
  rejected: COLORS.error,
  // Nursing workflow status
  in_nursing_review: COLORS.healthPurple,
  approved_by_nursing_pending_payment: COLORS.healthGreen,
  in_medical_review: COLORS.warning,
  // Legacy status
  pending: COLORS.warning,
  analyzing: COLORS.info,
  approved: COLORS.success,
  completed: COLORS.healthGreen,
  in_progress: COLORS.primary,
};
