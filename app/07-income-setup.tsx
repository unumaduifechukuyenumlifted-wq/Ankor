/** Screen 07 — Onboarding: Income Setup (frequency, average income, next income date). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, AmountInput, Button, InfoBanner, ProgressBar, SelectField , FlexScroll } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { onboardingDraft } from '../src/store/onboardingDraft';
import { money } from '../src/lib/format';

const FREQ: Option[] = [
  { label: 'Weekly', sub: 'Paid every week' },
  { label: 'Biweekly', sub: 'Every two weeks' },
  { label: 'Monthly', sub: 'Once a month' },
];

const dateOptions = (): Option[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    const label = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
    return i === 0 ? { label: `Tomorrow — ${label}` } : { label };
  });
};

export default function IncomeSetup() {
  const insets = useSafeAreaInsets();
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(
    onboardingDraft.frequency,
  );
  const [income, setIncome] = useState(onboardingDraft.income);
  const [nextDate, setNextDate] = useState(onboardingDraft.nextIncomeDate);
  const [sheet, setSheet] = useState<null | 'freq' | 'date'>(null);
  const [err, setErr] = useState<string | null>(null);

  const incomeNum = Number(income.replace(/,/g, ''));
  const freqLabel = FREQ.find((f) => f.label.toLowerCase() === frequency)?.label ?? 'Monthly';

  const next = () => {
    if (!incomeNum || incomeNum < 1000) {
      setErr('Enter your average income (at least ₦1,000)');
      return;
    }
    setErr(null);
    Object.assign(onboardingDraft, {
      income,
      frequency,
      nextIncomeDate: nextDate,
    });
    router.push('/08-financial-goals');
  };

  const prettyDate = (() => {
    const d = new Date(nextDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  })();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Income setup" />
      <FlexScroll style={{ paddingHorizontal: 20 }}>
        <ProgressBar progress={0.5} color={C.gold} style={{ marginBottom: 22 }} />
        <Text style={styles.heading}>How much comes in?</Text>
        <Text style={styles.sub}>Anchor uses your income to build a realistic plan.</Text>

        <View style={styles.freqRow}>
          {(['weekly', 'biweekly', 'monthly'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFrequency(f)}
              style={[styles.freqBtn, frequency === f && styles.freqOn]}
            >
              <Text style={{ ...T.small500, color: frequency === f ? C.navy : C.gray, fontFamily: frequency === f ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                {FREQ.find((x) => x.label.toLowerCase() === f)?.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <AmountInput value={income} onChange={(t) => { setIncome(t); setErr(null); }} label={`AVERAGE ${frequency.toUpperCase()} INCOME`} style={{ marginTop: 14 }} />
        {incomeNum > 0 ? (
          <Text style={{ ...T.small, marginTop: 8, marginLeft: 4 }}>
            That's about {money(Math.round((incomeNum * (frequency === 'monthly' ? 12 : frequency === 'biweekly' ? 26 : 52)) / 365))} per day.
          </Text>
        ) : null}

        <SelectField label="Next Income Date" value={prettyDate} onPress={() => setSheet('date')} icon="calendar" style={{ marginTop: 12 }} />
        {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 10 }}>{err}</Text> : null}

        <InfoBanner style={{ marginTop: 18 }} icon="sparkles">
          Anchor will re-run your budget allocation each time income lands, so your plan never goes stale.
        </InfoBanner>

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label="Continue" onPress={next} />
        </View>
      </FlexScroll>

      <OptionSheet
        visible={sheet === 'freq'}
        title="Income Frequency"
        options={FREQ}
        selected={freqLabel}
        onSelect={(l) => setFrequency(l.toLowerCase() as 'weekly' | 'biweekly' | 'monthly')}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'date'}
        title="Next Income Date"
        options={dateOptions()}
        selected={prettyDate}
        onSelect={(label) => {
          const dayOffset = dateOptions().findIndex((o) => o.label === label) + 1;
          setNextDate(new Date(Date.now() + dayOffset * 86400000).toISOString());
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
  freqRow: { flexDirection: 'row', backgroundColor: '#EFE8D6', borderRadius: 14, padding: 4, marginTop: 22 },
  freqBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  freqOn: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
});
