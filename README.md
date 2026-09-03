# ⚓ Anchor

**Balance your spending, savings and goals with AI.**

Anchor is a mobile personal-finance app for freelancers, students and salary earners,
built with **React Native + Expo (SDK 57)** and a single cream / navy / gold design
system. This repo contains the complete V1 spec: 27 screens, a 4-step
withdraw-to-bank flow, 8+ overlay modals, and explicit empty & error states.

## Quick start

```bash
npm install
npm start          # Metro dev server (scan with Expo Go, or press w for web)
npm run web        # web dev server directly
npm run typecheck  # tsc --noEmit
```

On first launch you'll get the Splash → Welcome → Sign Up → OTP → Onboarding
(Name → Income → Goals → Priorities → AI Budget) funnel. Accepting the plan runs a
"You're ready." success animation and drops you straight into Home.

## Design system

| Token | Value | Used for |
|---|---|---|
| Cream | `#F7F2E8` | App background |
| Navy | `#16283F` | Headers, primary buttons, dark cards |
| Gold / Mustard | `#C99A3B` | Progress, highlights, FAB accents |
| Terracotta | `#C1573B` | Emergency wallet, warnings, negative amounts |
| Green | `#4F6F52` | Checkmarks, completed states, income |
| Border | `#E4DCC9` | Subtle dividers |
| Gray | `#7A7A72` | Secondary text |

- **Headings / big currency**: Playfair Display (serif)
- **Body / UI**: Inter (sans)
- Currency is Nigerian Naira (₦) with thousands separators
- The anchor logo (navy anchor, mustard crossbar) is drawn programmatically —
  see `src/components/Logo.tsx` (in-app) and `scripts/make_assets.py`
  (icon / splash / favicon PNGs)

## Access rules (Absolute Lock Integrity, spec §4.4)

| Wallet | Withdrawal behavior |
|---|---|
| **Flexible Savings** | Always available, always succeeds immediately (subject to balance) |
| **Emergency Fund** | Accessible, but every withdrawal shows a purpose-reminder confirmation and is **logged distinctly** (`Emergency Withdrawal`) to track emergency usage |
| **Locked Savings** | **Absolute hard lock.** Funds cannot be moved, withdrawn, or reallocated until the goal's unlock condition is met — `targetDate` reached **or** 100% funded (user picks at creation, default: target date). No fees, no support overrides, no break-glass |

Enforcement is layered:
- `src/lib/locks.ts` — single source of truth (`isGoalMatured`, `lockViolationForWithdrawal`, the `LOCKED_GOAL` violation shape mirroring the spec's `403` payload)
- UI: tapping Withdraw on an immature locked goal opens the **Hard Lock Modal** (gold padlock, "Funds are Strictly Locked", single "Understood" action — no bypass). The withdrawal form is never reached. Goal cards show a closed padlock that flips to an open lock once matured.
- Data layer: the store's `EXECUTE_WITHDRAWAL` mutation re-checks the lock and **rejects the debit** if an immature locked goal would be touched — even if the UI were bypassed.

## Screen map (numbers match the spec)

| # | Route | Screen |
|---|---|---|
| 01 | `/01-splash` | Splash — logo, tagline, loading animation |
| 02 | `/02-welcome` | Welcome — Get Started / Log In |
| 03 | `/03-signup-login` | Sign Up / Log In (+ optional Google/Apple) |
| 04 | `/04-otp` | 6-digit OTP verification, resend countdown |
| 05 | `/05-forgot-password` | Forgot password / reset flow |
| 06 | `/06-personal-info` | Name, country, currency, occupation |
| 07 | `/07-income-setup` | Frequency, average income, next income date |
| 08 | `/08-financial-goals` | Goal multi-select (+ Skip for now) |
| 09 | `/09-priority-setup` | Essential / Important / Optional ranking |
| 10 | `/10-ai-budget-plan` | AI recommendation, Accept / Customize, "You're ready." |
| 11 | `/11-home` | Home — balance, safe-to-spend, coach, progress, quick actions |
| 12 | `/12-budget` | Budget — income/plan summary, categories, AI suggestions, history |
| 13 | `/13-goals` | Goals — 3 wallet cards, goal list, empty state |
| 14 | `/14-goal-details` | Goal details — Add Money / Withdraw / transactions / edit / delete |
| 15 | `/15-add-goal` | Add / edit goal (wallet auto-assigned by category, priority) |
| 16 | `/16-add-income` | Add income |
| 17 | `/17-record-expense` | Record expense (category grid, instant budget update) |
| 18 | `/18-ai-recommendation` | "Here's how to split it" — Accept / Edit |
| 19 | `/19-transaction-history` | Filters, search, colored rows, empty state |
| 20 | `/20-ai-chat` | Ask Anchor — chips, bubbles, typing indicator, mic |
| 21 | `/21-notifications` | Grouped Today / Earlier, 5 notification types |
| 22 | `/22-profile` | Profile — health score, achievements, settings, logout |
| 23 | `/23-health-score` | Circular gauge + breakdown bars + personalized tip |
| 24 | `/24-achievements` | Earned / locked badges + next badge progress |
| 25 | `/25-settings` | Full settings incl. Delete Account (+ offline demo toggle) |
| 26 | `/26-link-bank` | Link bank account / card, verify, linked list, empty state |
| 27 | `/27-withdraw` | Withdraw to bank — 4 steps: amount → account → confirm → receipt |

Bottom tab bar (Home · Budget · Goals · AI · Profile) is persistent on 11, 12, 13, 20, 22.

## Modals (§5)

`src/components/ModalHost.tsx` — Success Saving, Income Added, Expense Added,
Goal Completed, OTP Sent/Resent, Budget Exceeded warning, Withdrawal Confirmation,
Delete Goal confirmation (plus a few utility modals: account linked, logout,
delete account, social sign-in info).

## Architecture

```
app/                  # expo-router file routes (numbered per spec)
src/theme.ts          # palette, type scale, radii, shadows
src/components/       # UI kit (Button, Field, Card, InfoBanner, ProgressBar,
                      #   TabBar, OptionSheet, ModalHost, SuccessCheck, Logo…)
src/lib/types.ts      # data model (User, Wallet, Goal, Transaction, …)
src/lib/finance.ts    # budget engine, safe-to-spend, health score, achievements
src/lib/ai.ts         # rule-based AI coach (chat replies, tips, suggestions)
src/store/            # AppProvider (context + reducer + AsyncStorage persistence)
```

- **State**: one `AppState` in React Context, persisted to AsyncStorage (debounced).
  Money movements (`APPLY_INCOME`, `ADD_MONEY_TO_GOAL`, `EXECUTE_WITHDRAWAL`, …)
  update wallets, goals, transactions, notifications and recompute the health
  score + achievements in one pass.
- **AI**: deterministic on-device coach — it reads your actual budgets/goals to
  answer things like "How much can I safely spend today?". No API keys needed.
- **Demo data**: completing onboarding seeds a realistic 30-day history (prior
  income/expenses, carry-over savings, notifications) so every screen is alive.
- **Error states**: `Settings → Demo → Simulate offline network` makes the next
  Save action fail with a retry banner (Add Income, Record Expense, Add Goal,
  Link Account).
- **Web**: the app centers in a 480px phone frame on wide viewports.

## Brand assets

Regenerate icon/splash/favicon with:

```bash
python3 -m pip install pillow   # if missing
python3 scripts/make_assets.py
```
