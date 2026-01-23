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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatAPI, requestsAPI } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { ChatMessage } from '../../src/types';
import { COLORS, SIZES } from '../../src/utils/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    loadData();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  const loadData = async () => {
    try {
      const [messagesData, requestData] = await Promise.all([
        chatAPI.getMessages(requestId as string),
        requestsAPI.getById(requestId as string),
      ]);
      setMessages(messagesData);
      setRequest(requestData);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await chatAPI.getMessages(requestId as string);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await chatAPI.sendMessage({
        request_id: requestId as string,
        message: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessages();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.sender_id === user?.id;
  };

  const getOtherPartyName = () => {
    if (user?.role === 'doctor') {
      return request?.patient_name || 'Paciente';
    }
    return request?.doctor_name || 'Médico';
  };

  const getStatusLabel = () => {
    switch (request?.status) {
      case 'pending': return 'Aguardando médico';
      case 'analyzing': return 'Em análise';
      case 'in_progress': return 'Em atendimento';
      case 'completed': return 'Concluído';
      default: return request?.status;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{getOtherPartyName()}</Text>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: request?.status === 'in_progress' ? COLORS.healthGreen : COLORS.warning }
            ]} />
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
        </View>
        {request?.video_room && (
          <TouchableOpacity style={styles.videoButton}>
            <Ionicons name="videocam" size={24} color={COLORS.textWhite} />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptyChatSubtext}>
              Envie uma mensagem para iniciar a conversa
            </Text>
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
                <View
                  style={[
                    styles.messageBubble,
                    isMyMessage(message) ? styles.myMessage : styles.otherMessage,
                    message.sender_type === 'system' && styles.systemMessage,
                  ]}
                >
                  {!isMyMessage(message) && message.sender_type !== 'system' && (
                    <Text style={styles.senderName}>{message.sender_name}</Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isMyMessage(message) && styles.myMessageText,
                    message.sender_type === 'system' && styles.systemMessageText,
                  ]}>
                    {message.message}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    isMyMessage(message) && styles.myMessageTime,
                  ]}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SIZES.sm }]}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={COLORS.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.textWhite} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.textWhite} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  headerName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
  },
  videoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.healthGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SIZES.md,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl * 2,
  },
  emptyChatText: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  emptyChatSubtext: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: SIZES.md,
  },
  dateSeparatorText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SIZES.xs,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBackground,
    borderBottomLeftRadius: SIZES.xs,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: COLORS.backgroundDark,
    maxWidth: '90%',
  },
  senderName: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.textWhite,
  },
  systemMessageText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  messageTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SIZES.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});
