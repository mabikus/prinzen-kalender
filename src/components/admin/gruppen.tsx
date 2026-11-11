"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { gruppeLoeschen, gruppeSpeichern } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { DatenTabelle } from "@/components/ui/daten-tabelle";
import { FormularDrawer } from "@/components/ui/formular-drawer";
import { Badge } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useConfirm } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import type { Gruppe } from "@/lib/types";

type Entwurf = Omit<Gruppe, "id"> & { id?: string };

const NEU: Entwurf = { kuerzel: "", name: "", beschreibung: null, personen: null, farbe: "grau", in_alle: true, sortierung: NaN };

export function GruppenVerwaltung({ gruppen, anzahl }: { gruppen: Gruppe[]; anzahl: Record<string, number> }) {
  const [entwurf, setEntwurfRoh] = useState<Entwurf | null>(null);
  const [geaendert, setGeaendert] = useState(false);
  // Öffnen/Schließen setzt „geändert“ zurück, Tippen setzt es (onChange am Formular)
  const setEntwurf = (e: Entwurf | null) => {
    if (!e || e.id !== entwurf?.id || !entwurf) setGeaendert(false);
    setEntwurfRoh(e);
  };
  const [laeuft, starte] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();
  const gesamt = gruppen.filter((g) => g.in_alle).reduce((s, g) => s + (g.personen ?? 0), 0);

  const speichern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entwurf) return;
    starte(async () => {
      const r = await gruppeSpeichern(entwurf);
      if (!r.ok) return void toast.error(r.fehler);
      toast.success(entwurf.id ? "Gruppe gespeichert" : "Gruppe angelegt");
      setEntwurf(null);
      router.refresh();
    });
  };

  const loeschen = async (g: Gruppe) => {
    const ok = await confirm({
      title: `Gruppe „${g.name}“ löschen?`,
      description: "Sie wird bei allen Terminen entfernt. Das Kalender-Abo dieser Gruppe funktioniert dann nicht mehr.",
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!ok) return;
    const r = await gruppeLoeschen(g.id);
    if (!r.ok) return void toast.error(r.fehler);
    toast.success("Gruppe gelöscht");
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Gruppen"
        description={`Wer ist bei einem Termin dabei? Die Personenzahl wird für die Eintrittskarten zusammengerechnet – „Alle“ zusammen: ${gesamt} Personen.`}
        actions={
          <Button variant="primary" onClick={() => setEntwurf({ ...NEU })}>
            <Plus />
            Neue Gruppe
          </Button>
        }
      />
      <DatenTabelle
        zeilen={gruppen}
        schluessel={(g) => g.id}
        spalten={[
          { id: "kuerzel", titel: "Kürzel", breite: "92px", sortWert: (g) => g.kuerzel, zelle: (g) => <Kuerzel g={g} /> },
          { id: "name", titel: "Name", breite: "20%", sortWert: (g) => g.name, zelle: (g) => <span className="font-medium">{g.name}</span> },
          {
            id: "beschreibung",
            titel: "Beschreibung",
            sortWert: (g) => g.beschreibung,
            titelText: (g) => g.beschreibung ?? undefined,
            zelle: (g) => (g.beschreibung ? <span className="text-muted">{g.beschreibung}</span> : <span className="text-subtle/60">–</span>),
          },
          {
            id: "personen",
            titel: "Personen",
            breite: "112px",
            rechts: true,
            sortWert: (g) => g.personen,
            zelle: (g) => (g.personen == null ? <span className="text-accent-ink">fehlt</span> : g.personen),
          },
          {
            id: "alle",
            titel: "In „Alle“",
            breite: "104px",
            sortWert: (g) => (g.in_alle ? 1 : 0),
            zelle: (g) => (g.in_alle ? <span className="text-muted">ja</span> : <Badge>nein</Badge>),
          },
          { id: "termine", titel: "Termine", breite: "104px", rechts: true, sortWert: (g) => anzahl[g.id] ?? 0, zelle: (g) => <span className="text-muted">{anzahl[g.id] ?? 0}</span> },
          { id: "sortierung", titel: "Reihenf.", breite: "104px", rechts: true, sortWert: (g) => g.sortierung, zelle: (g) => <span className="text-subtle">{g.sortierung}</span> },
        ]}
        pillen={[
          { wert: "alle", titel: "Alle", passt: () => true },
          { wert: "in-alle", titel: "In „Alle“", passt: (g) => g.in_alle },
          { wert: "extra", titel: "Extra", passt: (g) => !g.in_alle },
          { wert: "fehlt", titel: "Anzahl fehlt", passt: (g) => g.personen == null, hervorheben: true },
        ]}
        suchtext={(g) => [g.kuerzel, g.name, g.beschreibung].filter(Boolean).join(" ")}
        suchPlatzhalter="Kürzel, Name, Beschreibung …"
        sortStart={{ id: "sortierung", richtung: "asc" }}
        aufZeile={(g) => setEntwurf({ ...g })}
        aktionen={(g) => <GruppenMenue g={g} bearbeiten={() => setEntwurf({ ...g })} loeschen={() => void loeschen(g)} />}
        karte={(g) => (
          <span className="flex items-center gap-4">
            <Kuerzel g={g} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-ink">{g.name}</span>
              <span className="block truncate text-[12.5px] text-subtle">
                {[g.beschreibung, g.in_alle ? null : "zählt nicht zu „Alle“", `${anzahl[g.id] ?? 0} Termine`].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className={g.personen == null ? "text-[13px] text-accent-ink" : "text-[13px] text-subtle tabular"}>
              {g.personen == null ? "Anzahl fehlt" : `${g.personen} Pers.`}
            </span>
          </span>
        )}
        leerTitel="Noch keine Gruppen"
      />

      <FormularDrawer
        offen={!!entwurf}
        schliessen={() => setEntwurf(null)}
        geaendert={geaendert}
        breite={520}
        oben={entwurf?.id ? "Gruppe" : "Neue Gruppe"}
        titel={entwurf?.id ? entwurf.name || "Gruppe bearbeiten" : "Gruppe anlegen"}
        fuss={(abbrechen) => (
          <>
            <span className="flex-1" />
            <Button variant="ghost" onClick={abbrechen}>
              Abbrechen
            </Button>
            <Button type="submit" form="gruppe-formular" variant="primary" loading={laeuft}>
              {entwurf?.id ? "Speichern" : "Anlegen"}
            </Button>
          </>
        )}
      >
        {entwurf ? (
          <form id="gruppe-formular" onSubmit={speichern} onChange={() => setGeaendert(true)} className="space-y-4 rounded-[14px] bg-panel p-4 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <Field label="Kürzel">
                <Input value={entwurf.kuerzel} onChange={(e) => setEntwurf({ ...entwurf, kuerzel: e.target.value })} />
              </Field>
              <Field label="Name" required>
                <Input required autoFocus value={entwurf.name} onChange={(e) => setEntwurf({ ...entwurf, name: e.target.value })} />
              </Field>
            </div>
            <Field label="Beschreibung" hint="Wer gehört dazu?">
              <Input value={entwurf.beschreibung ?? ""} onChange={(e) => setEntwurf({ ...entwurf, beschreibung: e.target.value || null })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Personen" hint="Vorschlag für jeden Termin – dort änderbar">
                <Input
                  inputMode="numeric"
                  value={entwurf.personen ?? ""}
                  onChange={(e) => {
                    const z = e.target.value.replace(/\D/g, "").slice(0, 3);
                    setEntwurf({ ...entwurf, personen: z === "" ? null : Number(z) });
                  }}
                />
              </Field>
              <Field label="Reihenfolge" hint="Kleinere Zahl steht weiter oben">
                <Input
                  inputMode="numeric"
                  value={Number.isNaN(entwurf.sortierung) ? "" : entwurf.sortierung}
                  onChange={(e) => {
                    const z = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setEntwurf({ ...entwurf, sortierung: z === "" ? NaN : Number(z) });
                  }}
                />
              </Field>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] bg-bg px-3 py-2.5 text-[13.5px]">
              <span>
                Gehört zu „Alle“
                <span className="block text-[12.5px] text-subtle">Familie z. B. nicht – die wird extra angekreuzt.</span>
              </span>
              <Switch
                checked={entwurf.in_alle}
                onCheckedChange={(v) => {
                  setGeaendert(true);
                  setEntwurf({ ...entwurf, in_alle: v });
                }}
              />
            </label>
          </form>
        ) : null}
      </FormularDrawer>
    </>
  );
}

function Kuerzel({ g }: { g: Gruppe }) {
  return (
    <span className="inline-grid h-8 min-w-10 place-items-center rounded-[var(--radius-control)] bg-accent px-2 text-[12px] font-bold text-accent-fg">
      {g.kuerzel}
    </span>
  );
}

function GruppenMenue({ g, bearbeiten, loeschen }: { g: Gruppe; bearbeiten: () => void; loeschen: () => void }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aktionen für ${g.name}`}>
          <MoreHorizontal />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={bearbeiten}>
          <Pencil />
          Bearbeiten
        </MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={loeschen}>
          <Trash2 />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
