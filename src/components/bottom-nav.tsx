"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

// A fixed bottom tab bar for phones: the reach-friendly, native-feeling pattern.
// Hidden on sm+ where the top pill nav takes over (see (app)/layout.tsx).

type Tab = {
  href: string;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
};

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/transactions", label: "Activity", Icon: ActivityIcon },
  { href: "/accounts", label: "Accounts", Icon: WalletIcon },
  { href: "/goals", label: "Goals", Icon: TargetIcon },
  { href: "/settings", label: "Settings", Icon: SlidersIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition " +
                  (active ? "text-teal-700" : "text-slate-500")
                }
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Plain functional UI glyphs (24px stroke icons), drawn inline so the tab bar
// needs no icon dependency.
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function ActivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SlidersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5v6M5 15v4" />
      <circle cx="5" cy="13" r="2" />
      <path d="M12 5v2M12 11v8" />
      <circle cx="12" cy="9" r="2" />
      <path d="M19 4v11" />
      <circle cx="19" cy="17" r="2" />
    </svg>
  );
}
