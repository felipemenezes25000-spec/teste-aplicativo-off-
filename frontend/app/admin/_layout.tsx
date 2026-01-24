import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/constants';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="doctors" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
