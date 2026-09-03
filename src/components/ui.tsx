import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, SHADOW, SHADOW_SM, T } from '../theme';
import { money } from '../lib/format';
import { categoryStyle } from '../lib/finance';
import { Transaction } from '../lib/types';

/* ---------------------------------- Screen ---------------------------------- */

/** Scrollable form body — keeps CTAs reachable on short viewports & with keyboard open.
 *  Content shorter than the screen stretches (flexGrow), so `marginTop: 'auto'`
 *  still pins footers to the bottom; taller content scrolls instead of clipping. */
export const FormScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);

/** Drop-in replacement for `<View style={{ paddingHorizontal: X, flex: 1 }}>` form bodies —
 *  same layout, but scrolls when content exceeds the viewport (buttons never clipped). */
export const FlexScroll: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => (
  <FormScroll>
    <View style={[{ flex: 1 }, style]}>{children}</View>
  </FormScroll>
);

export const Screen: React.FC<{
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  kb?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}> = ({ children, scroll = true, padded = true, kb = false, contentStyle }) => {
  const body = scroll ? <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={[{ flexGrow: 1 }, padded && styles.screenPad, contentStyle]}
    keyboardShouldPersistTaps="handled"
  >
    {children}
  </ScrollView> : <View style={[padded && styles.screenPad, contentStyle]}>{children}</View>;
  return (
    <View style={styles.screen}>
      {kb ? <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView> : body}
    </View>
  );
};

export const useBottomPad = (extra = 0) => {
  const insets = useSafeAreaInsets();
  return { paddingBottom: insets.bottom + extra };
};

/* ---------------------------------- Header ---------------------------------- */

export const AppHeader: React.FC<{
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
}> = ({ title, onBack, right, subtitle }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable hitSlop={12} onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={C.navy} />
          </Pressable>
        ) : (
          <View style={{ width: 34 }} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          {title ? <Text style={[T.h3, { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 19 }]}>{title}</Text> : null}
          {subtitle ? <Text style={T.small}>{subtitle}</Text> : null}
        </View>
        <View style={{ width: 34, alignItems: 'flex-end' }}>{right}</View>
      </View>
    </View>
  );
};

/* ---------------------------------- Button ---------------------------------- */

export const Button: React.FC<{
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'gold';
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, onPress, variant = 'primary', disabled, loading, small, style, icon }) => {
  const v = variant as string;
  const filled = v === 'primary' || v === 'gold' || v === 'danger';
  const bg = v === 'primary' ? C.navy : v === 'gold' ? C.gold : v === 'danger' ? C.terracotta : C.white;
  const fg: string = filled ? C.white : v === 'danger' ? C.terracotta : C.navy;
  const border: string =
    v === 'ghost' ? 'transparent' : v === 'danger' ? C.terracotta : v === 'gold' ? C.gold : C.navy;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} style={{ marginRight: 7 }} /> : null}
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: small ? 14 : 16,
              color: fg,
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

/* ----------------------------------- Card ----------------------------------- */

export const Card: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  elevation?: boolean;
  onPress?: () => void;
}> = ({ children, dark, style, elevation, onPress }) => {
  const styleArr = [
    styles.card,
    dark && { backgroundColor: C.navy, borderColor: 'transparent' },
    elevation && SHADOW,
    style,
  ];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styleArr, { opacity: pressed ? 0.96 : 1 }]}>
        {children}
      </Pressable>
    );
  return <View style={styleArr}>{children}</View>;
};

/* ---------------------------------- Fields ---------------------------------- */

export const FieldLabel: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <Text style={[T.label, light && { color: C.onNavyDim }]}>{children}</Text>
);

export const Field: React.FC<
  TextInputProps & {
    label: string;
    suffix?: string;
    prefix?: string;
    error?: string | null;
    right?: React.ReactNode;
  }
