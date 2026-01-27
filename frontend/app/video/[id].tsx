import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../src/contexts/AuthContext';
import { videoAPI, requestsAPI, consultationAPI } from '../../src/services/api';
import { COLORS, SIZES } from '../../src/utils/constants';

export default function VideoCallScreen() {
  const { id, room_url } = useLocalSearchParams<{ id: string; room_url?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string | null>(room_url || null);
  const [roomName, setRoomName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    if (!room_url) {
      loadOrCreateRoom();
    } else {
      setIsLoading(false);
    }
  }, [id, room_url]);

  // Call duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const loadOrCreateRoom = async () => {
    try {
      // First try to get existing room
      const existingRoom = await videoAPI.getRoom(id!);
      if (existingRoom?.room_url) {
        setRoomUrl(existingRoom.room_url);
        setRoomName(existingRoom.room_name || '');
        setIsLoading(false);
        return;
      }
    } catch (error) {
      // Room doesn't exist, create one
    }

    try {
      // Create new room
      const result = await videoAPI.createRoom(id!);
      if (result.video_room?.room_url) {
        setRoomUrl(result.video_room.room_url);
        setRoomName(result.video_room.room_name || '');
      } else {
        setError('Não foi possível criar a sala de vídeo');
      }
    } catch (error) {
      console.error('Error creating video room:', error);
      setError('Erro ao criar sala de videochamada');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Chamada',
      'Tem certeza que deseja encerrar a videochamada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.role === 'doctor') {
                await consultationAPI.end(id!);
              }
              router.back();
            } catch (error) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleWebViewLoad = () => {
    setIsCallActive(true);
  };

  // Generate Jitsi URL with configuration
  const getJitsiUrl = (): string => {
    if (!roomUrl) return '';
    
    const userName = encodeURIComponent(user?.name || 'Usuário');
    const baseUrl = roomUrl.split('#')[0];
    
    // Jitsi configuration options
    const config = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'config.disableDeepLinking=true',
      `userInfo.displayName="${userName}"`,
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
      'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]',
    ].join('&');
    
    return `${baseUrl}#${config}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Preparando videochamada...</Text>
      </View>
    );
  }

  if (error || !roomUrl) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="videocam-off" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Erro na Videochamada</Text>
        <Text style={styles.errorText}>{error || 'Sala de vídeo não encontrada'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrCreateRoom}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        </View>
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Jitsi WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: getJitsiUrl() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        startInLoadingState={true}
        onLoad={handleWebViewLoad}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setError('Erro ao carregar videochamada');
        }}
        allowsFullscreenVideo={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Conectando...</Text>
          </View>
        )}
      />

      {/* Bottom controls overlay */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + SIZES.md }]}>
        <Text style={styles.roomInfo}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textWhite} /> Chamada criptografada
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    marginTop: SIZES.lg,
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.xl,
  },
  retryButton: {
    marginTop: SIZES.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusMd,
  },
  retryButtonText: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  backButton: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textWhite,
  },
  liveText: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontXs,
    fontWeight: '700',
  },
  duration: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  roomInfo: {
    color: COLORS.textWhite,
    fontSize: SIZES.fontSm,
    opacity: 0.8,
  },
});
