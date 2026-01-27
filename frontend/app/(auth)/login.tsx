import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Logo } from '../../src/components/Logo';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';

// Required for web auth
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '864017403483-gvdaea3fm56go70jf0mqtk1ppajjppf1.apps.googleusercontent.com';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Auth setup - using same client ID for all platforms (web type)
  // For production, create separate Android and iOS OAuth clients
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    expoClientId: GOOGLE_CLIENT_ID,
    selectAccount: true,
  });

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    } else if (response?.type === 'error') {
      setError('Erro ao conectar com Google');
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setError('Erro ao obter token do Google');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await loginWithGoogle(accessToken);
      
      if (result.success) {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'doctor') {
            router.replace('/doctor');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(result.error || 'Erro ao fazer login com Google');
      }
    } catch (err) {
      setError('Erro ao processar login com Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      await promptAsync();
    } catch (err) {
      setError('Erro ao iniciar login com Google');
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    setIsLoading(false);

    if (result.success) {
      // Check user role and redirect accordingly
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          router.replace('/admin');
        } else if (userData.role === 'doctor') {
          router.replace('/doctor');
        } else if (userData.role === 'nurse') {
          router.replace('/nurse');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setError(result.error || 'Erro ao fazer login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decoration */}
          <View style={styles.decorTop} />
          <View style={styles.decorBottom} />

          {/* Header */}
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.subtitle}>
              Renove sua receita e pedido de exames de forma rápida e segura.
            </Text>
            
            {/* Trust badges */}
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.healthGreen} />
                <Text style={styles.badgeText}>100% Seguro</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="time" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>Rápido</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.healthGreen} />
                <Text style={styles.badgeText}>CFM</Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <View style={styles.actionRow}>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
              </TouchableOpacity>
              <Button
                title="Entrar"
                onPress={handleLogin}
                loading={isLoading}
                icon={<Ionicons name="arrow-forward" size={20} color={COLORS.textWhite} />}
              />
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={!request || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.socialButtonDark]}>
                <Ionicons name="logo-apple" size={24} color={COLORS.textWhite} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Não tem uma conta?{' '}
              <Link href="/(auth)/register" asChild>
                <Text style={styles.footerLink}>Criar conta</Text>
              </Link>
            </Text>
            <Text style={styles.footerTextSmall}>
              É médico?{' '}
              <Link href="/(auth)/doctor-register" asChild>
                <Text style={styles.footerLink}>Cadastre-se aqui</Text>
              </Link>
            </Text>
            <Text style={styles.footerTextSmall}>
              É enfermeiro(a)?{' '}
              <Link href="/(auth)/register-nurse" asChild>
                <Text style={styles.footerLink}>Cadastre-se aqui</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.lg,
    paddingTop: SIZES.xxl,
  },
  decorTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 100,
    transform: [{ translateX: 60 }, { translateY: -60 }],
  },
  decorBottom: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    width: 150,
    height: 150,
    backgroundColor: COLORS.healthGreen + '10',
    borderRadius: 75,
    transform: [{ translateX: -50 }],
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
    lineHeight: 22,
    maxWidth: 280,
  },
  badges: {
    flexDirection: 'row',
    marginTop: SIZES.md,
    gap: SIZES.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
  },
  form: {
    marginBottom: SIZES.lg,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '15',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fontSm,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  forgotPassword: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  socialSection: {
    marginVertical: SIZES.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: SIZES.md,
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.md,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  socialButtonDark: {
    backgroundColor: COLORS.textPrimary,
  },
  footer: {
    alignItems: 'center',
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  footerText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  footerTextSmall: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
