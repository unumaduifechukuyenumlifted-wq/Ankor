/** Screen 27 (step 4 of 4) — Transfer successful: receipt + share + done. */
import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { AppHeader, Button, Card, Screen } from '../../src/components/ui';
import { SuccessCheck } from '../../src/components/SuccessCheck';
import { C, T } from '../../src/theme';
import { money, fmtDateTime } from '../../src/lib/format';

export default function WithdrawSuccess() {
  const insets = useSafeAreaInsets();
  const { ref, bank, last4, wallet, amount, date } = useLocalSearchParams<{
    ref: string;
    bank: string;
    last4: string;
    wallet: string;
    amount: string;
    date: string;
  }>();

  const share = () =>
    Share.share({
      message: `Anchor receipt\n${ref}\n${money(Number(amount))} sent to ${bank} •••• ${last4}\n${fmtDateTime(date)}`,
    }).catch(() => undefined);

  const done = () => {
    router.dismissAll();
    router.replace('/13-goals');
  };

  return (
    <Screen scroll={false}>
      <View style={{ marginTop: insets.top }}>
        <AppHeader />
      </View>
      <View style={{ alignItems: 'center', marginTop: 26 }}>
        <SuccessCheck size={92} />
        <Text style={styles.amount}>{money(Number(amount ?? 0))} Sent</Text>
        <Text style={styles.sub}>
          To {bank} •••• {last4}
        </Text>
      </View>

      <Card style={{ marginTop: 30 }}>
        {[
          ['Reference', ref ?? '—'],
          ['From', `${wallet} wallet`],
          ['Date', fmtDateTime(date ?? new Date().toISOString())],
        ].map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={T.small}>{k}</Text>
            <Text style={{ ...T.small500, color: C.navy, flex: 1, textAlign: 'right' }}>{v}</Text>
          </View>
        ))}
        <View style={[styles.row, { marginBottom: 0 }]}>
          <Text style={T.small}>Status</Text>
          <View style={styles.statusPill}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: C.green }}>Completed</Text>
          </View>
        </View>
      </Card>

      <Pressable onPress={share} style={{ alignSelf: 'center', marginTop: 20 }} hitSlop={10}>
        <Text style={{ ...T.body500, color: C.goldDeep }}>Share Receipt</Text>
      </Pressable>

      <View style={{ marginTop: 'auto', marginBottom: insets.bottom + 24 }}>
        <Button label="Done" onPress={done} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amount: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 34, color: C.navy, marginTop: 20 },
  sub: { ...T.body, color: C.gray, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statusPill: { backgroundColor: C.greenSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, flex: 1, alignItems: 'flex-end', marginLeft: 12 },
});
