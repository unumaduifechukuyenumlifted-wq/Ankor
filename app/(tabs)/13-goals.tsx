/** Screen 13 — Goals: three wallet cards, goal list with progress, + Create Goal, empty state. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, EmptyState, ProgressBar, Screen, TagPill, useBottomPad } from '../../src/components/ui';
import { C, SHADOW, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { money, moneyK, fmtDateShort } from '../../src/lib/format';
import { isGoalMatured } from '../../src/lib/locks';

const WALLET_STYLE = {
  flexible: { bg: '#2E4666', accent: C.gold, tag: 'Flexible' },
  locked: { bg: '#0F1E31', accent: '#8FB4E3', tag: 'Locked' },
  emergency: { bg: C.terracotta, accent: '#F3D9CC', tag: 'Emergency' },
} as const;

export default function Goals() {
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomPad(8);
  const { state } = useApp();
  const wallets = state.wallets;
  const goals = state.goals;

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 14, marginBottom: 16 }}>
        <Text style={T.h1}>Goals</Text>
        <Text style={{ ...T.small, marginTop: 4 }}>Every naira anchored to a purpose</Text>
      </View>

      {/* Wallet cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
        style={{ marginHorizontal: -20, marginLeft: 0 }}
      >
        {wallets.map((w) => {
          const st = WALLET_STYLE[w.type];
          const goalCount = goals.filter((g) => g.walletId === w.id).length;
          return (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/27-withdraw?walletId=${w.id}`)}
              style={[styles.walletCard, { backgroundColor: st.bg }, SHADOW]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Ionicons
                  name={w.type === 'flexible' ? 'wallet' : w.type === 'locked' ? 'lock-closed' : 'shield'}
                  size={18}
                  color={st.accent}
                />
                <Text style={{ ...T.small, color: 'rgba(247,242,232,0.75)', fontFamily: 'Inter_600SemiBold' }}>{st.tag}</Text>
              </View>
              <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 19, color: C.onNavy, marginTop: 14 }}>
                {w.name}
              </Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: st.accent, marginTop: 6 }}>
                {money(w.balance)}
              </Text>
              <Text style={{ ...T.small, color: 'rgba(247,242,232,0.7)', marginTop: 4 }}>
                {goalCount} goal{goalCount === 1 ? '' : 's'} · tap to withdraw
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Goal list */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 }}>
        <Text style={{ ...T.h2, fontSize: 19 }}>Your Goals</Text>
        {goals.length > 0 ? <Text style={T.small}>{goals.length} total</Text> : null}
      </View>

      {goals.length === 0 ? (
        <Card style={{ paddingVertical: 10 }}>
          <EmptyState
            icon="flag-outline"
            title="No goals yet"
            body="Create your first savings goal to get started"
            actionLabel="Create Goal"
            onAction={() => router.push('/15-add-goal')}
          />
        </Card>
      ) : (
        goals.map((g) => {
          const pct = Math.min(1, g.savedAmount / g.targetAmount);
          const wallet = wallets.find((w) => w.id === g.walletId);
          return (
            <Card key={g.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/14-goal-details?id=${g.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ ...T.h3, fontSize: 16 }}>{g.name}</Text>
                    {g.accessType === 'locked' ? (
                      <Ionicons
                        name={isGoalMatured(g) ? 'lock-open-outline' : 'lock-closed'}
                        size={13}
                        color={isGoalMatured(g) ? C.green : C.gold}
                      />
                    ) : null}
                    {g.status === 'completed' ? <TagPill label="Completed" color={C.green} bg={C.greenSoft} icon="checkmark" /> : null}
                  </View>
                  <Text style={{ ...T.small, marginTop: 3 }}>
                    {wallet?.name} · by {fmtDateShort(g.targetDate)}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.goldDeep }}>
                  {moneyK(g.savedAmount)}/{moneyK(g.targetAmount)}
                </Text>
              </View>
              <ProgressBar progress={pct} color={g.status === 'completed' ? C.green : C.gold} style={{ marginTop: 12 }} />
            </Card>
          );
        })
      )}

      <Button label="+ Create Goal" onPress={() => router.push('/15-add-goal')} style={{ marginTop: 6, marginBottom: 24 }} />
      <View style={bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    width: 230,
    borderRadius: 20,
    padding: 18,
    marginRight: 12,
  },
});
