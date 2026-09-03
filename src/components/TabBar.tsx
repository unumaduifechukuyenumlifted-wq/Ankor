import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

const TABS = [
  { route: '/11-home', label: 'Home', icon: 'home', active: 'home' },
  { route: '/12-budget', label: 'Budget', icon: 'pie-chart-outline', active: 'pie-chart' },
  { route: '/13-goals', label: 'Goals', icon: 'flag-outline', active: 'flag' },
  { route: '/20-ai-chat', label: 'AI', icon: 'sparkles-outline', active: 'sparkles' },
  { route: '/22-profile', label: 'Profile', icon: 'person-outline', active: 'person' },
] as const;

/** Bottom tab bar — Home | Budget | Goals | AI | Profile (active: bold navy + gold dot). */
export const TabBar: React.FC = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const active = pathname === t.route;
        return (
          <Pressable
            key={t.route}
            onPress={() => router.replace(t.route as never)}
            style={styles.tab}
            hitSlop={{ top: 6, bottom: 6 }}
          >
            <View style={{ width: 30, height: 20, alignItems: 'center', justifyContent: 'flex-end' }}>
              {active ? <View style={styles.dot} /> : null}
            </View>
            <Ionicons
              name={(active ? t.active : t.icon) as keyof typeof Ionicons.glyphMap}
              size={22}
              color={active ? C.navy : C.gray}
            />
            <Text
              style={{
                fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                fontSize: 10.5,
                marginTop: 3,
                color: active ? C.navy : C.gray,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const tabBarShadow =
  Platform.OS === 'web'
    ? ({ boxShadow: '0px -8px 24px rgba(22,40,63,0.06)' } as never)
    : {};

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: 'row',
    backgroundColor: '#FDFBF4',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    ...tabBarShadow,
  },
  tab: { flex: 1, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gold, marginBottom: 4 },
});
