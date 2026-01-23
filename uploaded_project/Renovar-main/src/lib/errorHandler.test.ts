import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, handleAsyncError, type AppError } from './errorHandler';
import { logger } from './logger';
import { toast } from 'sonner';

vi.mock('./logger');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapSupabaseError', () => {
    it('should map network errors correctly', () => {
      const error = { message: 'fetch failed', code: 'NETWORK_ERROR' };
      const result = errorHandler.handleError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.userMessage).toBe('Erro de conexão. Verifique sua internet e tente novamente.');
    });

    it('should map authentication errors correctly', () => {
      const error = { message: 'JWT expired', code: 'PGRST301' };
      const result = errorHandler.handleError(error);

      expect(result.code).toBe('AUTH_ERROR');
      expect(result.userMessage).toBe('Sua sessão expirou. Por favor, faça login novamente.');
    });

    it('should map permission errors correctly', () => {
      const error = { message: 'permission denied', code: '42501' };
      const result = errorHandler.handleError(error);

      expect(result.code).toBe('PERMISSION_DENIED');
      expect(result.userMessage).toBe('Você não tem permissão para realizar esta ação.');
    });

    it('should map unknown errors correctly', () => {
      const error = new Error('Something went wrong');
      const result = errorHandler.handleError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.userMessage).toBe('Ocorreu um erro inesperado. Tente novamente ou contate o suporte.');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const result = errorHandler.handleError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('String error');
    });
  });

  describe('handleError', () => {
    it('should log error and show toast', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      errorHandler.handleError(error, context);

      expect(logger.error).toHaveBeenCalledWith(
        'Test error',
        error,
        expect.objectContaining({
          code: 'UNKNOWN_ERROR',
          userId: '123',
          action: 'test',
        })
      );

      expect(toast.error).toHaveBeenCalledWith(
        'Ocorreu um erro inesperado. Tente novamente ou contate o suporte.',
        expect.objectContaining({
          description: 'Se o problema persistir, entre em contato com o suporte.',
          duration: 5000,
        })
      );
    });

    it('should include context in error', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };

      const result = errorHandler.handleError(error, context);

      expect(result.context).toEqual(context);
    });
  });

  describe('handleErrorSilently', () => {
    it('should log error without showing toast', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };

      errorHandler.handleErrorSilently(error, context);

      expect(logger.error).toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('createError', () => {
    it('should create custom error', () => {
      const originalError = new Error('Original');
      const error = errorHandler.createError(
        'VALIDATION_ERROR',
        'Validation failed',
        'Por favor, verifique os dados',
        originalError
      );

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.userMessage).toBe('Por favor, verifique os dados');
      expect(error.originalError).toBe(originalError);
    });

    it('should use message as userMessage if not provided', () => {
      const error = errorHandler.createError('NETWORK_ERROR', 'Network error');

      expect(error.userMessage).toBe('Network error');
    });
  });

  describe('handleAsyncError', () => {
    it('should handle promise rejection', async () => {
      const error = new Error('Promise error');
      const promise = Promise.reject(error);

      await expect(handleAsyncError(promise)).rejects.toThrow('Promise error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should pass through successful promise', async () => {
      const promise = Promise.resolve('success');
      const result = await handleAsyncError(promise);

      expect(result).toBe('success');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should include context when handling error', async () => {
      const error = new Error('Promise error');
      const promise = Promise.reject(error);
      const context = { userId: '123' };

      await expect(handleAsyncError(promise, context)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        error,
        expect.objectContaining(context)
      );
    });
  });
});
