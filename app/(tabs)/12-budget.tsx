/** Screen 12 — Budget: income summary, budget summary, category breakdown,
 *  today's safe spending, weekly limit, AI suggestions, budget history. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ProgressBar, Screen, SectionHeader, useBottomPad } from '../../src/components/ui';
import { C, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { money, fmtDate } from '../../src/lib/format';
import { budgetSuggestions } from '../../src/lib/ai';
import { monthExpenses, monthIncome, safeToSpend, spentByCategory, categoryStyle } from '../../src/lib/finance';

export default function Budget() {
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomPad(8);
  const { state } = useApp();

  if (!state.budget || !state.onboarded) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top + 20 }}>
          <Text style={T.h1}>Budget</Text>
          <Text style={{ ...T.body, color: C.gray, marginTop: 8 }}>Finish onboarding to see your budget here.</Text>
        </View>
      </Screen>
    );
  }

  const b = state.budget;
  const income = monthIncome(state.transactions);
  const spent = monthExpenses(state.transactions);
  const plan = b.allocations.essentials + b.allocations.flexible;
  const sts = safeToSpend(b, state.transactions, b.nextIncomeDate);
  const byCat = spentByCategory(state.transactions);
  const suggestions = budgetSuggestions(state);

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 14, marginBottom: 18 }}>
        <Text style={T.h1}>Budget</Text>
        <Text style={{ ...T.small, marginTop: 4 }}>Your plan for this month</Text>
      </View>

      {/* Income summary */}
      <Card dark elevation>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.label, color: C.onNavyDim }}>INCOME THIS MONTH</Text>
            <Text style={styles.income}>{money(income)}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(247,242,232,0.14)' }}>
            <Text style={{ ...T.label, color: C.onNavyDim }}>NEXT INCOME</Text>
            <Text style={{ ...styles.incomeSm, marginTop: 4 }}>{fmtDate(b.nextIncomeDate)}</Text>
            <Text style={{ ...T.small, color: C.onNavyDim }}>in {sts.daysLeft} days · {b.frequency}</Text>
          </View>
        </View>
      </Card>

      {/* Budget summary */}
      <Card style={{ marginTop: 16 }}>
        <Text style={T.label}>BUDGET SUMMARY</Text>
        <Text style={{ ...T.h3, marginTop: 10 }}>
          {money(spent)} <Text style={{ ...T.small, color: C.gray }}>spent of {money(plan)}</Text>
        </Text>
        <ProgressBar progress={spent / Math.max(1, plan)} color={spent > plan ? C.terracotta : C.gold} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={T.small}>{Math.round((spent / Math.max(1, plan)) * 100)}% used</Text>
          <Text style={T.small500}>{money(Math.max(0, plan - spent))} left</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Essentials', v: b.allocations.essentials, c: C.navy },
            { label: 'Goals', v: b.allocations.goals, c: C.gold },
            { label: 'Flexible', v: b.allocations.flexible, c: C.green },
          ].map((x) => (
            <View key={x.label} style={styles.allocChip}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.c, marginRight: 6 }} />
                <Text style={{ ...T.small, fontSize: 11 }}>{x.label}</Text>
              </View>
              <Text style={{ ...T.small500, color: C.navy, marginTop: 4 }}>{money(x.v)}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Safe spending + weekly limit */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Card style={{ flex: 1 }}>
          <Text style={T.label}>SAFE TO SPEND TODAY</Text>
          <Text style={{ ...styles.safeBig, color: C.gold }}>{money(sts.daily)}</Text>
          <Text style={T.small}>{money(sts.remaining)} flexible left</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={T.label}>WEEKLY LIMIT</Text>
          <Text style={{ ...styles.safeBig, color: C.navy }}>{money(sts.daily * 7)}</Text>
          <Text style={T.small}>next {sts.daysLeft} days</Text>
        </Card>
      </View>

      {/* Category breakdown */}
      <SectionHeader label="CATEGORY BREAKDOWN" />
      <Card style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
        {b.categories.map((cat, i) => {
          const used = byCat[cat.name] ?? 0;
          const st = categoryStyle(cat.name);
          const over = used > cat.limit;
          return (
            <View key={cat.name} style={{ paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.catIcon, { backgroundColor: st.soft }]}>
                  <Ionicons name={st.icon as keyof typeof Ionicons.glyphMap} size={15} color={st.color} />
                </View>
                <Text style={{ ...T.body500, flex: 1, marginLeft: 10 }}>{cat.name}</Text>
                <Text style={{ ...T.small500, color: over ? C.terracotta : C.navy }}>
                  {money(used)} / {money(cat.limit)}
                </Text>
              </View>
              <ProgressBar progress={used / Math.max(1, cat.limit)} height={6} color={over ? C.terracotta : st.color} style={{ marginTop: 8, marginLeft: 40 }} />
              {i === b.categories.length - 1 ? null : <Divider />}
            </View>
          );
        })}
      </Card>

      {/* AI suggestions */}
      <SectionHeader label="AI SUGGESTIONS" />
      {suggestions.map((s) => (
        <Card key={s.title} style={{ marginTop: 0, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.sugIcon}>
              <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={16} color={C.gold} />
            </View>
            <Text style={{ ...T.body500, flex: 1, marginLeft: 10 }}>{s.title}</Text>
          </View>
          <Text style={{ ...T.small, marginTop: 8, lineHeight: 19 }}>{s.body}</Text>
        </Card>
      ))}

      {/* Budget history */}
      <SectionHeader label="BUDGET HISTORY" />
      <Card style={{ paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24 }}>
        {[...b.history].reverse().map((h, i, arr) => (
          <View key={h.month}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ ...T.h3, width: 46, fontFamily: 'PlayfairDisplay_700Bold' }}>{h.month}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={T.small}>Income {money(h.income)}</Text>
                <ProgressBar progress={h.spent / Math.max(1, h.income)} height={5} color={C.navy} style={{ marginTop: 6 }} />
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                <Text style={{ ...T.small500, color: C.terracotta }}>−{money(h.spent)}</Text>
                <Text style={{ ...T.small500, color: C.green, marginTop: 2 }}>+{money(h.saved)}</Text>
              </View>
            </View>
            {i === arr.length - 1 ? null : <Divider />}
          </View>
        ))}
      </Card>
      <View style={bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  income: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: C.onNavy, marginTop: 4 },
  incomeSm: { fontFamily: 'Inter_700Bold', fontSize: 17, color: C.onNavy },
  allocChip: { flex: 1, backgroundColor: C.bgDeep, borderRadius: 12, padding: 10 },
  safeBig: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 8 },
  catIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sugIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
});
