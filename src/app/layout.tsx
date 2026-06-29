import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kwacha Tracker",
  description: "Track your earnings, spending and savings goals in Zambian Kwacha.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
