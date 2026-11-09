"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImageUp, RotateCcw } from "lucide-react";
import { darstellungSpeichern } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader, Section } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";

interface Logo {
  gross: Blob;
  klein: Blob;
  vorschau: string;
}

function bildLaden(datei: File): Promise<HTMLImageElement> {
  return new Promise((ok, fehler) => {
    const bild = new Image();
    bild.onload = () => ok(bild);
    bild.onerror = () => fehler(new Error("Bild nicht lesbar"));
    bild.src = URL.createObjectURL(datei);
  });
}

/** Bereich mit Inhalt: durchsichtige und (fast) weiße Ränder werden abgeschnitten */
function inhalt(bild: HTMLImageElement) {
  const max = 1024;
  const f = Math.min(1, max / Math.max(bild.naturalWidth, bild.naturalHeight));
  const w = Math.round(bild.naturalWidth * f);
  const h = Math.round(bild.naturalHeight * f);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bild, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data;
  let l = w, o = h, r = -1, u = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const sichtbar = px[i + 3] > 16 && Math.min(px[i], px[i + 1], px[i + 2]) < 236;
      if (!sichtbar) continue;
      if (x < l) l = x;
      if (x > r) r = x;
      if (y < o) o = y;
      if (y > u) u = y;
    }
  if (r < 0) return { x: 0, y: 0, w: bild.naturalWidth, h: bild.naturalHeight };
  return { x: l / f, y: o / f, w: (r - l + 1) / f, h: (u - o + 1) / f };
}

/** Logo quadratisch auf Weiß zeichnen (mit etwas Rand) und als PNG ausgeben */
function zeichnen(bild: HTMLImageElement, ausschnitt: ReturnType<typeof inhalt>, px: number): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, px, px);
  g.imageSmoothingQuality = "high";
  const rand = px * 0.03;
  const s = Math.min((px - 2 * rand) / ausschnitt.w, (px - 2 * rand) / ausschnitt.h);
  const w = ausschnitt.w * s;
  const h = ausschnitt.h * s;
  g.drawImage(bild, ausschnitt.x, ausschnitt.y, ausschnitt.w, ausschnitt.h, (px - w) / 2, (px - h) / 2, w, h);
  return new Promise((ok, fehler) => c.toBlob((b) => (b ? ok(b) : fehler(new Error("PNG fehlgeschlagen"))), "image/png"));
}

async function vorbereiten(datei: File): Promise<Logo> {
  const bild = await bildLaden(datei);
  const ausschnitt = inhalt(bild);
  const [gross, klein] = await Promise.all([zeichnen(bild, ausschnitt, 512), zeichnen(bild, ausschnitt, 144)]);
  URL.revokeObjectURL(bild.src);
  return { gross, klein, vorschau: URL.createObjectURL(gross) };
}

/** Verwaltung → Darstellung: App-Name, Unterzeile und Logo (z. B. für die nächste Session). */
export function Darstellung({
  name: nameStart,
  untertitel: untertitelStart,
  logoStand,
  eigenesLogo,
  speicherbar,
}: {
  name: string;
  untertitel: string;
  logoStand: number;
  eigenesLogo: boolean;
  speicherbar: true | string;
}) {
  const router = useRouter();
  const datei = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(nameStart);
  const [untertitel, setUntertitel] = useState(untertitelStart);
  const [logo, setLogo] = useState<Logo | null>(null);
  const [zuruecksetzen, setZuruecksetzen] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const [laeuft, starte] = useTransition();

  const aktuellesLogo = logo?.vorschau ?? (zuruecksetzen ? "/logo.png" : `/marke/logo?v=${logoStand}`);
  const geaendert = name !== nameStart || untertitel !== untertitelStart || !!logo || zuruecksetzen;

  const waehlen = async (f: File | undefined) => {
    if (!f) return;
    setFehler(undefined);
    try {
      setLogo(await vorbereiten(f));
      setZuruecksetzen(false);
    } catch {
      setFehler("Dieses Bild kann der Browser nicht lesen. Bitte ein PNG oder JPG wählen.");
    }
  };

  const speichern = (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(undefined);
    const form = new FormData();
    form.set("name", name);
    form.set("untertitel", untertitel);
    if (logo) {
      form.set("logo", new File([logo.gross], "logo.png", { type: "image/png" }));
      form.set("logoKlein", new File([logo.klein], "logo-klein.png", { type: "image/png" }));
    }
    if (zuruecksetzen) form.set("logoZuruecksetzen", "1");
    starte(async () => {
      const r = await darstellungSpeichern(form);
      if (!r.ok) return setFehler(r.fehler);
      toast.success("Darstellung gespeichert");
      setLogo(null);
      setZuruecksetzen(false);
      router.refresh();
    });
  };

  return (
    <form onSubmit={speichern} className="space-y-5">
      <PageHeader title="Darstellung" description="Name, Unterzeile und Logo der App – zum Beispiel für die nächste Session." />

      {speicherbar !== true ? <p className="rounded-[var(--radius-card)] bg-active p-3 text-[14px] text-muted">{speicherbar}</p> : null}

      {/* Vorschau der Kopfzeile, wie sie in der App erscheint */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border-b-[3px] border-kopf-rand bg-kopf px-4 py-2.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aktuellesLogo} alt="" className="size-10" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[19px] font-semibold">{name || "App-Name"}</span>
            <span className="block truncate text-[12px] text-white/75">{untertitel}</span>
          </span>
        </div>
      </div>

      <Section title="Name und Unterzeile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App-Name" hint="Kopfzeile, Name unter dem App-Symbol, Kalender-Abo" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </Field>
          <Field label="Unterzeile" hint="z. B. „Session 2027/28“">
            <Input value={untertitel} onChange={(e) => setUntertitel(e.target.value)} maxLength={60} />
          </Field>
        </div>
      </Section>

      <Section
        title="Logo"
        description="Am besten quadratisch, mindestens 512 Pixel, PNG oder JPG. Weiße oder durchsichtige Ränder werden automatisch abgeschnitten."
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid size-36 shrink-0 place-items-center rounded-[var(--radius-card)] bg-white shadow-[inset_0_0_0_1px_var(--line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aktuellesLogo} alt="Logo" className="size-32 object-contain" />
          </div>
          <div className="space-y-2">
            <input ref={datei} type="file" accept="image/*" hidden onChange={(e) => void waehlen(e.target.files?.[0])} />
            <Button type="button" onClick={() => datei.current?.click()}>
              <ImageUp />
              Logo wählen …
            </Button>
            {(eigenesLogo && !zuruecksetzen) || logo ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLogo(null);
                  setZuruecksetzen(eigenesLogo);
                  if (datei.current) datei.current.value = "";
                }}
              >
                <RotateCcw />
                {logo ? "Auswahl verwerfen" : "Mitgeliefertes Logo verwenden"}
              </Button>
            ) : null}
            <p className="max-w-xs text-[12.5px] text-subtle">
              Das Symbol auf dem Home-Bildschirm übernimmt das iPhone erst, wenn man die App dort neu hinzufügt.
            </p>
          </div>
        </div>
      </Section>

      {fehler ? (
        <p role="alert" className="rounded-[var(--radius-card)] bg-accent-soft p-3 text-[14px] text-danger">
          {fehler}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg" loading={laeuft} disabled={!geaendert || speicherbar !== true}>
          Speichern
        </Button>
      </div>
    </form>
  );
}
