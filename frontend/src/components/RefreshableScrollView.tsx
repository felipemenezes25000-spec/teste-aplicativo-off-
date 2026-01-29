/**
 * 🔄 Refreshable ScrollView
 * Pull to refresh com animação customizada
 */

import React, { useState, useCallback, ReactNode } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Platform,
  FlatList,
  FlatListProps,
} from 'react-native';
import { useColors } from '../contexts/ThemeContext';

interface RefreshableScrollViewProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
}

export function RefreshableScrollView({
  children,
  onRefresh,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: RefreshableScrollViewProps) {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]} // Android
          tintColor={colors.primary} // iOS
          progressBackgroundColor={colors.surface} // Android
          title="Atualizando..." // iOS
          titleColor={colors.textSecondary} // iOS
        />
      }
    >
      {children}
    </ScrollView>
  );
}

// ============== REFRESHABLE FLATLIST ==============

interface RefreshableFlatListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  onRefresh: () => Promise<void>;
}

export function RefreshableFlatList<T>({
  onRefresh,
  ...props
}: RefreshableFlatListProps<T>) {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <FlatList
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressBackgroundColor={colors.surface}
        />
      }
    />
  );
}

// ============== EMPTY STATE COMPONENT ==============

import { Text, Image } from 'react-native';
import { AnimatedButton } from './AnimatedButton';

interface EmptyStateProps {
  icon?: string; // Emoji
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <AnimatedButton
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

// ============== LOADING OVERLAY ==============

import { ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.loadingBox, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text style={[styles.loadingText, { color: colors.text }]}>{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============== SUCCESS ANIMATION ==============

interface SuccessAnimationProps {
  visible: boolean;
  message?: string;
  onDone?: () => void;
}

export function SuccessAnimation({ visible, message, onDone }: SuccessAnimationProps) {
  const colors = useColors();

  React.useEffect(() => {
    if (visible && onDone) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.successBox, { backgroundColor: colors.surface }]}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={[styles.successText, { color: colors.text }]}>
            {message || 'Sucesso!'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  successBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
