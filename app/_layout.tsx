import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { AppProvider } from '../src/store/AppProvider';
import { ModalHost } from '../src/components/ModalHost';
import { C } from '../src/theme';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_500Medium_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProvider>
      {/* Phone-width frame on wide web viewports; full width on devices */}
      <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#EDE6D6' : C.bg, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 480,
            backgroundColor: C.bg,
            ...(Platform.OS === 'web'
              ? ({ borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD3BC' } as never)
              : {}),
          }}
        >
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="01-splash" options={{ animation: 'fade' }} />
            <Stack.Screen name="02-welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="10-ai-budget-plan" options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="27-withdraw/success" options={{ animation: 'fade' }} />
          </Stack>
          <ModalHost />
        </View>
      </View>
    </AppProvider>
  );
}