> = ({ label, suffix, prefix, error, right, style, ...inputProps }) => {
  return (
    <View style={[styles.field, error && { borderColor: C.terracotta }, style]}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.fieldValueRow}>
        {prefix ? <Text style={[T.money, { marginRight: 6 }]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={C.graySoft}
          style={[styles.fieldInput, suffix && { marginRight: 6 }]}
          {...inputProps}
        />
        {suffix ? <Text style={T.small500}>{suffix}</Text> : null}
        {right}
      </View>
      {error ? <Text style={{ ...T.small, color: C.terracotta, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
};

export const SelectField: React.FC<{
  label: string;
  value: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ label, value, onPress, icon, placeholder, style }) => (
  <Pressable onPress={onPress} style={[styles.field, style]}>
    <FieldLabel>{label}</FieldLabel>
    <View style={styles.fieldValueRow}>
      {icon ? <Ionicons name={icon} size={18} color={C.navy} style={{ marginRight: 8 }} /> : null}
      <Text
        style={[
          T.money,
          { flex: 1 },
          placeholder && { color: C.graySoft, fontFamily: 'Inter_500Medium' },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Ionicons name="chevron-down" size={16} color={C.gray} />
    </View>
  </Pressable>
);

/** Big amount input used on money screens. */
export const AmountInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ value, onChange, label = 'AMOUNT', autoFocus, style }) => (
  <View style={[styles.field, style]}>
    <FieldLabel>{label}</FieldLabel>
    <View style={styles.amountRow}>
      <Text style={styles.amountPrefix}>₦</Text>
        <TextInput
          autoFocus={autoFocus}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={C.graySoft}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          style={styles.amountInput}
        />
    </View>
  </View>
);

/* -------------------------------- Info banner -------------------------------- */

export const InfoBanner: React.FC<{
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
}> = ({ children, icon = 'information-circle', style, dark }) => (
  <View style={[styles.banner, dark && { backgroundColor: 'rgba(247,242,232,0.12)' }, style]}>
    <Ionicons name={icon} size={19} color={dark ? C.gold : C.gold} style={{ marginTop: 2 }} />
    <Text style={[styles.bannerText, dark && { color: C.onNavy, opacity: 0.9 }]}>{children}</Text>
  </View>
);

/* -------------------------------- Progress bar ------------------------------- */

export const ProgressBar: React.FC<{
  progress: number; // 0..1
  color?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ progress, color = C.gold, track = C.border, height = 8, style }) => (
  <View style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }, style]}>
    <View
      style={{
        width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
        height,
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

/* ----------------------------------- Chips ----------------------------------- */

export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, selected, onPress, style, icon }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && { backgroundColor: C.navy, borderColor: C.navy },
      pressed && { opacity: 0.8 },
      style,
    ]}
  >
    {icon ? <Ionicons name={icon} size={14} color={selected ? C.white : C.gray} style={{ marginRight: 6 }} /> : null}
    <Text style={{ ...T.small, fontFamily: 'Inter_500Medium', color: selected ? C.white : C.ink }}>{label}</Text>
  </Pressable>
);

export const TagPill: React.FC<{ label: string; color?: string; bg?: string; icon?: keyof typeof Ionicons.glyphMap }> = ({
  label,
  color = C.navy,
  bg = C.navy06,
  icon,
}) => (
  <View style={[styles.tagPill, { backgroundColor: bg }]}>
    {icon ? <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} /> : null}
    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.4, color }}>{label}</Text>
  </View>
);

/* --------------------------------- Sections --------------------------------- */

export const SectionHeader: React.FC<{ label: string; action?: string; onAction?: () => void }> = ({
  label,
  action,
  onAction,
}) => (
  <View style={styles.sectionRow}>
    <Text style={{ ...T.label, color: C.navy }}>{label}</Text>
    {action ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={{ ...T.small500, color: C.goldDeep }}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

export const Divider: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <View style={{ height: 1, backgroundColor: dark ? 'rgba(247,242,232,0.14)' : C.border }} />
);

/* ------------------------------ Settings rows ------------------------------- */

export const Row: React.FC<{
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  sub?: string;
  last?: boolean;
}> = ({ label, icon, right, onPress, danger, sub, last }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }, !last && styles.rowBorder]}>
    {icon ? (
      <View style={[styles.rowIcon, danger && { backgroundColor: C.terracottaSoft }]}>
        <Ionicons name={icon} size={17} color={danger ? C.terracotta : C.navy} />
      </View>
    ) : null}
    <View style={{ flex: 1 }}>
      <Text style={{ ...T.body500, color: danger ? C.terracotta : C.navy }}>{label}</Text>
      {sub ? <Text style={T.small}>{sub}</Text> : null}
    </View>
    {right ?? (onPress ? <Ionicons name="chevron-forward" size={17} color={C.graySoft} /> : null)}
  </Pressable>
);

