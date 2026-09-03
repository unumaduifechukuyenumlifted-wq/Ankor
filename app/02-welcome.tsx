/** Screen 02 — Welcome. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorMark } from '../src/components/Logo';
import { Button } from '../src/components/ui';
import { C, T } from '../src/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 28 }]}>
      <View style={{ alignItems: 'center' }}>
        <AnchorMark size={76} />
        <Text style={styles.headline}>Welcome to Anchor</Text>
        <Text style={styles.sub}>
          Balance your spending, savings and goals with AI.
        </Text>
      </View>

      <View style={styles.cards}>
        {[
          { icon: 'pie-chart', label: 'Smart budgets', sub: 'AI splits every naira before you spend it' },
          { icon: 'flag', label: 'Goal wallets', sub: 'Flexible, locked and emergency savings' },
          { icon: 'sparkles', label: 'AI coach', sub: 'Knows your money, answers instantly' },
        ].map((f) => (
          <View key={f.label} style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>{f.icon === 'pie-chart' ? '🥧' : f.icon === 'flag' ? '🏁' : '✨'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{f.label}</Text>
              <Text style={{ ...T.small, marginTop: 2 }}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto' }}>
        <Button label="Get Started" onPress={() => router.push('/03-signup-login?mode=signup')} />
        <Button label="Log In" variant="outline" onPress={() => router.push('/03-signup-login?mode=login')} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  headline: { ...T.display, textAlign: 'center', marginTop: 26 },
  sub: { ...T.body, textAlign: 'center', color: C.gray, marginTop: 10, maxWidth: 280, alignSelf: 'center' },
  cards: { marginTop: 48, gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});
