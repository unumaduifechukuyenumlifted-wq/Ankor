import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { C } from '../theme';

/** Animated green circular checkmark (transfer success, onboarding "You're ready"). */
export const SuccessCheck: React.FC<{ size?: number; onDone?: () => void }> = ({ size = 96, onDone }) => {
  const pop = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(pop, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(draw, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, []);

  const checkLength = size * 0.36;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: C.green,
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          opacity: pop,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 18,
          height: size + 18,
          borderRadius: (size + 18) / 2,
          borderWidth: 2,
          borderColor: C.green,
          opacity: ring.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.7, 0.35, 0] }),
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) }],
        }}
      />
      {/* checkmark made of two rotated bars */}
      <Animated.View
        style={{
          position: 'absolute',
          width: checkLength * 0.42,
          height: 4.5,
          borderRadius: 3,
          backgroundColor: '#FFFDF8',
          transform: [
            { translateX: -checkLength * 0.22 },
            { translateY: checkLength * 0.1 },
            { rotate: '45deg' },
            { scaleX: draw },
          ],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: checkLength,
          height: 4.5,
          borderRadius: 3,
          backgroundColor: '#FFFDF8',
          transform: [
            { translateX: checkLength * 0.08 },
            { rotate: '-45deg' },
            { scaleX: draw },
          ],
        }}
      />
    </View>
  );
};

/** Row of three pulsing loading dots (splash + AI typing). */
export const LoadingDots: React.FC<{ color?: string; size?: number }> = ({ color = C.gold, size = 9 }) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const dots = [0, 1, 2];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {dots.map((i) => (
        <Animated.View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            marginHorizontal: size * 0.35,
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [
              {
                translateY: a.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -size * 0.6, 0],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};
