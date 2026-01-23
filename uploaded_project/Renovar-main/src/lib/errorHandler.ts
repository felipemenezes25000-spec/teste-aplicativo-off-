/**
 * Sistema centralizado de tratamento de erros
 */

import { logger } from './logger';
import { toast } from 'sonner';

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_ERROR'
  | 'UPLOAD_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
}

class ErrorHandler {
  /**
   * Mapeia erros do Supabase para erros da aplicação
   */
  private mapSupabaseError(error: unknown): AppError {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const supabaseError = error as { message: string; code?: string };
      
      // Erros de rede
      if (supabaseError.message.includes('fetch') || supabaseError.message.includes('network')) {
        return {
          code: 'NETWORK_ERROR',
          message: supabaseError.message,
          userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
          originalError: error,
        };
      }

      // Erros de autenticação
      if (supabaseError.code === 'PGRST301' || supabaseError.message.includes('JWT')) {
        return {
          code: 'AUTH_ERROR',
          message: supabaseError.message,
          userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
          originalError: error,
        };
      }

      // Erros de permissão
      if (supabaseError.code === '42501' || supabaseError.message.includes('permission')) {
        return {
          code: 'PERMISSION_DENIED',
          message: supabaseError.message,
          userMessage: 'Você não tem permissão para realizar esta ação.',
          originalError: error,
        };
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : String(error),
      userMessage: 'Ocorreu um erro inesperado. Tente novamente ou contate o suporte.',
      originalError: error,
    };
  }

  /**
   * Trata e exibe erro de forma amigável ao usuário
   */
  handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.mapSupabaseError(error);
    
    if (context) {
      appError.context = context;
    }

    // Log do erro
    logger.error(appError.message, appError.originalError, {
      code: appError.code,
      ...appError.context,
    });

    // Exibir mensagem amigável ao usuário
    toast.error(appError.userMessage, {
      description: this.getErrorDescription(appError.code),
      duration: 5000,
    });

    return appError;
  }

  /**
   * Retorna descrição adicional baseada no código de erro
   */
  private getErrorDescription(code: ErrorCode): string | undefined {
    const descriptions: Record<ErrorCode, string> = {
      NETWORK_ERROR: 'Verifique sua conexão com a internet.',
      AUTH_ERROR: 'Faça login novamente para continuar.',
      VALIDATION_ERROR: 'Verifique os dados informados.',
      PAYMENT_ERROR: 'Não foi possível processar o pagamento. Verifique os dados do cartão.',
      UPLOAD_ERROR: 'Erro ao fazer upload do arquivo. Tente novamente.',
      NOT_FOUND: 'O recurso solicitado não foi encontrado.',
      PERMISSION_DENIED: 'Entre em contato com o suporte se acredita que isso é um erro.',
      UNKNOWN_ERROR: 'Se o problema persistir, entre em contato com o suporte.',
    };

    return descriptions[code];
  }

  /**
   * Trata erro silenciosamente (sem toast)
   */
  handleErrorSilently(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.mapSupabaseError(error);
    
    if (context) {
      appError.context = context;
    }

    logger.error(appError.message, appError.originalError, {
      code: appError.code,
      ...appError.context,
    });

    return appError;
  }

  /**
   * Cria um erro customizado
   */
  createError(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    originalError?: unknown
  ): AppError {
    return {
      code,
      message,
      userMessage: userMessage || message,
      originalError,
    };
  }
}

export const errorHandler = new ErrorHandler();

// Helper para uso em try/catch
export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return promise.catch((error) => {
    errorHandler.handleError(error, context);
    throw error;
  });
}
