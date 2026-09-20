/** Screen 06 — Onboarding: Personal Information (occupation + free-text OTHER).
 *  Nigeria-only: no country/currency pickers — fixed NG/NGN (src/lib/locale.ts).
 *  Continue lives in a FIXED footer (never scrolls out of view when the OTHER
 *  free-text field appears or the keyboard opens) and is enabled when:
 *  - a listed occupation is selected, OR
 *  - "Other" is selected AND the free-text occupationOther field is non-empty. */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, Button, Field, InfoBanner, ProgressBar, SelectField } from '../src/components/ui';
import { OptionSheet } from '../src/components/OptionSheet';
import { C, T } from '../src/theme';
import { onboardingDraft } from '../src/store/onboardingDraft';
import { OCCUPATION_OPTIONS, occupationLabel } from '../src/lib/occupations';
import { Occupation } from '../src/lib/types';
import { NIGERIA_ONLY_BANNER } from '../src/lib/locale';

export default function PersonalInfo() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(onboardingDraft.name);
  const [occupation, setOccupation] = useState<Occupation | ''>(onboardingDraft.occupation || '');
  const [occupationOther, setOccupationOther] = useState(onboardingDraft.occupationOther ?? '');
  const [sheet, setSheet] = useState<null | 'occupation'>(null);
  const [err, setErr] = useState<string | null>(null);

  const isOther = occupation === 'OTHER';
  // Validation truth table for the Continue button (always visible, disabled until valid):
  //  - listed occupation (not Other) → complete
  //  - Other + non-empty free text → complete
  //  - Other + empty text → NOT complete (user hasn't answered yet)
  const nameOk = name.trim().length >= 2;
  const otherOk = !isOther || occupationOther.trim().length > 0;
  const canContinue = nameOk && !!occupation && otherOk;

  const next = () => {
    if (!canContinue) {
      setErr(
        !nameOk
          ? 'Add your name to continue'
          : !occupation
            ? 'Select your occupation to continue'
            : 'Tell us what you do — a word is enough',
      );
      return;
    }
    setErr(null);
    Object.assign(onboardingDraft, {
      name,
      occupation,
      occupationOther: isOther ? occupationOther.trim() : '',
    });
    router.push('/07-income-setup');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <AppHeader onBack={() => router.back()} title="Personal information" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar progress={0.25} color={C.gold} style={{ marginBottom: 22 }} />
          <Text style={styles.heading}>Let's get to know you</Text>
          <Text style={styles.sub}>This helps Anchor tailor your budget and AI coaching.</Text>

          <Field
            label="Full Name"
            placeholder="Ada Obi"
            value={name}
            onChangeText={(t) => { setName(t); setErr(null); }}
            style={{ marginTop: 22 }}
          />
          <SelectField
            label="Occupation"
            value={occupation ? occupationLabel(occupation) : 'Select occupation'}
            placeholder={!occupation}
            onPress={() => setSheet('occupation')}
            icon="briefcase"
            style={{ marginTop: 12 }}
          />
          {isOther ? (
            <>
              <Field
                label="What do you do?"
                placeholder="e.g. Content creator, Driver"
                value={occupationOther}
                onChangeText={(t) => { setOccupationOther(t); setErr(null); }}
                autoFocus
                style={{ marginTop: 12 }}
              />
              {occupationOther.trim().length === 0 ? (
                <Text style={styles.otherHint}>
                  Type a word or two — Continue unlocks once you've answered.
                </Text>
              ) : null}
            </>
          ) : null}
          <InfoBanner style={{ marginTop: 14 }} icon="lock-closed">
            {NIGERIA_ONLY_BANNER}
          </InfoBanner>
          {err ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 10 }}>{err}</Text> : null}
        </ScrollView>

        {/* Fixed footer — always visible, never pushed away by field/keyboard growth */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 12 }}>
          <Button label="Continue" onPress={next} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={sheet === 'occupation'}
        title="Occupation"
        options={OCCUPATION_OPTIONS.map((o) => ({ label: o.label, icon: o.icon }))}
        selected={occupation ? occupationLabel(occupation) : undefined}
        onSelect={(label) => {
          const opt = OCCUPATION_OPTIONS.find((o) => o.label === label);
          if (opt) setOccupation(opt.key);
          setErr(null);
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
  otherHint: { ...T.small, marginTop: 8, marginLeft: 4, color: C.goldDeep },
});
