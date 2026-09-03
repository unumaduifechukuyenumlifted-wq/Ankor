/** Anchor data model (spec §7). */

export type Priority = 'essential' | 'important' | 'optional';
export type WalletType = 'flexible' | 'locked' | 'emergency';
export type TxType = 'income' | 'expense' | 'savings' | 'withdrawal';
export type NotifType = 'budget_alert' | 'ai_tip' | 'goal_milestone' | 'income_reminder' | 'savings_reminder';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  occupation: string;
}

export interface Wallet {
  id: string;
  type: WalletType;
  name: string;
  balance: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // ISO
  priority: Priority;
  walletId: string;
  category: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
  walletId?: string;
  goalId?: string;
  reference?: string;
}

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string; // ISO
  read: boolean;
}

export interface BudgetCategory {
  name: string;
  limit: number;
}

export interface BudgetHistoryItem {
  month: string; // "Aug"
  income: number;
  spent: number;
  saved: number;
}

export interface Budget {
  averageIncome: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextIncomeDate: string;
  allocations: { essentials: number; goals: number; flexible: number };
  categories: BudgetCategory[];
  history: BudgetHistoryItem[];
}

export interface LinkedAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  earned: boolean;
  progress: number;
  target: number;
}

export interface HealthScore {
  score: number;
  spendingDiscipline: number;
  savingsConsistency: number;
  goalProgress: number;
  history: { date: string; score: number }[];
}

export interface Settings {
  notifications: boolean;
  darkMode: boolean;
  biometric: boolean;
  currency: string;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  ts: string;
}

export interface WithdrawDraft {
  walletId?: string;
  amount?: number;
  accountId?: string;
}

export interface AppState {
  hydrated: boolean;
  authed: boolean;
  onboarded: boolean;
  pendingAuth: { email: string; phone: string; mode: 'signup' | 'login' } | null;
  user: User | null;
  wallets: Wallet[];
  goals: Goal[];
  transactions: Transaction[];
  notifications: Notification[];
  budget: Budget | null;
  linkedAccounts: LinkedAccount[];
  achievements: Achievement[];
  health: HealthScore;
  streakDays: number;
  joinedAt: string;
  chat: ChatMessage[];
  incomeDraft: {
    amount: number;
    source: string;
    dateReceived: string;
    nextIncomeDate: string;
    split?: { essentials: number; goals: number; flexible: number };
  } | null;
  withdrawDraft: WithdrawDraft | null;
  offlineMode: boolean; // demo: simulate network failure on save actions
  settings: Settings;
}
