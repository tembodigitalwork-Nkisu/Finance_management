// Mobile money fee engine for Zambian operators: MTN MoMo, Airtel Money and
// Zamtel Kwacha.
//
// ⚠️  VERIFY THESE NUMBERS BEFORE TRUSTING THE AUTO FEES.
// Operator tariffs are official, banded (the fee depends on the amount band),
// and revised periodically — the government person-to-person levy doubled on
// 1 January 2026. When these tables were researched, third-party sources
// DISAGREED on several bands and Zamtel's official site was unreachable. So:
//   • Airtel withdrawal — confirmed across two sources (verified).
//   • MTN — from a 2026 schedule; upper withdrawal bands were disputed.
//   • Zamtel — could NOT be confirmed; treat as placeholder.
// Everything here is plain data. To fix a tariff, edit the number and the whole
// app updates. Dial the operator's USSD tariff (*115# etc.) to confirm.

export type Provider = "mtn" | "airtel" | "zamtel";
export type MomoOp = "withdraw" | "send" | "receive";

export const PROVIDER_LABELS: Record<Provider, string> = {
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
  zamtel: "Zamtel Kwacha",
};

export const MOMO_OP_LABELS: Record<MomoOp, string> = {
  withdraw: "Withdraw (cash out)",
  send: "Send money",
  receive: "Receive money",
};

// A band charges `fee` when the amount is at or below `upTo` (and above the
// previous band's `upTo`). Bands must be listed smallest-first.
interface Band {
  upTo: number;
  fee: number;
}

interface Tariff {
  verified: boolean;
  source: string;
  asOf: string;
  withdraw: Band[];
  // The operator's own send fee. The government levy below is added on top.
  send: Band[];
  receiveFree: boolean;
}

// Government Mobile Money Transaction Levy. Charged on person-to-person SENDS
// only — never on withdrawals or on receiving. Same bands across all operators.
// Doubled effective 1 January 2026.
const LEVY: Band[] = [
  { upTo: 150, fee: 0.32 },
  { upTo: 300, fee: 0.4 },
  { upTo: 500, fee: 0.8 },
  { upTo: 1000, fee: 2.0 },
  { upTo: 3000, fee: 4.0 },
  { upTo: 5000, fee: 7.5 },
  { upTo: 10000, fee: 8.0 },
];

const TARIFFS: Record<Provider, Tariff> = {
  airtel: {
    verified: true,
    source: "airtel.co.zm tariff guide, cross-checked with liquify-zambia.com",
    asOf: "2026",
    withdraw: [
      { upTo: 150, fee: 2.5 },
      { upTo: 300, fee: 5 },
      { upTo: 500, fee: 10 },
      { upTo: 1000, fee: 20 },
      { upTo: 3000, fee: 35 },
      { upTo: 5000, fee: 55 },
      { upTo: 10000, fee: 60 },
    ],
    send: [
      { upTo: 150, fee: 0.58 },
      { upTo: 300, fee: 1.1 },
      { upTo: 500, fee: 1.2 },
      { upTo: 1000, fee: 2.0 },
      { upTo: 3000, fee: 3.6 },
      { upTo: 5000, fee: 5.0 },
      { upTo: 10000, fee: 7.0 },
    ],
    receiveFree: true,
  },
  mtn: {
    // Upper withdrawal bands were disputed between sources — confirm before use.
    verified: false,
    source: "zamcalc.com MTN MoMo 2026 schedule",
    asOf: "2026",
    withdraw: [
      { upTo: 150, fee: 2.5 },
      { upTo: 300, fee: 5 },
      { upTo: 500, fee: 10 },
      { upTo: 1000, fee: 20 },
      { upTo: 2000, fee: 30 },
      { upTo: 3000, fee: 40 },
      { upTo: 5000, fee: 55 },
      { upTo: 10000, fee: 60 },
    ],
    send: [
      { upTo: 150, fee: 0.42 },
      { upTo: 300, fee: 0.9 },
      { upTo: 500, fee: 0.8 },
      { upTo: 1000, fee: 1.0 },
      { upTo: 3000, fee: 2.2 },
      { upTo: 5000, fee: 3.0 },
      { upTo: 10000, fee: 4.0 },
    ],
    receiveFree: true,
  },
  zamtel: {
    // PLACEHOLDER — Zamtel's official tariff was unreachable during research.
    // Withdrawal is advertised as free up to K10,000; the send provider fee is
    // UNKNOWN and set to 0 (the government levy below still applies to sends).
    // Please confirm with Zamtel and replace these numbers.
    verified: false,
    source: "UNCONFIRMED — Zamtel official tariff was unreachable",
    asOf: "unknown",
    withdraw: [{ upTo: 10000, fee: 0 }],
    send: [{ upTo: 10000, fee: 0 }],
    receiveFree: true,
  },
};

function bandFee(bands: Band[], amount: number): number {
  for (const b of bands) {
    if (amount <= b.upTo) return b.fee;
  }
  // Above the top band, fall back to the highest band's fee.
  return bands.length ? bands[bands.length - 1].fee : 0;
}

export interface FeeBreakdown {
  providerFee: number; // the operator's own charge
  levy: number; // government person-to-person levy (sends only)
  total: number; // providerFee + levy
  verified: boolean; // whether this operator's table is confirmed
}

// The official charge for a mobile-money operation. Receiving is free; the levy
// applies to sends only; withdrawals carry the operator fee with no levy.
export function computeMomoFee(
  provider: Provider,
  op: MomoOp,
  amount: number,
): FeeBreakdown {
  const t = TARIFFS[provider];
  if (op === "receive" || !(amount > 0)) {
    return { providerFee: 0, levy: 0, total: 0, verified: t.verified };
  }
  if (op === "withdraw") {
    const providerFee = round2(bandFee(t.withdraw, amount));
    return { providerFee, levy: 0, total: providerFee, verified: t.verified };
  }
  const providerFee = round2(bandFee(t.send, amount));
  const levy = round2(bandFee(LEVY, amount));
  return { providerFee, levy, total: round2(providerFee + levy), verified: t.verified };
}

export function isVerified(provider: Provider): boolean {
  return TARIFFS[provider].verified;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
