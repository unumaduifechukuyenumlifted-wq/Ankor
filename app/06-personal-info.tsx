/** Screen 06 — Onboarding: Personal Information. */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button, Field, ProgressBar, SelectField } from '../src/components/ui';
import { OptionSheet } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { onboardingDraft } from '../src/store/onboardingDraft';

const OCCUPATIONS = [
  { label: 'Student', icon: 'school' },
  { label: 'NYSC', icon: 'ribbon' },
  { label: 'Salary Earner', icon: 'briefcase' },
  { label: 'Freelancer', icon: 'laptop' },
];

const COUNTRIES = [
  { label: 'Nigeria', icon: 'flag' },
  { label: 'Ghana', icon: 'flag' },
  { label: 'Kenya', icon: 'flag' },
  { label: 'South Africa', icon: 'flag' },
  { label: 'United Kingdom', icon: 'flag' },
  { label: 'United States', icon: 'flag' },
];

const CURRENCIES = [
  { label: 'NGN — Nigerian Naira (₦)' },
  { label: 'GHS — Ghanaian Cedi (₵)' },
  { label: 'KES — Kenyan Shilling (KSh)' },
  { label: 'USD — US Dollar ($)' },
];

export default function PersonalInfo() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(onboardingDraft.name);
  const [country, setCountry] = useState(onboardingDraft.country);
  const [currency, setCurrency] = useState(onboardingDraft.currency);
  const [occupation, setOccupation] = useState(onboardingDraft.occupation);
  const [sheet, setSheet] = useState<null | 'country' | 'currency' | 'occupation'>(null);
  const [err, setErr] = useState<string | null>(null);

  const next = () => {
    if (name.trim().length < 2 || !occupation) {
      setErr('Add your name and occupation to continue');
      return;
    }
    Object.assign(onboardingDraft, { name, country, currency, occupation });
    router.push('/07-income-setup');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Personal information" />
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <ProgressBar progress={0.25} color={C.gold} style={{ marginBottom: 22 }} />
        <Text style={styles.heading}>Let's get to know you</Text>
        <Text style={styles.sub}>This helps Anchor tailor your budget and AI coaching.</Text>

        <Field label="Full Name" placeholder="Ada Obi" value={name} onChangeText={(t) => { setName(t); setErr(null); }} style={{ marginTop: 22 }} />
        <SelectField label="Country" value={country} onPress={() => setSheet('country')} icon="earth" style={{ marginTop: 12 }} />
        <SelectField label="Currency" value={currency} onPress={() => setSheet('currency')} icon="cash" style={{ marginTop: 12 }} />
        <SelectField
          label="Occupation"
          value={occupation || 'Select occupation'}
          placeholder={!occupation}
          onPress={() => setSheet('occupation')}
          icon="briefcase"
          style={{ marginTop: 12 }}
        />
        {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 10 }}>{err}</Text> : null}

        <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
          <Button label="Continue" onPress={next} />
        </View>
      </View>

      <OptionSheet
        visible={sheet === 'country'}
        title="Country"
        options={COUNTRIES}
        selected={country}
        onSelect={setCountry}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'currency'}
        title="Currency"
        options={CURRENCIES}
        selected={currency}
        onSelect={setCurrency}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'occupation'}
        title="Occupation"
        options={OCCUPATIONS}
        selected={occupation}
        onSelect={setOccupation}
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
