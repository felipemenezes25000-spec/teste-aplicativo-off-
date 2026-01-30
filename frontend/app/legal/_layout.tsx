import { Stack } from 'expo-router';
import { useColors } from '@/contexts/ThemeContext';

export default function LegalLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="terms" 
        options={{ title: 'Termos de Uso' }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ title: 'Política de Privacidade' }} 
      />
      <Stack.Screen 
        name="consent" 
        options={{ title: 'Termo de Consentimento' }} 
      />
    </Stack>
  );
}
