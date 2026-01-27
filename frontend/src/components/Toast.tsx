import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/constants';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.successToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.toast, styles.errorToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: COLORS.error + '20' }]}>
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
        </View>
      )}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.infoToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: COLORS.info + '20' }]}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
        </View>
      )}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={[styles.toast, styles.warningToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      renderLeadingIcon={() => (
        <View style={[styles.iconContainer, { backgroundColor: COLORS.warning + '20' }]}>
          <Ionicons name="warning" size={24} color={COLORS.warning} />
        </View>
      )}
    />
  ),
};

export { toastConfig };

// Helper functions
export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({ type: 'success', text1: title, text2: message });
  },
  error: (title: string, message?: string) => {
    Toast.show({ type: 'error', text1: title, text2: message });
  },
  info: (title: string, message?: string) => {
    Toast.show({ type: 'info', text1: title, text2: message });
  },
  warning: (title: string, message?: string) => {
    Toast.show({ type: 'warning', text1: title, text2: message });
  },
};

const styles = StyleSheet.create({
  toast: {
    borderLeftWidth: 0,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    minHeight: 60,
    width: '92%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successToast: {
    backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  errorToast: {
    backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  infoToast: {
    backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  warningToast: {
    backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  contentContainer: {
    paddingHorizontal: SIZES.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  title: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
});
