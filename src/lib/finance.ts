import { Goal, Priority, Transaction, WalletType } from './types';
import { daysUntil, monthKey } from './format';

/* ---------------------------------- Catalog --------------------------------- */

export const ESSENTIAL_CATS = ['Food', 'Transport', 'Data', 'Rent', 'Bills'] as const;
export const LIFESTYLE_CATS = ['Other', 'Shopping', 'Lifestyle', 'Health'] as const;

export const CATEGORY_STYLE: Record<string, { icon: string; color: string; soft: string }> = {
  Food: { icon: 'fast-food', color: '#C99A3B', soft: '#F3E5C3' },
  Transport: { icon: 'bus', color: '#4F6F52', soft: '#DFE8DD' },
  Data: { icon: 'wifi', color: '#5B7DB1', soft: '#DCE6F4' },
  Rent: { icon: 'home', color: '#16283F', soft: '#E2E6EC' },
  Bills: { icon: 'receipt', color: '#8A6FA8', soft: '#E9E1F1' },
  Other: { icon: 'ellipsis-horizontal', color: '#7A7A72', soft: '#EAE8DF' },
  // tx-only categories
  Salary: { icon: 'briefcase', color: '#4F6F52', soft: '#DFE8DD' },
  Freelance: { icon: 'laptop', color: '#C99A3B', soft: '#F3E5C3' },
  Gifts: { icon: 'gift', color: '#C1573B', soft: '#F2DCD2' },
  Savings: { icon: 'wallet', color: '#4F6F52', soft: '#DFE8DD' },
  Withdrawal: { icon: 'arrow-up', color: '#C1573B', soft: '#F2DCD2' },
};

export const categoryStyle = (name: string) =>
  CATEGORY_STYLE[name] ?? CATEGORY_STYLE.Other;

/** Goal catalog from onboarding step 8 (spec order) + wallet auto-assignment + default target. */
export const GOAL_CATALOG: {
  name: string;
  wallet: WalletType;
  target: number;
  months: number;
  icon: string;
}[] = [
  { name: 'School Fees', wallet: 'locked', target: 200000, months: 6, icon: 'school' },
  { name: 'Rent', wallet: 'locked', target: 400000, months: 6, icon: 'home' },
  { name: 'Food', wallet: 'flexible', target: 60000, months: 2, icon: 'fast-food' },
  { name: 'Transport', wallet: 'flexible', target: 40000, months: 2, icon: 'bus' },
  { name: 'Emergency Fund', wallet: 'emergency', target: 300000, months: 8, icon: 'shield' },
  { name: 'Laptop', wallet: 'flexible', target: 250000, months: 5, icon: 'laptop' },
  { name: 'Business', wallet: 'locked', target: 150000, months: 4, icon: 'storefront' },
  { name: 'Investment', wallet: 'locked', target: 100000, months: 6, icon: 'trending-up' },
  { name: 'Family', wallet: 'flexible', target: 80000, months: 3, icon: 'people' },
  { name: 'Vacation', wallet: 'flexible', target: 200000, months: 8, icon: 'airplane' },
  { name: 'Other', wallet: 'flexible', target: 50000, months: 3, icon: 'ellipsis-horizontal' },
];

export const walletForGoalCategory = (category: string): WalletType =>
  GOAL_CATALOG.find((g) => g.name === category)?.wallet ?? 'flexible';

export const defaultGoalTarget = (category: string): { target: number; months: number } =>
  GOAL_CATALOG.find((g) => g.name === category) ?? { target: 50000, months: 3 };

export const PRIORITY_LABEL: Record<Priority, string> = {
  essential: 'Essential',
  important: 'Important',
  optional: 'Optional',
};

export const PRIORITY_WEIGHT: Record<Priority, number> = { essential: 3, important: 2, optional: 1 };

/* --------------------------------- Budgeting -------------------------------- */

export const SPLIT = { essentials: 0.5, goals: 0.3, flexible: 0.2 };

export const suggestAllocation = (income: number) => ({
  essentials: Math.round(income * SPLIT.essentials),
  goals: Math.round(income * SPLIT.goals),
  flexible: Math.round(income * SPLIT.flexible),
});

/** Essentials portion is broken into category limits (weights sum to 1). */
const CAT_WEIGHTS: Record<string, number> = {
  Food: 0.3,
  Transport: 0.18,
  Data: 0.12,
  Rent: 0.3,
  Bills: 0.1,
};

export const buildCategories = (essentials: number) =>
  Object.entries(CAT_WEIGHTS).map(([name, w]) => ({
    name,
    limit: Math.round((essentials * w) / 500) * 500,
  }));

export const currentMonth = () => monthKey(new Date());

export const txThisMonth = (txs: Transaction[]) => {
  const key = currentMonth();
  return txs.filter((t) => monthKey(new Date(t.date)) === key);
};

export const spentByCategory = (txs: Transaction[]): Record<string, number> => {
  const out: Record<string, number> = {};
  txThisMonth(txs)
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      out[t.category] = (out[t.category] ?? 0) + t.amount;
    });
  return out;
};

export const monthIncome = (txs: Transaction[]) =>
  txThisMonth(txs)
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

export const monthExpenses = (txs: Transaction[]) =>
  txThisMonth(txs)
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

