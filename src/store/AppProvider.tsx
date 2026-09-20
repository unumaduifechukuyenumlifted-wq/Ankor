import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  Budget,
  Goal,
  LinkedAccount,
  Notification,
  Priority,
  Settings,
  Transaction,
  User,
  Wallet,
} from '../lib/types';
import {
  buildCategories,
  clamp,
  computeHealth,
  defaultGoalTarget,
  evaluateAchievements,
  PRIORITY_WEIGHT,
  uid,
  walletForGoalCategory,
} from '../lib/finance';
import { isGoalMatured } from '../lib/locks';
import { normalizeOccupation } from '../lib/occupations';
import { COUNTRY_CODE, CURRENCY_CODE } from '../lib/locale';
import { toISO, daysBetween } from '../lib/format';

const STORAGE_KEY = 'anchor-state-v2';

export const INITIAL_STATE: AppState = {
  hydrated: false,
  authed: false,
  onboarded: false,
  pendingAuth: null,
  user: null,
  wallets: [],
  goals: [],
  transactions: [],
  notifications: [],
  budget: null,
  linkedAccounts: [],
  achievements: [],
  health: { score: 0, spendingDiscipline: 0, savingsConsistency: 0, goalProgress: 0, history: [] },
  streakDays: 0,
  joinedAt: toISO(new Date()),
  chat: [],
  incomeDraft: null,
  withdrawDraft: null,
  offlineMode: false,
  settings: { notifications: true, darkMode: false, biometric: false },
};

/* ---------------------------------- Actions --------------------------------- */

export type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'PATCH'; patch: Partial<AppState> }
  | { type: 'SET_PENDING_AUTH'; payload: AppState['pendingAuth'] }
  | { type: 'LOGIN'; user: User }
  | { type: 'COMPLETE_ONBOARDING'; payload: OnboardingPayload }
  | { type: 'APPLY_INCOME'; amount: number; source: string; dateReceived: string; nextIncomeDate: string; split: Split }
  | { type: 'RECORD_EXPENSE'; tx: Transaction }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'UPDATE_GOAL'; goal: Goal }
  | { type: 'DELETE_GOAL'; id: string }
  | { type: 'ADD_MONEY_TO_GOAL'; goalId: string; amount: number }
  | { type: 'EXECUTE_WITHDRAWAL'; walletId: string; amount: number; account: LinkedAccount; date: string; reference: string }
  | { type: 'LINK_ACCOUNT'; account: LinkedAccount }
  | { type: 'UNLINK_ACCOUNT'; id: string }
  | { type: 'MARK_NOTIFS_READ' }
  | { type: 'ADD_NOTIFS'; items: Notification[] }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'PUSH_CHAT'; role: 'ai' | 'user'; text: string }
  | { type: 'CLEAR_CHAT' }
  | { type: 'LOGOUT' }
  | { type: 'WIPE' };

export interface Split {
  essentials: number;
  goals: number;
  flexible: number;
}

export interface OnboardingPayload {
  user: User;
  income: number;
  frequency: Budget['frequency'];
  nextIncomeDate: string;
  selectedGoals: { name: string; priority: Priority }[];
  split: Split;
}

/* ------------------------------ State helpers ------------------------------- */

const daysAgo = (d: number) => toISO(new Date(Date.now() - d * 86400000));

/** Recompute derived metrics (health, achievements, streak) after any money movement. */
const applyMetrics = (s: AppState): AppState => {
  const streakDays = Math.max(0, daysBetween(new Date(s.joinedAt), new Date()));
  const emergencyGoal = s.goals.find((g) => g.category === 'Emergency Fund');
  const health = computeHealth(s.budget, s.transactions, s.goals);
  return {
    ...s,
    streakDays,
    health: {
      ...health,
      history: [...s.health.history.slice(-9), { date: toISO(new Date()), score: health.score }],
    },
    achievements: evaluateAchievements({
      goals: s.goals,
      txs: s.transactions,
      wallets: s.wallets,
      streakDays,
      emergencyTarget: emergencyGoal?.targetAmount ?? 300000,
    }),
  };
};

