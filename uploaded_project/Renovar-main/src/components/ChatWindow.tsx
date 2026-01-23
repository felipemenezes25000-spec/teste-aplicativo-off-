import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowLeft, Phone, Video, MoreVertical, CheckCheck, Check, Smile, Paperclip, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  requestId: string;
  requestType: 'prescription' | 'exam' | 'consultation';
  otherUserName?: string;
  otherUserAvatar?: string;
  onBack?: () => void;
  onVideoCall?: () => void;
  embedded?: boolean;
}

export function ChatWindow({ 
  requestId, 
  requestType, 
  otherUserName = 'Médico',
  otherUserAvatar,
  onBack,
  onVideoCall,
  embedded = false,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = useChat(requestId, requestType);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length, markAsRead]);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;
    sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "flex flex-col bg-gradient-to-br from-health-blue/5 via-background to-health-green/5",
      embedded ? "h-full" : "h-screen"
    )}>
      {/* Premium Header */}
      {!embedded && (
        <div className="bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-soft">
          <div className="flex items-center gap-3 px-4 py-3">
            {onBack && (
              <button 
                onClick={onBack} 
                className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-health-green/30">
                <AvatarImage src={otherUserAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-health-blue text-white font-bold">
                  {getInitials(otherUserName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-health-green rounded-full border-2 border-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{otherUserName}</h2>
              <p className="text-xs text-health-green font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-health-green rounded-full animate-pulse" />
                Online agora
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-primary/10"
              >
                <Phone className="w-5 h-5 text-primary" />
              </Button>
              {onVideoCall && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onVideoCall}
                  className="rounded-xl hover:bg-health-green/10"
                >
                  <Video className="w-5 h-5 text-health-green" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-muted"
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-health-blue flex items-center justify-center mx-auto mb-3 animate-pulse-soft">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
              <p className="text-muted-foreground text-sm">Carregando mensagens...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-health-blue/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">
              Nenhuma mensagem ainda
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Envie uma mensagem para iniciar a conversa
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="h-px flex-1 bg-border/50" />
                <span className="px-4 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">
                  {date}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const showAvatar = !isOwn && (index === 0 || dateMessages[index - 1]?.sender_id !== message.sender_id);
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && (
                        <div className="w-8">
                          {showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={otherUserAvatar} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-health-blue text-white text-xs font-bold">
                                {getInitials(otherUserName)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-3 relative group",
                          isOwn
                            ? "bg-gradient-to-br from-primary to-health-blue text-white rounded-2xl rounded-br-md shadow-lg shadow-primary/20"
                            : "bg-white text-foreground rounded-2xl rounded-bl-md shadow-soft border border-border/30"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.message}
                        </p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isOwn ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[10px]",
                            isOwn ? "text-white/70" : "text-muted-foreground"
                          )}>
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && (
                            <CheckCheck className={cn(
                              "w-3.5 h-3.5",
                              message.read ? "text-health-green" : "text-white/50"
                            )} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="h-12 pl-4 pr-24 rounded-2xl border-2 border-border/50 focus:border-primary bg-muted/30 text-sm"
              disabled={isSending}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Smile className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-primary to-health-blue shadow-lg shadow-primary/30 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {/* Typing indicator placeholder */}
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Mensagens criptografadas de ponta a ponta
        </p>
      </div>
    </div>
  );
}
