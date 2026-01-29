/**
 * ⚙️ Settings Screen
 * RenoveJá+ Telemedicina
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface SettingItem {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  type: 'navigate' | 'toggle' | 'select' | 'action';
  value?: boolean;
  options?: { label: string; value: string }[];
  selectedValue?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, isDark, colors, setMode } = useTheme();
  const { logout } = useAuth();
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleThemeChange = () => {
    Alert.alert('Tema', 'Escolha o tema do aplicativo', [
      { text: 'Claro', onPress: () => setMode('light') },
      { text: 'Escuro', onPress: () => setMode('dark') },
      { text: 'Sistema', onPress: () => setMode('system') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Sistema';
    }
  };

  const sections = [
    {
      title: 'Aparência',
      items: [
        {
          id: 'theme',
          icon: isDark ? 'moon' : 'sunny',
          label: 'Tema',
          subtitle: getThemeLabel(),
          type: 'select' as const,
          onPress: handleThemeChange,
        },
      ],
    },
    {
      title: 'Notificações',
      items: [
        {
          id: 'push',
          icon: 'notifications',
          label: 'Notificações Push',
          subtitle: 'Receba alertas de atualizações',
          type: 'toggle' as const,
          value: notifications,
          onToggle: setNotifications,
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          id: 'help',
          icon: 'help-circle',
          label: 'Central de Ajuda',
          type: 'navigate' as const,
          onPress: () => Linking.openURL('https://renoveja.com/ajuda'),
        },
        {
          id: 'contact',
          icon: 'mail',
          label: 'Fale Conosco',
          type: 'navigate' as const,
          onPress: () => Linking.openURL('mailto:suporte@renoveja.com'),
        },
        {
          id: 'terms',
          icon: 'document-text',
          label: 'Termos de Uso',
          type: 'navigate' as const,
          onPress: () => Linking.openURL('https://renoveja.com/termos'),
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark',
          label: 'Política de Privacidade',
          type: 'navigate' as const,
          onPress: () => Linking.openURL('https://renoveja.com/privacidade'),
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          id: 'logout',
          icon: 'log-out',
          label: 'Sair da Conta',
          type: 'action' as const,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerGradient[0]} />
      
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && [styles.settingItemBorder, { borderBottomColor: colors.borderLight }],
                  ]}
                  onPress={item.onPress}
                  disabled={item.type === 'toggle'}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.id === 'logout' ? '#FEE2E2' : colors.primaryLight }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.id === 'logout' ? '#EF4444' : colors.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, { color: item.id === 'logout' ? '#EF4444' : colors.textPrimary }]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                  {(item.type === 'navigate' || item.type === 'select') && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textMuted }]}>RenoveJá+ v1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>© 2024 RenoveJá Telemedicina</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },

  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingItemBorder: { borderBottomWidth: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingContent: { flex: 1, marginLeft: 14 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },

  footer: { alignItems: 'center', marginTop: 20 },
  version: { fontSize: 13, fontWeight: '500' },
  copyright: { fontSize: 12, marginTop: 4 },
});
