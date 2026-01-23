/**
 * Constantes centralizadas da aplicação
 * 
 * SECURITY: Preços não são mais hardcoded aqui.
 * Use o hook usePricing() para buscar preços do backend.
 */

// Status de solicitações
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CORRECTION_NEEDED: 'correction_needed',
  COMPLETED: 'completed',
} as const;

// Status de pagamentos
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Métodos de pagamento
export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
} as const;

// Limites e configurações
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NOTES_LENGTH: 500,
  RATE_LIMIT_PAYMENTS_PER_HOUR: 10,
  SESSION_TIMEOUT_MINUTES: 60,
} as const;

// URLs e endpoints
export const ENDPOINTS = {
  VIA_CEP: 'https://viacep.com.br/ws',
  MERCADO_PAGO_API: 'https://api.mercadopago.com',
} as const;

// Mensagens padrão
export const MESSAGES = {
  LOADING: 'Carregando...',
  SAVING: 'Salvando...',
  SUCCESS: 'Operação realizada com sucesso!',
  ERROR: 'Ocorreu um erro. Tente novamente.',
  CONFIRM_DELETE: 'Tem certeza que deseja excluir?',
  CONFIRM_CANCEL: 'Tem certeza que deseja cancelar?',
  NO_DATA: 'Nenhum dado encontrado.',
  NO_CONNECTION: 'Sem conexão com a internet.',
} as const;

// Tempos (em milissegundos)
export const TIMINGS = {
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_VALIDATION: 500,
  TOAST_DURATION: 5000,
  REFETCH_INTERVAL: 30000, // 30 segundos
  PIX_POLL_INTERVAL: 5000, // 5 segundos
} as const;

// Configurações de cache
export const CACHE_KEYS = {
  STALE_TIME: {
    SHORT: 1000 * 60 * 5, // 5 minutos
    MEDIUM: 1000 * 60 * 15, // 15 minutos
    LONG: 1000 * 60 * 60, // 1 hora
  },
} as const;

// Regex patterns
export const PATTERNS = {
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  PHONE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
  CEP: /^\d{5}-?\d{3}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CRM: /^\d{4,10}$/,
} as const;

// Especialidades médicas
export const MEDICAL_SPECIALTIES = [
  'Clínico Geral',
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Ginecologia',
  'Neurologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
] as const;

// Estados brasileiros
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
