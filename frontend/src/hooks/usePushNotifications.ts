/**
 * 🔔 Push Notifications Hook
 * Gerencia permissões, registro e recebimento de notificações
 */

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

// Configurar como as notificações são exibidas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  useEffect(() => {
    // Registrar para push notifications
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          // Enviar token pro backend
          sendTokenToBackend(token);
        }
      })
      .catch(err => setError(err.message));

    // Listener para notificações recebidas (app em primeiro plano)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('📬 Notificação recebida:', notification);
    });

    // Listener para quando usuário clica na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificação clicada:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Enviar token para o backend
  const sendTokenToBackend = async (token: string) => {
    try {
      await api.updatePushToken(token);
      console.log('✅ Push token enviado ao backend');
    } catch (err) {
      console.log('⚠️ Erro ao enviar push token (usuário pode não estar logado)');
    }
  };

  // Navegar baseado nos dados da notificação
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'request_update' && data?.request_id) {
      router.push(`/request/${data.request_id}`);
    } else if (data?.type === 'chat_message' && data?.request_id) {
      router.push(`/request/${data.request_id}?tab=chat`);
    } else if (data?.type === 'consultation_ready' && data?.request_id) {
      router.push(`/video/${data.request_id}`);
    }
  };

  return {
    expoPushToken,
    notification,
    error,
    sendTokenToBackend,
  };
}

// Função para registrar dispositivo para push notifications
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Push notifications só funcionam em dispositivo físico
  if (!Device.isDevice) {
    console.log('⚠️ Push notifications requerem dispositivo físico');
    return null;
  }

  // Verificar permissões
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Pedir permissão se ainda não tiver
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Permissão para notificações não concedida');
    return null;
  }

  // Obter token do Expo
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenResponse.data;
    console.log('🔑 Expo Push Token:', token);
  } catch (err) {
    console.error('Erro ao obter push token:', err);
  }

  // Configurar canal de notificação no Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'RenoveJá+',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00B4CD',
    });
  }

  return token;
}

// Função para enviar notificação local (útil para testes)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // null = imediatamente
  });
}

export default usePushNotifications;
