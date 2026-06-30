import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";

export const metadata: Metadata = {
  title: "Kwacha Tracker",
  description: "Track your earnings, spending and savings goals in Zambian Kwacha.",
  applicationName: "Kwacha Tracker",
  manifest: "/manifest.webmanifest",
  // Tells iOS to launch full-screen from the home-screen icon, like a native app.
  appleWebApp: {
    capable: true,
    title: "Kwacha",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/api/icon?size=192", sizes: "192x192", type: "image/png" },
    ],
    // iOS uses this PNG for the home-screen icon (it ignores SVG here).
    apple: [{ url: "/api/icon?size=180", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  // Paints the browser/status bar in the brand teal.
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  // `cover` lets the layout reach under the notch / home indicator so we can pad
  // for them ourselves with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
