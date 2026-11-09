import { headers } from "next/headers";
import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import QRCode from "qrcode";
import { CalendarPlus, KeyRound, Link2, ShieldAlert } from "lucide-react";
import { TeilenKnoepfe } from "@/components/admin/teilen";
import { Callout } from "@/components/ui/callout";
import { Page, PageHeader } from "@/components/ui/page";
import { ladeDaten } from "@/lib/daten";
import { filterListe } from "@/lib/labels";
import { ladeMarke } from "@/lib/marke-laden";
import { zugangsToken } from "@/lib/zugang";

export const metadata = { title: "Teilen" };

export default function Seite() {
  return (
    <Page width="narrow">
      <PageHeader title="Teilen" description="Zugangslink und Kalender-Abos an die Gruppe weitergeben." />
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Inhalt />
      </Suspense>
    </Page>
  );
}

async function Inhalt() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const basis = `${proto}://${host}`;
  const token = zugangsToken();
  const [{ gruppen }, { name: APP_NAME }] = await Promise.all([ladeDaten(), ladeMarke()]);

  if (!token) {
    return (
      <Callout tone="warning" title="Zugriffsschutz ist noch nicht eingerichtet">
        Ohne <code>ZUGANG_TOKEN</code> kann jeder, der die Adresse kennt, alle Termine sehen. In Vercel unter Settings →
        Environment Variables den Eintrag <code>ZUGANG_TOKEN</code> mit einem geheimen Wort (Buchstaben, Ziffern,
        Bindestriche) anlegen und neu deployen. Danach erscheint hier der Link zum Teilen.
      </Callout>
    );
  }

  const link = `${basis}/?k=${encodeURIComponent(token)}`;
  const qr = await QRCode.toString(link, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1f1a17", light: "#ffffff" },
  });
  const feeds = filterListe(gruppen).filter((f) => f.key === "alle" || gruppen.some((g) => g.id === f.key));

  return (
    <div className="space-y-8">
      {/* Zugangslink */}
      <section className="overflow-hidden rounded-[14px] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Link2 className="size-5" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold">Zugangslink für alle</h2>
            <p className="text-[13.5px] text-subtle">Einmal öffnen – danach dauerhaft Zugriff auf alle Termine.</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_180px] sm:items-start">
          <div className="space-y-4">
            <p className="break-all rounded-[10px] bg-bg px-3.5 py-3 font-mono text-[14px] leading-relaxed text-ink select-all">
              {link}
            </p>
            <TeilenKnoepfe url={link} titel={APP_NAME} text={`Hier sind alle Termine der Session im ${APP_NAME}:`} />
          </div>
          <figure className="mx-auto w-[180px] text-center">
            <div className="rounded-[12px] bg-white p-2 shadow-[inset_0_0_0_1px_var(--line)]" dangerouslySetInnerHTML={{ __html: qr }} />
            <figcaption className="mt-1.5 text-[12.5px] text-subtle">Zum Abscannen mit der Handy-Kamera</figcaption>
          </figure>
        </div>
      </section>

      {/* Kalender-Abos */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <CalendarPlus className="size-[18px] text-subtle" />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-subtle">Kalender-Abos</h2>
        </div>
        <p className="px-1 text-[14px] text-subtle">
          Wer den Zugangslink geöffnet hat, findet die Abos auch selbst unter „Abo“. Hier zum direkten Weitergeben – z. B. nur die
          Senats-Termine an den Senat.
        </p>
        <ul className="divide-y divide-line overflow-hidden rounded-[14px] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
          {feeds.map((f) => {
            const url = `${basis}/kalender/${encodeURIComponent(token)}/${f.key}.ics`;
            return (
              <li key={f.key} className="space-y-3 px-5 py-4">
                <div>
                  <h3 className="text-[15px] font-semibold">{f.label}</h3>
                  <p className="text-[13px] text-subtle">{f.beschreibung}</p>
                </div>
                <TeilenKnoepfe
                  kompakt
                  url={url}
                  titel={`${APP_NAME} – ${f.label}`}
                  text={`Kalender-Abo „${f.label}“ (${APP_NAME}) – auf dem iPhone antippen und „Abonnieren“ wählen:`}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <Callout tone="neutral" icon={<KeyRound />} title="Link ändern">
        Ist der Link in falsche Hände geraten? In Vercel ein neues <code>ZUGANG_TOKEN</code> eintragen und neu deployen. Alte
        Links und Abos funktionieren dann nicht mehr – den neuen Link einfach wieder hier teilen.
      </Callout>
      <p className="flex items-center gap-1.5 px-1 text-[12.5px] text-subtle">
        <ShieldAlert className="size-3.5" />
        Nur innerhalb der Gruppe weitergeben – mit dem Link sieht man alle Termine und Treffpunkte.
      </p>
    </div>
  );
}
