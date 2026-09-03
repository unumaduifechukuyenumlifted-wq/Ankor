/** Screen 22 — Profile: avatar, name/occupation, health score + achievements rows,
 *  settings, support, logout. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Row, Screen, useBottomPad } from '../../src/components/ui';
import { C, SHADOW, T } from '../../src/theme';
import { useApp } from '../../src/store/AppProvider';
import { scoreColor, scoreLabel } from '../../src/lib/finance';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const bottomPad = useBottomPad(8);
  const { state, dispatch, showModal } = useApp();
  const user = state.user;
  const earned = state.achievements.filter((a) => a.earned).length;
  const inProgress = state.achievements.filter((a) => !a.earned).length;

  const logout = () =>
    showModal({
      type: 'logout',
      props: {
        onConfirm: () => {
          dispatch({ type: 'LOGOUT' });
          router.replace('/02-welcome');
        },
      },
    });

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 18, alignItems: 'center', marginBottom: 20 }}>
        <Avatar name={user?.name ?? 'A'} size={84} />
        <Text style={{ ...T.h2, marginTop: 12 }}>{user?.name ?? 'Friend'}</Text>
        <Text style={{ ...T.small, marginTop: 3 }}>
          {user?.occupation ?? '—'} · {user?.country ?? 'Nigeria'}
        </Text>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={13} color={C.gold} />
          <Text style={{ ...T.small500, color: C.navy, marginLeft: 5 }}>{state.streakDays}-day streak</Text>
        </View>
      </View>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }} elevation>
        <Row
          icon="pulse"
          label="Financial Health Score"
          sub={`${state.health.score}/100 · ${scoreLabel(state.health.score)}`}
          right={
            <View style={styles.scoreBadge}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: scoreColor(state.health.score) }}>
                {state.health.score}
              </Text>
            </View>
          }
          onPress={() => router.push('/23-health-score')}
        />
        <Row
          icon="ribbon"
          label="Achievements"
          sub={`${earned} earned · ${inProgress} in progress`}
          onPress={() => router.push('/24-achievements')}
          last
        />
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 16, marginTop: 16 }}>
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/25-settings')} />
        <Row
          icon="chatbubble-ellipses-outline"
          label="Support"
          onPress={() =>
            showModal({
              type: 'info',
              props: {
                icon: 'chatbubble-ellipses',
                title: 'We’re here to help',
                message: 'Reach the Anchor team at support@anchor.money — typical reply in under 2 hours.',
                buttonLabel: 'Done',
              },
            })
          }
        />
        <Row icon="log-out-outline" label="Logout" danger onPress={logout} last />
      </Card>

      <Text style={{ ...T.small, textAlign: 'center', marginTop: 26, color: C.graySoft }}>Anchor v1.0 · Made for naira savers</Text>
      <View style={bottomPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.goldSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  scoreBadge: {
    width: 40,
    height: 28,
    borderRadius: 10,
    backgroundColor: C.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
