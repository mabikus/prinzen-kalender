"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { gruppeLoeschen, gruppeSpeichern } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Dialog, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useConfirm } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import type { Gruppe } from "@/lib/types";

type Entwurf = Omit<Gruppe, "id"> & { id?: string };

const NEU: Entwurf = { kuerzel: "", name: "", beschreibung: null, personen: null, farbe: "grau", in_alle: true, sortierung: NaN };

export function GruppenVerwaltung({ gruppen, anzahl }: { gruppen: Gruppe[]; anzahl: Record<string, number> }) {
  const [entwurf, setEntwurf] = useState<Entwurf | null>(null);
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
        description="Wer ist bei einem Termin dabei? Die Personenzahl wird für die Eintrittskarten zusammengerechnet."
        actions={
          <Button variant="primary" onClick={() => setEntwurf({ ...NEU })}>
            <Plus />
            Neue Gruppe
          </Button>
        }
      />
      {gruppen.length === 0 ? (
        <EmptyState icon={<Users />} title="Noch keine Gruppen" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
          {gruppen.map((g) => (
            <li key={g.id} className="flex items-center gap-4 px-4 py-3">
              <span className="grid h-8 min-w-10 place-items-center rounded-[var(--radius-control)] bg-accent px-2 text-[12px] font-bold text-accent-fg">
                {g.kuerzel}
              </span>
              <button type="button" onClick={() => setEntwurf({ ...g })} className="min-w-0 flex-1 text-left">
                <span className="block text-[14px] font-medium text-ink">{g.name}</span>
                <span className="block truncate text-[12.5px] text-subtle">
                  {[g.beschreibung, g.in_alle ? null : "zählt nicht zu „Alle“", `${anzahl[g.id] ?? 0} Termine`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
              <span className={g.personen == null ? "text-[13px] text-accent-ink" : "text-[13px] text-subtle tabular"}>
                {g.personen == null ? "Anzahl fehlt" : `${g.personen} Pers.`}
              </span>
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Aktionen">
                    <MoreHorizontal />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onSelect={() => setEntwurf({ ...g })}>
                    <Pencil />
                    Bearbeiten
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem destructive onSelect={() => void loeschen(g)}>
                    <Trash2 />
                    Löschen
                  </MenuItem>
                </MenuContent>
              </Menu>
            </li>
          ))}
          <li className="flex justify-between bg-bg px-4 py-2.5 text-[13px] text-subtle">
            <span>„Alle“ zusammen</span>
            <span className="tabular">{gesamt} Personen</span>
          </li>
        </ul>
      )}

      <Dialog
        open={!!entwurf}
        onOpenChange={(o) => !o && setEntwurf(null)}
        title={entwurf?.id ? "Gruppe bearbeiten" : "Neue Gruppe"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEntwurf(null)}>
              Abbrechen
            </Button>
            <Button type="submit" form="gruppe-formular" variant="primary" loading={laeuft}>
              Speichern
            </Button>
          </>
        }
      >
        {entwurf ? (
          <form id="gruppe-formular" onSubmit={speichern} className="space-y-4">
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
              <Field label="Personen" hint="Für die Kartenberechnung">
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={entwurf.personen ?? ""}
                  onChange={(e) => setEntwurf({ ...entwurf, personen: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </Field>
              <Field label="Reihenfolge">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(entwurf.sortierung) ? "" : entwurf.sortierung}
                  onChange={(e) => setEntwurf({ ...entwurf, sortierung: e.target.value === "" ? NaN : Number(e.target.value) })}
                />
              </Field>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] bg-bg px-3 py-2.5 text-[13.5px]">
              <span>
                Gehört zu „Alle“ / „Jeder Verfügbare“
                <span className="block text-[12.5px] text-subtle">Familie z. B. nicht – die wird extra angekreuzt.</span>
              </span>
              <Switch checked={entwurf.in_alle} onCheckedChange={(v) => setEntwurf({ ...entwurf, in_alle: v })} />
            </label>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
