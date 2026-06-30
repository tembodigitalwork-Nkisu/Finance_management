import { ImageResponse } from "next/og";

// Generates the app's PNG icons on the fly from the same coin-in-hand mark used
// across the UI. We render PNGs (not the SVG) because iOS home-screen icons and
// Android maskable icons both require raster images. `next/og` ships inside the
// `next` package, so this needs no extra dependency.

const BRAND = "#0f766e";

// The mark in white strokes, sized to a 64x64 viewBox (matches public/icon.svg).
const glyph = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="16" r="11"/><path d="M40 9.5v13M43.5 12.2c-.6-1.3-2-2-3.5-2-1.9 0-3.4 1.2-3.4 2.8 0 3.6 7 1.8 7 5.5 0 1.6-1.5 2.8-3.6 2.8-1.6 0-3-.8-3.6-2.1"/><path d="M3 44l9-4 13 1c2 .1 3.9.9 5.4 2.2l4.2 3.6h7.5c2 0 3.6 1.6 3.6 3.6s-1.6 3.6-3.6 3.6H28c-2.6 0-5.1-.8-7.2-2.4L13 49"/><path d="M3 41l0 9 6 2 0-12z"/></g></svg>`;

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(1024, Math.max(48, Number(searchParams.get("size")) || 512));
  // Keep the glyph inside the central ~62% so a maskable crop never clips it.
  const glyphSize = Math.round(size * 0.62);
  const src = `data:image/svg+xml;base64,${btoa(glyph)}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={glyphSize} height={glyphSize} src={src} alt="" />
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
