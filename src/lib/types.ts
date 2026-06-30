export type AccountType = "bank" | "credit_card" | "mobile_money" | "cash";
// 'transfer' is a mobile-money cash-out's principal: it shifts your own money,
// so it counts as neither income nor spending (only its fee does).
export type Direction = "expense" | "income" | "transfer";

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
  // Mobile-money metadata. op: 'withdraw' | 'send' | 'receive' | 'fee'.
  // provider: 'mtn' | 'airtel' | 'zamtel'. Both null for plain entries.
  op: string | null;
  provider: string | null;
  fee_parent_id: string | null;
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
