/** Screen 24 — Achievements: Earned / Locked badge circles + Next Badge progress. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, ProgressBar, Screen, SectionHeader } from '../src/components/ui';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { moneyK } from '../src/lib/format';

const Badge: React.FC<{
  icon: string;
  label: string;
  locked?: boolean;
}> = ({ icon, label, locked }) => (
  <View style={styles.badgeCol}>
    <View style={[styles.badgeCircle, locked && styles.badgeLocked]}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={locked ? C.graySoft : C.gold} />
      {locked ? (
        <View style={styles.lockDot}>
          <Ionicons name="lock-closed" size={9} color={C.white} />
        </View>
      ) : null}
    </View>
    <Text style={{ ...T.small500, color: locked ? C.gray : C.navy, marginTop: 8, textAlign: 'center', fontSize: 12, maxWidth: 96 }}>
      {label}
    </Text>
  </View>
);

export default function Achievements() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const earned = state.achievements.filter((a) => a.earned);
  const locked = state.achievements.filter((a) => !a.earned);
  const next = [...locked].sort((a, b) => b.progress / b.target - a.progress / a.target)[0];

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Achievements" />
      </View>

      <SectionHeader label={`EARNED · ${earned.length}`} />
      <Card>
        {earned.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ ...T.small, textAlign: 'center' }}>
              No badges earned yet — your first goal or 30-day streak unlocks this shelf.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {earned.map((a) => (
              <Badge key={a.id} icon={a.icon} label={a.name} />
            ))}
          </View>
        )}
      </Card>

      <SectionHeader label={`LOCKED · ${locked.length}`} />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {locked.map((a) => (
            <Badge key={a.id} icon={a.icon} label={a.name} locked />
          ))}
        </View>
        <View style={{ marginTop: 14 }}>
          {locked.map((a) => (
            <View key={a.id} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ ...T.small500, flex: 1 }}>{a.name}</Text>
                <Text style={T.small}>
                  {a.target >= 100000 ? `${moneyK(a.progress)}/${moneyK(a.target)}` : `${Math.min(a.progress, a.target)}/${a.target}`}
                </Text>
              </View>
              <ProgressBar progress={a.progress / a.target} height={5} color={C.graySoft} style={{ marginTop: 5 }} />
            </View>
          ))}
        </View>
      </Card>

      {next ? (
        <>
          <SectionHeader label="NEXT BADGE" />
          <Card style={{ marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.badgeCircle, { width: 48, height: 48, borderRadius: 16 }]}>
                <Ionicons name={next.icon as keyof typeof Ionicons.glyphMap} size={22} color={C.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={T.h3}>{next.name}</Text>
                <Text style={{ ...T.small, marginTop: 2 }}>{next.description}</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: C.goldDeep }}>
                {next.target >= 100000
                  ? `${moneyK(next.progress)}/${moneyK(next.target)}`
                  : `${Math.min(next.progress, next.target)}/${next.target}`}
              </Text>
            </View>
            <ProgressBar progress={next.progress / next.target} color={C.gold} style={{ marginTop: 14 }} />
          </Card>
        </>
      ) : (
        <Card style={{ marginBottom: 30, alignItems: 'center' }}>
          <Text style={T.h3}>All badges earned 🎉</Text>
          <Text style={{ ...T.small, marginTop: 4, textAlign: 'center' }}>You've mastered Anchor. New badges ship soon.</Text>
          <Button label="View Goals" variant="outline" small style={{ marginTop: 14 }} onPress={() => router.replace('/13-goals')} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeCol: { width: '31%', alignItems: 'center', marginBottom: 6 },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: { backgroundColor: '#ECE8DE' },
  lockDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.gray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
});
