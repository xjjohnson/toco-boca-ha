import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { useSync } from '@/hooks/useSync';

export default function RootLayout() {
  useSync();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" hidden />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.wall },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.wall },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="grown-ups" options={{ title: 'Grown-ups' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
