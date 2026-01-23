import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/constants';

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="request/[id]" 
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="chat/[id]" 
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
