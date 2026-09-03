import { Goal, Wallet } from './types';
import { fmtDate, money } from './format';

/**
 * ABSOLUTE LOCK INTEGRITY (spec §4.4, §12.1)
 * ------------------------------------------
 * Locked goals are immutable until their unlock condition is met.
 * No fees, no overrides, no break-glass. This module is the single
 * source of truth — the UI consults it AND the store's withdrawal
 * mutation re-checks it (defense in depth, like an API service layer).
 */

/** Has this goal satisfied its unlock condition? (Non-locked goals are always matured.) */
export const isGoalMatured = (goal: Goal, now: Date = new Date()): boolean => {
  if (goal.accessType !== 'locked') return true;
  if (goal.unlockMode === 'funded') return goal.savedAmount >= goal.targetAmount;
  return new Date(goal.targetDate).getTime() <= now.getTime();
};

export interface LockViolation {
  code: 'LOCKED_GOAL';
  message: string; // "Funds cannot be moved until [Target Date]."
  unlockDate: string;
  unlockDatePretty: string;
  targetAmount: number;
  goalName: string;
}

/** The goal a withdrawal from this wallet would debit (largest active goal on it). */
export const debitGoalForWallet = (goals: Goal[], walletId: string): Goal | undefined =>
  goals
    .filter((g) => g.walletId === walletId && g.status === 'active')
    .sort((a, b) => b.savedAmount - a.savedAmount)[0];

/**
 * Service-layer check (spec §11 / §6): would debiting this wallet violate the hard lock?
 * Returns a LockViolation the UI renders as the Hard Lock Modal, or null if allowed.
 */
export const lockViolationForWithdrawal = (
  wallets: Wallet[],
  goals: Goal[],
  walletId: string,
  now: Date = new Date(),
): LockViolation | null => {
  const goal = debitGoalForWallet(goals, walletId);
  if (!goal || isGoalMatured(goal, now)) return null;
  return {
    code: 'LOCKED_GOAL',
    message: `Funds cannot be moved until ${goal.unlockMode === 'funded' ? `fully funded (${money(goal.targetAmount)})` : fmtDate(goal.targetDate)}.`,
    unlockDate: goal.targetDate,
    unlockDatePretty: fmtDate(goal.targetDate),
    targetAmount: goal.targetAmount,
    goalName: goal.name,
  };
};

/** Human label for the unlock condition, used across UI. */
export const unlockConditionLabel = (goal: Goal): string =>
  goal.unlockMode === 'funded'
    ? `unlocks when fully funded (${money(goal.targetAmount)})`
    : `unlocks ${fmtDate(goal.targetDate)}`;
