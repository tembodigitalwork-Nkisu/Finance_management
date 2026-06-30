export type AccountType =
  | "bank"
  | "credit_card"
  | "mobile_money"
  | "cash"
  | "savings";
export type Direction = "expense" | "income";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  credit_limit: number | null;
  opening_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  direction: Direction;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  // A move between your own accounts (e.g. into Savings); excluded from the
  // month's income/spending totals. The "deduct from" leg links to its receiving
  // leg via transfer_parent_id.
  is_transfer: boolean;
  transfer_parent_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Settings {
  user_id: string;
  monthly_income_target: number;
  savings_target_amount: number;
  savings_target_count: number;
  savings_target_unit: string; // 'years' | 'months' | 'weeks' | 'days'
  updated_at: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank account",
  credit_card: "Credit card",
  mobile_money: "Mobile money",
  cash: "Cash",
  savings: "Savings",
};

export const CATEGORIES = [
  "Rent",
  "Groceries",
  "Transport",
  "Airtime & Data",
  "Utilities",
  "Eating out",
  "Health",
  "Entertainment",
  "Family",
  "Shopping",
  "Salary",
  "Side income",
  "Transfer",
  "Other",
] as const;
