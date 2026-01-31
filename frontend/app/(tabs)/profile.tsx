/**
 * 👤 Profile Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

type ProfileStyles = ReturnType<typeof createStyles>;
interface MenuItemPropsWithColors extends MenuItemProps {
  colors: ReturnType<typeof useColors>;
  styles: ProfileStyles;
}

const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, rightElement, danger, colors, styles: menuStyles }: MenuItemPropsWithColors) => (
  <TouchableOpacity style={menuStyles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[menuStyles.menuIconContainer, danger && menuStyles.menuIconDanger]}>
      <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : colors.primary} />
    </View>
    <View style={menuStyles.menuContent}>
      <Text style={[menuStyles.menuTitle, danger && menuStyles.menuTitleDanger]}>{title}</Text>
      {subtitle && <Text style={menuStyles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
    {showArrow && !rightElement && (
      <Ionicons name="chevron-forward" size={20} color="#CDD5DA" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const getInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#4AC5E0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={colors.headerGradient}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.badgeText}>Conta verificada</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.menuCard}>
            <MenuItem colors={colors} styles={styles} icon="person-outline" title="Dados pessoais" subtitle="Nome, CPF, data de nascimento" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="location-outline" title="Endereços" subtitle="Gerencie seus endereços" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="card-outline" title="Pagamento" subtitle="Cartões e PIX" onPress={() => {}} />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.menuCard}>
            <MenuItem colors={colors} styles={styles} icon="notifications-outline" title="Notificações" onPress={() => setNotificationsEnabled(!notificationsEnabled)} showArrow={false} rightElement={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#E4E9EC', true: '#A8E6CF' }} thumbColor={notificationsEnabled ? '#10B981' : '#FFFFFF'} />} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="moon-outline" title="Modo escuro" onPress={() => setDarkMode(!darkMode)} showArrow={false} rightElement={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E4E9EC', true: '#A8E6CF' }} thumbColor={darkMode ? '#10B981' : '#FFFFFF'} />} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="language-outline" title="Idioma" subtitle="Português (BR)" onPress={() => {}} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          <View style={styles.menuCard}>
            <MenuItem colors={colors} styles={styles} icon="help-circle-outline" title="Central de ajuda" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="chatbubble-outline" title="Fale conosco" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="document-text-outline" title="Termos de uso" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem colors={colors} styles={styles} icon="shield-outline" title="Política de privacidade" onPress={() => {}} />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem colors={colors} styles={styles} icon="log-out-outline" title="Sair da conta" onPress={handleLogout} showArrow={false} danger />
          </View>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>RenoveJá+ v2.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 50,
      paddingBottom: 80,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.card,
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileCard: {
      alignItems: 'center',
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 32,
      borderWidth: 4,
      borderColor: colors.card,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.card,
    },
    avatarInitials: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.card,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.card,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.card,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 12,
    },
    badgeContainer: {
      flexDirection: 'row',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.card,
    },
    content: {
      flex: 1,
      marginTop: -40,
    },
    contentContainer: {
      paddingHorizontal: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    menuIconDanger: {
      backgroundColor: '#FEE2E2',
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    menuTitleDanger: {
      color: colors.error,
    },
    menuSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.backgroundDark,
      marginLeft: 70,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 8,
    },
  });
}
