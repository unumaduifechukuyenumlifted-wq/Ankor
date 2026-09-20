/** Screen 25 — Settings. Currency is locked to NGN (Nigeria-only) — display only. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Row, Screen, Toggle } from '../src/components/ui';
import { C, T } from '../src/theme';
import { COUNTRY_NAME, CURRENCY_DISPLAY } from '../src/lib/locale';
import { useApp } from '../src/store/AppProvider';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal } = useApp();
  const s = state.settings;

  const set = (patch: Partial<typeof s>) => dispatch({ type: 'SET_SETTINGS', patch });

  const infoModal = (icon: string, title: string, message: string) =>
    showModal({ type: 'info', props: { icon, title, message, buttonLabel: 'Got it' } });

  const askDeleteAccount = () =>
    showModal({
      type: 'delete-account',
      props: {
        onConfirm: () => {
          dispatch({ type: 'WIPE' });
          router.replace('/02-welcome');
        },
      },
    });

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Settings" />
      </View>

      <Text style={{ ...T.label, marginTop: 8, marginBottom: 8 }}>PREFERENCES</Text>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
        <Row
          icon="notifications-outline"
          label="Notifications"
          onPress={() => set({ notifications: !s.notifications })}
          right={<Toggle value={s.notifications} onChange={(v) => set({ notifications: v })} />}
        />
        <Row
          icon="moon-outline"
          label="Dark Mode"
          onPress={() => {
            const v = !s.darkMode;
            set({ darkMode: v });
            if (v) infoModal('moon', 'Dark mode is docking', 'A warm navy dark theme is in the works and will arrive in the next Anchor release.');
          }}
          right={<Toggle value={s.darkMode} onChange={(v) => { set({ darkMode: v }); if (v) infoModal('moon', 'Dark mode is docking', 'A warm navy dark theme is in the works and will arrive in the next Anchor release.'); }} />}
        />
        <Row
          icon="cash-outline"
          label="Currency"
          sub={`${CURRENCY_DISPLAY} · ${COUNTRY_NAME} only`}
          right={<Ionicons name="lock-closed" size={15} color={C.gray} />}
          last
        />
      </Card>

      <Text style={{ ...T.label, marginTop: 18, marginBottom: 8 }}>SECURITY & PRIVACY</Text>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
        <Row
          icon="shield-checkmark-outline"
          label="Security"
          sub="PIN · 2FA · device sessions"
          onPress={() => infoModal('shield-checkmark', 'Security status: Strong', 'Your account is protected with device binding and encrypted local storage. Two-factor authentication adds an extra layer from the OTP we send at sign-in.')}
        />
        <Row
          icon="finger-print-outline"
          label="Biometric Login"
          onPress={() => set({ biometric: !s.biometric })}
          right={<Toggle value={s.biometric} onChange={(v) => set({ biometric: v })} />}
        />
        <Row
          icon="lock-closed-outline"
          label="Privacy"
          onPress={() => infoModal('lock-closed', 'Privacy at Anchor', 'Your data lives on your device. Anchor never sells your information, and analytics are anonymized. You can export or erase everything from this screen anytime.')}
          last
        />
      </Card>

      <Text style={{ ...T.label, marginTop: 18, marginBottom: 8 }}>SUPPORT</Text>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
        <Row
          icon="help-circle-outline"
          label="Help Center"
          onPress={() => infoModal('help-circle', 'Help Center', 'Browse guides at help.anchor.money or message the team at support@anchor.money. Popular topics: withdrawing to your bank, editing goals, and resetting your plan.')}
        />
        <Row
          icon="information-circle-outline"
          label="About Anchor"
          sub="Version 1.0.0"
          onPress={() => infoModal('anchor', 'Anchor 1.0.0', 'Anchor keeps your spending, savings and goals balanced with AI coaching. Made with care for naira savers everywhere. ⚓')}
        />
        <Row icon="trash-outline" label="Delete Account" danger onPress={askDeleteAccount} last />
      </Card>

      <Text style={{ ...T.label, marginTop: 18, marginBottom: 8 }}>DEMO</Text>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 16, marginBottom: 30 }}>
        <Row
          icon="cloud-offline-outline"
          label="Simulate offline network"
          sub="Turns save actions into failed requests to preview error states"
          onPress={() => dispatch({ type: 'PATCH', patch: { offlineMode: !state.offlineMode } })}
          right={<Toggle value={state.offlineMode} onChange={(v) => dispatch({ type: 'PATCH', patch: { offlineMode: v } })} />}
          last
        />
      </Card>

    </Screen>
  );
}
