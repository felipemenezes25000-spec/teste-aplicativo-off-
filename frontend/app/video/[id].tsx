/**
 * 📹 Video Call Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export default function VideoCallScreen() {
  const { id, room_url } = useLocalSearchParams<{ id: string; room_url?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  
  const [loading, setLoading] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string | null>(room_url || null);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    if (!room_url) {
      loadOrCreateRoom();
    } else {
      setLoading(false);
    }
  }, [id, room_url]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isCallActive) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isCallActive]);

  const loadOrCreateRoom = async () => {
    try {
      const existingRoom = await api.getVideoRoom(id!);
      if (existingRoom?.room_url) {
        setRoomUrl(existingRoom.room_url);
        setLoading(false);
        return;
      }
    } catch (error) {}

    try {
      const result = await api.createVideoRoom(id!);
      if (result.video_room?.room_url) {
        setRoomUrl(result.video_room.room_url);
      } else {
        setError('Não foi possível criar a sala de vídeo');
      }
    } catch (error) {
      setError('Erro ao criar sala de videochamada');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert('Encerrar Chamada', 'Tem certeza que deseja encerrar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (user?.role === 'doctor') await api.endConsultation(id!);
          } catch (error) {}
          router.back();
        },
      },
    ]);
  };

  const getJitsiUrl = (): string => {
    if (!roomUrl) return '';
    const userName = encodeURIComponent(user?.name || 'Usuário');
    const baseUrl = roomUrl.split('#')[0];
    const config = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'config.disableDeepLinking=true',
      `userInfo.displayName="${userName}"`,
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    ].join('&');
    return `${baseUrl}#${config}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
        <LinearGradient colors={['#1A3A4A', '#2D5A6B']} style={styles.loadingGradient}>
          <View style={styles.loadingIcon}>
            <Ionicons name="videocam" size={40} color="#FFFFFF" />
          </View>
          <ActivityIndicator size="large" color="#00B4CD" style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Preparando videochamada...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error || !roomUrl) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
        <View style={styles.errorIcon}>
          <Ionicons name="videocam-off" size={48} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Erro na Videochamada</Text>
        <Text style={styles.errorText}>{error || 'Sala de vídeo não encontrada'}</Text>
        <TouchableOpacity onPress={loadOrCreateRoom} activeOpacity={0.8}>
          <LinearGradient colors={['#00B4CD', '#4AC5E0']} style={styles.retryButton}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
          <Text style={styles.backButtonAltText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header Overlay */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        </View>
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
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
        onLoad={() => setIsCallActive(true)}
        onError={() => setError('Erro ao carregar videochamada')}
        allowsFullscreenVideo={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#00B4CD" />
            <Text style={styles.webviewLoadingText}>Conectando...</Text>
          </View>
        )}
      />

      {/* Bottom Overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.encryptionBadge}>
          <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
          <Text style={styles.encryptionText}>Chamada criptografada</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.8)' },

  errorContainer: { flex: 1, backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorIcon: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#1A3A4A', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#6B7C85', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, paddingHorizontal: 24, borderRadius: 14, gap: 8 },
  retryButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  backButtonAlt: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24 },
  backButtonAltText: { fontSize: 15, fontWeight: '500', color: '#00B4CD' },

  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.6)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  duration: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  endCallButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },

  webview: { flex: 1, backgroundColor: '#000000' },
  webviewLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  webviewLoadingText: { marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.7)' },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, alignItems: 'center', paddingVertical: 16, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  encryptionText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
});
