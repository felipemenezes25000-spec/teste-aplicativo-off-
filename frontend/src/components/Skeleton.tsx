/**
 * 💀 Skeleton Loading Components
 * Placeholder animado enquanto carrega
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Skeleton básico com animação de pulse
export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton de Avatar/Imagem circular
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

// Skeleton de Card de Solicitação
export function SkeletonRequestCard() {
  const colors = useColors();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardBody}>
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={12} />
        <Skeleton width={60} height={12} />
      </View>
    </View>
  );
}

// Skeleton de Lista de Solicitações
export function SkeletonRequestList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRequestCard key={i} />
      ))}
    </View>
  );
}

// Skeleton de Perfil
export function SkeletonProfile() {
  const colors = useColors();
  
  return (
    <View style={[styles.profileContainer, { backgroundColor: colors.surface }]}>
      <SkeletonAvatar size={80} />
      <Skeleton width={150} height={20} style={{ marginTop: 12 }} />
      <Skeleton width={200} height={14} style={{ marginTop: 8 }} />
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

// Skeleton de Chat
export function SkeletonChat() {
  return (
    <View style={styles.chatContainer}>
      {/* Mensagem recebida */}
      <View style={[styles.chatBubble, styles.chatBubbleLeft]}>
        <Skeleton width={200} height={16} />
        <Skeleton width={150} height={16} style={{ marginTop: 4 }} />
      </View>
      {/* Mensagem enviada */}
      <View style={[styles.chatBubble, styles.chatBubbleRight]}>
        <Skeleton width={180} height={16} />
      </View>
      {/* Mensagem recebida */}
      <View style={[styles.chatBubble, styles.chatBubbleLeft]}>
        <Skeleton width={220} height={16} />
        <Skeleton width={100} height={16} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Skeleton de Notificação
export function SkeletonNotification() {
  const colors = useColors();
  
  return (
    <View style={[styles.notification, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.notificationContent}>
        <Skeleton width={180} height={14} style={{ marginBottom: 6 }} />
        <Skeleton width={250} height={12} />
      </View>
    </View>
  );
}

export function SkeletonNotificationList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotification key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  profileStat: {
    alignItems: 'center',
  },
  chatContainer: {
    padding: 16,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  chatBubbleLeft: {
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
  },
  notification: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
});
