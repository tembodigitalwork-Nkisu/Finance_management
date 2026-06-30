import type { Transaction, Goal, Account } from "./types";

export interface MonthSummary {
  income: number;
  expense: number;
  net: number; // income - expense (what you actually saved this month so far)
  dayOfMonth: number;
  daysInMonth: number;
  projectedExpense: number; // linear forecast of full-month spend
  projectedNet: number; // income target vs projected spend
}

// Sum this month's transactions and forecast where the month is heading.
export function summarizeMonth(
  txns: Transaction[],
  monthlyIncomeTarget = 0,
  ref = new Date(),
): MonthSummary {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const inMonth = txns.filter((t) => {
    const d = new Date(t.occurred_on + "T00:00:00");
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const income = sum(inMonth.filter((t) => t.direction === "income"));
  const expense = sum(inMonth.filter((t) => t.direction === "expense"));

  const dayOfMonth = ref.getDate();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const projectedExpense = (expense / dayOfMonth) * daysInMonth;

  // Use the bigger of actual income so far or your stated monthly target,
  // so early in the month the forecast still reflects expected salary.
  const expectedIncome = Math.max(income, monthlyIncomeTarget);

  return {
    income,
    expense,
    net: income - expense,
    dayOfMonth,
    daysInMonth,
    projectedExpense,
    projectedNet: expectedIncome - projectedExpense,
  };
}

export interface GoalStatus {
  remaining: number;
  percent: number;
  monthsLeft: number;
  requiredPerMonth: number;
  onTrack: boolean;
  shortfallPerMonth: number;
}

// Compare what a goal needs per month against what you can actually save.
export function goalStatus(
  goal: Goal,
  monthlyCapacity: number,
  ref = new Date(),
): GoalStatus {
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const percent = clamp((goal.saved_amount / goal.target_amount) * 100, 0, 100);

  const monthsLeft = wholeMonthsBetween(ref, new Date(goal.target_date + "T00:00:00"));
  // If the deadline is here/past, you need the whole remaining amount now.
  const requiredPerMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;

  const onTrack = remaining === 0 || monthlyCapacity >= requiredPerMonth;
  const shortfallPerMonth = Math.max(0, requiredPerMonth - monthlyCapacity);

  return { remaining, percent, monthsLeft, requiredPerMonth, onTrack, shortfallPerMonth };
}

// The live balance of an account: its opening balance adjusted by every
// transaction logged against it.
//   - Asset accounts (bank, mobile money, cash): money in (income) raises it;
//     money out (expenses and cash-out transfers, including fees) lowers it.
//   - Credit cards: the "balance" is what you owe, so charges (expenses) raise
//     it and payments (income) lower it.
export function accountBalance(txns: Transaction[], account: Account): number {
  const forAcc = txns.filter((t) => t.account_id === account.id);
  const income = sum(forAcc.filter((t) => t.direction === "income"));
  const expense = sum(forAcc.filter((t) => t.direction === "expense"));
  const transfer = sum(forAcc.filter((t) => t.direction === "transfer"));
  const opening = Number(account.opening_balance) || 0;

  if (account.type === "credit_card") {
    return opening + expense - income;
  }
  return opening + income - expense - transfer;
}

function sum(txns: Transaction[]): number {
  return txns.reduce((acc, t) => acc + Number(t.amount), 0);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Whole months from `from` to `to`, rounded up so a partial month still counts.
function wholeMonthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  // If the target day is later this month, count the current month too.
  const dayAdjust = to.getDate() >= from.getDate() ? 1 : 0;
  return Math.max(0, months + dayAdjust);
}
