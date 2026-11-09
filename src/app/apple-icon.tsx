import { appIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Symbol für "Zum Home-Bildschirm" auf dem iPhone
export default function AppleIcon() {
  return appIcon(180, 0.14);
}
