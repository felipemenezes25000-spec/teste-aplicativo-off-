import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function RegisterNurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerNurse } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [coren, setCoren] = useState('');
  const [corenState, setCorenState] = useState('SP');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStateSelector, setShowStateSelector] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !coren || !corenState) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await registerNurse({
        name,
        email,
        password,
        phone,
        coren,
        coren_state: corenState,
      });
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/nurse') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cadastro de Enfermeiro(a)</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="medkit" size={40} color={COLORS.healthPurple} />
            </View>
            <Text style={styles.title}>Dados Profissionais</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para acessar o painel de triagem
            </Text>
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              autoCapitalize="words"
            />

            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <View style={styles.corenContainer}>
                <Text style={styles.label}>COREN *</Text>
                <TextInput
                  style={styles.input}
                  value={coren}
                  onChangeText={setCoren}
                  placeholder="000000"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.stateContainer}>
                <Text style={styles.label}>UF *</Text>
                <TouchableOpacity
                  style={styles.stateSelector}
                  onPress={() => setShowStateSelector(!showStateSelector)}
                >
                  <Text style={styles.stateSelectorText}>{corenState}</Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                {showStateSelector && (
                  <View style={styles.stateDropdown}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {STATES.map((state) => (
                        <TouchableOpacity
                          key={state}
                          style={styles.stateOption}
                          onPress={() => {
                            setCorenState(state);
                            setShowStateSelector(false);
                          }}
                        >
                          <Text style={[
                            styles.stateOptionText,
                            state === corenState && styles.stateOptionSelected
                          ]}>{state}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar Senha *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              secureTextEntry
            />

            <Button
              title={isLoading ? 'Cadastrando...' : 'Cadastrar'}
              onPress={handleRegister}
              disabled={isLoading}
              fullWidth
              style={{ marginTop: SIZES.md }}
            />
          </Card>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Já tem conta? <Text style={styles.loginTextBold}>Fazer login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: SIZES.xs,
  },
  headerTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.md,
  },
  card: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.healthPurple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.cardBackground,
  },
  row: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  corenContainer: {
    flex: 2,
  },
  stateContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  stateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.cardBackground,
  },
  stateSelectorText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  stateDropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    zIndex: 100,
    elevation: 5,
  },
  stateOption: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stateOptionText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  stateOptionSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: SIZES.lg,
  },
  loginText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
