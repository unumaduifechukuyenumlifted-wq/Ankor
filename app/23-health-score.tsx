/** Screen 23 — Financial Health Score Detail: circular gauge + breakdown bars + tip. */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import { AppHeader, Card, InfoBanner, ProgressBar, Screen, SectionHeader } from '../src/components/ui';
import { C, T } from '../src/theme';
import { useApp } from '../src/store/AppProvider';
import { scoreColor, scoreLabel, healthTip } from '../src/lib/finance';
import { monthName } from '../src/lib/format';

const Gauge: React.FC<{ score: number }> = ({ score }) => {
  const [shown, setShown] = useState(0);
  const size = 190;
  const r = 78;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);

  useEffect(() => {
    const start = performance.now ? performance.now() : Date.now();
    const dur = 900;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, ((performance.now ? performance.now() : Date.now()) - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(score * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E9E1CC" strokeWidth={14} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(circ * shown) / 100} ${circ}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 52, color: C.navy, lineHeight: 60 }}>{shown}</Text>
        <Text style={{ ...T.small, color: C.gray }}>out of 100</Text>
        <View style={[styles.labelPill, { backgroundColor: color + '22' }]}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color }}>{scoreLabel(shown)}</Text>
        </View>
      </View>
    </View>
  );
};

export default function HealthScoreDetail() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const h = state.health;
  const emergencyBalance = state.wallets.find((w) => w.type === 'emergency')?.balance ?? 0;

  const bars = [
    { label: 'Spending Discipline', value: h.spendingDiscipline, hint: 'Expenses vs your monthly plan', color: C.navy },
    { label: 'Savings Consistency', value: h.savingsConsistency, hint: 'Regular deposits into goals', color: C.gold },
    { label: 'Goal Progress', value: h.goalProgress, hint: 'Average progress across goals', color: C.green },
  ];

  const history = h.history.slice(-6);

  return (
    <Screen>
      <View style={{ marginTop: insets.top }}>
        <AppHeader onBack={() => router.back()} title="Financial Health Score" />
      </View>

      <Gauge score={h.score} />

      <Card style={{ marginTop: 22 }}>
        <Text style={T.label}>BREAKDOWN</Text>
        {bars.map((b, i) => (
          <View key={b.label} style={{ marginTop: i === 0 ? 14 : 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ ...T.body500, flex: 1 }}>{b.label}</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: b.value >= 65 ? C.green : b.value >= 45 ? C.gold : C.terracotta }}>
                {b.value}%
              </Text>
            </View>
            <ProgressBar progress={b.value / 100} color={b.color} style={{ marginTop: 7 }} />
            <Text style={{ ...T.small, marginTop: 5 }}>{b.hint}</Text>
          </View>
        ))}
      </Card>

      <InfoBanner style={{ marginTop: 16 }} icon="sparkles">
        {healthTip({ ...h, emergencyBalance })}
      </InfoBanner>

      <SectionHeader label="SCORE HISTORY" />
      <Card style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 10 }}>
          {history.map((hh) => (
            <View key={hh.date} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ ...T.small, fontSize: 10.5, marginBottom: 4 }}>{hh.score}</Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(6, (hh.score / 100) * 56),
                  borderRadius: 6,
                  backgroundColor: scoreColor(hh.score),
                  opacity: 0.85,
                }}
              />
              <Text style={{ ...T.small, fontSize: 10.5, marginTop: 5 }}>{monthName(new Date(hh.date))}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  labelPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
});
