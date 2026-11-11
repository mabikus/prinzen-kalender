"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dices, Lock, MessageCircle, Trash2 } from "lucide-react";
import { pinSpeichern } from "@/app/verwaltung/aktionen";
import { Kopieren } from "@/components/kopieren";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/overlay";
import { PageHeader, Section } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";

const zufallsPin = () => String(Math.floor(100000 + Math.random() * 900000));

export function VertraulichVerwaltung({
  pin,
  anzahl,
  appName,
  speicherbar,
}: {
  pin: string | null;
  /** Zahl der vertraulichen Termine */
  anzahl: number;
  appName: string;
  speicherbar: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [neu, setNeu] = useState("");
  const [laeuft, starte] = useTransition();

  const speichern = (wert: string | null, meldung: string) =>
    starte(async () => {
      const r = await pinSpeichern(wert);
      if (!r.ok) return void toast.error(r.fehler);
      toast.success(meldung);
      setNeu("");
      router.refresh();
    });

  const aendern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin) {
      const ok = await confirm({
        title: "PIN ändern?",
        description: "Alle, die bisher freigeschaltet sind, sehen die vertraulichen Termine erst nach Eingabe der neuen PIN wieder. Ihre vertraulichen Kalender-Abos hören auf und müssen neu abonniert werden.",
        confirmLabel: "PIN ändern",
      });
      if (!ok) return;
    }
    speichern(neu, pin ? "PIN geändert" : "PIN gesetzt");
  };

  const entfernen = async () => {
    const ok = await confirm({
      title: "PIN entfernen?",
      description: "Danach kann niemand mehr die vertraulichen Termine freischalten. Die Termine selbst bleiben erhalten (nur in der Verwaltung sichtbar).",
      confirmLabel: "Entfernen",
      destructive: true,
    });
    if (ok) speichern(null, "PIN entfernt");
  };

  const nachricht = pin
    ? `Code für die weiteren Termine im ${appName}: ${pin}\n\nIn der App unten auf das Zahnrad (Einstellungen) tippen und bei „Weitere Termine“ den Code eingeben.`
    : "";

  return (
    <>
      <PageHeader
        title="Vertrauliche Termine"
        description="Termine nur für Eingeweihte, z. B. Vorstand und Familie – ohne eigenes Benutzerkonto. Wer die PIN in der App eingibt, sieht sie zusätzlich, auch im Kalender-Abo."
      />
      <div className="space-y-5">
        <Section
          title="PIN"
          description={
            pin
              ? `${anzahl} ${anzahl === 1 ? "Termin ist" : "Termine sind"} vertraulich. Termin bearbeiten → Status → „Sichtbar für: Nur mit PIN“.`
              : "Noch keine PIN – vertrauliche Termine sieht im Moment nur die Verwaltung."
          }
        >
          {pin ? (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-active px-4 py-2 font-display text-[26px] font-bold tracking-[0.2em] tabular">
                <Lock className="size-5 text-accent-ink" />
                {pin}
              </span>
              <Kopieren text={pin} beschriftung="Kopieren" />
              <Button asChild variant="outline" size="sm">
                <a href={`https://wa.me/?text=${encodeURIComponent(nachricht)}`} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  Per WhatsApp teilen
                </a>
              </Button>
            </div>
          ) : null}
          <form onSubmit={aendern} className="flex flex-wrap items-end gap-2">
            <Field label={pin ? "Neue PIN" : "PIN festlegen"} hint="4 bis 8 Ziffern" className="w-[12rem]">
              <Input
                value={neu}
                onChange={(e) => setNeu(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="z. B. 2027"
                disabled={!speicherbar}
                className="tabular tracking-[0.15em]"
              />
            </Field>
            <Button type="button" variant="ghost" onClick={() => setNeu(zufallsPin())} disabled={!speicherbar}>
              <Dices />
              Vorschlag
            </Button>
            <Button type="submit" variant="primary" loading={laeuft} disabled={!speicherbar || neu.length < 4}>
              {pin ? "PIN ändern" : "PIN speichern"}
            </Button>
            {pin ? (
              <Button type="button" variant="ghost" className="ml-auto text-danger" onClick={() => void entfernen()} disabled={!speicherbar}>
                <Trash2 />
                PIN entfernen
              </Button>
            ) : null}
          </form>
        </Section>

        <Section title="So funktioniert’s">
          <ol className="list-decimal space-y-1.5 pl-5 text-[14px] text-muted">
            <li>Termin bearbeiten und unter „Status“ bei „Sichtbar für“ auf „Nur mit PIN“ stellen.</li>
            <li>PIN an Vorstand, Familie & Co. weitergeben (z. B. per WhatsApp).</li>
            <li>Die tippen in der App unten auf das Zahnrad (Einstellungen) und geben bei „Weitere Termine“ die PIN als Code ein.</li>
            <li>Ab dann sehen sie die vertraulichen Termine mit Schloss – in Liste, Monat und im Kalender-Abo.</li>
            <li>Neue PIN = alle sind wieder draußen (auch ihre vertraulichen Abos).</li>
          </ol>
        </Section>
      </div>
    </>
  );
}
