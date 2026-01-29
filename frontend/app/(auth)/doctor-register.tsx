/**
 * 👨‍⚕️ Doctor Register Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState } from 'react';
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
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function DoctorRegisterScreen() {
  const router = useRouter();
  const { registerDoctor } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [crm, setCrm] = useState('');
  const [crmState, setCrmState] = useState('SP');
  const [specialty, setSpecialty] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !crm.trim() || !specialty.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Atenção', 'Você precisa aceitar os termos de uso');
      return;
    }

    setLoading(true);
    try {
      await registerDoctor({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        crm: crm.trim(),
        crm_state: crmState,
        specialty: specialty.trim(),
      });
      Alert.alert('Sucesso! 🎉', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/doctor') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar conta');
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
    options?: any
  ) => (
    <View style={[styles.inputContainer, focusedInput === inputKey && styles.inputFocused]}>
      <Ionicons 
        name={icon as any}
        size={20} 
        color={focusedInput === inputKey ? '#1A3A4A' : '#9BA7AF'} 
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9BA7AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={options?.keyboardType || 'default'}
        secureTextEntry={options?.secureTextEntry && !showPassword}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        onFocus={() => setFocusedInput(inputKey)}
        onBlur={() => setFocusedInput(null)}
      />
      {options?.secureTextEntry && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9BA7AF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
      
      <LinearGradient
        colors={['#1A3A4A', '#2D5A6B']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
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
          {/* Header */}
          <View style={styles.header}>
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Link>
            <View style={styles.headerBadge}>
              <Ionicons name="medical" size={16} color="#FFFFFF" />
              <Text style={styles.headerBadgeText}>Área Médica</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Cadastro Médico</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados profissionais para se cadastrar como médico na plataforma
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Dados Pessoais</Text>
            {renderInput('person-outline', 'Nome completo *', name, setName, 'name', { autoCapitalize: 'words' })}
            {renderInput('mail-outline', 'E-mail *', email, setEmail, 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderInput('call-outline', 'Telefone', phone, setPhone, 'phone', { keyboardType: 'phone-pad' })}
            {renderInput('lock-closed-outline', 'Senha *', password, setPassword, 'password', { secureTextEntry: true })}

            <Text style={[styles.formSectionTitle, { marginTop: 24 }]}>Dados Profissionais</Text>
            
            {/* CRM Row */}
            <View style={styles.crmRow}>
              <View style={[styles.inputContainer, styles.crmInput, focusedInput === 'crm' && styles.inputFocused]}>
                <Ionicons name="id-card-outline" size={20} color={focusedInput === 'crm' ? '#1A3A4A' : '#9BA7AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="CRM *"
                  placeholderTextColor="#9BA7AF"
                  value={crm}
                  onChangeText={setCrm}
                  keyboardType="number-pad"
                  onFocus={() => setFocusedInput('crm')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <TouchableOpacity 
                style={styles.stateSelector}
                onPress={() => setShowStateModal(true)}
              >
                <Text style={styles.stateSelectorText}>{crmState}</Text>
                <Ionicons name="chevron-down" size={16} color="#1A3A4A" />
              </TouchableOpacity>
            </View>

            {renderInput('medkit-outline', 'Especialidade *', specialty, setSpecialty, 'specialty', { autoCapitalize: 'words' })}

            {/* Terms */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                Li e aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
                <Text style={styles.termsLink}>Código de Ética Médica</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={loading ? ['#9BA7AF', '#6B7C85'] : ['#1A3A4A', '#2D5A6B']}
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
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Modal */}
      {showStateModal && (
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStateModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Estado</Text>
            <ScrollView style={styles.modalScroll}>
              {UF_LIST.map(uf => (
                <TouchableOpacity
                  key={uf}
                  style={[styles.modalItem, crmState === uf && styles.modalItemSelected]}
                  onPress={() => { setCrmState(uf); setShowStateModal(false); }}
                >
                  <Text style={[styles.modalItemText, crmState === uf && styles.modalItemTextSelected]}>{uf}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  gradient: { ...StyleSheet.absoluteFillObject },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  headerBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  titleSection: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },

  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 5 },
  formSectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7C85', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFB', borderRadius: 16, borderWidth: 1.5, borderColor: '#E4E9EC', marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputFocused: { borderColor: '#1A3A4A', backgroundColor: '#FFFFFF' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1A3A4A' },
  eyeButton: { padding: 4 },

  crmRow: { flexDirection: 'row', gap: 12 },
  crmInput: { flex: 1 },
  stateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB', borderRadius: 16, borderWidth: 1.5, borderColor: '#E4E9EC', paddingHorizontal: 16, height: 56, gap: 4, marginBottom: 16 },
  stateSelectorText: { fontSize: 16, fontWeight: '600', color: '#1A3A4A' },

  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E4E9EC', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#1A3A4A', borderColor: '#1A3A4A' },
  termsText: { flex: 1, fontSize: 14, color: '#6B7C85', lineHeight: 20 },
  termsLink: { color: '#1A3A4A', fontWeight: '500' },

  registerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  registerButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },

  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#6B7C85' },
  loginLink: { fontSize: 14, color: '#1A3A4A', fontWeight: '600' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '80%', maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A3A4A', marginBottom: 16, textAlign: 'center' },
  modalScroll: { maxHeight: 300 },
  modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10 },
  modalItemSelected: { backgroundColor: '#E6F7FA' },
  modalItemText: { fontSize: 16, color: '#1A3A4A', textAlign: 'center' },
  modalItemTextSelected: { fontWeight: '600', color: '#00B4CD' },
});