export const totalSaved = (txs: Transaction[]) =>
  txs.filter((t) => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

export const totalBalance = (wallets: { balance: number }[]) =>
  wallets.reduce((s, w) => s + w.balance, 0);

export interface SafeToSpend {
  daily: number;
  remaining: number;
  daysLeft: number;
}

export const safeToSpend = (
  budget: { allocations: { flexible: number } } | null,
  txs: Transaction[],
  nextIncomeDate: string,
): SafeToSpend => {
  const flexiblePool = budget?.allocations.flexible ?? 0;
  const lifestyleSpent = txThisMonth(txs)
    .filter((t) => t.type === 'expense' && !(ESSENTIAL_CATS as readonly string[]).includes(t.category))
    .reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, flexiblePool - lifestyleSpent);
  const daysLeft = Math.max(1, daysUntil(nextIncomeDate));
  return { daily: Math.floor(remaining / daysLeft), remaining, daysLeft };
};

/* ------------------------------- Health score ------------------------------- */

export const computeHealth = (
  budget: { allocations: { essentials: number; flexible: number }; categories: { name: string; limit: number }[] } | null,
  txs: Transaction[],
  goals: Goal[],
): { score: number; spendingDiscipline: number; savingsConsistency: number; goalProgress: number } => {
  // Spending discipline: how well expenses track the monthly plan
  const planned = (budget?.allocations.essentials ?? 0) + (budget?.allocations.flexible ?? 0);
  const spent = monthExpenses(txs);
  const util = planned > 0 ? spent / planned : 0;
  const spendingDiscipline =
    util <= 1 ? Math.round(100 - 30 * util) : Math.max(30, Math.round(100 - 55 * (util - 1)));

  // Savings consistency: savings events across the last 30 days (goal: 4+/month)
  const since = Date.now() - 30 * 86400000;
  const savingsEvents = txs.filter((t) => t.type === 'savings' && new Date(t.date).getTime() >= since).length;
  const savingsConsistency = Math.min(100, Math.round((savingsEvents / 4) * 100));

  // Goal progress: average completion across active goals
  const goalProgress =
    goals.length > 0
      ? Math.min(
          100,
          Math.round(
            (goals.reduce((s, g) => s + Math.min(1, g.savedAmount / Math.max(1, g.targetAmount)), 0) /
              goals.length) *
              100,
          ),
        )
      : 0;

  const score = Math.max(
    1,
    Math.min(
      100,
      Math.round(0.4 * spendingDiscipline + 0.35 * savingsConsistency + 0.25 * goalProgress),
    ),
  );
  return { score, spendingDiscipline, savingsConsistency, goalProgress };
};

export const scoreLabel = (score: number): string =>
  score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs work';

export const scoreColor = (score: number): string =>
  score >= 80 ? '#4F6F52' : score >= 50 ? '#C99A3B' : '#C1573B';

export const healthTip = (h: {
  spendingDiscipline: number;
  savingsConsistency: number;
  goalProgress: number;
  emergencyBalance: number;
}): string => {
  const min = Math.min(h.spendingDiscipline, h.savingsConsistency, h.goalProgress);
  if (h.emergencyBalance < 50000 || min === h.savingsConsistency)
    return 'Add to your Emergency Fund this week to lift your Savings Consistency score.';
  if (min === h.spendingDiscipline)
    return 'You are close to your monthly plan limit — cooking two meals at home could lift your Spending Discipline.';
  return 'Move a small amount into your top goal today to lift your Goal Progress score.';
};

/* ------------------------------- Achievements ------------------------------- */

export const evaluateAchievements = (ctx: {
  goals: Goal[];
  txs: Transaction[];
  wallets: { type: string; balance: number }[];
  streakDays: number;
  emergencyTarget: number;
}): { id: string; name: string; description: string; icon: string; earned: boolean; progress: number; target: number }[] => {
  const { goals, txs, wallets, streakDays, emergencyTarget } = ctx;
  const completed = goals.filter((g) => g.status === 'completed').length;
  const saved = txs.filter((t) => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
  const emergency = wallets.find((w) => w.type === 'emergency')?.balance ?? 0;
  return [
    {
      id: 'first_goal',
      name: 'First Goal Completed',
      description: 'Fully fund your first savings goal',
      icon: 'flag',
      earned: completed >= 1,
      progress: Math.min(completed, 1),
      target: 1,
    },
    {
      id: 'streak_30',
      name: '30-Day Streak',
      description: 'Log your money for 30 days straight',
      icon: 'flame',
      earned: streakDays >= 30,
      progress: Math.min(streakDays, 30),
      target: 30,
    },
    {
      id: 'first_100k',
      name: 'First ₦100k Saved',
      description: 'Save a total of ₦100,000 in Anchor',
      icon: 'wallet',
      earned: saved >= 100000,
      progress: Math.min(saved, 100000),
      target: 100000,
    },
    {
      id: 'three_goals',
      name: '3 Goals Completed',
      description: 'Complete three savings goals',
      icon: 'ribbon',
      earned: completed >= 3,
      progress: completed,
      target: 3,
    },
    {
      id: 'emergency_ready',
      name: 'Emergency Ready',
      description: 'Build a ₦300,000 emergency fund',
      icon: 'shield',
      earned: emergency >= emergencyTarget,
      progress: Math.min(emergency, emergencyTarget),
      target: emergencyTarget,
    },
    {
      id: 'streak_90',
      name: '90-Day Streak',
      description: 'Log your money for 90 days straight',
      icon: 'flame-outline',
      earned: streakDays >= 90,
      progress: Math.min(streakDays, 90),
      target: 90,
    },
  ];
};

/* --------------------------------- Utilities -------------------------------- */

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const refCode = (): string =>
  `ANW-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
