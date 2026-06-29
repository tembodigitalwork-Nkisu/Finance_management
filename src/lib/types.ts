export type AccountType = "bank" | "credit_card" | "mobile_money" | "cash";
export type Direction = "expense" | "income";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  credit_limit: number | null;
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
  monthly_savings_target: number;
  updated_at: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank account",
  credit_card: "Credit card",
  mobile_money: "Mobile money",
  cash: "Cash",
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
