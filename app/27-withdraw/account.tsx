/** Screen 27 (step 2 of 4) — Where should it go? Linked accounts + add-new row. */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, EmptyState, Screen } from '../../src/components/ui';
import { C, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { money } from '../../src/lib/format';

const initials = (bank: string) =>
  bank.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const COLORS = ['#16283F', '#C99A3B', '#4F6F52', '#5B7DB1'];

export default function WithdrawStep2() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const draft = state.withdrawDraft;
  const [selected, setSelected] = useState<string | null>(state.withdrawDraft?.accountId ?? null);

  const next = () => {
    dispatch({ type: 'PATCH', patch: { withdrawDraft: { ...draft, accountId: selected ?? undefined } } });
    router.push('/27-withdraw/confirm');
  };

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} />
      </View>

      <Text style={styles.title}>Where should it go?</Text>
      <Text style={styles.sub}>
        {draft?.amount ? `${money(draft.amount)} will land in the account you pick.` : 'Pick the account that should receive this transfer.'}
      </Text>

      <Text style={{ ...T.label, marginTop: 26, marginBottom: 8 }}>LINKED ACCOUNTS</Text>

      {state.linkedAccounts.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No linked bank account"
          body="Link a bank account to withdraw your Anchor savings."
          actionLabel="+ Add New Bank Account"
          onAction={() => router.push('/26-link-bank?flow=withdraw')}
        />
      ) : (
        <View>
          {state.linkedAccounts.map((a, i) => {
            const on = selected === a.id;
            return (
              <Pressable key={a.id} onPress={() => setSelected(a.id)} style={[styles.acctCard, on && styles.acctOn]}>
                <View style={[styles.bankBadge, { backgroundColor: COLORS[i % COLORS.length] }]}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.white }}>{initials(a.bank)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ ...T.body500, color: C.navy }}>{a.bank}</Text>
                  <Text style={T.small}>•••• {a.accountNumber.slice(-4)} · {a.accountName}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Dashed add row */}
      <Pressable onPress={() => router.push('/26-link-bank?flow=withdraw')} style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.7 }]}>
        <Ionicons name="add" size={18} color={C.gold} />
        <Text style={{ ...T.body500, color: C.goldDeep, marginLeft: 8 }}>Add New Bank Account</Text>
      </Pressable>

      <View style={{ marginTop: 'auto', marginBottom: insets.bottom + 20 }}>
        <Button label="Continue" onPress={next} disabled={!selected} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 6 },
  acctCard: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  acctOn: { borderColor: C.navy },
  bankBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.navy },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.navy },
  addRow: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
});
