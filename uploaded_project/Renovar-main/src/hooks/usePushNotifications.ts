import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';

// VAPID public key - must match the one in secrets
const VAPID_PUBLIC_KEY = 'BLvSifkADkmklUQFwbol2pbyZJFM-itD3GgoVrOtWctKFSnaPgHgCXkgYOG7qo8_5odma0Ni-GVSS5Kq59ZABVY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check current subscription status
  useEffect(() => {
    if (!isSupported || !user) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        logger.error('Error checking subscription', error, {
          component: 'usePushNotifications',
          action: 'checkSubscription',
          userId: user?.id,
        });
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.log('Service Worker registered', {
        component: 'usePushNotifications',
        action: 'registerServiceWorker',
        scope: registration.scope,
      });
      return registration;
    } catch (error) {
      logger.error('Service Worker registration failed', error, {
        component: 'usePushNotifications',
        action: 'registerServiceWorker',
      });
      throw error;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    if (!isSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('Permissão para notificações foi negada');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      logger.log('Push subscription created', {
        component: 'usePushNotifications',
        action: 'subscribe',
        userId: user.id,
      });

      // Extract keys from subscription
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Notificações push ativadas!');
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'usePushNotifications',
        action: 'subscribe',
        userId: user?.id,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
      }

      setIsSubscribed(false);
      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'usePushNotifications',
        action: 'unsubscribe',
        userId: user?.id,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    if (!isSubscribed) {
      toast.error('Ative as notificações primeiro');
      return false;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          payload: {
            title: '🔔 Teste de Notificação',
            body: 'Parabéns! As notificações push estão funcionando corretamente.',
            icon: '/favicon.ico',
            tag: 'test-notification',
            data: { url: '/profile' }
          }
        }
      });

      if (error) throw error;

      logger.log('Test notification sent', {
        component: 'usePushNotifications',
        action: 'sendTestNotification',
        userId: user.id,
      });
      toast.success('Notificação de teste enviada!');
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'usePushNotifications',
        action: 'sendTestNotification',
        userId: user?.id,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    toggleSubscription,
    sendTestNotification
  };
}
