import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat } from '../../src/components/Chat';
import { COLORS } from '../../src/utils/constants';

export default function DoctorChatScreen() {
  const { id, patient } = useLocalSearchParams<{ id: string; patient?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Chat
        requestId={id!}
        patientName={patient ? decodeURIComponent(patient) : undefined}
        onBack={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
