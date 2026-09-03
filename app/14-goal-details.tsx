/** Screen 14 — Goal Details: dark card, progress, Add Money / Withdraw, transactions, edit/delete. */
import React, { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AmountInput,
  AppHeader,
  Button,
  Card,
  Divider,
  ErrorBanner,
  ProgressBar,
  Screen,
  SectionHeader,
  TagPill,
  TxRow,
} from '../src/components/ui';
import { C, SHADOW, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { money, fmtDate } from '../src/lib/format';
import { isGoalMatured, unlockConditionLabel } from '../src/lib/locks';
import { PRIORITY_LABEL } from '../src/lib/finance';
import { Goal } from '../src/lib/types';

export default function GoalDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal, simulatedSave } = useApp();
  const goal = state.goals.find((g) => g.id === id);
  const wallet = state.wallets.find((w) => w.id === goal?.walletId);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pop = useMemo(() => new Animated.Value(0), []);

  if (!goal || !wallet) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Goal" />
        <Text style={{ ...T.body, color: C.gray, textAlign: 'center', marginTop: 40 }}>This goal no longer exists.</Text>
      </View>
    );
  }

  const pct = Math.min(1, goal.savedAmount / goal.targetAmount);
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const isLockedAccess = goal.accessType === 'locked';
  const matured = isGoalMatured(goal);
  const hardLocked = isLockedAccess && !matured; // ABSOLUTE LOCK (spec 4.4)
  const canWithdraw = !hardLocked && wallet.balance > 0;
  const txs = state.transactions
    .filter((t) => t.goalId === goal.id || (t.walletId === wallet.id && (t.type === 'savings' || t.type === 'withdrawal')))
    .slice(0, 8);

  const confirmAdd = async () => {
    const n = Number(amount);
    if (!n || n <= 0) {
      setErr('Enter an amount first');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await simulatedSave();
      const willComplete = goal.savedAmount + n >= goal.targetAmount;
      dispatch({ type: 'ADD_MONEY_TO_GOAL', goalId: goal.id, amount: n });
      setAdding(false);
      setAmount('');
      Animated.spring(pop, { toValue: 1, friction: 6, useNativeDriver: true }).start();
      showModal({
        type: willComplete ? 'goal-completed' : 'success-saving',
        props: willComplete
          ? { goalName: goal.name, onDone: () => undefined }
          : { amount: n, goalName: goal.name, onDone: () => undefined },
      });
    } catch {
      setErr('Network unavailable — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showHardLock = () =>
    showModal({
      type: 'hard-lock',
      props: { unlockDatePretty: fmtDate(goal.targetDate), targetAmount: goal.targetAmount },
    });

  const askDelete = () =>
    showModal({
      type: 'delete-goal',
      props: {
        goalName: goal.name,
        saved: goal.savedAmount,
        onConfirm: () => {
          dispatch({ type: 'DELETE_GOAL', id: goal.id });
          router.back();
        },
      },
    });

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} />
      </View>

      <Animated.View style={[styles.hero, SHADOW, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: C.onNavy, flex: 1 }}>{goal.name}</Text>
          {goal.status === 'completed' ? (
            <TagPill label="Completed" color={C.gold} bg="rgba(201,154,59,0.2)" icon="checkmark" />
          ) : (
            <TagPill label={PRIORITY_LABEL[goal.priority]} color="rgba(247,242,232,0.85)" bg="rgba(247,242,232,0.12)" />
          )}
        </View>
        <Text style={{ ...T.label, color: 'rgba(247,242,232,0.55)', marginTop: 16 }}>TARGET AMOUNT</Text>
        <Text style={styles.target}>{money(goal.targetAmount)}</Text>
        <Text style={{ ...T.small, color: 'rgba(247,242,232,0.6)', marginTop: 2 }}>by {fmtDate(goal.targetDate)}</Text>
        {isLockedAccess ? (
          <View style={[styles.lockChip, { backgroundColor: matured ? 'rgba(79,111,82,0.30)' : 'rgba(201,154,59,0.20)' }]}>
            <Ionicons name={matured ? 'lock-open-outline' : 'lock-closed'} size={12} color={matured ? '#9CC7A1' : C.gold} />
            <Text style={{ ...T.small, color: matured ? '#BADBBE' : '#E3C687', marginLeft: 5 }}>
              {matured ? 'Unlocked — withdrawals available' : `Strictly locked · ${unlockConditionLabel(goal)}`}
            </Text>
          </View>
        ) : null}
        <ProgressBar progress={pct} color={C.gold} track="rgba(247,242,232,0.16)" height={10} style={{ marginTop: 16 }} />
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.label, color: 'rgba(247,242,232,0.55)' }}>SAVED</Text>
            <Text style={{ ...styles.heroNum, color: C.gold }}>{money(goal.savedAmount)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.label, color: 'rgba(247,242,232,0.55)' }}>REMAINING</Text>
            <Text style={styles.heroNum}>{money(remaining)}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
        <Button label="Add Money" icon="add" style={{ flex: 1 }} onPress={() => setAdding(true)} />
        {hardLocked ? (
          <Button label="Withdraw" variant="outline" icon="lock-closed" style={{ flex: 1 }} onPress={showHardLock} />
        ) : canWithdraw ? (
          <Button
            label="Withdraw"
            variant="outline"
            icon="business"
            style={{ flex: 1 }}
            onPress={() => router.push(`/27-withdraw?walletId=${wallet.id}`)}
          />
        ) : (
          <View style={[styles.lockedNote]}>
            <Ionicons name="wallet-outline" size={14} color={C.gray} />
            <Text style={{ ...T.small, marginLeft: 6 }}>No balance yet</Text>
          </View>
        )}
      </View>

      {/* Transactions */}
      <SectionHeader label="TRANSACTIONS" />
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {txs.length === 0 ? (
          <Text style={{ ...T.small, textAlign: 'center', paddingVertical: 22 }}>
            No transactions yet — tap Add Money to make your first deposit.
          </Text>
        ) : (
          txs.map((tx, i) => <TxRow key={tx.id} tx={tx} last={i === txs.length - 1} />)
        )}
      </Card>

      <View style={styles.footerLinks}>
        <Pressable onPress={() => router.push(`/15-add-goal?id=${goal.id}`)} hitSlop={10}>
          <Text style={{ ...T.body500, color: C.navy }}>Edit Goal</Text>
        </Pressable>
        <View style={{ width: 1, height: 16, backgroundColor: C.border }} />
        <Pressable onPress={askDelete} hitSlop={10}>
          <Text style={{ ...T.body500, color: C.terracotta }}>Delete Goal</Text>
        </Pressable>
      </View>

      {/* Add money overlay */}
      {adding ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBackdrop} onPress={() => setAdding(false)} />
          <Animated.View style={styles.sheetCard}>
            <Text style={T.h2}>Add to {goal.name}</Text>
            <Text style={{ ...T.small, marginTop: 4 }}>
              Goes into {wallet.name} · currently {money(wallet.balance)}
            </Text>
            <AmountInput value={amount} onChange={(t) => { setAmount(t); setErr(null); }} autoFocus style={{ marginTop: 16 }} />
            {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 8 }}>{err}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setAdding(false)} />
              <Button label="Add Money" style={{ flex: 1 }} loading={saving} onPress={confirmAdd} />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 22,
    marginTop: 8,
  },
  target: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 38, color: C.onNavy, marginTop: 4 },
  heroNum: { fontFamily: 'Inter_700Bold', fontSize: 19, color: C.onNavy, marginTop: 4 },
  lockChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  lockedNote: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#F1EBDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 22, marginBottom: 30 },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 60, justifyContent: 'center', paddingHorizontal: 24 },
  overlayBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22,40,63,0.5)' },
  sheetCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    padding: 22,
  },
});
