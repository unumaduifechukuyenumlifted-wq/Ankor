import { AppState } from './types';
import { money, moneyK, fmtDate, daysUntil } from './format';
import { monthExpenses, safeToSpend, spentByCategory, monthIncome } from './finance';

/** Rule-based coach engine — powers AI chat, Home coach card and Budget suggestions. */

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const coachTip = (s: AppState): string => {
  const sts = safeToSpend(s.budget, s.transactions, s.budget?.nextIncomeDate ?? new Date().toISOString());
  const tips: string[] = [
    `You can safely spend ${money(sts.daily)} today and still hit every goal this month.`,
    `Your next income lands in ${sts.daysLeft} day${sts.daysLeft === 1 ? '' : 's'} — keep ${money(sts.remaining)} flexible money for the gap.`,
    `Moving ${money(2000)} to a goal today barely dents your wallet, but compounds your streak.`,
  ];
  const topGoal = s.goals.find((g) => g.status === 'active');
  if (topGoal) {
    const pct = Math.round((topGoal.savedAmount / Math.max(1, topGoal.targetAmount)) * 100);
    tips.push(
      `${topGoal.name} is ${pct}% funded — at this pace you'll get there before ${fmtDate(topGoal.targetDate)}.`,
    );
  }
  const cats = spentByCategory(s.transactions);
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  if (topCat) tips.push(`${topCat[0]} is your biggest spend category this month (${money(topCat[1])}). A small trim frees up goal money.`);
  return pick(tips);
};

export interface Suggestion {
  title: string;
  body: string;
  icon: string;
}

export const budgetSuggestions = (s: AppState): Suggestion[] => {
  const out: Suggestion[] = [];
  if (!s.budget) return out;
  const spent = spentByCategory(s.transactions);
  for (const cat of s.budget.categories) {
    const used = spent[cat.name] ?? 0;
    if (used > cat.limit * 0.85) {
      out.push({
        title: `Trim ${cat.name} by ${money(Math.round((used - cat.limit * 0.85) / 100) * 100)}`,
        body: `You've used ${Math.round((used / cat.limit) * 100)}% of your ${cat.name} budget this month. Shifting the excess to a goal keeps your plan on track.`,
        icon: 'scissors',
      });
      break;
    }
  }
  const sts = safeToSpend(s.budget, s.transactions, s.budget.nextIncomeDate);
  if (sts.daily < 1500) {
    out.push({
      title: 'Flexible money is running low',
      body: `Only ${money(sts.remaining)} is left for flexible spending until ${fmtDate(s.budget.nextIncomeDate)}. Aim to keep daily spend under ${money(sts.daily)}.`,
      icon: 'warning',
    });
  }
  const emergency = s.wallets.find((w) => w.type === 'emergency');
  if (emergency && emergency.balance < 100000) {
    out.push({
      title: 'Top up your Emergency Fund',
      body: `A ₦10,000 move today brings you to ${money(emergency.balance + 10000)} — closer to the recommended 3 months of essentials.`,
      icon: 'shield',
    });
  }
  if (out.length < 2) {
    out.push({
      title: 'Round up your savings',
      body: `If you save ${money(500)} every day this week, you'll add ${money(3500)} to your goals without noticing it.`,
      icon: 'sparkles',
    });
  }
  return out.slice(0, 2);
};

const match = (q: string, ...words: string[]) => words.some((w) => q.toLowerCase().includes(w));

