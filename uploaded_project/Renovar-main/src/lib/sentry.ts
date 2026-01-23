import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't send network errors from development
          if (error.message.includes('Failed to fetch') && import.meta.env.DEV) {
            return null;
          }
        }
      }
      return event;
    },
  });
}

export function setSentryUser(user: { id: string; email?: string; name?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

export function addSentryBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'default',
    level: level || 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}
