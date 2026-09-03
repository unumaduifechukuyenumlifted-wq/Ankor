/** Screen 27 (step 3 of 4) — Confirm transfer: navy summary card, fee/arrival, warning modal. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button, InfoBanner, Screen } from '../../src/components/ui';
import { C, SHADOW, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { money, money2, toISO } from '../../src/lib/format';
import { refCode } from '../../src/lib/finance';

export default function WithdrawStep3() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal } = useApp();
  const draft = state.withdrawDraft;
  const [sending, setSending] = useState(false);

  const wallet = state.wallets.find((w) => w.id === draft?.walletId);
  const account = state.linkedAccounts.find((a) => a.id === draft?.accountId);

  if (!draft?.amount || !wallet || !account) {
    return (
      <Screen>
        <View style={{ marginTop: insets.top }}>
          <AppHeader onBack={() => router.back()} title="Confirm transfer" />
        </View>
        <Text style={{ ...T.body, color: C.gray, textAlign: 'center', marginTop: 40 }}>
          Something went missing — start the withdrawal again.
        </Text>
      </Screen>
    );
  }

  const amount = draft.amount;

  const send = () => {
    setSending(true);
    showModal({
      type: 'withdraw-confirm',
      props: {
        amount,
        walletName: wallet.name,
        bank: account.bank,
        onConfirm: () => {
          const reference = refCode();
          const date = toISO(new Date());
          dispatch({
            type: 'EXECUTE_WITHDRAWAL',
            walletId: wallet.id,
            amount,
            account,
            date,
            reference,
          });
          router.replace(`/27-withdraw/success?ref=${reference}&bank=${encodeURIComponent(account.bank)}&last4=${account.accountNumber.slice(-4)}&wallet=${encodeURIComponent(wallet.name)}&amount=${amount}&date=${encodeURIComponent(date)}`);
        },
      },
    });
    setSending(false);
  };

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Confirm transfer" />
      </View>

      {/* Summary card */}
      <View style={[styles.summary, SHADOW]}>
        <Text style={{ ...T.label, color: 'rgba(247,242,232,0.55)' }}>YOU'RE SENDING</Text>
        <Text style={styles.bigAmount}>{money2(draft.amount)}</Text>
        <View style={styles.sumDivider} />
        {[
          ['From', `${wallet.name} · ${money(wallet.balance)}`],
          ['To', `${account.bank} •••• ${account.accountNumber.slice(-4)}`],
          ['Fee', '₦0.00 — free this month'],
          ['Arrives', 'Within minutes'],
        ].map(([k, v]) => (
          <View key={k} style={styles.sumRow}>
            <Text style={{ ...T.small, color: 'rgba(247,242,232,0.6)' }}>{k}</Text>
            <Text style={{ ...T.small500, color: C.onNavy, flex: 1, textAlign: 'right' }}>{v}</Text>
          </View>
        ))}
      </View>

      <InfoBanner style={{ marginTop: 18 }} icon="information-circle">
        Withdrawals reduce this wallet's progress toward its goal.
      </InfoBanner>

      <View style={{ marginTop: 'auto', marginBottom: insets.bottom + 20 }}>
        <Button label="Confirm & Send" onPress={send} loading={sending} />
        <Button label="Cancel" variant="outline" style={{ marginTop: 12 }} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: C.navy, borderRadius: 22, padding: 22, marginTop: 8 },
  bigAmount: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 42, color: C.onNavy, marginTop: 6 },
  sumDivider: { height: 1, backgroundColor: 'rgba(247,242,232,0.14)', marginVertical: 16 },
  sumRow: { flexDirection: 'row', marginBottom: 12 },
});