/** Split the "goals" portion across active goals weighted by priority. */
const distributeGoalsPortion = (s: AppState, amount: number, date: string): { goals: Goal[]; wallets: Wallet[]; txs: Transaction[] } => {
  const active = s.goals.filter((g) => g.status === 'active');
  if (active.length === 0 || amount <= 0) return { goals: [], wallets: [], txs: [] };
  const totalWeight = active.reduce((sum, g) => sum + PRIORITY_WEIGHT[g.priority], 0);
  const goals = s.goals.map((g) => {
    if (g.status !== 'active') return g;
    const share = Math.round((amount * PRIORITY_WEIGHT[g.priority]) / totalWeight);
    return { ...g, savedAmount: g.savedAmount + share, status: (g.savedAmount + share >= g.targetAmount ? 'completed' : 'active') as Goal['status'] };
  });
  const wallets = s.wallets.map((w) => {
    const delta = active
      .filter((g) => g.walletId === w.id)
      .reduce((sum, g) => sum + Math.round((amount * PRIORITY_WEIGHT[g.priority]) / totalWeight), 0);
    return { ...w, balance: w.balance + delta };
  });
  const txs: Transaction[] = active.map((g) => ({
    id: uid('tx'),
    type: 'savings' as const,
    amount: Math.round((amount * PRIORITY_WEIGHT[g.priority]) / totalWeight),
    category: 'Savings',
    description: `Automatic allocation to ${g.name}`,
    date,
    goalId: g.id,
    walletId: g.walletId,
  }));
  return { goals, wallets, txs };
};

/* ------------------------------ Seeded history ------------------------------ */

const seedHistory = (income: number) => {
  const txs: Transaction[] = [
    { id: uid('tx'), type: 'income', amount: income, category: 'Salary', description: 'Salary — last month', date: daysAgo(30) },
    { id: uid('tx'), type: 'expense', amount: 4200, category: 'Food', description: 'Groceries — Shoprite', date: daysAgo(27) },
    { id: uid('tx'), type: 'expense', amount: 1500, category: 'Transport', description: 'Uber to meeting', date: daysAgo(26) },
    { id: uid('tx'), type: 'expense', amount: 3000, category: 'Data', description: 'MTN 3GB bundle', date: daysAgo(24) },
    { id: uid('tx'), type: 'expense', amount: 5500, category: 'Food', description: 'Weekend market run', date: daysAgo(22) },
    { id: uid('tx'), type: 'expense', amount: 900, category: 'Transport', description: 'Danfa to work', date: daysAgo(20) },
    { id: uid('tx'), type: 'expense', amount: 6500, category: 'Bills', description: 'NEPA bill', date: daysAgo(18) },
    { id: uid('tx'), type: 'expense', amount: 2800, category: 'Food', description: 'Lunch — Mama Put', date: daysAgo(16) },
    { id: uid('tx'), type: 'expense', amount: 1200, category: 'Data', description: 'Airtel top-up', date: daysAgo(14) },
    { id: uid('tx'), type: 'expense', amount: 3400, category: 'Other', description: 'Barber + toiletries', date: daysAgo(12) },
    { id: uid('tx'), type: 'expense', amount: 4800, category: 'Food', description: 'Groceries', date: daysAgo(9) },
    { id: uid('tx'), type: 'expense', amount: 1100, category: 'Transport', description: 'Bus fares', date: daysAgo(7) },
    { id: uid('tx'), type: 'expense', amount: 2600, category: 'Other', description: 'Gift — Amara', date: daysAgo(5) },
    { id: uid('tx'), type: 'expense', amount: 3900, category: 'Food', description: 'Dinner with friends', date: daysAgo(3) },
    { id: uid('tx'), type: 'expense', amount: 1000, category: 'Transport', description: 'Okada rides', date: daysAgo(1) },
  ];
  return txs;
};

