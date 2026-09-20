/** Screen 19 — Transaction History: filter tabs, search, filter icon, colored rows, empty state. */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, EmptyState, Screen, TxRow } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { money } from '../src/lib/format';
import { TxType } from '../src/lib/types';

const TABS: { label: string; types: TxType[] }[] = [
  { label: 'All', types: ['income', 'expense', 'savings', 'withdrawal'] },
  { label: 'Income', types: ['income'] },
  { label: 'Expenses', types: ['expense', 'withdrawal'] },
  { label: 'Savings', types: ['savings'] },
];

const RANGES: Option[] = [
  { label: 'All time' },
  { label: 'This month' },
  { label: 'This week' },
];

export default function TransactionHistory() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('All time');
  const [sheet, setSheet] = useState(false);

  const txs = useMemo(() => {
    const now = new Date();
    const cutoff =
      range === 'This month' ? new Date(now.getFullYear(), now.getMonth(), 1) : range === 'This week' ? new Date(now.getTime() - 7 * 86400000) : null;
    return state.transactions
      .filter((t) => TABS[tab].types.includes(t.type))
      .filter((t) => (cutoff ? new Date(t.date) >= cutoff : true))
      .filter((t) =>
        query.trim().length === 0
          ? true
          : `${t.description} ${t.category}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, tab, query, range]);

  const sum = (type: TxType) =>
    txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Transactions" />
      </View>
      <View style={{ paddingBottom: 24 }}>
        {/* Search + filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={C.gray} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search transactions"
              placeholderTextColor={C.graySoft}
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, minWidth: 0, fontFamily: 'Inter_500Medium', fontSize: 14, color: C.navy, padding: 0 }}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close" size={16} color={C.gray} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setSheet(true)}>
            <Ionicons name="options-outline" size={18} color={C.navy} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <Pressable key={t.label} onPress={() => setTab(i)} style={[styles.tab, tab === i && styles.tabOn]}>
              <Text style={{ ...T.small500, color: tab === i ? C.white : C.gray, fontFamily: tab === i ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 0 ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={[styles.sumChip, { backgroundColor: C.greenSoft }]}>
              <Text style={{ ...T.small, color: C.green }}>In {money(sum('income'))}</Text>
            </View>
            <View style={[styles.sumChip, { backgroundColor: C.terracottaSoft }]}>
              <Text style={{ ...T.small, color: C.terracotta }}>Out {money(sum('expense') + sum('withdrawal'))}</Text>
            </View>
          </View>
        ) : null}

        <Text style={{ ...T.small, marginBottom: 10, marginLeft: 2 }}>
          {range} · {txs.length} transaction{txs.length === 1 ? '' : 's'}
        </Text>

        {txs.length === 0 ? (
          <Card style={{ paddingVertical: 10 }}>
            <EmptyState
              icon="receipt-outline"
              title={query ? 'Nothing matches that search' : 'No transactions yet'}
              body={query ? 'Try a different search term or clear the filters.' : 'Your income and expenses will show up here.'}
            />
          </Card>
        ) : (
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }} elevation>
            {txs.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} last={i === txs.length - 1} />
            ))}
          </Card>
        )}
      </View>

      <OptionSheet visible={sheet} title="Date Range" options={RANGES} selected={range} onSelect={setRange} onClose={() => setSheet(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', backgroundColor: '#EFE8D6', borderRadius: 13, padding: 4, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  tabOn: { backgroundColor: C.navy },
  sumChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
