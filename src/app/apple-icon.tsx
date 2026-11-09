import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Symbol für "Zum Home-Bildschirm" auf dem iPhone
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#9a1219" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path
            d="M15 44 L13 22 L24 31 L32 17 L40 31 L51 22 L49 44 Z"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M15 50 H49" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
