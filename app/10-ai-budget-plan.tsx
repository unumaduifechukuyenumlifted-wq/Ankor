/** Screen 10 — AI Budget Recommendation: income, suggested allocation, Accept/Customize,
 *  success animation ("You're ready."), then straight to Home. */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, InfoBanner , FlexScroll } from '../src/components/ui';
import { SuccessCheck } from '../src/components/SuccessCheck';
import { C, T } from '../src/theme';
import { useApp, Split } from '../src/store/AppProvider';
import { onboardingDraft } from '../src/store/onboardingDraft';
import { COUNTRY_CODE, CURRENCY_CODE } from '../src/lib/locale';
import { money } from '../src/lib/format';
import { suggestAllocation, uid } from '../src/lib/finance';

const ROWS: { key: keyof Split; label: string; hint: string; color: string }[] = [
  { key: 'essentials', label: 'Essentials', hint: 'Food · Transport · Data · Rent · Bills', color: C.navy },
  { key: 'goals', label: 'Goals', hint: 'Split across your goals by priority', color: C.gold },
  { key: 'flexible', label: 'Flexible money', hint: 'Safe to spend on anything', color: C.green },
];

export default function AiBudgetPlan() {
  const insets = useSafeAreaInsets();
  const { dispatch, state } = useApp();
  const income = Math.max(0, Number(onboardingDraft.income.replace(/,/g, '')) || 0);
  const suggested = useMemo(() => suggestAllocation(income), [income]);
  const [custom, setCustom] = useState(false);
  const [split, setSplit] = useState<Split>(suggested);
  const [ready, setReady] = useState(false);

  const total = split.essentials + split.goals + split.flexible;
  const pct = (v: number) => Math.round((v / Math.max(1, income)) * 100);

  const bump = (key: keyof Split, delta: number) => {
    setSplit((s) => {
      const next = { ...s, [key]: Math.max(0, s[key] + delta) };
      const sum = next.essentials + next.goals + next.flexible;
      if (sum > income) return s; // keep total = income
      return next;
    });
  };

  const confirm = (finalSplit: Split) => {
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: {
        user: {
          id: uid('user'),
          name: onboardingDraft.name || 'Ada Obi',
          email: state.pendingAuth?.email || 'ada@example.com',
          phone: state.pendingAuth?.phone || '+234 803 123 4567',
          // Nigeria-only lock: fixed values, not user input (store re-hardcodes too)
          country: COUNTRY_CODE,
          currency: CURRENCY_CODE,
          occupation: onboardingDraft.occupation || 'SALARY_EARNER',
          occupationOther:
            onboardingDraft.occupation === 'OTHER' ? onboardingDraft.occupationOther.trim() || undefined : undefined,
        },
        income,
        frequency: onboardingDraft.frequency,
        nextIncomeDate: onboardingDraft.nextIncomeDate,
        selectedGoals: onboardingDraft.goals,
        split: finalSplit,
      },
    });
    setReady(true);
    setTimeout(() => router.replace('/11-home'), 2300);
  };

  if (ready) {
    return (
      <View style={styles.ready}>
        <SuccessCheck size={92} />
        <Text style={styles.readyTitle}>You're ready.</Text>
        <Text style={styles.readySub}>Your plan is live — welcome to Anchor.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="AI Budget Recommendation" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <Text style={styles.heading}>Here's your plan</Text>
        <Text style={styles.sub}>
          Built from a {money(income)} {onboardingDraft.frequency} income using the 50/30/20 anchor method.
        </Text>

        <Card dark style={{ marginTop: 20 }}>
          <Text style={{ ...T.label, color: C.onNavyDim }}>MONTHLY INCOME</Text>
          <Text style={styles.income}>{money(income)}</Text>
          <View style={{ height: 1, backgroundColor: 'rgba(247,242,232,0.14)', marginVertical: 16 }} />
          {ROWS.map((r) => (
            <View key={r.key} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={{ ...T.body500, color: C.onNavy, flex: 1, marginLeft: 8 }}>{r.label}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.onNavy }}>
                  {money(split[r.key])}
                </Text>
                <Text style={{ ...T.small, color: C.onNavyDim, width: 44, textAlign: 'right' }}>{pct(split[r.key])}%</Text>
              </View>
              {!custom ? <Text style={{ ...T.small, color: C.onNavyDim, marginLeft: 16, marginTop: 2 }}>{r.hint}</Text> : null}
              {custom ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 8 }}>
                  <Pressable onPress={() => bump(r.key, -1000)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={16} color={C.onNavy} />
                  </Pressable>
                  <View style={styles.stepBar}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: r.color, width: `${pct(split[r.key])}%` }} />
                  </View>
                  <Pressable onPress={() => bump(r.key, 1000)} style={styles.stepBtn}>
                    <Ionicons name="add" size={16} color={C.onNavy} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
          {custom ? (
            <Text style={{ ...T.small, color: C.onNavyDim, marginTop: 2 }}>
              {total === income ? 'Balanced — every naira has a job.' : `${money(income - total)} unassigned`}
            </Text>
          ) : null}
        </Card>

        <InfoBanner style={{ marginTop: 16 }} icon="sparkles">
          {custom
            ? 'Adjust in ₦1,000 steps — Anchor keeps the total locked to your income.'
            : 'Essentials are protected first, goals funded by priority, and you keep flexible money guilt-free.'}
        </InfoBanner>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          {custom ? (
            <>
              <Button label="Confirm Plan" onPress={() => confirm(split)} disabled={total !== income} />
              <Button
                label="Back to suggestion"
                variant="ghost"
                small
                style={{ marginTop: 6, borderWidth: 0 }}
                onPress={() => {
                  setCustom(false);
                  setSplit(suggested);
                }}
              />
            </>
          ) : (
            <>
              <Button label="Accept Plan" onPress={() => confirm(suggested)} />
              <Button label="Customize Plan" variant="outline" style={{ marginTop: 12 }} onPress={() => setCustom(true)} />
            </>
          )}
        </View>
      </FlexScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
  income: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 36, color: C.onNavy, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(247,242,232,0.14)', alignItems: 'center', justifyContent: 'center' },
  stepBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(247,242,232,0.16)', marginHorizontal: 10, overflow: 'hidden', flexDirection: 'row' },
  ready: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  readyTitle: { ...T.display, marginTop: 26, textAlign: 'center' },
  readySub: { ...T.body, color: C.gray, marginTop: 8, textAlign: 'center' },
});
