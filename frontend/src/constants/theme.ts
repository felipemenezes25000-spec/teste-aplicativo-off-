/**
 * 🎨 RenoveJá+ Theme Constants
 * Paleta de cores e estilos padronizados
 */

export const COLORS = {
  // Cores Primárias
  primary: '#00B4CD',
  primaryLight: '#4AC5E0',
  primaryDark: '#0A9BB0',
  
  // Texto
  textPrimary: '#1A3A4A',
  textSecondary: '#6B7C85',
  textTertiary: '#9BA7AF',
  textInverse: '#FFFFFF',
  
  // Backgrounds
  background: '#F8FAFB',
  backgroundCard: '#FFFFFF',
  backgroundLight: '#F1F5F9',
  backgroundDark: '#1A3A4A',
  
  // Status
  success: '#10B981',
  successLight: '#34D399',
  successBg: '#D1FAE5',
  successBgLight: '#ECFDF5',
  
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningBg: '#FEF3C7',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorBg: '#FEE2E2',
  
  info: '#00B4CD', // Aligned with primary
  infoLight: '#4AC5E0',
  infoBg: '#DFF7FB',
  
  // Accent Colors
  pink: '#EC4899',
  pinkLight: '#F472B6',
  pinkBg: '#FDF2F8',
  
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleBg: '#EDE9FE',
  
  // Bordas e Divisores
  border: '#E4E9EC',
  borderLight: '#F1F5F9',
  divider: '#CDD5DA',
  
  // Gradientes
  gradientPrimary: ['#00B4CD', '#4AC5E0'],
  gradientDark: ['#1A3A4A', '#2D5A6B'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientPink: ['#EC4899', '#F472B6'],
  gradientPurple: ['#8B5CF6', '#A78BFA'],
  gradientError: ['#EF4444', '#F87171'],
  
  // Transparências
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white80: 'rgba(255, 255, 255, 0.8)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 32,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Ícones padrão para cada tipo de ação
export const ICONS = {
  // Navegação
  back: 'arrow-back',
  forward: 'chevron-forward',
  close: 'close',
  menu: 'menu',
  
  // Ações
  add: 'add',
  edit: 'create',
  delete: 'trash',
  save: 'checkmark',
  cancel: 'close',
  refresh: 'refresh',
  search: 'search',
  filter: 'filter',
  
  // Status
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'alert-circle',
  info: 'information-circle',
  
  // Médico
  prescription: 'document-text',
  exam: 'flask',
  consultation: 'videocam',
  doctor: 'medkit',
  nurse: 'medical',
  patient: 'person',
  
  // Comunicação
  chat: 'chatbubbles',
  call: 'call',
  video: 'videocam',
  notification: 'notifications',
  
  // Pagamento
  payment: 'card',
  pix: 'qr-code',
  money: 'cash',
  wallet: 'wallet',
  
  // Outros
  camera: 'camera',
  gallery: 'images',
  location: 'location',
  time: 'time',
  calendar: 'calendar',
  settings: 'settings',
  profile: 'person',
  logout: 'log-out-outline',
  lock: 'lock-closed',
  eye: 'eye',
  star: 'star',
  heart: 'heart',
  ai: 'sparkles',
  sign: 'finger-print',
  download: 'download',
  upload: 'cloud-upload',
};

// Status de solicitações
export const REQUEST_STATUS = {
  submitted: {
    label: 'Aguardando',
    color: COLORS.warning,
    bg: COLORS.warningBg,
    icon: 'time',
  },
  in_review: {
    label: 'Em análise',
    color: COLORS.info,
    bg: COLORS.infoBg,
    icon: 'eye',
  },
  approved_pending_payment: {
    label: 'Aguardando pagamento',
    color: COLORS.purple,
    bg: COLORS.purpleBg,
    icon: 'card',
  },
  paid: {
    label: 'Pago',
    color: COLORS.success,
    bg: COLORS.successBg,
    icon: 'checkmark-circle',
  },
  signed: {
    label: 'Assinado',
    color: COLORS.success,
    bg: COLORS.successBg,
    icon: 'finger-print',
  },
  completed: {
    label: 'Concluído',
    color: COLORS.success,
    bg: COLORS.successBg,
    icon: 'checkmark-circle',
  },
  rejected: {
    label: 'Recusado',
    color: COLORS.error,
    bg: COLORS.errorBg,
    icon: 'close-circle',
  },
  cancelled: {
    label: 'Cancelado',
    color: COLORS.textTertiary,
    bg: COLORS.backgroundLight,
    icon: 'close',
  },
};

export default {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZES,
  SHADOWS,
  ICONS,
  REQUEST_STATUS,
};
