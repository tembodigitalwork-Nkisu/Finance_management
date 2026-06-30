"use client";

import { useEffect } from "react";

// Registers the service worker once on the client. Without this, the browser
// never sees /sw.js and the app is not installable. Rendered (returning null)
// from the root layout so it runs on every page.
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