const seedNotifications = (): Notification[] => [
  {
    id: uid('nt'),
    type: 'ai_tip',
    title: 'Your plan is live',
    body: 'Anchor moved your first allocation into goals and wallets. Check Budget to see the split.',
    timestamp: daysAgo(0.1),
    read: false,
  },
  {
    id: uid('nt'),
    type: 'income_reminder',
    title: 'Income coming up',
    body: 'Your next income lands soon. Want Anchor to re-run your allocation when it does?',
    timestamp: daysAgo(0.35),
    read: false,
  },
  {
    id: uid('nt'),
    type: 'savings_reminder',
    title: 'Small save, big finish',
    body: 'Moving ₦2,000 to a goal today keeps your savings streak alive.',
    timestamp: daysAgo(1.1),
    read: false,
  },
  {
    id: uid('nt'),
    type: 'budget_alert',
    title: 'Food budget at 80%',
    body: "You've used 80% of this month's Food budget. Two home-cooked meals will keep you on plan.",
    timestamp: daysAgo(2.2),
    read: true,
  },
  {
    id: uid('nt'),
    type: 'goal_milestone',
    title: 'Milestone reached',
    body: 'Your Emergency Fund passed its first milestone. Nice anchoring.',
    timestamp: daysAgo(4.5),
    read: true,
  },
];

/* ---------------------------------- Reducer --------------------------------- */

