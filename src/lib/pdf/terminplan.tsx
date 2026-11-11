import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { adresseText } from "../adresse";
import { personenBedarf, werText } from "../labels";
import type { Daten, Termin } from "../types";
import { datumKurz, MONATE, zeitplan, zeitText } from "../zeit";

// Terminplan als A4-PDF (hoch). Mitgelieferte Schrift Helvetica: kann ä/ö/ü/ß, aber keine Pfeile – daher „›“.

const ROT = "#9b1219";
const GRAU = "#6f6760";
const LINIE = "#e7e1da";

const s = StyleSheet.create({
  seite: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 28, fontFamily: "Helvetica", fontSize: 7.6, color: "#1f1a17" },
  kopf: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: ROT },
  logo: { width: 34, height: 34, marginRight: 10 },
  titel: { fontFamily: "Helvetica-Bold", fontSize: 15 },
  untertitel: { fontSize: 8.5, color: GRAU, marginTop: 2 },
  stand: { marginLeft: "auto", fontSize: 7.5, color: GRAU, textAlign: "right" },
  spaltenkopf: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: "#1f1a17", paddingBottom: 3, marginBottom: 1 },
  kopfText: { fontFamily: "Helvetica-Bold", fontSize: 6.6, letterSpacing: 0.5, color: GRAU, textTransform: "uppercase" },
  monat: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: ROT, marginTop: 7, marginBottom: 2 },
  zeile: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: LINIE },
  datum: { width: 50, fontFamily: "Helvetica-Bold" },
  zeit: { width: 62 },
  termin: { flex: 1, paddingRight: 6 },
  ort: { width: 132, paddingRight: 6 },
  wer: { width: 108 },
  klein: { fontSize: 6.6, color: GRAU },
  fett: { fontFamily: "Helvetica-Bold" },
  hinweis: { fontFamily: "Helvetica-Bold", color: ROT },
  fuss: { position: "absolute", bottom: 16, left: 28, right: 28, flexDirection: "row", fontSize: 6.6, color: GRAU },
});

export interface PlanOptionen {
  appName: string;
  untertitel: string;
  logo?: Uint8Array;
  /** z. B. „Kommende Termine“ oder „Ganze Session“ */
  auswahl: string;
  /** Verwaltung: bestellte Karten zeigen (intern) */
  mitBestellt?: boolean;
}

function zeitZeilen(t: Termin, ende: number | null | undefined): string[] {
  const z: string[] = [];
  if (t.treffzeit) z.push(`Treffen ${t.treffzeit}`);
  if (t.beginn) z.push(`Beginn ${t.beginn}`);
  if (!t.treffzeit && !t.beginn) z.push(t.anschluss_an ? "im Anschluss" : "Zeit offen");
  if (t.ende) z.push(`Ende ${t.ende}`);
  else if (ende != null && (t.treffzeit || t.beginn)) z.push(`Ende ca. ${zeitText(ende)}`);
  return z;
}

function Plan({ termine, daten, o }: { termine: Termin[]; daten: Daten; o: PlanOptionen }) {
  const plan = zeitplan(daten.termine);
  const monate = new Map<string, Termin[]>();
  for (const t of termine) monate.set(t.datum.slice(0, 7), [...(monate.get(t.datum.slice(0, 7)) ?? []), t]);
  const stand = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" }).format(new Date());

  return (
    <Document title={`${o.appName} – Terminplan`} author={o.appName} language="de">
      <Page size="A4" style={s.seite}>
        <View style={s.kopf} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF-Bild, kein HTML */}
          {o.logo ? <Image src={Buffer.from(o.logo)} style={s.logo} /> : null}
          <View>
            <Text style={s.titel}>{o.appName} – Terminplan</Text>
            <Text style={s.untertitel}>
              {o.untertitel} · {o.auswahl} · {termine.length} Termine
            </Text>
          </View>
          <Text style={s.stand}>Stand: {stand}</Text>
        </View>

        <View style={s.spaltenkopf} fixed>
          <Text style={[s.kopfText, s.datum]}>Datum</Text>
          <Text style={[s.kopfText, s.zeit]}>Zeit</Text>
          <Text style={[s.kopfText, s.termin]}>Termin</Text>
          <Text style={[s.kopfText, s.ort]}>Treffpunkt › Ort</Text>
          <Text style={[s.kopfText, s.wer]}>Wer · Karten</Text>
        </View>

        {[...monate].map(([monat, ts]) => {
          const [j, m] = monat.split("-").map(Number);
          return (
            <View key={monat}>
              <Text style={s.monat} minPresenceAhead={24}>
                {MONATE[m - 1]} {j}
              </Text>
              {ts.map((t) => {
                const z = plan.get(t.id);
                const adresse = adresseText(t);
                const orte = [t.treffpunkt, t.ort && t.ort !== t.treffpunkt ? t.ort : null].filter(Boolean).join(" › ");
                const b = t.anmeldung ? personenBedarf(t, daten.gruppen) : null;
                return (
                  <View key={t.id} style={s.zeile} wrap={false}>
                    <Text style={s.datum}>{datumKurz(t.datum)}</Text>
                    <View style={s.zeit}>
                      {zeitZeilen(t, z?.ende).map((x, i) => (
                        <Text key={x} style={i === 0 ? s.fett : s.klein}>
                          {x}
                        </Text>
                      ))}
                    </View>
                    <View style={s.termin}>
                      {t.tagesprogramm ? <Text style={s.klein}>{t.tagesprogramm}</Text> : null}
                      <Text style={s.fett}>
                        {t.titel}
                        {t.vertraulich ? "  (vertraulich)" : ""}
                        {t.status === "vorbehalt" ? "  – unter Vorbehalt" : ""}
                      </Text>
                      {t.veranstalter ? <Text style={s.klein}>Veranstalter: {t.veranstalter}</Text> : null}
                      {t.hinweis ? <Text style={s.hinweis}>{t.hinweis}</Text> : null}
                      {t.bemerkung ? <Text style={s.klein}>{t.bemerkung}</Text> : null}
                    </View>
                    <View style={s.ort}>
                      <Text>{orte || "–"}</Text>
                      {adresse ? <Text style={s.klein}>{adresse}</Text> : null}
                    </View>
                    <View style={s.wer}>
                      <Text>{werText(t, daten.gruppen)}</Text>
                      {b ? (
                        <Text style={s.hinweis}>
                          Karte: {b.summe}
                          {b.ohneAngabe.length ? "+" : ""} Pers.
                          {o.mitBestellt && t.karten_bestellt != null ? ` · ${t.karten_bestellt} bestellt` : ""}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={s.fuss} fixed>
          <Text>
            {o.appName} · {o.untertitel}
          </Text>
          <Text style={{ marginLeft: "auto" }} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function terminplanPdf(termine: Termin[], daten: Daten, o: PlanOptionen): Promise<Buffer> {
  return renderToBuffer(<Plan termine={termine} daten={daten} o={o} />);
}

/** Dateiname, z. B. „Terminplan-2026-11-11.pdf“ */
export function pdfName(): string {
  const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  return `Terminplan-${heute}.pdf`;
}
