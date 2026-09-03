/** Screen 08 — Onboarding: Financial Goals (multi-select + Skip for now). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, ProgressBar } from '../src/components/ui';
import { C, T } from '../src/theme';
import { onboardingDraft } from '../src/store/onboardingDraft';
import { GOAL_CATALOG, walletForGoalCategory } from '../src/lib/finance';

export default function FinancialGoals() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(
    onboardingDraft.goals.map((g) => g.name),
  );

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const next = () => {
    Object.assign(onboardingDraft, {
      goals: selected.map((name) => ({
        name,
        priority: (onboardingDraft.goals.find((g) => g.name === name)?.priority ?? 'important') as
          | 'essential'
          | 'important'
          | 'optional',
      })),
    });
    router.push(selected.length > 0 ? '/09-priority-setup' : '/10-ai-budget-plan');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Financial goals" />
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <ProgressBar progress={0.75} color={C.gold} style={{ marginBottom: 22 }} />
        <Text style={styles.heading}>What are you saving for?</Text>
        <Text style={styles.sub}>Pick everything that applies — Anchor builds a wallet for each.</Text>

        <View style={styles.grid}>
          {GOAL_CATALOG.map((g) => {
            const on = selected.includes(g.name);
            const wt = walletForGoalCategory(g.name);
            return (
              <Pressable key={g.name} onPress={() => toggle(g.name)} style={[styles.tile, on && styles.tileOn]}>
                <Ionicons name={g.icon as keyof typeof Ionicons.glyphMap} size={22} color={on ? C.white : C.navy} />
                <Text style={{ ...T.small500, color: on ? C.white : C.ink, marginTop: 8, textAlign: 'center', fontFamily: on ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                  {g.name}
                </Text>
                <Text style={{ ...T.small, color: on ? 'rgba(247,242,232,0.7)' : C.graySoft, fontSize: 10.5, marginTop: 2 }}>
                  {wt === 'locked' ? 'Locked' : wt === 'emergency' ? 'Emergency' : 'Flexible'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Pressable onPress={() => { setSelected([]); Object.assign(onboardingDraft, { goals: [] }); router.push('/10-ai-budget-plan'); }} style={{ alignSelf: 'center', marginBottom: 14 }}>
            <Text style={{ ...T.small500, color: C.gray }}>Skip for now</Text>
          </Pressable>
          <Button label="Continue" onPress={next} disabled={selected.length === 0} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 22, gap: 12 },
  tile: {
    width: '30.5%',
    aspectRatio: 0.92,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tileOn: { backgroundColor: C.navy, borderColor: C.navy },
});
