/**
 * 🔔 Push Notifications Hook
 * Configuração e gerenciamento de notificações push (Expo)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '../services/api';

// Configurar como notificações aparecem quando app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface PushNotificationsState {
  token: string | null;
  isRegistered: boolean;
  notification: Notifications.Notification | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationsState>({
    token: null,
    isRegistered: false,
    notification: null,
  });

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Registrar para push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('Push notifications não funcionam no simulador');
      return null;
    }

    try {
      // Verificar permissões existentes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Pedir permissão se necessário
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação negada');
        return null;
      }

      // Configurações específicas Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'RenoveJá',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });
      }

      // Obter token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      const token = tokenData.data;
      console.log('Push token:', token);

      setState(s => ({ ...s, token, isRegistered: true }));

      // Salvar token no backend
      try {
        await api.updatePushToken(token);
      } catch (error) {
        console.log('Erro ao salvar token no backend:', error);
      }

      return token;
    } catch (error) {
      console.error('Erro ao registrar push notifications:', error);
      return null;
    }
  }, []);

  // Setup listeners
  useEffect(() => {
    registerForPushNotifications();

    // Listener: notificação recebida (app aberto)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      setState(s => ({ ...s, notification }));
    });

    // Listener: usuário tocou na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuário tocou na notificação:', response);
      const data = response.notification.request.content.data;
      
      // Navegar baseado nos dados da notificação
      handleNotificationNavigation(data);
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

  return {
    ...state,
    register: registerForPushNotifications,
  };
}

// Navegar para tela específica baseado na notificação
function handleNotificationNavigation(data: any) {
  // Implementar navegação baseada nos dados
  // Ex: data.type === 'request_approved' → navegar para /request/[id]
  if (data?.requestId) {
    // router.push(`/request/${data.requestId}`);
  }
}

// ============== FUNÇÕES UTILITÁRIAS ==============

// Agendar notificação local
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: trigger || null, // null = imediatamente
  });
}

// Cancelar notificação agendada
export async function cancelScheduledNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancelar todas as notificações
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Limpar badge do app
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// Definir badge count
export async function setBadge(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

// ============== TEMPLATES DE NOTIFICAÇÃO ==============

export const NotificationTemplates = {
  requestAccepted: (doctorName: string, requestId: string) => ({
    title: '👨‍⚕️ Solicitação em análise',
    body: `Dr(a). ${doctorName} está analisando sua solicitação`,
    data: { type: 'request_accepted', requestId },
  }),

  requestApproved: (price: number, requestId: string) => ({
    title: '✅ Solicitação aprovada!',
    body: `Valor: R$ ${price.toFixed(2)}. Pague para receber sua receita.`,
    data: { type: 'request_approved', requestId },
  }),

  requestRejected: (reason: string, requestId: string) => ({
    title: '❌ Solicitação recusada',
    body: reason,
    data: { type: 'request_rejected', requestId },
  }),

  paymentConfirmed: (requestId: string) => ({
    title: '💰 Pagamento confirmado!',
    body: 'Sua receita está sendo preparada pelo médico.',
    data: { type: 'payment_confirmed', requestId },
  }),

  prescriptionReady: (requestId: string) => ({
    title: '📝 Receita pronta!',
    body: 'Sua receita digital está disponível para download.',
    data: { type: 'prescription_ready', requestId },
  }),

  newMessage: (senderName: string, requestId: string) => ({
    title: `💬 Nova mensagem de ${senderName}`,
    body: 'Toque para ver a mensagem',
    data: { type: 'new_message', requestId },
  }),

  medicationReminder: (medicationName: string) => ({
    title: '💊 Hora do remédio!',
    body: `Lembre-se de tomar ${medicationName}`,
    data: { type: 'medication_reminder' },
  }),
};
