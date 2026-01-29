/**
 * 🔐 Biometric Authentication Hook
 * Face ID / Touch ID / Fingerprint
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRICS_ENABLED_KEY = '@renoveja_biometrics_enabled';

interface BiometricsState {
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: 'fingerprint' | 'facial' | 'iris' | null;
  isAuthenticating: boolean;
}

export function useBiometrics() {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    isEnabled: false,
    biometryType: null,
    isAuthenticating: false,
  });

  // Verificar disponibilidade
  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      // Verificar se hardware suporta
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setState(s => ({ ...s, isAvailable: false }));
        return;
      }

      // Verificar se tem biometria cadastrada
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setState(s => ({ ...s, isAvailable: false }));
        return;
      }

      // Descobrir tipo de biometria
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometryType: 'fingerprint' | 'facial' | 'iris' | null = null;
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'facial';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'iris';
      }

      // Verificar se usuário habilitou
      const savedEnabled = await AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY);
      const isEnabled = savedEnabled === 'true';

      setState({
        isAvailable: true,
        isEnabled,
        biometryType,
        isAuthenticating: false,
      });
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
      setState(s => ({ ...s, isAvailable: false }));
    }
  };

  // Autenticar com biometria
  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    if (!state.isAvailable) return false;

    setState(s => ({ ...s, isAuthenticating: true }));

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Autentique-se para continuar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permite PIN como fallback
        fallbackLabel: 'Usar senha',
      });

      setState(s => ({ ...s, isAuthenticating: false }));
      return result.success;
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      setState(s => ({ ...s, isAuthenticating: false }));
      return false;
    }
  }, [state.isAvailable]);

  // Habilitar/desabilitar biometria
  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && state.isAvailable) {
      // Verificar autenticação antes de habilitar
      const success = await authenticate('Confirme sua identidade para ativar');
      if (!success) return false;
    }

    await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, enabled ? 'true' : 'false');
    setState(s => ({ ...s, isEnabled: enabled }));
    return true;
  }, [state.isAvailable, authenticate]);

  // Nome amigável do tipo de biometria
  const biometryName = state.biometryType === 'facial' 
    ? 'Face ID' 
    : state.biometryType === 'fingerprint'
    ? 'Touch ID'
    : state.biometryType === 'iris'
    ? 'Íris'
    : 'Biometria';

  return {
    ...state,
    biometryName,
    authenticate,
    setEnabled,
    refresh: checkBiometrics,
  };
}
