import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    try {
      // Check if device (not simulator/emulator)
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'renoveja-app', // Replace with your actual project ID
      });
      
      this.expoPushToken = tokenData.data;
      await this.saveToken(this.expoPushToken);
      
      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'RenoveJá+ Notificações',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        // Channel for urgent notifications
        await Notifications.setNotificationChannelAsync('urgent', {
          name: 'Notificações Urgentes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF0000',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('expoPushToken', token);
      
      // Send token to backend
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        await api.post('/users/push-token', { push_token: token }, {
          params: { token: authToken }
        });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }
    return await AsyncStorage.getItem('expoPushToken');
  }

  // Schedule local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = immediate
    });
  }

  // Cancel notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Show immediate local notification
  async showNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    await this.scheduleLocalNotification(title, body, data, null);
  }

  // Notification types for the app
  async notifyPrescriptionReady(prescriptionId: string, doctorName: string): Promise<void> {
    await this.showNotification(
      '📋 Receita Pronta!',
      `Dr(a). ${doctorName} assinou sua receita. Toque para visualizar.`,
      { type: 'prescription_ready', id: prescriptionId }
    );
  }

  async notifyConsultationStarting(consultationId: string, doctorName: string): Promise<void> {
    await this.showNotification(
      '🩺 Consulta Iniciando!',
      `Dr(a). ${doctorName} está aguardando você na videochamada.`,
      { type: 'consultation_starting', id: consultationId }
    );
  }

  async notifyNewMessage(requestId: string, senderName: string): Promise<void> {
    await this.showNotification(
      '💬 Nova Mensagem',
      `${senderName} enviou uma mensagem.`,
      { type: 'new_message', id: requestId }
    );
  }

  async notifyPaymentConfirmed(requestId: string): Promise<void> {
    await this.showNotification(
      '✅ Pagamento Confirmado!',
      'Seu pagamento foi recebido e sua solicitação está sendo processada.',
      { type: 'payment_confirmed', id: requestId }
    );
  }

  async notifyRequestUpdate(requestId: string, status: string): Promise<void> {
    const statusMessages: { [key: string]: string } = {
      analyzing: 'Sua solicitação está sendo analisada pelo médico.',
      approved: 'Sua solicitação foi aprovada!',
      rejected: 'Sua solicitação foi recusada. Entre em contato conosco.',
      completed: 'Sua solicitação foi concluída com sucesso!',
    };
    
    await this.showNotification(
      '📢 Atualização da Solicitação',
      statusMessages[status] || 'Houve uma atualização na sua solicitação.',
      { type: 'request_update', id: requestId, status }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
