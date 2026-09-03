/** Screen 15 — Add Goal: name, target, date; wallet auto-assigned by category (override via banner),
 *  priority selector, Save. Doubles as Edit Goal (via ?id=). */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, AmountInput, Button, ErrorBanner, Field, InfoBanner, SelectField } from '../src/components/ui';
import { OptionSheet, Option } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { GOAL_CATALOG, defaultGoalTarget, uid, walletForGoalCategory } from '../src/lib/finance';
import { toISO } from '../src/lib/format';
import { Priority } from '../src/lib/types';

const PRIORITIES: { key: Priority; label: string; hint: string }[] = [
  { key: 'essential', label: 'Essential', hint: 'Funded first' },
  { key: 'important', label: 'Important', hint: 'Steady funding' },
  { key: 'optional', label: 'Optional', hint: 'Extra funds' },
];

export default function AddGoal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, dispatch, simulatedSave } = useApp();
  const existing = state.goals.find((g) => g.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [target, setTarget] = useState(existing ? String(existing.targetAmount) : '');
  const [months, setMonths] = useState(3);
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'important');
  const [walletType, setWalletType] = useState(existing ? state.wallets.find((w) => w.id === existing.walletId)?.type : undefined);
  const [sheet, setSheet] = useState<null | 'category' | 'date' | 'wallet'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [netErr, setNetErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const autoWallet = walletForGoalCategory(category || 'Other');
  const effectiveWallet = walletType ?? autoWallet;
  const wallet = state.wallets.find((w) => w.type === effectiveWallet);

  const targetDate = toISO(new Date(Date.now() + months * 30 * 86400000));
  const dateOptions: Option[] = [
    { label: '3 months', sub: 'Recommended' },
    { label: '6 months' },
    { label: '9 months' },
    { label: '12 months' },
  ];
  const dateLabel = `${months} months · ${new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const save = async () => {
    const targetNum = Number(target);
    if (name.trim().length < 2) return setErr('Give your goal a name');
    if (!targetNum || targetNum < 100) return setErr('Target must be at least ₦100');
    setErr(null);
    setSaving(true);
    try {
      await simulatedSave();
      if (existing) {
        dispatch({
          type: 'UPDATE_GOAL',
          goal: { ...existing, name: name.trim(), targetAmount: targetNum, targetDate, priority, walletId: wallet?.id ?? existing.walletId, category: category || existing.category },
        });
      } else {
        dispatch({
          type: 'ADD_GOAL',
          goal: {
            id: uid('goal'),
            name: name.trim(),
            targetAmount: targetNum,
            savedAmount: 0,
            targetDate,
            priority,
            walletId: wallet?.id ?? 'w-flex',
            category: category || 'Other',
            status: 'active',
            createdAt: toISO(new Date()),
          },
        });
      }
      router.back();
    } catch {
      setNetErr('Network unavailable — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title={existing ? 'Edit Goal' : 'New Goal'} />
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.heading}>{existing ? 'Adjust your goal' : 'What are you anchoring?'}</Text>
        <Text style={styles.sub}>Anchor assigns the right wallet automatically.</Text>

        <Field label="Goal Name" placeholder="e.g. New Laptop" value={name} onChangeText={(t) => { setName(t); setErr(null); }} style={{ marginTop: 20 }} />
        <SelectField
          label="Category"
          value={category || 'Select category'}
          placeholder={!category}
          onPress={() => setSheet('category')}
          icon="pricetag-outline"
          style={{ marginTop: 12 }}
        />
        <AmountInput value={target} onChange={(t) => { setTarget(t); setErr(null); }} label="TARGET AMOUNT" style={{ marginTop: 12 }} />
        <SelectField label="Target Date" value={dateLabel} onPress={() => setSheet('date')} icon="calendar" style={{ marginTop: 12 }} />

        {/* Auto wallet + override */}
        {category ? (
          <InfoBanner style={{ marginTop: 14 }} icon="wallet-outline">
            {`${category} goals are saved in a ${autoWallet === 'locked' ? 'Locked' : autoWallet === 'emergency' ? 'Emergency' : 'Flexible'} wallet. `}
            <Text
              style={{ fontFamily: 'Inter_700Bold', fontStyle: 'italic', color: C.goldDeep }}
              onPress={() => setSheet('wallet')}
            >
              {walletType && walletType !== autoWallet
                ? `Using ${walletType === 'locked' ? 'Locked' : walletType === 'emergency' ? 'Emergency' : 'Flexible'} — Change wallet`
                : 'Change wallet'}
            </Text>
          </InfoBanner>
        ) : null}

        {/* Priority selector */}
        <Text style={{ ...T.label, marginTop: 18, marginBottom: 8 }}>PRIORITY</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {PRIORITIES.map((p) => (
            <Pressable key={p.key} onPress={() => setPriority(p.key)} style={[styles.prioBtn, priority === p.key && styles.prioOn]}>
              <Text style={{ ...T.small500, color: priority === p.key ? C.white : C.ink, fontFamily: priority === p.key ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                {p.label}
              </Text>
              <Text style={{ ...T.small, fontSize: 10.5, color: priority === p.key ? 'rgba(247,242,232,0.7)' : C.gray, marginTop: 2 }}>
                {p.hint}
              </Text>
            </Pressable>
          ))}
        </View>

        {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 14 }}>{err}</Text> : null}
        {netErr ? (
          <ErrorBanner message={netErr} onRetry={save} style={{ marginTop: 14 }} />
        ) : null}

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label={existing ? 'Save Changes' : 'Save Goal'} onPress={save} loading={saving} />
        </View>
      </View>

      <OptionSheet
        visible={sheet === 'category'}
        title="Category"
        options={GOAL_CATALOG.map((g) => ({ label: g.name, sub: `Default target ₦${g.target.toLocaleString('en-US')}` }))}
        selected={category}
        onSelect={(label) => {
          setCategory(label);
          if (!target) setTarget(String(defaultGoalTarget(label).target));
        }}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'date'}
        title="Target Date"
        options={dateOptions}
        selected={`${months} months`}
        onSelect={(label) => setMonths(Number(label.split(' ')[0]))}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'wallet'}
        title="Wallet"
        options={[
          { label: 'Flexible Savings', sub: 'Add and withdraw anytime' },
          { label: 'Locked Savings', sub: 'Withdrawals locked until target' },
          { label: 'Emergency Fund', sub: 'For surprises only' },
        ]}
        selected={state.wallets.find((w) => w.type === effectiveWallet)?.name}
        onSelect={(label) => {
          const map: Record<string, 'flexible' | 'locked' | 'emergency'> = {
            'Flexible Savings': 'flexible',
            'Locked Savings': 'locked',
            'Emergency Fund': 'emergency',
          };
          setWalletType(map[label]);
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
  prioBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.card,
    paddingVertical: 12,
    alignItems: 'center',
  },
  prioOn: { backgroundColor: C.navy, borderColor: C.navy },
});
