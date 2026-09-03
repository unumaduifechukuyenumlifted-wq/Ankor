import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../theme';
import { Button } from './ui';
import { useApp } from '../store/AppProvider';
import { money } from '../lib/format';

/**
 * Global overlay modal host (spec §5).
 * Success ✔ : Success Saving, Income Added, Expense Added, Goal Completed, OTP Sent
 * Warning ⚠ : Budget Exceeded, Withdrawal Confirmation, Delete Goal
 */
export const ModalHost: React.FC = () => {
  const { modal, dismissModal } = useApp();
  const scale = useRef(new Animated.Value(0.85)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modal) {
      fade.setValue(0);
      scale.setValue(0.85);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
      if (modal.type === 'otp-sent') {
        const t = setTimeout(() => dismissModal(), 1800);
        return () => clearTimeout(t);
      }
    }
  }, [modal]);

  const run = useCallback(
    (fn?: () => void) => () => {
      dismissModal();
      fn?.();
    },
    [dismissModal],
  );

  if (!modal) return null;
  const p = (modal.props ?? {}) as Record<string, any>;

  const body = (() => {
    switch (modal.type) {
      /* --------------------------------— Success -------------------------------- */
      case 'success-saving':
        return (
          <SuccessBody
            icon="checkmark"
            title="Saved successfully"
            message={`${money(p.amount ?? 0)} added to ${p.goalName}. Its progress bar just moved — keep the momentum going.`}
            buttonLabel="Nice!"
            onButton={run(p.onDone)}
          />
        );
      case 'income-added':
        return (
          <SuccessBody
            icon="checkmark"
            title="Income added"
            message={`${money(p.amount ?? 0)} recorded and split across essentials, goals and flexible money.`}
            buttonLabel="Done"
            onButton={run(p.onDone)}
          />
        );
      case 'expense-added':
        return (
          <SuccessBody
            icon="checkmark"
            title="Expense added"
            message={`${money(p.amount ?? 0)} logged to ${p.category ?? 'budget'}. Your budget updated instantly.`}
            buttonLabel="Done"
            onButton={run(p.onDone)}
          />
        );
      case 'goal-completed':
        return (
          <SuccessBody
            icon="trophy"
            title="Goal completed! 🎉"
            message={`${p.goalName} is fully funded. That's serious anchoring — pick your next target when you're ready.`}
            buttonLabel="Celebrate"
            onButton={run(p.onDone)}
          />
        );
      case 'account-linked':
        return (
          <SuccessBody
            icon="checkmark"
            title="Account linked"
            message={`${p.bank} •••• ${String(p.last4 ?? '')} is now linked. You can withdraw to it anytime.`}
            buttonLabel="Done"
            onButton={run(p.onDone)}
          />
        );
      case 'otp-sent':
        return (
          <SuccessBody
            icon="mail"
            title="OTP sent"
            message={p.resent ? 'A new code is on its way.' : `We sent a 6-digit code to ${p.destination ?? 'you'}.`}
            buttonLabel="OK"
            onButton={run(undefined)}
            quiet
          />
        );
      /* --------------------------------— Warning -------------------------------- */
      case 'budget-exceeded':
        return (
          <WarnBody
            icon="warning"
            title="Budget exceeded"
            message={`${money(p.amount ?? 0)} pushes your ${p.category ?? ''} budget over its ${money(p.limit ?? 0)} monthly limit. Saving it anyway means trimming elsewhere to stay on plan.`}
            primaryLabel="Save anyway"
            secondaryLabel="Adjust amount"
            onPrimary={run(p.onProceed)}
            onSecondary={run(undefined)}
          />
        );
      case 'withdraw-confirm':
        return (
          <WarnBody
            icon="alert-circle"
            title="Confirm withdrawal"
            message={`You're about to send ${money(p.amount ?? 0)} from ${p.walletName ?? 'your wallet'} to ${p.bank ?? 'your bank'}. Withdrawals reduce this wallet's progress toward its goal.`}
            primaryLabel="Yes, send it"
            secondaryLabel="Not yet"
            onPrimary={run(p.onConfirm)}
            onSecondary={run(undefined)}
          />
        );
      case 'delete-goal':
        return (
          <WarnBody
            icon="trash"
            title="Delete this goal?"
            message={`"${p.goalName ?? 'This goal'}" and its progress (₦${(p.saved ?? 0).toLocaleString('en-US')} saved) will be removed. The money stays in its wallet — this can't be undone.`}
            primaryLabel="Delete goal"
            secondaryLabel="Keep goal"
            danger
            onPrimary={run(p.onConfirm)}
            onSecondary={run(undefined)}
          />
        );
      case 'logout':
        return (
          <WarnBody
            icon="log-out"
            title="Log out of Anchor?"
            message="Your budgets, goals and wallets will be right here when you come back."
            primaryLabel="Log out"
            secondaryLabel="Stay"
            danger
            onPrimary={run(p.onConfirm)}
            onSecondary={run(undefined)}
          />
        );
      case 'delete-account':
        return (
          <WarnBody
            icon="trash"
            title="Delete your account?"
            message="This permanently erases your profile, wallets, goals and history from Anchor. This can't be undone."
            primaryLabel="Delete everything"
            secondaryLabel="Cancel"
            danger
            onPrimary={run(p.onConfirm)}
            onSecondary={run(undefined)}
          />
        );
      case 'social-signin':
        return (
          <SuccessBody
            icon="sparkles"
            title="Coming soon"
            message="Google and Apple sign-in are on the next Anchor release. Use your email or phone number for now."
            buttonLabel="Got it"
            onButton={run(undefined)}
          />
        );
      case 'info':
      default:
        return (
          <SuccessBody
            icon={(p.icon as any) ?? 'information-circle'}
            title={p.title ?? 'Anchor'}
            message={p.message ?? ''}
            buttonLabel={p.buttonLabel ?? 'OK'}
            onButton={run(p.onDone)}
          />
        );
    }
  })();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissModal} />
      </Animated.View>
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>{body}</Animated.View>
    </View>
  );
};

const SuccessBody: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  buttonLabel: string;
  onButton: () => void;
  quiet?: boolean;
}> = ({ icon, title, message, buttonLabel, onButton }) => (
  <>
    <View style={[styles.iconCircle, { backgroundColor: C.greenSoft }]}>
      <Ionicons name={icon} size={30} color={C.green} />
    </View>
    <Text style={[T.h2, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
    <Text style={[T.small, { textAlign: 'center', marginTop: 8, lineHeight: 21 }]}>{message}</Text>
    <Button label={buttonLabel} onPress={onButton} style={{ marginTop: 22 }} />
  </>
);

const WarnBody: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  danger?: boolean;
}> = ({ icon, title, message, primaryLabel, secondaryLabel, onPrimary, onSecondary, danger }) => (
  <>
    <View style={[styles.iconCircle, { backgroundColor: C.terracottaSoft }]}>
      <Ionicons name={icon} size={30} color={C.terracotta} />
    </View>
    <Text style={[T.h2, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
    <Text style={[T.small, { textAlign: 'center', marginTop: 8, lineHeight: 21 }]}>{message}</Text>
    <Button label={primaryLabel} variant={danger ? 'danger' : 'primary'} onPress={onPrimary} style={{ marginTop: 22 }} />
    <Button label={secondaryLabel} variant="ghost" onPress={onSecondary} small style={{ marginTop: 8, borderWidth: 0 }} />
  </>
);

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22,40,63,0.5)' },
  card: {
    width: 330,
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
});
