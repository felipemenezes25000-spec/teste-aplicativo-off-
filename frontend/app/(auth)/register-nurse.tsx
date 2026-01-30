/**
 * 👩‍⚕️ Nurse Registration - Modern Design
 * RenoveJá+ Telemedicina
 */

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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function RegisterNurseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { registerNurse } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [coren, setCoren] = useState('');
  const [corenState, setCorenState] = useState('SP');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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

    setLoading(true);
    try {
      await registerNurse({ name, email, password, phone, coren, coren_state: corenState });
      Alert.alert('Sucesso! 🎉', 'Cadastro realizado com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/nurse') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    inputKey: string,
    options?: { keyboardType?: any; secureTextEntry?: boolean; autoCapitalize?: any }
  ) => (
    <View style={[styles.inputContainer, focusedInput === inputKey && styles.inputFocused]}>
      <Ionicons name={icon as any} size={20} color={focusedInput === inputKey ? '#10B981' : '#9BA7AF'} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9BA7AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={options?.keyboardType || 'default'}
        secureTextEntry={options?.secureTextEntry}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        onFocus={() => setFocusedInput(inputKey)}
        onBlur={() => setFocusedInput(null)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* Header */}
      <LinearGradient colors={['#059669', '#10B981']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="medkit" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Cadastro de Enfermeiro(a)</Text>
          <Text style={styles.headerSubtitle}>Preencha seus dados para acessar o painel de triagem</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Form Card */}
          <View style={styles.formCard}>
            {renderInput('person-outline', 'Nome completo *', name, setName, 'name', { autoCapitalize: 'words' })}
            {renderInput('mail-outline', 'E-mail *', email, setEmail, 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderInput('call-outline', 'Telefone', phone, setPhone, 'phone', { keyboardType: 'phone-pad' })}

            {/* COREN Row */}
            <View style={styles.corenRow}>
              <View style={styles.corenInputContainer}>
                <View style={[styles.inputContainer, focusedInput === 'coren' && styles.inputFocused, { flex: 1 }]}>
                  <Ionicons name="id-card-outline" size={20} color={focusedInput === 'coren' ? '#10B981' : '#9BA7AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="COREN *"
                    placeholderTextColor="#9BA7AF"
                    value={coren}
                    onChangeText={setCoren}
                    keyboardType="numeric"
                    onFocus={() => setFocusedInput('coren')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.stateSelector} onPress={() => setShowStateSelector(!showStateSelector)}>
                <Text style={styles.stateSelectorText}>{corenState}</Text>
                <Ionicons name="chevron-down" size={18} color="#6B7C85" />
              </TouchableOpacity>
            </View>

            {/* State Dropdown */}
            {showStateSelector && (
              <View style={styles.stateDropdown}>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {STATES.map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={styles.stateOption}
                      onPress={() => { setCorenState(state); setShowStateSelector(false); }}
                    >
                      <Text style={[styles.stateOptionText, state === corenState && styles.stateOptionSelected]}>{state}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {renderInput('lock-closed-outline', 'Senha *', password, setPassword, 'password', { secureTextEntry: true })}
            {renderInput('lock-closed-outline', 'Confirmar senha *', confirmPassword, setConfirmPassword, 'confirmPassword', { secureTextEntry: true })}

            {/* Register Button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={loading ? ['#9BA7AF', '#6B7C85'] : ['#059669', '#10B981']}
                style={styles.registerButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Cadastrar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Fazer login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 50, paddingBottom: 32, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerContent: { alignItems: 'center' },
  iconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.card, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  formCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 5 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, marginBottom: 14, paddingHorizontal: 14, height: 52 },
  inputFocused: { borderColor: colors.success, backgroundColor: colors.card },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },

  corenRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  corenInputContainer: { flex: 1 },
  stateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, height: 52, gap: 6, minWidth: 80 },
  stateSelectorText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  stateDropdown: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 14, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  stateOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F7' },
  stateOptionText: { fontSize: 15, color: colors.textPrimary, textAlign: 'center' },
  stateOptionSelected: { color: colors.success, fontWeight: '600' },

  registerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8, marginTop: 8 },
  registerButtonText: { fontSize: 17, fontWeight: '600', color: colors.card },

  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 15, color: colors.textSecondary },
  loginLink: { fontSize: 15, color: colors.success, fontWeight: '600' },
});
