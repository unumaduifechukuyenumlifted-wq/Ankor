/** Screen 27 (step 1 of 4) — Send to your bank: wallet, amount, daily-limit banner. */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AmountInput, AppHeader, Button, InfoBanner, Screen } from '../../src/components/ui';
import { OptionSheet, Option } from '../../src/components/OptionSheet';
import { WalletBadge } from '../../src/components/ui';
import { C, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { money } from '../../src/lib/format';

export default function WithdrawStep1() {
  const { walletId } = useLocalSearchParams<{ walletId?: string }>();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const [wallet, setWallet] = useState<string | undefined>(walletId ?? state.withdrawDraft?.walletId ?? state.wallets[0]?.id);
  const [amount, setAmount] = useState(state.withdrawDraft?.amount ? String(state.withdrawDraft.amount) : '');
  const [sheet, setSheet] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: 'PATCH', patch: { withdrawDraft: { ...state.withdrawDraft, walletId: wallet } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const w = state.wallets.find((x) => x.id === wallet);
  const amountNum = Number(amount);

  const next = () => {
    if (!w) return;
    if (!amountNum || amountNum <= 0) return setErr('Enter an amount');
    if (amountNum > w.balance) return setErr(`That's more than this wallet's ${money(w.balance)} balance`);
    setErr(null);
    dispatch({ type: 'PATCH', patch: { withdrawDraft: { walletId: wallet, amount: amountNum } } });
    router.push('/27-withdraw/account');
  };

  const walletOptions: Option[] = state.wallets.map((x) => ({
    label: x.name,
    sub: `${money(x.balance)} · ${x.type === 'locked' ? 'Locked' : x.type === 'emergency' ? 'Emergency' : 'Flexible'}`,
    icon: x.type === 'flexible' ? 'wallet' : x.type === 'locked' ? 'lock-closed' : 'shield',
  }));

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} />
      </View>

      <Text style={styles.title}>Send to your bank</Text>
      <Text style={styles.sub}>Move money out of Anchor whenever you need it.</Text>

      {/* From wallet */}
      <Text style={{ ...T.label, marginTop: 26, marginBottom: 8 }}>FROM WALLET</Text>
      <Pressable onPress={() => setSheet(true)} style={styles.walletCard}>
        <WalletBadge type={w?.type ?? 'flexible'} size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ ...T.h3, fontSize: 16 }}>{w?.name}</Text>
            <View style={[styles.typePill, w?.type === 'emergency' && { backgroundColor: C.terracottaSoft }]}>
              <Text style={{ ...T.small, fontSize: 10, color: w?.type === 'emergency' ? C.terracotta : C.gray }}>
                {w?.type === 'locked' ? 'Locked' : w?.type === 'emergency' ? 'Emergency' : 'Flexible'}
              </Text>
            </View>
          </View>
          <Text style={{ ...T.money, marginTop: 4 }}>{money(w?.balance ?? 0)}</Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={C.gray} />
      </Pressable>

      <AmountInput value={amount} onChange={(t) => { setAmount(t); setErr(null); }} style={{ marginTop: 14 }} />

      <View style={styles.quickRow}>
        {[0.25, 0.5, 1].map((f) => (
          <Pressable
            key={f}
            onPress={() => { setAmount(String(Math.floor((w?.balance ?? 0) * f))); setErr(null); }}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={{ ...T.small500, color: C.navy }}>{f === 1 ? 'All' : `${f * 100}%`}</Text>
          </Pressable>
        ))}
      </View>

      {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 8 }}>{err}</Text> : null}

      <InfoBanner style={{ marginTop: 14 }} icon="information-circle">
        You can withdraw up to {money(w?.balance ?? 0)} from this wallet today.
      </InfoBanner>

      <View style={{ marginTop: 'auto', marginBottom: insets.bottom + 20 }}>
        <Button label="Continue" onPress={next} disabled={!amountNum || !!err} />
      </View>

      <OptionSheet
        visible={sheet}
        title="From Wallet"
        options={walletOptions}
        selected={w?.name}
        onSelect={(label) => setWallet(state.wallets.find((x) => x.name === label)?.id)}
        onClose={() => setSheet(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 6 },
  walletCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typePill: { marginLeft: 8, backgroundColor: C.bgDeep, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickBtn: { borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
});
