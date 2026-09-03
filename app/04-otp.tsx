/** Screen 04 — OTP Verification: 6-digit code, resend with countdown, continue. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button } from '../src/components/ui';
import { useApp } from '../src/store/AppProvider';
import { C, T } from '../src/theme';

export default function OtpVerification() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const { state, dispatch, showModal } = useApp();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [count, setCount] = useState(30);
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const destination = state.pendingAuth?.email || state.pendingAuth?.phone || 'your email';
  const isSignup = mode !== 'login';

  useEffect(() => {
    inputRef.current?.focus();
    const t = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const submit = () => {
    if (code.length !== 6) {
      setError(true);
      doShake();
      return;
    }
    // Verified (any 6 digits in this demo)
    if (isSignup || !state.onboarded) {
      router.replace('/06-personal-info');
    } else {
      dispatch({ type: 'PATCH', patch: { authed: true } });
      router.replace('/11-home');
    }
  };

  const resend = () => {
    if (count > 0) return;
    setCount(30);
    setCode('');
    setError(false);
    showModal({ type: 'otp-sent', props: { destination, resent: true } });
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Verify it's you" />
      <View style={{ paddingHorizontal: 24, flex: 1 }}>
        <Text style={styles.sub}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: C.navy, fontFamily: 'Inter_600SemiBold' }}>{destination}</Text>
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.boxes, { transform: [{ translateX: shake }] }]}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const filled = code.length > i;
              const active = code.length === i;
              return (
                <View
                  key={i}
                  style={[
                    styles.box,
                    filled && styles.boxFilled,
                    active && styles.boxActive,
                    error && styles.boxError,
                  ]}
                >
                  {filled ? (
                    <Text style={styles.boxDigit}>{code[i]}</Text>
                  ) : active ? (
                    <View style={styles.caret} />
                  ) : null}
                </View>
              );
            })}
          </Animated.View>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => {
            setError(false);
            setCode(t.replace(/\D/g, '').slice(0, 6));
          }}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
        />

        <View style={styles.resendRow}>
          <Text style={T.small}>Didn't get the code?</Text>
          <Pressable onPress={resend} disabled={count > 0} hitSlop={8}>
            <Text style={{ ...T.small500, color: count > 0 ? C.graySoft : C.goldDeep, marginLeft: 6 }}>
              {count > 0 ? `Resend in ${count}s` : 'Resend Code'}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label="Continue" onPress={submit} disabled={code.length !== 6} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  sub: { ...T.body, color: C.gray, textAlign: 'center', marginTop: 10 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 34 },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: C.navy },
  boxActive: { borderColor: C.gold },
  boxError: { borderColor: C.terracotta },
  boxDigit: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.navy },
  caret: { width: 2, height: 26, backgroundColor: C.gold },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
});
