/** Screen 05 — Forgot Password / Reset: email/phone → send code → new password → confirm. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button, Field, InfoBanner , FlexScroll } from '../src/components/ui';
import { useApp } from '../src/store/AppProvider';
import { C, T } from '../src/theme';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const { showModal } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const sendCode = () => {
    if (contact.trim().length < 5) {
      setErr('Enter the email or phone on your account');
      return;
    }
    setErr(null);
    showModal({ type: 'otp-sent', props: { destination: contact } });
    setStep(2);
  };

  const reset = () => {
    if (code.replace(/\D/g, '').length !== 6) {
      setErr('Enter the 6-digit code we sent you');
      return;
    }
    if (pw.length < 6) {
      setErr('New password must be at least 6 characters');
      return;
    }
    if (pw !== confirm) {
      setErr("Passwords don't match");
      return;
    }
    setErr(null);
    showModal({
      type: 'info',
      props: {
        icon: 'checkmark-circle',
        title: 'Password reset',
        message: 'Your password has been updated. Log in with your new password.',
        buttonLabel: 'Back to Log In',
        onDone: () => router.back(),
      },
    });
    setStep(3);
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Reset password" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <View style={styles.steps}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotOn]} />
          ))}
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.heading}>Enter your email or phone</Text>
            <Text style={styles.sub}>We'll send a reset code to verify it's you.</Text>
            <Field
              label="Email or Phone Number"
              placeholder="you@example.com"
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
              error={err}
              style={{ marginTop: 18 }}
            />
            <Button label="Send Reset Code" onPress={sendCode} style={{ marginTop: 20 }} />
          </>
        ) : step === 2 ? (
          <>
            <Text style={styles.heading}>Enter new password</Text>
            <Text style={styles.sub}>Code sent to {contact}. It expires in 10 minutes.</Text>
            <Field
              label="Reset Code"
              placeholder="6-digit code"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              style={{ marginTop: 18 }}
            />
            <Field label="New Password" placeholder="••••••••" value={pw} onChangeText={setPw} secureTextEntry style={{ marginTop: 12 }} />
            <Field label="Confirm New Password" placeholder="••••••••" value={confirm} onChangeText={setConfirm} secureTextEntry style={{ marginTop: 12 }} />
            {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 10 }}>{err}</Text> : null}
            <Button label="Reset Password" onPress={reset} style={{ marginTop: 20 }} />
          </>
        ) : (
          <InfoBanner icon="checkmark-circle" style={{ marginTop: 18 }}>
            Password updated. Head back to the log in screen to continue.
          </InfoBanner>
        )}
      </FlexScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  steps: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotOn: { backgroundColor: C.gold },
  heading: { ...T.h1, marginTop: 4 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
});
