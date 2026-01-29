/**
 * 🏥 Waiting Room Screen - Sala de Espera Virtual
 * RenoveJá+ Telemedicina
 * 
 * Paciente aguarda aqui até o médico iniciar a consulta
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export default function WaitingRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<string>('Calculando...');
  const [consultationReady, setConsultationReady] = useState(false);
  
  // Animações
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waitingSeconds = useRef(0);
  const [waitingTime, setWaitingTime] = useState('00:00');

  // Animação de pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animação de rotação
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

  // Contador de tempo de espera
  useEffect(() => {
    const interval = setInterval(() => {
      waitingSeconds.current += 1;
      const mins = Math.floor(waitingSeconds.current / 60);
      const secs = waitingSeconds.current % 60;
      setWaitingTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carregar dados e verificar status
  useEffect(() => {
    loadRequest();
    const pollInterval = setInterval(checkConsultationStatus, 5000); // Verifica a cada 5 segundos
    return () => clearInterval(pollInterval);
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
      
      // Verificar se já pode entrar na chamada
      if (data.status === 'in_consultation' && data.video_room?.room_url) {
        setConsultationReady(true);
      }
      
      // Simular posição na fila (em produção viria do backend)
      setQueuePosition(1);
      setEstimatedWait('5-10 min');
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados da consulta');
    } finally {
      setLoading(false);
    }
  };

  const checkConsultationStatus = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
      
      // Se o médico iniciou a consulta, mostrar botão de entrar
      if (data.status === 'in_consultation' && data.video_room?.room_url) {
        setConsultationReady(true);
      }
    } catch (error) {
      console.log('Erro ao verificar status:', error);
    }
  };

  const handleJoinCall = () => {
    if (request?.video_room?.room_url) {
      router.push({
        pathname: '/video/[id]',
        params: { id: id!, room_url: request.video_room.room_url }
      });
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar? Se a consulta já foi paga, você poderá solicitar reembolso.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/requests')
        }
      ]
    );
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#EC4899" />
        <LinearGradient colors={['#EC4899', '#F472B6']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Se a consulta está pronta, mostrar tela diferente
  if (consultationReady) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <LinearGradient colors={['#10B981', '#34D399']} style={styles.readyGradient}>
          
          {/* Ícone de sucesso */}
          <View style={styles.readyIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
          </View>
          
          <Text style={styles.readyTitle}>O médico está pronto!</Text>
          <Text style={styles.readySubtitle}>
            Dr(a). {request?.doctor_name || 'Médico'} iniciou a consulta
          </Text>

          {/* Info do médico */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={32} color="#10B981" />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr(a). {request?.doctor_name || 'Médico'}</Text>
              <Text style={styles.doctorSpecialty}>{request?.specialty || 'Clínico Geral'}</Text>
            </View>
          </View>

          {/* Botão de entrar */}
          <TouchableOpacity 
            onPress={handleJoinCall} 
            activeOpacity={0.8}
            style={styles.joinButtonWrapper}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0FDF4']}
              style={styles.joinButton}
            >
              <Ionicons name="videocam" size={28} color="#10B981" />
              <Text style={styles.joinButtonText}>Entrar na Videochamada</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dicas */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Antes de entrar:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.tipText}>Verifique sua câmera e microfone</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.tipText}>Escolha um local silencioso</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.tipText}>Tenha boa iluminação</Text>
            </View>
          </View>

        </LinearGradient>
      </View>
    );
  }

  // Tela de espera
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EC4899" />
      <LinearGradient colors={['#EC4899', '#F472B6']} style={styles.gradient}>
        
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Main content */}
        <View style={styles.mainContent}>
          
          {/* Animated waiting icon */}
          <View style={styles.waitingIconContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.rotatingBorder, { transform: [{ rotate: rotateInterpolate }] }]}>
              <LinearGradient
                colors={['#FFFFFF', 'rgba(255,255,255,0.3)', '#FFFFFF']}
                style={styles.rotatingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <View style={styles.waitingIconInner}>
              <Ionicons name="hourglass" size={48} color="#FFFFFF" />
            </View>
          </View>

          {/* Status text */}
          <Text style={styles.waitingTitle}>Aguardando médico...</Text>
          <Text style={styles.waitingSubtitle}>
            {request?.schedule_type === 'immediate' 
              ? 'Você está na fila de atendimento'
              : `Consulta agendada para ${request?.scheduled_at || 'em breve'}`}
          </Text>

          {/* Stats cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statValue}>{waitingTime}</Text>
              <Text style={styles.statLabel}>Tempo de espera</Text>
            </View>
            
            {queuePosition && (
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                <Text style={styles.statValue}>{queuePosition}º</Text>
                <Text style={styles.statLabel}>Posição na fila</Text>
              </View>
            )}
            
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statValue}>{estimatedWait}</Text>
              <Text style={styles.statLabel}>Estimativa</Text>
            </View>
          </View>

          {/* Request info */}
          <View style={styles.requestInfoCard}>
            <Text style={styles.requestInfoTitle}>Detalhes da consulta</Text>
            <View style={styles.requestInfoRow}>
              <Text style={styles.requestInfoLabel}>Especialidade</Text>
              <Text style={styles.requestInfoValue}>{request?.specialty || 'Clínico Geral'}</Text>
            </View>
            <View style={styles.requestInfoRow}>
              <Text style={styles.requestInfoLabel}>Duração</Text>
              <Text style={styles.requestInfoValue}>{request?.duration || 30} minutos</Text>
            </View>
          </View>

        </View>

        {/* Tips */}
        <View style={styles.bottomTips}>
          <View style={styles.tipBanner}>
            <Ionicons name="bulb" size={20} color="#FCD34D" />
            <Text style={styles.tipBannerText}>
              Enquanto espera, verifique se sua câmera e microfone estão funcionando
            </Text>
          </View>
        </View>

        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar consulta</Text>
        </TouchableOpacity>

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#FFFFFF' },

  gradient: { flex: 1, paddingTop: 50 },
  readyGradient: { flex: 1, paddingTop: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  backButton: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  // Waiting icon animation
  waitingIconContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  rotatingBorder: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: 'transparent', borderTopColor: '#FFFFFF' },
  rotatingGradient: { width: '100%', height: '100%', borderRadius: 70 },
  waitingIconInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  waitingTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  waitingSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },

  // Request info
  requestInfoCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, width: '100%' },
  requestInfoTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  requestInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  requestInfoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  requestInfoValue: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // Tips
  bottomTips: { paddingHorizontal: 24, paddingBottom: 8 },
  tipBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, gap: 12 },
  tipBannerText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },

  cancelButton: { alignItems: 'center', paddingVertical: 20, paddingBottom: 36 },
  cancelButtonText: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },

  // Ready state
  readyIconContainer: { marginBottom: 24 },
  readyTitle: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  readySubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 32 },

  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 16, marginBottom: 32, width: '100%' },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  doctorSpecialty: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  joinButtonWrapper: { width: '100%', marginBottom: 32 },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 16, gap: 12 },
  joinButtonText: { fontSize: 18, fontWeight: '700', color: '#10B981' },

  tipsContainer: { alignItems: 'flex-start', width: '100%' },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
});
