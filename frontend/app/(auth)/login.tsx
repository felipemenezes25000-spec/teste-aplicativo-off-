/**
 * 🔐 Login Screen - Modern & Minimalist Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '864017403483-gvdaea3fm56go70jf0mqtk1ppajjppf1.apps.googleusercontent.com';

export default function LoginScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    } else if (response?.type === 'error') {
      setError('Erro ao conectar com Google');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setError('Erro ao obter token do Google');
      setGoogleLoading(false);
      return;
    }

    try {
      const result = await loginWithGoogle(accessToken);
      if (result.success) {
        navigateByRole();
      } else {
        setError(result.error || 'Erro ao fazer login com Google');
      }
    } catch (err) {
      setError('Erro ao processar login com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateByRole = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const routes: Record<string, string> = {
        admin: '/admin',
        doctor: '/doctor',
        nurse: '/nurse',
      };
      router.replace((routes[userData.role] || '/(tabs)') as any);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigateByRole();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Erro ao fazer login');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setError('Erro ao iniciar login com Google');
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F6F8" />
      
      <LinearGradient
        colors={['#E8F6F8', '#D4EFF3', '#C0E8EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Title */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[colors.primary, '#4AC5E0']}
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="medical" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.brandName}>RenoveJá+</Text>
            <Text style={styles.brandTagline}>Sua saúde, simplificada</Text>
          </View>

          {/* Trust Badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.badgeText}>100% Seguro</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Rápido</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.badgeText}>CFM</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={focusedInput === 'email' ? colors.primary : '#9BA7AF'} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#9BA7AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={focusedInput === 'password' ? colors.primary : '#9BA7AF'} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#9BA7AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons 
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#9BA7AF" 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={loading ? ['#9BA7AF', '#6B7C85'] : ['#4AC5E0', '#00B4CD']}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={!request || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.socialButtonDark]}>
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Links */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Não tem uma conta?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Criar conta</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.proLinks}>
            <Text style={styles.proText}>
              É médico?{' '}
              <Link href="/(auth)/doctor-register" asChild>
                <Text style={styles.proLink}>Cadastre-se aqui</Text>
              </Link>
            </Text>
            <Text style={styles.proText}>
              É enfermeiro(a)?{' '}
              <Link href="/(auth)/register-nurse" asChild>
                <Text style={styles.proLink}>Cadastre-se aqui</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#E8F6F8',
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },

    logoSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    brandName: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    brandTagline: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
    },

    badges: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 32,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 5,
    },

    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEE2E2',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: colors.error,
    },

    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 56,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    eyeButton: {
      padding: 4,
    },

    forgotButton: {
      alignSelf: 'flex-end',
      marginBottom: 20,
    },
    forgotText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      borderRadius: 16,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    loginButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.card,
    },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      paddingHorizontal: 16,
      fontSize: 13,
      color: colors.textMuted,
    },

    socialButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },
    socialButton: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    socialButtonDark: {
      backgroundColor: colors.textPrimary,
      borderColor: colors.textPrimary,
    },

    registerSection: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      gap: 4,
    },
    registerText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    registerLink: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600',
    },

    proLinks: {
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    proText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    proLink: {
      color: colors.primary,
      fontWeight: '500',
    },
  });
}