export const aiReply = (question: string, s: AppState): string => {
  const q = question.toLowerCase();
  if (!s.budget) {
    return "I'll be able to coach you once your budget is set up — it only takes a minute. Finish onboarding and I'll take it from there.";
  }
  const sts = safeToSpend(s.budget, s.transactions, s.budget.nextIncomeDate);

  if (match(q, 'safely spend', 'safe to spend', 'spend today', 'can i spend')) {
    return `You can safely spend up to ${money(sts.daily)} today. That keeps ${money(sts.remaining)} of flexible money spread over the next ${sts.daysLeft} days until your income on ${fmtDate(s.budget.nextIncomeDate)} — and your goals stay fully on track.`;
  }

  if (match(q, 'on track', 'goal for', 'track for')) {
    const goal =
      s.goals.find((g) => q.includes(g.name.toLowerCase())) ??
      s.goals.filter((g) => g.status === 'active').sort((a, b) => b.savedAmount / b.targetAmount - a.savedAmount / a.targetAmount)[0];
    if (!goal) return "You don't have an active goal yet — create one and I'll watch the pace with you.";
    const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
    const days = Math.max(1, daysUntil(goal.targetDate));
    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
    const perDay = Math.ceil(remaining / days);
    const paceOk = pct >= Math.round((100 * (30 - Math.min(30, days)) / 30) * 0.8);
    return `${goal.name} is ${pct}% funded (${moneyK(goal.savedAmount)} of ${moneyK(goal.targetAmount)}). You need about ${money(perDay)}/day to reach it by ${fmtDate(goal.targetDate)}. ${
      paceOk ? "That's on track — keep the steady deposits coming." : `Slightly behind pace — an extra ${money(Math.round(perDay * 0.2))}/day closes the gap.`
    }`;
  }

  if (match(q, 'where', 'most of my money', 'went', 'spend this week', 'week')) {
    const cats = Object.entries(spentByCategory(s.transactions)).sort((a, b) => b[1] - a[1]);
    const total = monthExpenses(s.transactions);
    if (cats.length === 0) return "You haven't logged any expenses this month yet — record one and I'll spot the patterns for you.";
    const [top, amt] = cats[0];
    const share = Math.round((amt / Math.max(1, total)) * 100);
    const second = cats[1];
    return `Most of your money went to ${top} — ${money(amt)} (${share}% of the ${money(total)} you've spent this month).${
      second ? ` ${second[0]} follows at ${money(second[1])}.` : ''
    } ${top === 'Food' ? 'Two more home-cooked meals a week could free up ~₦8,000 for goals.' : `Trimming ${top} by 10% would free ${money(Math.round(amt * 0.1))}.`}`;
  }

  if (match(q, 'save', 'saving', 'saved')) {
    const saved = s.transactions.filter((t) => t.type === 'savings').reduce((a, t) => a + t.amount, 0);
    return `You've saved a total of ${money(saved)} in Anchor across ${s.goals.length} goal${s.goals.length === 1 ? '' : 's'}. Your wallets currently hold ${money(s.wallets.reduce((a, w) => a + w.balance, 0))} — steady discipline like this is what raises your health score.`;
  }

  if (match(q, 'income', 'salary', 'next pay', 'paid')) {
    return `Your next income is expected on ${fmtDate(s.budget.nextIncomeDate)} — ${sts.daysLeft} day${sts.daysLeft === 1 ? '' : 's'} away. This month you've recorded ${money(monthIncome(s.transactions))}. When it lands, log it and I'll re-run your allocation instantly.`;
  }

  if (match(q, 'emergency')) {
    const em = s.wallets.find((w) => w.type === 'emergency');
    return `Your Emergency Fund holds ${money(em?.balance ?? 0)}. The comfort zone is 3 months of essentials — about ${money(s.budget.allocations.essentials * 3)}. ${(em?.balance ?? 0) < 100000 ? 'Small weekly moves of ₦5,000 add up fast.' : "You're building a solid cushion — keep it going."}`;
  }

  return pick([
    `Here's the headline: ${money(sts.daily)} is your safe-to-spend for today, and your plan is ${Math.round((monthExpenses(s.transactions) / Math.max(1, s.budget.allocations.essentials + s.budget.allocations.flexible)) * 100)}% through its monthly allowance. Ask me about goals, categories or your next income anytime.`,
    `Quick pulse: you've spent ${money(monthExpenses(s.transactions))} this month and saved across ${s.goals.filter((g) => g.status === 'active').length} active goals. Try asking "Where did most of my money go this week?" for the breakdown.`,
  ]);
};

export const SUGGESTED_QUESTIONS = [
  'How much can I safely spend today?',
  'Am I on track for my Rent goal?',
  'Where did most of my money go this week?',
  'How is my Emergency Fund looking?',
  'When is my next income?',
];
