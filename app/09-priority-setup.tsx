/** Screen 09 — Onboarding: Priority Setup (Essential / Important / Optional). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, InfoBanner, ProgressBar , FlexScroll } from '../src/components/ui';
import { OptionSheet } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { onboardingDraft } from '../src/store/onboardingDraft';
import { GOAL_CATALOG } from '../src/lib/finance';

type Priority = 'essential' | 'important' | 'optional';

const PRIORITIES: { key: Priority; label: string; hint: string; color: string }[] = [
  { key: 'essential', label: 'Essential', hint: 'Must happen', color: C.terracotta },
  { key: 'important', label: 'Important', hint: 'Should happen', color: C.gold },
  { key: 'optional', label: 'Optional', hint: 'Nice to have', color: C.green },
];

export default function PrioritySetup() {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<{ name: string; priority: Priority }[]>(
    onboardingDraft.goals.length > 0 ? onboardingDraft.goals : [],
  );
  const [sheetFor, setSheetFor] = useState<string | null>(null);

  const setPriority = (goalName: string, priority: string) =>
    setGoals((gs) => gs.map((g) => (g.name === goalName ? { ...g, priority: priority as Priority } : g)));

  const next = () => {
    Object.assign(onboardingDraft, { goals });
    router.push('/10-ai-budget-plan');
  };

  const activeGoal = sheetFor ? goals.find((g) => g.name === sheetFor) : null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Priority setup" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <ProgressBar progress={0.9} color={C.gold} style={{ marginBottom: 22 }} />
        <Text style={styles.heading}>Rank your goals</Text>
        <Text style={styles.sub}>
          Anchor funds higher-priority goals first when income lands.
        </Text>

        <View style={styles.prioRow}>
          {PRIORITIES.map((p) => (
            <View key={p.key} style={styles.prioHead}>
              <View style={[styles.prioDot, { backgroundColor: p.color }]} />
              <Text style={{ ...T.small500, color: C.navy, fontFamily: 'Inter_700Bold' }}>{p.label}</Text>
              <Text style={{ ...T.small, fontSize: 11 }}>{p.hint}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          {goals.map((g) => {
            const p = PRIORITIES.find((x) => x.key === g.priority)!;
            const icon = GOAL_CATALOG.find((x) => x.name === g.name)?.icon ?? 'ellipsis-horizontal';
            return (
              <Pressable key={g.name} onPress={() => setSheetFor(g.name)} style={({ pressed }) => [styles.goalRow, pressed && { opacity: 0.75 }]}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={C.navy} style={{ marginRight: 12 }} />
                <Text style={{ ...T.body500, flex: 1 }}>{g.name === 'Other' ? 'My Goal' : g.name}</Text>
                <View style={[styles.prioPill, { backgroundColor: p.color + '22' }]}>
                  <View style={[styles.prioDot, { backgroundColor: p.color }]} />
                  <Text style={{ ...T.small500, color: C.navy, marginLeft: 6 }}>{p.label}</Text>
                </View>
                <Ionicons name="chevron-down" size={15} color={C.gray} style={{ marginLeft: 8 }} />
              </Pressable>
            );
          })}
        </View>

        <InfoBanner style={{ marginTop: 16 }} icon="information-circle">
          Essential goals get 3× funding weight, Important 2×, Optional 1×.
        </InfoBanner>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Pressable onPress={next} style={{ alignSelf: 'center', marginBottom: 14 }}>
            <Text style={{ ...T.small500, color: C.gray }}>Skip for now</Text>
          </Pressable>
          <Button label="Continue" onPress={next} />
        </View>
      </FlexScroll>

      <OptionSheet
        visible={sheetFor !== null}
        title={sheetFor ?? ''}
        options={PRIORITIES.map((p) => ({ label: p.label, sub: p.hint }))}
        selected={activeGoal ? PRIORITIES.find((p) => p.key === activeGoal.priority)?.label : undefined}
        onSelect={(label) => sheetFor && setPriority(sheetFor, label.toLowerCase())}
        onClose={() => setSheetFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
  prioRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  prioHead: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.card,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  prioDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  prioPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
