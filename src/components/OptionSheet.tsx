import React, { useEffect } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, T } from '../theme';

export interface Option {
  label: string;
  sub?: string;
  icon?: string;
}

/** Bottom-sheet option picker (used by SelectField all over the app). */
export const OptionSheet: React.FC<{
  visible: boolean;
  title: string;
  options: Option[];
  selected?: string;
  onSelect: (label: string) => void;
  onClose: () => void;
}> = ({ visible, title, options, selected, onSelect, onClose }) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      anim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={styles.overlayWrap}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropFill, { opacity: anim }]} />
      </Pressable>
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 14, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }]}>
        <View style={styles.grabber} />
        <Text style={[T.h3, { textAlign: 'center', marginBottom: 8, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18 }]}>
          {title}
        </Text>
        <View style={{ maxHeight: 380 }}>
          {options.map((o) => {
            const isSel = o.label === selected;
            return (
              <Pressable
                key={o.label}
                style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  onSelect(o.label);
                  onClose();
                }}
              >
                {o.icon ? (
                  <View style={styles.optionIcon}>
                    <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={17} color={C.navy} />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ ...T.body500, color: C.navy }}>{o.label}</Text>
                  {o.sub ? <Text style={T.small}>{o.sub}</Text> : null}
                </View>
                {isSel ? <Ionicons name="checkmark" size={20} color={C.green} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayWrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 90,
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web' ? {} : {}),
  },
  backdrop: { ...StyleSheet.absoluteFill, zIndex: 90 },
  backdropFill: { flex: 1, backgroundColor: 'rgba(22,40,63,0.45)' },
  sheet: {
    backgroundColor: '#FDFBF4',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 91,
    ...Platform.select({
      web: { boxShadow: '0px -10px 40px rgba(22,40,63,0.25)' } as never,
      default: { shadowColor: '#16283F', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: -6 } },
    }),
  },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.navy06,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
