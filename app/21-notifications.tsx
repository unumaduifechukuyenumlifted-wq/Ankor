/** Screen 21 — Notifications: grouped Today / Earlier, typed rows, relative time. */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, EmptyState, Screen } from '../src/components/ui';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { relTime, isSameDay } from '../src/lib/format';
import { NotifType } from '../src/lib/types';

const TYPE_STYLE: Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; label: string }> = {
  budget_alert: { icon: 'warning', color: C.terracotta, soft: C.terracottaSoft, label: 'Budget Alert' },
  ai_tip: { icon: 'sparkles', color: C.gold, soft: C.goldSoft, label: 'AI Tip' },
  goal_milestone: { icon: 'flag', color: C.green, soft: C.greenSoft, label: 'Goal Milestone' },
  income_reminder: { icon: 'cash', color: C.navy, soft: '#E2E6EC', label: 'Income Reminder' },
  savings_reminder: { icon: 'wallet', color: C.green, soft: C.greenSoft, label: 'Savings Reminder' },
};

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'MARK_NOTIFS_READ' }), 1200);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();
  const sorted = [...state.notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const today = sorted.filter((n) => isSameDay(new Date(n.timestamp), now));
  const earlier = sorted.filter((n) => !isSameDay(new Date(n.timestamp), now));

  const Group: React.FC<{ label: string; items: typeof sorted }> = ({ label, items }) =>
    items.length === 0 ? null : (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ ...T.label, marginBottom: 10, color: C.navy }}>{label}</Text>
        <Card style={{ paddingVertical: 6, paddingHorizontal: 14 }}>
          {items.map((n, i) => {
            const st = TYPE_STYLE[n.type];
            return (
              <View key={n.id} style={[styles.notifRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <View style={[styles.notifIcon, { backgroundColor: st.soft }]}>
                  <Ionicons name={st.icon} size={17} color={st.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ ...T.small500, color: st.color, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 }}>
                      {st.label.toUpperCase()}
                    </Text>
                    <Text style={{ ...T.small, marginLeft: 8 }}>{relTime(n.timestamp)}</Text>
                    {!n.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={{ ...T.body500, color: C.navy, marginTop: 3 }}>{n.title}</Text>
                  <Text style={{ ...T.small, marginTop: 2, lineHeight: 18 }}>{n.body}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    );

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Notifications" />
      </View>
      {sorted.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="You're all caught up"
          body="Budget alerts, goal milestones and AI tips will land here."
        />
      ) : (
        <View style={{ paddingBottom: 30 }}>
          <Group label="TODAY" items={today} />
          <Group label="EARLIER" items={earlier} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notifRow: { flexDirection: 'row', paddingVertical: 14 },
  notifIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold, marginLeft: 'auto' },
});
