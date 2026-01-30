/**
 * 💬 Doctor Chat Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_type?: string;
  message: string;
  created_at: string;
}

export default function DoctorChatScreen() {
  const colors = useColors();
  const { id, patient } = useLocalSearchParams<{ id: string; patient?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const patientName = patient ? decodeURIComponent(patient) : 'Paciente';

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadMessages = async () => {
    try {
      const data = await api.getChatMessages(id!);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.sendChatMessage(id!, newMessage.trim());
      setNewMessage('');
      await loadMessages();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (message: ChatMessage) => message.sender_id === user?.id;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A3A4A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.textPrimary} />
      
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{patientName}</Text>
          <Text style={styles.headerSubtitle}>Paciente</Text>
        </View>
        <TouchableOpacity style={styles.videoButton} onPress={() => router.push(`/video/${id}`)}>
          <Ionicons name="videocam" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <View style={styles.emptyChatIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color="#9BA7AF" />
            </View>
            <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptyChatSubtext}>Inicie a conversa com o paciente</Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || 
              new Date(message.created_at).toDateString() !== 
              new Date(messages[index - 1].created_at).toDateString();
            
            return (
              <View key={message.id}>
                {showDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                      {format(new Date(message.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.messageBubble,
                  isMyMessage(message) ? styles.myMessage : styles.otherMessage,
                  message.sender_type === 'system' && styles.systemMessage,
                ]}>
                  {!isMyMessage(message) && message.sender_type !== 'system' && (
                    <Text style={styles.senderName}>{message.sender_name || patientName}</Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isMyMessage(message) && styles.myMessageText,
                    message.sender_type === 'system' && styles.systemMessageText,
                  ]}>
                    {message.message}
                  </Text>
                  <Text style={[styles.messageTime, isMyMessage(message) && styles.myMessageTime]}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#9BA7AF"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 14 },
  headerName: { fontSize: 17, fontWeight: '600', color: colors.card },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  videoButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 24, paddingBottom: 16 },

  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyChatIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.backgroundDark, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyChatText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  emptyChatSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  dateSeparator: { alignItems: 'center', marginVertical: 16 },
  dateSeparatorText: { fontSize: 12, color: colors.textMuted, backgroundColor: colors.backgroundDark, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },

  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: colors.textPrimary, borderBottomRightRadius: 4 },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  systemMessage: { alignSelf: 'center', backgroundColor: colors.backgroundDark, maxWidth: '90%' },
  senderName: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  messageText: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  myMessageText: { color: colors.card },
  systemMessageText: { textAlign: 'center', fontStyle: 'italic', color: colors.textSecondary },
  messageTime: { fontSize: 11, color: colors.textMuted, marginTop: 6, alignSelf: 'flex-end' },
  myMessageTime: { color: 'rgba(255,255,255,0.6)' },

  inputContainer: { backgroundColor: colors.card, paddingHorizontal: 24, paddingVertical: 12, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F1F5F7' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.background, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary, maxHeight: 100, paddingVertical: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: colors.border },
});
