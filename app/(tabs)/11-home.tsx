/** Screen 11 — Home: greeting, balance, safe-to-spend, AI coach, budget & goal progress,
 *  quick actions, recent activity. */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, ProgressBar, Screen, SectionHeader, TxRow, useBottomPad } from '../../src/components/ui';
import { C, T } from '../../src/theme';
import { useApp, firstName } from '../../src/store/AppProvider';
import { money, fmtWeekdayDate } from '../../src/lib/format';
import { coachTip } from '../../src/lib/ai';
import { ESSENTIAL_CATS, monthExpenses, safeToSpend, totalBalance } from '../../src/lib/finance';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomPad(8);
  const { state } = useApp();
  const [tipSeed, setTipSeed] = useState(0);
  const tip = useMemo(() => coachTip(state), [state, tipSeed]);

  if (!state.onboarded) {
    return (
      <View style={[styles.wrap, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
        <Text style={T.h1}>Let's set up your plan</Text>
        <Text style={{ ...T.body, color: C.gray, marginTop: 8 }}>
          Finish onboarding to unlock budgets, goals and the AI coach.
        </Text>
      </View>
    );
  }

  const balance = totalBalance(state.wallets);
  const sts = safeToSpend(state.budget, state.transactions, state.budget!.nextIncomeDate);
  const spent = monthExpenses(state.transactions);
  const essentialsPlan = state.budget!.allocations.essentials + state.budget!.allocations.flexible;
  const topGoal = [...state.goals].filter((g) => g.status === 'active').sort(
    (a, b) => b.savedAmount / b.targetAmount - a.savedAmount / a.targetAmount,
  )[0];
  const recent = state.transactions.slice(0, 3);
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 14, marginBottom: 18 }}>
        <View style={styles.greetRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={state.user?.name ?? 'A'} size={46} />
            <View style={{ marginLeft: 12 }}>
              <Text style={T.small}>{greeting()},</Text>
              <Text style={{ ...T.h3, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 19 }}>
                {firstName(state.user?.name ?? 'Friend')}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/21-notifications')} style={styles.bell} hitSlop={10}>
            <Ionicons name="notifications-outline" size={22} color={C.navy} />
            {unread > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>
        <Text style={{ ...T.small, marginTop: 10, marginLeft: 58 }}>{fmtWeekdayDate(new Date())}</Text>
      </View>

      {/* Balance card */}
      <Card dark elevation>
        <Text style={{ ...T.label, color: C.onNavyDim }}>AVAILABLE BALANCE</Text>
        <Text style={styles.balance}>{money(balance)}</Text>
        <View style={styles.balanceDivider} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.label, color: C.onNavyDim }}>SAFE TO SPEND TODAY</Text>
            <Text style={styles.safe}>{money(sts.daily)}</Text>
            <Text style={{ ...T.small, color: C.onNavyDim, marginTop: 2 }}>
              {sts.remaining >= 0 ? `${money(sts.remaining)} flexible left` : ''} · {sts.daysLeft}d to income
            </Text>
          </View>
          <View style={styles.incomeChip}>
            <Ionicons name="calendar-outline" size={13} color={C.gold} />
            <Text style={{ ...T.small500, color: C.onNavy, marginLeft: 5 }}>
              Income in {sts.daysLeft}d
            </Text>
          </View>
        </View>
      </Card>

      {/* AI coach */}
      <Pressable onPress={() => router.push('/20-ai-chat')} style={({ pressed }) => [styles.coach, pressed && { opacity: 0.85 }]}>
        <View style={styles.coachIcon}>
          <Ionicons name="sparkles" size={18} color={C.gold} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ ...T.small500, color: C.goldDeep, fontFamily: 'Inter_700Bold' }}>AI COACH</Text>
          <Text style={{ ...T.body, color: C.brown, fontStyle: 'italic', marginTop: 3 }}>{tip}</Text>
        </View>
        <Pressable onPress={() => setTipSeed((s) => s + 1)} hitSlop={10} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          <Ionicons name="refresh" size={16} color={C.gold} />
        </Pressable>
        <Ionicons name="chevron-forward" size={17} color={C.gold} style={{ marginLeft: 8, marginTop: 4 }} />
      </Pressable>

      {/* Budget progress */}
      <Card style={{ marginTop: 16 }} onPress={() => router.push('/12-budget')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[T.label, { flex: 1 }]}>BUDGET PROGRESS · THIS MONTH</Text>
          <Ionicons name="chevron-forward" size={16} color={C.gray} />
        </View>
        <Text style={{ ...T.h3, marginTop: 10 }}>
          {money(spent)} <Text style={{ ...T.small, color: C.gray }}>of {money(essentialsPlan)} planned</Text>
        </Text>
        <ProgressBar progress={spent / Math.max(1, essentialsPlan)} color={spent > essentialsPlan ? C.terracotta : C.gold} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
          {state.budget!.categories.slice(0, 4).map((cat) => {
            const used = state.transactions
              .filter((t) => t.type === 'expense' && t.category === cat.name)
              .reduce((s, t) => s + t.amount, 0);
            return (
              <View key={cat.name} style={{ flex: 1 }}>
                <Text style={{ ...T.small, fontSize: 11 }} numberOfLines={1}>
                  {cat.name}
                </Text>
                <ProgressBar progress={used / Math.max(1, cat.limit)} height={4} color={used > cat.limit ? C.terracotta : C.navy} style={{ marginTop: 4 }} />
              </View>
            );
          })}
        </View>
      </Card>

      {/* Goal progress */}
      {topGoal ? (
        <Card style={{ marginTop: 16 }} onPress={() => router.push(`/14-goal-details?id=${topGoal.id}`)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.label, { flex: 1 }]}>GOAL PROGRESS</Text>
            <Ionicons name="chevron-forward" size={16} color={C.gray} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Text style={{ ...T.h3, flex: 1 }}>{topGoal.name}</Text>
            <Text style={{ ...T.small500, color: C.goldDeep }}>
              {Math.round((topGoal.savedAmount / topGoal.targetAmount) * 100)}%
            </Text>
          </View>
          <ProgressBar progress={topGoal.savedAmount / topGoal.targetAmount} color={C.gold} style={{ marginTop: 10 }} />
          <Text style={{ ...T.small, marginTop: 8 }}>
            {money(topGoal.savedAmount)} saved · {money(topGoal.targetAmount - topGoal.savedAmount)} to go
          </Text>
        </Card>
      ) : null}

      {/* Quick actions */}
      <SectionHeader label="QUICK ACTIONS" />
      <View style={styles.qaGrid}>
        {[
          { label: 'Add Income', icon: 'arrow-down', color: C.green, route: '/16-add-income' },
          { label: 'Record Expense', icon: 'arrow-up', color: C.terracotta, route: '/17-record-expense' },
          { label: 'Create Goal', icon: 'flag', color: C.navy, route: '/15-add-goal' },
          { label: 'Withdraw', icon: 'business', color: C.gold, route: '/27-withdraw' },
        ].map((qa) => (
          <Pressable key={qa.label} onPress={() => router.push(qa.route as never)} style={({ pressed }) => [styles.qaTile, pressed && { opacity: 0.75 }]}>
            <View style={[styles.qaIcon, { backgroundColor: qa.color + '1C' }]}>
              <Ionicons name={qa.icon as keyof typeof Ionicons.glyphMap} size={20} color={qa.color} />
            </View>
            <Text style={{ ...T.small500, color: C.ink, marginTop: 8, textAlign: 'center' }}>{qa.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Recent activity */}
      <SectionHeader label="RECENT ACTIVITY" action="See all" onAction={() => router.push('/19-transaction-history')} />
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4, marginBottom: 24 }} elevation>
        {recent.map((tx, i) => (
          <TxRow key={tx.id} tx={tx} last={i === recent.length - 1} />
        ))}
      </Card>
      <View style={bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.terracotta, borderWidth: 1.5, borderColor: C.card },
  balance: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 38, color: C.onNavy, marginTop: 4 },
  balanceDivider: { height: 1, backgroundColor: 'rgba(247,242,232,0.14)', marginVertical: 16 },
  safe: { fontFamily: 'Inter_700Bold', fontSize: 26, color: C.gold, marginTop: 4 },
  incomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,154,59,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  coach: {
    backgroundColor: C.banner,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(201,154,59,0.2)', alignItems: 'center', justifyContent: 'center' },
  qaGrid: { flexDirection: 'row', gap: 10 },
  qaTile: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: 'center' },
  qaIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
