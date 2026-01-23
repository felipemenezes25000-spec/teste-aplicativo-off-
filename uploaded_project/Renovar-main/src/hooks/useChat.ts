import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from './useRealtime';

interface ChatMessage {
  id: string;
  request_id: string;
  request_type: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function useChat(requestId: string, requestType: 'prescription' | 'exam' | 'consultation') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!requestId && !!user,
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          request_id: requestId,
          request_type: requestType,
          sender_id: user?.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', requestId] });
    },
  });

  // Mark messages as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('request_id', requestId)
        .neq('sender_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', requestId] });
    },
  });

  // Real-time subscription usando o hook centralizado
  useRealtime({
    table: 'chat_messages',
    event: 'INSERT',
    filter: `request_id=eq.${requestId}`,
    queryKey: ['chat-messages', requestId],
    enabled: !!requestId && !!user,
  });

  // Get unread count
  const unreadCount = messages.filter(m => !m.read && m.sender_id !== user?.id).length;

  return {
    messages,
    isLoading,
    sendMessage,
    isSending,
    markAsRead,
    unreadCount,
    isTyping,
    setIsTyping,
  };
}
