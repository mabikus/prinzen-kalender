/** Kennung der veröffentlichten Version – die App vergleicht sie mit ihrer eigenen (components/pwa.tsx). */
export function GET() {
  return Response.json({ version: process.env.APP_VERSION ?? null }, { headers: { "Cache-Control": "no-store" } });
}