export const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <Pressable
    hitSlop={6}
    onPress={() => onChange(!value)}
    style={[styles.toggleTrack, { backgroundColor: value ? C.green : '#D8D2C2' }]}
  >
    <View style={[styles.toggleThumb, value && { transform: [{ translateX: 22 }] }]} />
  </Pressable>
);

/* --------------------------------- Empty state -------------------------------- */

export const EmptyState: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, body, actionLabel, onAction }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={30} color={C.gold} />
    </View>
    <Text style={[T.h2, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
    <Text style={[T.small, { textAlign: 'center', marginTop: 6, maxWidth: 260 }]}>{body}</Text>
    {actionLabel ? <Button label={actionLabel} onPress={onAction} style={{ marginTop: 18 }} /> : null}
  </View>
);

/* ---------------------------------- Avatar ----------------------------------- */

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 64 }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: size * 0.42, color: C.onNavy }}>
      {(name.trim()[0] ?? 'A').toUpperCase()}
    </Text>
  </View>
);

/* ------------------------------- Category icon ------------------------------- */

export const CategoryBadge: React.FC<{ category: string; size?: number }> = ({ category, size = 42 }) => {
  const st = categoryStyle(category);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 - 2, backgroundColor: st.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={st.icon as keyof typeof Ionicons.glyphMap} size={size * 0.46} color={st.color} />
    </View>
  );
};

/* ------------------------------- Wallet icon -------------------------------- */

export const WalletBadge: React.FC<{ type: 'flexible' | 'locked' | 'emergency'; size?: number }> = ({ type, size = 42 }) => {
  const map = {
    flexible: { icon: 'wallet', color: C.gold, soft: C.goldSoft },
    locked: { icon: 'lock-closed', color: C.navy, soft: '#E2E6EC' },
    emergency: { icon: 'shield', color: C.terracotta, soft: C.terracottaSoft },
  } as const;
  const st = map[type];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 - 2, backgroundColor: st.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={st.icon} size={size * 0.44} color={st.color} />
    </View>
  );
};

/* ------------------------------ Transaction row ------------------------------ */

export const TxRow: React.FC<{ tx: Transaction; onPress?: () => void; last?: boolean }> = ({ tx, onPress, last }) => {
  const positive = tx.type === 'income';
  const category = tx.type === 'income' ? tx.category : tx.type === 'savings' ? 'Savings' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.category;
  const sign = positive ? '+' : '-';
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.txRow, pressed && { opacity: 0.75 }, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <CategoryBadge category={category} size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={1} style={{ ...T.body500, color: C.navy }}>
          {tx.description || category}
        </Text>
        <Text style={{ ...T.small, marginTop: 2 }}>
          {category} · {dateLabel(tx.date)}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: positive ? C.green : C.terracotta }}>
        {sign}
        {money(tx.amount)}
      </Text>
    </Pressable>
  );
};

export const dateLabel = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

/* ------------------------------- Error banner -------------------------------- */

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void; style?: StyleProp<ViewStyle> }> = ({ message, onRetry, style }) => (
  <View style={[styles.errorBanner, style]}>
    <Ionicons name="cloud-offline" size={18} color={C.terracotta} />
    <Text style={{ ...T.small500, color: C.terracotta, flex: 1, marginLeft: 8 }}>{message}</Text>
    {onRetry ? (
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.navy }}>Retry</Text>
      </Pressable>
    ) : null}
  </View>
);

/* ---------------------------------- Styles ---------------------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  screenPad: { paddingHorizontal: 20 },
  header: { paddingHorizontal: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  btn: {
    height: 56,
    borderRadius: R.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  btnSmall: { height: 42, borderRadius: 12, paddingHorizontal: 14 },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },
  field: {
    backgroundColor: C.card,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, minHeight: 30 },
  fieldInput: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: C.navy, padding: 0 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  amountPrefix: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: C.gray, marginRight: 8 },
  amountInput: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 34, color: C.navy, padding: 0, minHeight: 42 },
  banner: {
    backgroundColor: C.banner,
    borderRadius: R.banner,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 20,
    color: C.brown,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  tagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.navy06,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  toggleTrack: { width: 46, height: 27, borderRadius: 14, padding: 2.5 },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.white,
    ...SHADOW_SM,
  },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.terracottaSoft,
    borderRadius: R.banner,
    padding: 12,
    paddingHorizontal: 14,
  },
});

export { SHADOW, SHADOW_SM };
