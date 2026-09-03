/** Screen 03 — Sign Up / Log In (email, phone, password + optional Google/Apple). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button, Field, InfoBanner } from '../src/components/ui';
import { useApp } from '../src/store/AppProvider';
import { C, T } from '../src/theme';

export default function SignUpLogIn() {
  const { mode: modeParam } = useLocalSearchParams<{ mode: string }>();
  const [mode, setMode] = useState<'signup' | 'login'>(modeParam === 'login' ? 'login' : 'signup');
  const { dispatch, showModal } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const isSignup = mode === 'signup';
  const validate = () => {
    const e: Record<string, string | undefined> = {};
    if (isSignup && name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number';
    if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const destination = email || `+234${phone.replace(/\D/g, '').slice(-10)}`;

  const submit = () => {
    if (!validate()) return;
    dispatch({ type: 'SET_PENDING_AUTH', payload: { email, phone: phone || '+234 800 000 0000', mode } });
    showModal({ type: 'otp-sent', props: { destination } });
    router.push(`/04-otp?mode=${mode}`);
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title={isSignup ? 'Create your account' : 'Welcome back'} />
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <View style={styles.seg}>
          {(['signup', 'login'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segActive]}>
              <Text style={{ ...T.small500, color: mode === m ? C.navy : C.gray, fontFamily: mode === m ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                {m === 'signup' ? 'Sign Up' : 'Log In'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isSignup ? (
          <Field
            label="Full Name"
            placeholder="Ada Obi"
            value={name}
            onChangeText={setName}
            error={errors.name}
            style={{ marginTop: 18 }}
          />
        ) : null}
        <Field
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          style={{ marginTop: 12 }}
        />
        <Field
          label="Phone Number"
          placeholder="0803 123 4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
          style={{ marginTop: 12 }}
        />
        <Field
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          style={{ marginTop: 12 }}
        />

        {!isSignup ? (
          <Pressable onPress={() => router.push('/05-forgot-password')} style={{ alignSelf: 'flex-end', marginTop: 12 }}>
            <Text style={{ ...T.small500, color: C.goldDeep }}>Forgot password?</Text>
          </Pressable>
        ) : (
          <InfoBanner style={{ marginTop: 14 }} icon="lock-closed">
            Your money data stays on your device. Anchor never sells your information.
          </InfoBanner>
        )}

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label={isSignup ? 'Create Account' : 'Log In'} onPress={submit} />
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={T.small}>or continue with</Text>
            <View style={styles.orLine} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              label="Google"
              variant="outline"
              icon="logo-google"
              small
              style={{ flex: 1 }}
              onPress={() => showModal({ type: 'social-signin' })}
            />
            <Button
              label="Apple"
              variant="outline"
              icon="logo-apple"
              small
              style={{ flex: 1 }}
              onPress={() => showModal({ type: 'social-signin' })}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#EFE8D6',
    borderRadius: 14,
    padding: 4,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  segActive: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: C.border },
});
