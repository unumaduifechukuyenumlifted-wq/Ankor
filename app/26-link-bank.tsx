/** Screen 26 — Link Bank Account / Card: bank select, verify, linked accounts list, empty state. */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, EmptyState, Field, InfoBanner, Screen, SectionHeader } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { uid } from '../src/lib/finance';
import { LinkedAccount } from '../src/lib/types';

const BANKS: Option[] = [
  { label: 'Access Bank', icon: 'business' },
  { label: 'GTBank', icon: 'business' },
  { label: 'First Bank', icon: 'business' },
  { label: 'Zenith Bank', icon: 'business' },
  { label: 'UBA', icon: 'business' },
  { label: 'Kuda Bank', icon: 'phone-portrait' },
  { label: 'OPay', icon: 'phone-portrait' },
  { label: 'Moniepoint', icon: 'phone-portrait' },
  { label: 'PalmPay', icon: 'phone-portrait' },
];

const initials = (bank: string) =>
  bank
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const AVATAR_COLORS = ['#16283F', '#C99A3B', '#4F6F52', '#5B7DB1'];

export default function LinkBank() {
  const { flow } = useLocalSearchParams<{ flow: string }>();
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal, simulatedSave } = useApp();
  const [mode, setMode] = useState<'bank' | 'card'>('bank');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [verified, setVerified] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const verify = () => {
    if (mode === 'bank' && accountNumber.replace(/\D/g, '').length !== 10) {
      setErr('Account numbers are 10 digits');
      return;
    }
    if (mode === 'card' && cardNumber.replace(/\D/g, '').length < 15) {
      setErr('Enter the 16 digits on your card');
      return;
    }
    setErr(null);
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(state.user?.name ?? 'Ada Obi');
    }, 1300);
  };

  const link = async () => {
    if (!bank) {
      setErr('Select your bank first');
      return;
    }
    try {
      await simulatedSave();
      const last4 = (mode === 'bank' ? accountNumber : cardNumber).slice(-4);
      dispatch({
        type: 'LINK_ACCOUNT',
        account: {
          id: uid('acct'),
          bank,
          accountNumber: mode === 'bank' ? accountNumber : cardNumber,
          accountName: verified ?? state.user?.name ?? 'You',
        } as LinkedAccount,
      });
      showModal({
        type: 'account-linked',
        props: {
          bank,
          last4,
          onDone: () => {
            if (flow === 'withdraw') router.back();
          },
        },
      });
      setBank('');
      setAccountNumber('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setVerified(null);
    } catch {
      setErr('Network unavailable — please try again.');
    }
  };

  return (
    <Screen kb>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Link Bank Account" />
      </View>

      {/* Linked accounts */}
      <SectionHeader label={`LINKED ACCOUNTS · ${state.linkedAccounts.length}`} />
      {state.linkedAccounts.length === 0 ? (
        <Card style={{ paddingVertical: 8 }}>
          <EmptyState
            icon="business-outline"
            title="No linked bank account"
            body="Link your first account to withdraw money straight to your bank in minutes."
          />
        </Card>
      ) : (
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          {state.linkedAccounts.map((a, i) => (
            <View key={a.id} style={[styles.acctRow, i < state.linkedAccounts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <View style={[styles.bankBadge, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.white }}>{initials(a.bank)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ ...T.body500, color: C.navy }}>{a.bank}</Text>
                <Text style={T.small}>
                  •••• {a.accountNumber.slice(-4)} · {a.accountName}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => dispatch({ type: 'UNLINK_ACCOUNT', id: a.id })}>
                <Ionicons name="trash-outline" size={17} color={C.graySoft} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      {/* Add form */}
      <SectionHeader label="ADD NEW" />
      <View style={styles.seg}>
        {(['bank', 'card'] as const).map((m) => (
          <Pressable key={m} onPress={() => { setMode(m); setVerified(null); setErr(null); }} style={[styles.segBtn, mode === m && styles.segOn]}>
            <Text style={{ ...T.small500, color: mode === m ? C.white : C.gray, fontFamily: mode === m ? 'Inter_700Bold' : 'Inter_500Medium' }}>
              {m === 'bank' ? 'Bank Account' : 'Debit Card'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => setSheet(true)} style={styles.bankField}>
        <Text style={T.label}>SELECT BANK</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ ...T.money, flex: 1, color: bank ? C.navy : C.graySoft }}>{bank || 'Choose your bank'}</Text>
          <Ionicons name="chevron-down" size={16} color={C.gray} />
        </View>
      </Pressable>

      {mode === 'bank' ? (
        <Field
          label="Account Number"
          placeholder="0123456789"
          value={accountNumber}
          onChangeText={(t) => { setAccountNumber(t.replace(/\D/g, '').slice(0, 10)); setVerified(null); setErr(null); }}
          keyboardType="number-pad"
          style={{ marginTop: 12 }}
        />
      ) : (
        <>
          <Field
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChangeText={(t) => { setCardNumber(t.replace(/\D/g, '').slice(0, 16)); setVerified(null); setErr(null); }}
            keyboardType="number-pad"
            style={{ marginTop: 12 }}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Field
              label="Expiry"
              placeholder="09/28"
              value={expiry}
              onChangeText={setExpiry}
              keyboardType="number-pad"
              style={{ flex: 1 }}
            />
            <Field label="CVV" placeholder="123" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
        </>
      )}

      {verified ? (
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={18} color={C.green} />
          <Text style={{ ...T.body500, color: C.green, marginLeft: 8 }}>Verified — {verified}</Text>
        </View>
      ) : null}
      {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 10 }}>{err}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button label={verifying ? 'Verifying…' : 'Verify'} variant="outline" style={{ flex: 1 }} onPress={verify} disabled={verifying || !!verified} />
        <Button label="Link Account" style={{ flex: 1 }} onPress={link} disabled={!verified} />
      </View>

      <InfoBanner style={{ marginTop: 16, marginBottom: 30 }} icon="lock-closed">
        Anchor connects read-only and never stores your bank PIN. Withdrawals arrive in minutes.
      </InfoBanner>

      <OptionSheet visible={sheet} title="Select Bank" options={BANKS} selected={bank} onSelect={(l) => { setBank(l); setErr(null); }} onClose={() => setSheet(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: '#EFE8D6', borderRadius: 13, padding: 4, marginBottom: 12 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segOn: { backgroundColor: C.navy },
  bankField: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bankBadge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  acctRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
});
