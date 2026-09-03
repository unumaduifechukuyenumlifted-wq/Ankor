/** Screen 17 — Record Expense: amount, category icon grid, description, date,
 *  instant budget update + Budget Exceeded warning. */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AmountInput, Button, ErrorBanner, Field, SelectField , FlexScroll } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { uid } from '../src/lib/finance';
import { toISO } from '../src/lib/format';
import { Transaction } from '../src/lib/types';

const CATS = [
  { name: 'Food', icon: 'fast-food' },
  { name: 'Transport', icon: 'bus' },
  { name: 'Data', icon: 'wifi' },
  { name: 'Other', icon: 'ellipsis-horizontal' },
];

const dateOptions = (): Option[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return [
    { label: 'Today' },
    { label: 'Yesterday' },
    ...Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.now() - (i + 2) * 86400000);
      return { label: `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}` };
    }),
  ];
};

export default function RecordExpense() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, showModal, simulatedSave } = useApp();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('Today');
  const [sheet, setSheet] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [netErr, setNetErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountNum = Number(amount);

  const buildTx = (): Transaction => ({
    id: uid('tx'),
    type: 'expense',
    amount: amountNum,
    category: category ?? 'Other',
    description: description.trim() || (category ?? 'Expense'),
    date: date === 'Today' ? toISO(new Date()) : date === 'Yesterday' ? toISO(new Date(Date.now() - 86400000)) : toISO(new Date()),
  });

  const commit = () => {
    dispatch({ type: 'RECORD_EXPENSE', tx: buildTx() });
    showModal({
      type: 'expense-added',
      props: { amount: amountNum, category: category, onDone: () => router.back() },
    });
  };

  const save = async () => {
    if (!amountNum || amountNum <= 0) {
      setErr('Enter the amount you spent');
      return;
    }
    if (!category) {
      setErr('Pick a category');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await simulatedSave();

      // Budget exceeded check against the category's monthly limit
      const cat = state.budget?.categories.find((c) => c.name === category);
      const spent = state.transactions
        .filter((t) => t.type === 'expense' && t.category === category && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((s, t) => s + t.amount, 0);
      const limit = cat?.limit ?? state.budget?.allocations.flexible ?? Infinity;

      if (cat && spent + amountNum > limit) {
        showModal({
          type: 'budget-exceeded',
          props: { amount: amountNum, category, limit, onProceed: commit },
        });
      } else {
        commit();
      }
    } catch {
      setNetErr('Network unavailable — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Record Expense" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <Text style={styles.heading}>What did you spend?</Text>
        <Text style={styles.sub}>Logging keeps your safe-to-spend honest.</Text>

        <AmountInput value={amount} onChange={(t) => { setAmount(t); setErr(null); }} autoFocus style={{ marginTop: 22 }} />

        <Text style={{ ...T.label, marginTop: 18, marginBottom: 10 }}>CATEGORY</Text>
        <View style={styles.grid}>
          {CATS.map((cat) => {
            const on = category === cat.name;
            return (
              <Pressable key={cat.name} onPress={() => { setCategory(cat.name); setErr(null); }} style={[styles.catTile, on && styles.catOn]}>
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={24} color={on ? C.white : C.navy} />
                <Text style={{ ...T.small500, color: on ? C.white : C.ink, marginTop: 8, fontFamily: on ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="Description" placeholder="e.g. Lunch at Cafe One" value={description} onChangeText={setDescription} style={{ marginTop: 16 }} />
        <SelectField label="Date" value={date} onPress={() => setSheet(true)} icon="calendar" style={{ marginTop: 12 }} />

        {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 12 }}>{err}</Text> : null}
        {netErr ? <ErrorBanner message={netErr} onRetry={save} style={{ marginTop: 12 }} /> : null}

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label="Save Expense" onPress={save} loading={saving} />
          <Text style={{ ...T.small, textAlign: 'center', marginTop: 10 }}>Updates your budget instantly.</Text>
        </View>
      </FlexScroll>

      <OptionSheet visible={sheet} title="Date" options={dateOptions()} selected={date} onSelect={setDate} onClose={() => setSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 12 },
  catTile: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  catOn: { backgroundColor: C.navy, borderColor: C.navy },
});