export const reducer = (s: AppState, a: Action): AppState => {
  switch (a.type) {
    case 'HYDRATE':
      return { ...a.state, hydrated: true };
    case 'PATCH':
      return { ...s, ...a.patch };
    case 'SET_PENDING_AUTH':
      return { ...s, pendingAuth: a.payload };
    case 'LOGIN':
      return { ...s, authed: true, user: a.user };
    case 'LOGOUT':
      return { ...INITIAL_STATE, hydrated: true, offlineMode: s.offlineMode, settings: s.settings };
    case 'WIPE':
      return { ...INITIAL_STATE, hydrated: true };

    case 'COMPLETE_ONBOARDING': {
      const { user, income, frequency, nextIncomeDate, selectedGoals, split } = a.payload;
      // Nigeria-only lock: country/currency are hardcoded server-side (NG/NGN).
      // Client-supplied values for these fields are ignored entirely.
      const fixedUser: User = { ...user, country: COUNTRY_CODE, currency: CURRENCY_CODE };
      const now = toISO(new Date());
      const wallets: Wallet[] = [
        { id: 'w-flex', type: 'flexible', name: 'Flexible Savings', balance: 0 },
        { id: 'w-lock', type: 'locked', name: 'Locked Savings', balance: 0 },
        { id: 'w-em', type: 'emergency', name: 'Emergency Fund', balance: 0 },
      ];
      const walletIdByType: Record<string, string> = {
        flexible: 'w-flex',
        locked: 'w-lock',
        emergency: 'w-em',
      };
      const goals: Goal[] = selectedGoals.map((g) => {
        const { target, months } = defaultGoalTarget(g.name);
        return {
          id: uid('goal'),
          name: g.name === 'Other' ? 'My Goal' : g.name,
          targetAmount: target,
          savedAmount: 0,
          targetDate: toISO(new Date(Date.now() + months * 30 * 86400000)),
          priority: g.priority,
          walletId: walletIdByType[walletForGoalCategory(g.name)],
          category: g.name,
          status: 'active',
          createdAt: now,
          accessType: walletForGoalCategory(g.name),
          unlockMode: 'date' as const,
        };
      });

      let state: AppState = {
        ...s,
        authed: true,
        onboarded: true,
        user: fixedUser,
        wallets,
        goals,
        transactions: seedHistory(income),
        notifications: seedNotifications(),
        budget: {
          averageIncome: income,
          frequency,
          nextIncomeDate,
          allocations: split,
          categories: buildCategories(split.essentials),
          history: [
            { month: 'Jul', income, spent: Math.round(income * 0.79), saved: Math.round(income * 0.21) },
            { month: 'Aug', income, spent: Math.round(income * 0.74), saved: Math.round(income * 0.26) },
          ],
        },
        joinedAt: daysAgo(30),
        chat: [],
        incomeDraft: null,
        withdrawDraft: null,
      };

      // Historical emergency/flexible savings (previous months before Anchor plan)
      const historicalEm = 40000;
      const historicalFlex = 8000;
      state = {
        ...state,
        wallets: state.wallets.map((w) =>
          w.type === 'emergency' ? { ...w, balance: historicalEm } : w.type === 'flexible' ? { ...w, balance: historicalFlex } : w,
        ),
        goals: state.goals.map((g) => (g.category === 'Emergency Fund' ? { ...g, savedAmount: historicalEm } : g)),
        transactions: [
          ...state.transactions,
          {
            id: uid('tx'),
            type: 'savings' as const,
            amount: historicalEm,
            category: 'Savings',
            description: 'Carry-over savings — Emergency Fund',
            date: daysAgo(20),
            walletId: 'w-em',
            goalId: state.goals.find((g) => g.category === 'Emergency Fund')?.id,
          },
          {
            id: uid('tx'),
            type: 'savings' as const,
            amount: historicalFlex,
            category: 'Savings',
            description: 'Carry-over savings — Flexible',
            date: daysAgo(12),
            walletId: 'w-flex',
          },
        ],
      };

      // First income + accepted allocation
      const incomeTx: Transaction = {
        id: uid('tx'),
        type: 'income',
        amount: income,
        category: 'Salary',
        description: 'First income — Anchor plan activated',
        date: now,
      };
      const dist = distributeGoalsPortion(state, split.goals, now);
      state = {
        ...state,
        transactions: [incomeTx, ...state.transactions, ...dist.txs],
        goals: dist.goals.length ? dist.goals : state.goals,
        wallets: state.wallets.map((w) => {
          if (w.id === 'w-flex') return { ...w, balance: w.balance + split.flexible };
          const bumped = dist.wallets.find((dw) => dw.id === w.id);
          return bumped ? { ...w, balance: bumped.balance } : w;
        }),
      };
      if (split.flexible > 0) {
        state = {
          ...state,
          transactions: [
            ...state.transactions,
            {
              id: uid('tx'),
              type: 'savings',
              amount: split.flexible,
              category: 'Savings',
              description: 'Moved to Flexible Savings',
              date: now,
              walletId: 'w-flex',
            },
          ],
        };
      }
      return applyMetrics(state);
    }

    case 'APPLY_INCOME': {
      const now = toISO(new Date());
      const incomeTx: Transaction = {
        id: uid('tx'),
        type: 'income',
        amount: a.amount,
        category: a.source.includes('Free') ? 'Freelance' : 'Salary',
        description: `Income — ${a.source}`,
        date: a.dateReceived,
      };
      const dist = distributeGoalsPortion(s, a.split.goals, now);
      let next: AppState = {
        ...s,
        transactions: [incomeTx, ...s.transactions, ...dist.txs],
        goals: dist.goals.length ? dist.goals : s.goals,
        wallets: s.wallets.map((w) => {
          if (w.id === 'w-flex') return { ...w, balance: w.balance + a.split.flexible };
          const bumped = dist.wallets.find((dw) => dw.id === w.id);
          return bumped ? { ...w, balance: bumped.balance } : w;
        }),
        incomeDraft: null,
      };
      if (a.split.flexible > 0) {
        next = {
          ...next,
          transactions: [
            {
              id: uid('tx'),
              type: 'savings',
              amount: a.split.flexible,
              category: 'Savings',
              description: 'Moved to Flexible Savings',
              date: now,
              walletId: 'w-flex',
            },
            ...next.transactions,
          ],
        };
      }
      const incomes = next.transactions.filter((t) => t.type === 'income');
      next = {
        ...next,
        budget: s.budget
          ? {
              ...s.budget,
              nextIncomeDate: a.nextIncomeDate,
              averageIncome: Math.round(incomes.reduce((x, t) => x + t.amount, 0) / incomes.length),
              allocations: a.split,
              categories: buildCategories(a.split.essentials),
            }
          : s.budget,
        notifications: [
          {
            id: uid('nt'),
            type: 'ai_tip',
            title: 'Budget re-allocated',
            body: `Anchor split your ${('₦' + a.amount.toLocaleString('en-US'))} income across essentials, goals and flexible money.`,
            timestamp: now,
            read: false,
          },
          ...s.notifications,
        ],
      };
      return applyMetrics(next);
    }

    case 'RECORD_EXPENSE': {
      const next = { ...s, transactions: [a.tx, ...s.transactions] };
      return applyMetrics(next);
    }

    case 'ADD_GOAL':
      return applyMetrics({ ...s, goals: [...s.goals, a.goal] });

    case 'UPDATE_GOAL':
      return applyMetrics({ ...s, goals: s.goals.map((g) => (g.id === a.goal.id ? a.goal : g)) });

    case 'DELETE_GOAL':
      return applyMetrics({ ...s, goals: s.goals.filter((g) => g.id !== a.id) });

    case 'ADD_MONEY_TO_GOAL': {
      const goal = s.goals.find((g) => g.id === a.goalId);
      if (!goal) return s;
      const now = toISO(new Date());
      const completedBefore = goal.status === 'completed';
      const updated: Goal = {
        ...goal,
        savedAmount: goal.savedAmount + a.amount,
        status: goal.savedAmount + a.amount >= goal.targetAmount ? 'completed' : 'active',
      };
      const justCompleted = !completedBefore && updated.status === 'completed';
      const notifs = justCompleted
        ? [
            {
              id: uid('nt'),
              type: 'goal_milestone' as const,
              title: 'Goal completed 🎉',
              body: `You fully funded ${goal.name}. Time to set the next one?`,
              timestamp: now,
              read: false,
            },
            ...s.notifications,
          ]
        : s.notifications;
      return applyMetrics({
        ...s,
        goals: s.goals.map((g) => (g.id === a.goalId ? updated : g)),
        wallets: s.wallets.map((w) => (w.id === goal.walletId ? { ...w, balance: w.balance + a.amount } : w)),
        transactions: [
          {
            id: uid('tx'),
            type: 'savings' as const,
            amount: a.amount,
            category: 'Savings',
            description: `Added to ${goal.name}`,
            date: now,
            goalId: goal.id,
            walletId: goal.walletId,
          },
          ...s.transactions,
        ],
        notifications: notifs,
      });
    }

    case 'EXECUTE_WITHDRAWAL': {
      const wallet = s.wallets.find((w) => w.id === a.walletId);
      if (!wallet) return s;
      const goalOnWallet = s.goals
        .filter((g) => g.walletId === wallet.id && g.status === 'active')
        .sort((x, y) => y.savedAmount - x.savedAmount)[0];
      // ABSOLUTE LOCK (spec §4.4 / §12.1) — data-layer backstop. The UI blocks this
      // first with the Hard Lock Modal; if a debit like this ever reaches the store
      // anyway, the mutation is rejected and no money moves. No fees. No overrides.
      if (goalOnWallet && goalOnWallet.accessType === 'locked' && !isGoalMatured(goalOnWallet)) {
        return s;
      }
      const isEmergency = wallet.type === 'emergency';
      return applyMetrics({
        ...s,
        wallets: s.wallets.map((w) => (w.id === a.walletId ? { ...w, balance: Math.max(0, w.balance - a.amount) } : w)),
        goals: goalOnWallet
          ? s.goals.map((g) => (g.id === goalOnWallet.id ? { ...g, savedAmount: Math.max(0, g.savedAmount - a.amount) } : g))
          : s.goals,
        transactions: [
          {
            id: uid('tx'),
            type: 'withdrawal' as const,
            amount: a.amount,
            // Emergency usage is logged distinctly (spec §4.4) to track emergency draws.
            category: isEmergency ? 'Emergency Withdrawal' : 'Withdrawal',
            description: `${isEmergency ? 'Emergency Fund withdrawal' : 'Withdrawal'} to ${a.account.bank} •••• ${a.account.accountNumber.slice(-4)}`,
            date: a.date,
            walletId: a.walletId,
            goalId: goalOnWallet?.id,
            reference: a.reference,
          },
          ...s.transactions,
        ],
        withdrawDraft: null,
      });
    }

    case 'LINK_ACCOUNT':
      return { ...s, linkedAccounts: [...s.linkedAccounts, a.account] };

    case 'UNLINK_ACCOUNT':
      return { ...s, linkedAccounts: s.linkedAccounts.filter((x) => x.id !== a.id) };

    case 'MARK_NOTIFS_READ':
      return { ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) };

    case 'ADD_NOTIFS':
      return { ...s, notifications: [...a.items, ...s.notifications] };

    case 'SET_SETTINGS':
      return { ...s, settings: { ...s.settings, ...a.patch } };

    case 'PUSH_CHAT':
      return {
        ...s,
        chat: [...s.chat, { id: uid('msg'), role: a.role, text: a.text, ts: toISO(new Date()) }],
      };

    case 'CLEAR_CHAT':
      return { ...s, chat: [] };

    default:
      return s;
  }
};

