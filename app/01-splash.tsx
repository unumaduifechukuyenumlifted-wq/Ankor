/** Screen 01 — Splash: Anchor logo, tagline, loading animation. */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorMark } from '../src/components/Logo';
import { LoadingDots } from '../src/components/SuccessCheck';
import { C } from '../src/theme';
import { useApp } from '../src/store/AppProvider';

export default function SplashScreen() {
  const { state } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      if (!state.hydrated) return;
      router.replace(state.authed ? '/11-home' : '/02-welcome');
    }, 2100);
    return () => clearTimeout(t);
  }, [state.hydrated, state.authed]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
        <AnchorMark size={112} />
        <Text style={styles.wordmark}>Anchor</Text>
        <Text style={styles.tagline}>Balance your spending, savings and goals.</Text>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: insets.bottom + 54 }}>
        <LoadingDots />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 40,
    color: C.navy,
    marginTop: 18,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.gray,
    marginTop: 10,
    letterSpacing: 0.3,
  },
});
