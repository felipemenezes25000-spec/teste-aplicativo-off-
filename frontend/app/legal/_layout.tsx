import { Stack } from 'expo-router';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#00B4CD' },
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
