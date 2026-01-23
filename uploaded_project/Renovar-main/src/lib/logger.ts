/**
 * Sistema de logging centralizado
 * Desabilita logs em produção para melhor performance e segurança
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  log(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.log(this.formatMessage('log', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.warn(this.formatMessage('warn', message, context));
    }
    // Em produção, enviar para serviço de monitoramento
    this.sendToMonitoring('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    // Erros sempre são logados, mesmo em produção
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    
    console.error(this.formatMessage('error', message, errorContext));
    
    // Enviar para serviço de monitoramento (ex: Sentry)
    this.sendToMonitoring('error', message, errorContext);
  }

  debug(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext): void {
    if (import.meta.env.PROD) {
      try {
        if (level === 'error') {
          const error = context?.error instanceof Error 
            ? context.error 
            : new Error(message);
          
          Sentry.captureException(error, {
            extra: context,
            tags: {
              component: context?.component,
              action: context?.action,
            },
          });
        } else if (level === 'warn') {
          Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
            tags: {
              component: context?.component,
              action: context?.action,
            },
          });
        }
      } catch (err) {
        // Silently fail if Sentry is not initialized
        console.error('Failed to send to Sentry:', err);
      }
    }
  }
}

export const logger = new Logger();

// Helper para substituir console.log em todo o código
export default logger;
