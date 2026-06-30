import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest. It is what makes the app
// installable: the name/icon shown on the home screen, and `display: standalone`
// is what strips the browser chrome so it opens like a native app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kwacha Tracker",
    short_name: "Kwacha",
    description:
      "Track your earnings, spending and savings goals in Zambian Kwacha.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [
      { src: "/api/icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
      // A maskable icon lets Android crop it to the device's icon shape without
      // clipping the artwork, because the teal background bleeds to the edges.
      { src: "/api/icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
