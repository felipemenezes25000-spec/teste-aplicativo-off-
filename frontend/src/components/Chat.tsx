import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS, SIZES } from '../utils/constants';
import { ChatMessage } from '../types';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ChatProps {
  requestId: string;
  patientName?: string;
  doctorName?: string;
  onBack?: () => void;
}

export function Chat({ requestId, patientName, doctorName, onBack }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(loadMessages, 5000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [requestId]);

  const loadMessages = async () => {
    try {
      const data = await chatAPI.getMessages(requestId);
      setMessages(data);
      // Mark messages as read
      await chatAPI.markAsRead(requestId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await chatAPI.sendMessage({
        request_id: requestId,
        message: newMessage.trim(),
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
      return patientName || 'Paciente';
    }
    return doctorName || 'Médico';
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = isMyMessage(item);
    const isSystem = item.sender_type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessage}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sender_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          {!isOwn && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {format(new Date(item.created_at), 'HH:mm', { locale: ptBR })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando mensagens...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons 
              name={user?.role === 'doctor' ? 'person' : 'medkit'} 
              size={20} 
              color={COLORS.textWhite} 
            />
          </View>
          <View>
            <Text style={styles.headerName}>{getOtherPartyName()}</Text>
            <Text style={styles.headerStatus}>
              {user?.role === 'doctor' ? 'Paciente' : 'Médico'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptySubtext}>Envie uma mensagem para iniciar a conversa</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
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
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.md,
    color: COLORS.textSecondary,
    fontSize: SIZES.fontMd,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SIZES.xs,
    marginRight: SIZES.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  headerName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerStatus: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  messageList: {
    padding: SIZES.md,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.healthPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  avatarText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: SIZES.fontSm,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SIZES.xs,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.cardBackground,
    borderBottomLeftRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  senderName: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.healthPurple,
    marginBottom: SIZES.xs,
  },
  messageText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: COLORS.textWhite,
  },
  messageTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: SIZES.md,
  },
  systemMessage: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SIZES.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  emptySubtext: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SIZES.md,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SIZES.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});
