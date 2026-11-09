/**
 * Startbilder für iPhones (Pixel im Hochformat). iOS wählt per Media-Query das passende Bild;
 * ohne passendes Bild zeigt es beim Öffnen der App kurz eine leere Fläche.
 */
export const STARTBILDER = [
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max
  { w: 402, h: 874, dpr: 3 }, // 16 Pro
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 393, h: 852, dpr: 3 }, // 14 Pro, 15, 15 Pro, 16
  { w: 428, h: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, dpr: 3 }, // 12, 13, 14
  { w: 375, h: 812, dpr: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { w: 414, h: 896, dpr: 2 }, // XR, 11
  { w: 375, h: 667, dpr: 2 }, // SE, 8
].map((g) => ({
  breite: g.w * g.dpr,
  hoehe: g.h * g.dpr,
  media: `(device-width: ${g.w}px) and (device-height: ${g.h}px) and (-webkit-device-pixel-ratio: ${g.dpr}) and (orientation: portrait)`,
}));
