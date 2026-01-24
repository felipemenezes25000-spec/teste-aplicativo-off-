import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/constants';

export default function VideoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