/* --------------------------------- Modals ----------------------------------- */

export type ModalType =
  | 'success-saving'
  | 'income-added'
  | 'expense-added'
  | 'goal-completed'
  | 'otp-sent'
  | 'budget-exceeded'
  | 'withdraw-confirm'
  | 'hard-lock'
  | 'delete-goal'
  | 'account-linked'
  | 'logout'
  | 'delete-account'
  | 'social-signin'
  | 'info';

export interface ModalReq {
  type: ModalType;
  props?: Record<string, unknown>;
}

/* --------------------------------- Context ---------------------------------- */

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  modal: ModalReq | null;
  showModal: (m: ModalReq) => void;
  dismissModal: () => void;
  /** Simulated network save — rejects when offlineMode is on (spec §6 error state). */
  simulatedSave: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [modal, setModal] = React.useState<ModalReq | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          // Migration: goals created before the Absolute Lock spec lack accessType/unlockMode;
          // occupations stored before the enum expand as legacy labels.
          const typeByWallet = new Map((parsed.wallets ?? []).map((w) => [w.id, w.type]));
          const goals = (parsed.goals ?? []).map((g) => ({
            ...g,
            accessType: g.accessType ?? typeByWallet.get(g.walletId) ?? 'flexible',
            unlockMode: g.unlockMode ?? 'date',
          }));
          const user = parsed.user
            ? {
                ...parsed.user,
                occupation: normalizeOccupation(parsed.user.occupation),
                country: COUNTRY_CODE, // Nigeria-only lock, applied to legacy data too
                currency: CURRENCY_CODE,
              }
            : null;
          const settings = {
            notifications: parsed.settings?.notifications ?? true,
            darkMode: parsed.settings?.darkMode ?? false,
            biometric: parsed.settings?.biometric ?? false,
          };
          dispatch({
            type: 'HYDRATE',
            state: { ...INITIAL_STATE, ...parsed, goals, user, settings, hydrated: true },
          });
        } else {
          dispatch({ type: 'HYDRATE', state: INITIAL_STATE });
        }
      })
      .catch(() => dispatch({ type: 'HYDRATE', state: INITIAL_STATE }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, hydrated: false })).catch(() => undefined);
    }, 250);
  }, [state]);

  // Logout / account wipe: persist the reset IMMEDIATELY. Without this, closing the
  // app inside the 250ms debounce window could resurrect the old session on next
  // launch — which then skips straight to Home instead of onboarding.
  const prevAuthed = useRef(false);
  useEffect(() => {
    if (!state.hydrated) return;
    if (prevAuthed.current && !state.authed) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, hydrated: false })).catch(() => undefined);
    }
    prevAuthed.current = state.authed;
  }, [state.authed, state.hydrated]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      modal,
      showModal: (m) => setModal(m),
      dismissModal: () => setModal(null),
      simulatedSave: () =>
        new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            if (state.offlineMode) reject(new Error('Network unavailable — please try again.'));
            else resolve();
          }, 650);
        }),
    }),
    [state, modal],
  );

  return <AppContext.Provider value={value}>{state.hydrated ? children : null}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

export { clamp };
