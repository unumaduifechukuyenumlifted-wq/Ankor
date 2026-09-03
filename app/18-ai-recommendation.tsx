/** Screen 18 — AI Recommendation: "Here's how to split it" for the income just entered. */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, InfoBanner } from '../src/components/ui';
import { C, T } from '../src/theme';
import { useApp, Split } from '../src/store/AppProvider';
import { money } from '../src/lib/format';
import { suggestAllocation } from '../src/lib/finance';

const ROWS: { key: keyof Split; label: string; hint: string; color: string }[] = [
  { key: 'essentials', label: 'Essentials', hint: 'Food, transport, data, rent, bills', color: C.navy },
  { key: 'goals', label: 'Goals', hint: 'Weighted by your priorities', color: C.gold },
  { key: 'flexible', label: 'Flexible money', hint: 'Yours to enjoy, guilt-free', color: C.green },
];

export default function AiRecommendation() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal } = useApp();
  const draft = state.incomeDraft;
  const suggested = useMemo(() => suggestAllocation(draft?.amount ?? 0), [draft?.amount]);
  const [split, setSplit] = useState<Split>(suggested);
  const [editing, setEditing] = useState(false);

  if (!draft) {
    return (
      <View style={[styles.wrap, { paddingTop: insets.top }]}>
        <AppHeader onBack={() => router.back()} title="AI Recommendation" />
        <Text style={{ ...T.body, color: C.gray, textAlign: 'center', marginTop: 40 }}>
          Add an income first and I'll show you how to split it.
        </Text>
      </View>
    );
  }

  const total = split.essentials + split.goals + split.flexible;
  const goalNames = state.goals.filter((g) => g.status === 'active').slice(0, 3).map((g) => g.name);

  const bump = (key: keyof Split, delta: number) =>
    setSplit((s) => {
      const next = { ...s, [key]: Math.max(0, s[key] + delta) };
      return next.essentials + next.goals + next.flexible > draft.amount ? s : next;
    });

  const accept = (finalSplit: Split) => {
    dispatch({
      type: 'APPLY_INCOME',
      amount: draft.amount,
      source: draft.source,
      dateReceived: draft.dateReceived,
      nextIncomeDate: draft.nextIncomeDate,
      split: finalSplit,
    });
    showModal({
      type: 'income-added',
      props: {
        amount: draft.amount,
        onDone: () => {
          router.dismissAll();
          router.replace('/11-home');
        },
      },
    });
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="AI Recommendation" />
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.heading}>Here's how to split it</Text>
        <Text style={styles.sub}>
          Your {money(draft.amount)} {draft.source.toLowerCase()} income, anchored the 50/30/20 way.
        </Text>

        <Card dark style={{ marginTop: 20 }} elevation>
          {ROWS.map((r, i) => (
            <View key={r.key} style={{ marginBottom: i === ROWS.length - 1 ? 0 : 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ ...T.body500, color: C.onNavy }}>{r.label}</Text>
                  {!editing ? <Text style={{ ...T.small, color: C.onNavyDim }}>{r.hint}</Text> : null}
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: C.onNavy }}>{money(split[r.key])}</Text>
              </View>
              {editing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 20 }}>
                  <Pressable onPress={() => bump(r.key, -500)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={15} color={C.onNavy} />
                  </Pressable>
                  <View style={styles.bar}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: r.color, width: `${(split[r.key] / draft.amount) * 100}%` }} />
                  </View>
                  <Pressable onPress={() => bump(r.key, 500)} style={styles.stepBtn}>
                    <Ionicons name="add" size={15} color={C.onNavy} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {editing ? (
            <Text style={{ ...T.small, color: C.onNavyDim, marginTop: 14 }}>
              {total === draft.amount ? 'Balanced ✓' : `${money(draft.amount - total)} left to assign`}
            </Text>
          ) : null}
        </Card>

        <InfoBanner style={{ marginTop: 16 }} icon="sparkles">
          {editing
            ? 'Adjust in ₦500 steps. Essentials stay protected no matter what.'
            : goalNames.length > 0
              ? `Goals money flows to ${goalNames.join(', ')} — weighted by the priorities you set.`
              : 'No active goals yet, so goals money parks in Locked Savings until you create one.'}
        </InfoBanner>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label={editing ? 'Accept Split' : 'Accept'} onPress={() => accept(split)} disabled={editing && total !== draft.amount} />
          <Button label="Edit" variant="outline" style={{ marginTop: 12 }} onPress={() => setEditing((e) => !e)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(247,242,232,0.14)', alignItems: 'center', justifyContent: 'center' },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(247,242,232,0.16)', marginHorizontal: 10, overflow: 'hidden' },
});
