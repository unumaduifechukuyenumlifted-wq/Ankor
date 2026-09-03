/** Screen 16 — Add Income: amount, source, date received, next income date, then AI split (18). */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, AmountInput, Button, ErrorBanner, InfoBanner, SelectField , FlexScroll } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { toISO } from '../src/lib/format';

const SOURCES: Option[] = [
  { label: 'Salary', icon: 'briefcase' },
  { label: 'Freelance', icon: 'laptop' },
  { label: 'Business', icon: 'storefront' },
  { label: 'Gift', icon: 'gift' },
  { label: 'Other', icon: 'ellipsis-horizontal' },
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

const nextDateOptions = (): Option[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    const label = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    return i === 6 ? { label: `In a week — ${label}` } : { label };
  });
};

const pretty = (iso: string) => {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export default function AddIncome() {
  const insets = useSafeAreaInsets();
  const { dispatch, simulatedSave } = useApp();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [dateReceived, setDateReceived] = useState('Today');
  const [nextIncome, setNextIncome] = useState(toISO(new Date(Date.now() + 30 * 86400000)));
  const [sheet, setSheet] = useState<null | 'source' | 'date' | 'next'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [netErr, setNetErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = Number(amount);
    if (!n || n < 100) {
      setErr('Enter an income amount (at least ₦100)');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await simulatedSave();
      const received =
        dateReceived === 'Today' ? toISO(new Date()) : dateReceived === 'Yesterday' ? toISO(new Date(Date.now() - 86400000)) : toISO(new Date());
      dispatch({
        type: 'PATCH',
        patch: {
          incomeDraft: {
            amount: n,
            source,
            dateReceived: received,
            nextIncomeDate: nextIncome,
          },
        },
      });
      router.push('/18-ai-recommendation');
    } catch {
      setNetErr('Network unavailable — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Add Income" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <Text style={styles.heading}>Money in 🎉</Text>
        <Text style={styles.sub}>Log income and Anchor re-plans everything instantly.</Text>

        <AmountInput value={amount} onChange={(t) => { setAmount(t); setErr(null); }} autoFocus style={{ marginTop: 22 }} />
        {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 8 }}>{err}</Text> : null}

        <SelectField label="Income Source" value={source} onPress={() => setSheet('source')} icon="briefcase" style={{ marginTop: 12 }} />
        <SelectField label="Date Received" value={dateReceived} onPress={() => setSheet('date')} icon="calendar" style={{ marginTop: 12 }} />
        <SelectField label="Next Income Date" value={pretty(nextIncome)} onPress={() => setSheet('next')} icon="calendar-outline" style={{ marginTop: 12 }} />

        <InfoBanner style={{ marginTop: 18 }} icon="sparkles">
          Anchor will re-run your budget allocation once this is added.
        </InfoBanner>

        {netErr ? <ErrorBanner message={netErr} onRetry={submit} style={{ marginTop: 14 }} /> : null}

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label="Continue" onPress={submit} loading={saving} />
        </View>
      </FlexScroll>

      <OptionSheet visible={sheet === 'source'} title="Income Source" options={SOURCES} selected={source} onSelect={setSource} onClose={() => setSheet(null)} />
      <OptionSheet visible={sheet === 'date'} title="Date Received" options={dateOptions()} selected={dateReceived} onSelect={setDateReceived} onClose={() => setSheet(null)} />
      <OptionSheet
        visible={sheet === 'next'}
        title="Next Income Date"
        options={nextDateOptions()}
        selected={pretty(nextIncome)}
        onSelect={(label) => {
          const idx = nextDateOptions().findIndex((o) => o.label === label);
          setNextIncome(toISO(new Date(Date.now() + (idx + 1) * 86400000)));
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  heading: { ...T.h1 },
  sub: { ...T.body, color: C.gray, marginTop: 8 },
});
