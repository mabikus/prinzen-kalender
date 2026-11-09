import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Symbol für "Zum Home-Bildschirm" auf dem iPhone
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#b91c1c" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path
            d="M12 46 L14 22 L24 32 L32 16 L40 32 L50 22 L52 46 Z"
            fill="#facc15"
            stroke="#fde68a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="12" y="46" width="40" height="6" rx="2" fill="#facc15" />
          <circle cx="32" cy="16" r="3" fill="#fff" />
          <circle cx="14" cy="22" r="2.5" fill="#fff" />
          <circle cx="50" cy="22" r="2.5" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
