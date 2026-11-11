import "server-only";
import { ladeLogo, ladeMarke } from "../marke-laden";
import type { Daten } from "../types";
import { jetztInBerlin } from "../zeit";
import { pdfName, terminplanPdf } from "./terminplan";

/** Terminplan als PDF-Antwort. `alle`: ganze Session, sonst ab heute. */
export async function terminplanAntwort(daten: Daten, opts: { alle: boolean; mitBestellt?: boolean; zusatz?: string }) {
  const heute = jetztInBerlin().datum;
  const termine = opts.alle ? daten.termine : daten.termine.filter((t) => t.datum >= heute);
  const [marke, logo] = await Promise.all([ladeMarke(), ladeLogo(true)]);
  const auswahl = [opts.alle ? "Ganze Session" : "Kommende Termine", opts.zusatz].filter(Boolean).join(" · ");
  const pdf = await terminplanPdf(termine, daten, {
    appName: marke.name,
    untertitel: marke.untertitel,
    logo,
    auswahl,
    mitBestellt: opts.mitBestellt,
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdfName()}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
