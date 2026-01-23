import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';

const SPECIALTIES = [
  'Clínico Geral',
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Ginecologia',
  'Neurologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
];

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function DoctorRegisterScreen() {
  const router = useRouter();
  const { registerDoctor } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [crm, setCrm] = useState('');
  const [crmState, setCrmState] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !crm || !crmState || !specialty || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await registerDoctor({
      name,
      email,
      password,
      phone,
      crm,
      crm_state: crmState,
      specialty,
    });
    
    setIsLoading(false);

    if (result.success) {
      router.replace('/doctor');
    } else {
      setError(result.error || 'Erro ao criar conta');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS.healthPurple + '08', COLORS.background]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.doctorBadge}>
              <Ionicons name="medical" size={20} color={COLORS.healthPurple} />
              <Text style={styles.doctorBadgeText}>Cadastro Médico</Text>
            </View>
            <Text style={styles.title}>Bem-vindo, Doutor(a)!</Text>
            <Text style={styles.subtitle}>
              Cadastre-se para atender pacientes na plataforma RenoveJá+
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Nome completo *"
              placeholder="Dr(a). Seu Nome"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
            />

            <Input
              label="E-mail *"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <View style={styles.row}>
              <View style={styles.flex2}>
                <Input
                  label="CRM *"
                  placeholder="000000"
                  value={crm}
                  onChangeText={setCrm}
                  keyboardType="number-pad"
                  leftIcon="document-text-outline"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>UF *</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowStatePicker(!showStatePicker)}
                >
                  <Text style={crmState ? styles.pickerText : styles.pickerPlaceholder}>
                    {crmState || 'UF'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                {showStatePicker && (
                  <View style={styles.pickerDropdown}>
                    <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                      {STATES.map((state) => (
                        <TouchableOpacity
                          key={state}
                          style={styles.pickerItem}
                          onPress={() => {
                            setCrmState(state);
                            setShowStatePicker(false);
                          }}
                        >
                          <Text style={styles.pickerItemText}>{state}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View>
              <Text style={styles.inputLabel}>Especialidade *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
              >
                <Ionicons name="medkit-outline" size={20} color={COLORS.textMuted} style={styles.pickerIcon} />
                <Text style={specialty ? styles.pickerText : styles.pickerPlaceholder}>
                  {specialty || 'Selecione sua especialidade'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              {showSpecialtyPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                    {SPECIALTIES.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={styles.pickerItem}
                        onPress={() => {
                          setSpecialty(spec);
                          setShowSpecialtyPicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>{spec}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Input
              label="Senha *"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              containerStyle={{ marginTop: SIZES.md }}
            />

            <Input
              label="Confirmar senha *"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <Button
              title="Criar Conta Médica"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </LinearGradient>
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
  header: {
    marginBottom: SIZES.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.healthPurple + '15',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
    marginBottom: SIZES.md,
  },
  doctorBadgeText: {
    marginLeft: SIZES.sm,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.healthPurple,
  },
  title: {
    fontSize: SIZES.font3xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
  row: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
    marginLeft: SIZES.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    height: 56,
    paddingHorizontal: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SIZES.md,
  },
  pickerIcon: {
    marginRight: SIZES.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.textMuted,
  },
  pickerDropdown: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    marginTop: -SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  submitButton: {
    marginTop: SIZES.md,
  },
});
