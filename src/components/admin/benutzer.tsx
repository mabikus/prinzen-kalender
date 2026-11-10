"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CircleCheck, Crown, KeyRound, Mail, MessageCircle, MoreHorizontal, Trash2, UserPlus, X } from "lucide-react";
import {
  benutzerAktivSetzen,
  benutzerEinladen,
  benutzerLoeschen,
  einladungLoeschen,
  passwortLink,
} from "@/app/verwaltung/aktionen";
import { Kopieren } from "@/components/kopieren";
import { Button } from "@/components/ui/button";
import { DatenTabelle } from "@/components/ui/daten-tabelle";
import { Badge, Initials, StatusDot } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Dialog, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, useConfirm } from "@/components/ui/overlay";
import { PageHeader, Section } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import type { BenutzerZeile } from "@/lib/benutzer";
import { zeitpunkt } from "@/lib/protokoll-text";

interface EinladungInfo {
  id: string;
  email: string;
  name: string | null;
  laeuftAb: string;
}

type LinkDialog = { titel: string; text: string; link: string; email: string } | null;

export function BenutzerVerwaltung({
  ich,
  benutzer,
  einladungen,
  appName: APP_NAME,
}: {
  ich: { id: string; role: "superadmin" | "admin" };
  appName: string;
  benutzer: BenutzerZeile[];
  einladungen: EinladungInfo[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [einladen, setEinladen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "" });
  const [link, setLink] = useState<LinkDialog>(null);
  const [laeuft, starte] = useTransition();

  const einladungSenden = (e: React.FormEvent) => {
    e.preventDefault();
    starte(async () => {
      const r = await benutzerEinladen(form.email, form.name);
      if (!r.ok) return void toast.error(r.fehler);
      setEinladen(false);
      setLink({
        titel: "Einladung erstellt",
        text: `Schick ${form.name || form.email} diesen Link. Damit wird das Passwort festgelegt. Gültig 7 Tage, nur einmal nutzbar.`,
        link: r.daten,
        email: form.email,
      });
      setForm({ email: "", name: "" });
      router.refresh();
    });
  };

  const pwLink = async (b: BenutzerZeile) => {
    const r = await passwortLink(b.id);
    if (!r.ok) return void toast.error(r.fehler);
    setLink({
      titel: "Passwort-Link erstellt",
      text: `Mit diesem Link kann ${b.name} ein neues Passwort festlegen. Gültig 48 Stunden, nur einmal nutzbar.`,
      link: r.daten,
      email: b.email,
    });
  };

  const aktiv = async (b: BenutzerZeile, wert: boolean) => {
    if (!wert && !(await confirm({ title: `${b.name} deaktivieren?`, description: "Das Konto wird sofort abgemeldet und kann sich nicht mehr anmelden.", confirmLabel: "Deaktivieren", destructive: true })))
      return;
    const r = await benutzerAktivSetzen(b.id, wert);
    if (!r.ok) return void toast.error(r.fehler);
    toast.success(wert ? "Konto aktiviert" : "Konto deaktiviert");
    router.refresh();
  };

  const loeschen = async (b: BenutzerZeile) => {
    if (!(await confirm({ title: `${b.name} löschen?`, description: "Das Konto wird endgültig gelöscht. Das Protokoll bleibt erhalten.", confirmLabel: "Endgültig löschen", destructive: true, typeToConfirm: "LÖSCHEN" })))
      return;
    const r = await benutzerLoeschen(b.id);
    if (!r.ok) return void toast.error(r.fehler);
    toast.success("Konto gelöscht");
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Benutzer"
        description="Alle Benutzer sind Administratoren und dürfen alles pflegen. Der Super-Admin kann nicht gelöscht werden."
        actions={
          <Button variant="primary" onClick={() => setEinladen(true)}>
            <UserPlus />
            Administrator einladen
          </Button>
        }
      />
      <div className="space-y-6">
        <DatenTabelle
          zeilen={benutzer}
          schluessel={(b) => b.id}
          spalten={[
            {
              id: "name",
              titel: "Name",
              breite: "24%",
              sortWert: (b) => b.name,
              zelle: (b) => (
                <span className="flex min-w-0 items-center gap-2.5">
                  <Initials name={b.name} color={b.banned ? "var(--subtle)" : "var(--accent)"} size={26} />
                  <span className="min-w-0 truncate font-medium">{b.name}</span>
                  {b.id === ich.id ? <Badge>Du</Badge> : null}
                </span>
              ),
            },
            { id: "email", titel: "E-Mail", sortWert: (b) => b.email, titelText: (b) => b.email, zelle: (b) => <span className="text-muted">{b.email}</span> },
            {
              id: "rolle",
              titel: "Rolle",
              breite: "150px",
              sortWert: (b) => (b.role === "superadmin" ? 0 : 1),
              zelle: (b) =>
                b.role === "superadmin" ? (
                  <Badge tone="accent">
                    <Crown className="size-3" />
                    Super-Admin
                  </Badge>
                ) : (
                  <span className="text-muted">Administrator</span>
                ),
            },
            {
              id: "status",
              titel: "Status",
              breite: "130px",
              sortWert: (b) => (b.banned ? 1 : 0),
              zelle: (b) => (b.banned ? <StatusDot tone="danger">Deaktiviert</StatusDot> : <StatusDot tone="success">Aktiv</StatusDot>),
            },
            { id: "passkeys", titel: "Passkeys", breite: "112px", rechts: true, sortWert: (b) => b.passkeys, zelle: (b) => <span className="text-muted">{b.passkeys || "–"}</span> },
            {
              id: "zuletzt",
              titel: "Zuletzt aktiv",
              breite: "170px",
              sortWert: (b) => b.zuletztAktiv,
              zelle: (b) => <span className="text-muted tabular">{b.zuletztAktiv ? zeitpunkt(b.zuletztAktiv) : "–"}</span>,
            },
          ]}
          pillen={[
            { wert: "alle", titel: "Alle", passt: () => true },
            { wert: "aktiv", titel: "Aktiv", passt: (b) => !b.banned },
            { wert: "aus", titel: "Deaktiviert", passt: (b) => b.banned },
          ]}
          suchtext={(b) => `${b.name} ${b.email}`}
          suchPlatzhalter="Name oder E-Mail …"
          aktionen={(b) => (
            <BenutzerMenue
              b={b}
              pwErlaubt={b.role !== "superadmin" || ich.role === "superadmin"}
              geschuetzt={b.role === "superadmin" || b.id === ich.id}
              pwLink={pwLink}
              aktiv={aktiv}
              loeschen={loeschen}
            />
          )}
          karte={(b) => (
            <span className="flex items-center gap-3">
              <Initials name={b.name} color={b.banned ? "var(--subtle)" : "var(--accent)"} size={34} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-[14px] font-medium">
                  {b.name}
                  {b.role === "superadmin" ? (
                    <Badge tone="accent">
                      <Crown className="size-3" />
                      Super-Admin
                    </Badge>
                  ) : null}
                  {b.id === ich.id ? <Badge>Du</Badge> : null}
                  {b.banned ? <Badge tone="danger">Deaktiviert</Badge> : null}
                </span>
                <span className="block truncate text-[12.5px] text-subtle">
                  {b.email}
                  {b.passkeys ? ` · ${b.passkeys} Passkey${b.passkeys > 1 ? "s" : ""}` : ""}
                  {b.zuletztAktiv ? ` · zuletzt aktiv ${zeitpunkt(b.zuletztAktiv)}` : ""}
                </span>
              </span>
            </span>
          )}
        />

        {einladungen.length ? (
          <Section title="Offene Einladungen">
            <ul className="divide-y divide-line">
              {einladungen.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <Mail className="size-4 text-subtle" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">{e.name ? `${e.name} · ${e.email}` : e.email}</span>
                    <span className="block text-[12.5px] text-subtle">gültig bis {zeitpunkt(e.laeuftAb)}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const r = await einladungLoeschen(e.id);
                      if (!r.ok) return void toast.error(r.fehler);
                      toast.success("Einladung zurückgezogen");
                      router.refresh();
                    }}
                  >
                    <X />
                    Zurückziehen
                  </Button>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <Dialog
        open={einladen}
        onOpenChange={setEinladen}
        title="Administrator einladen"
        description="Es wird ein Link erstellt, den du per WhatsApp oder E-Mail weitergibst."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEinladen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" form="einladen-formular" variant="primary" loading={laeuft}>
              Link erstellen
            </Button>
          </>
        }
      >
        <form id="einladen-formular" onSubmit={einladungSenden} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="E-Mail" required hint="Damit meldet sich die Person später an.">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </form>
      </Dialog>

      <Dialog open={!!link} onOpenChange={(o) => !o && setLink(null)} title={link?.titel ?? ""} description={link?.text}>
        {link ? (
          <div className="space-y-4">
            <Input readOnly value={link.link} onFocus={(e) => e.target.select()} className="font-mono text-[12.5px]" />
            <div className="flex flex-wrap gap-2">
              <Kopieren text={link.link} />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${APP_NAME} – dein Link: ${link.link}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-panel px-3 py-1.5 text-sm font-medium text-tinte ring-1 ring-inset ring-linie hover:text-marke-700 hover:ring-marke-300"
              >
                <MessageCircle className="size-4" strokeWidth={1.75} />
                WhatsApp
              </a>
              <a
                href={`mailto:${link.email}?subject=${encodeURIComponent(APP_NAME)}&body=${encodeURIComponent(`Hallo,\n\nhier ist dein Link für den ${APP_NAME}:\n${link.link}\n`)}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-panel px-3 py-1.5 text-sm font-medium text-tinte ring-1 ring-inset ring-linie hover:text-marke-700 hover:ring-marke-300"
              >
                <Mail className="size-4" strokeWidth={1.75} />
                E-Mail
              </a>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function BenutzerMenue({
  b,
  pwErlaubt,
  geschuetzt,
  pwLink,
  aktiv,
  loeschen,
}: {
  b: BenutzerZeile;
  pwErlaubt: boolean;
  geschuetzt: boolean;
  pwLink: (b: BenutzerZeile) => Promise<void>;
  aktiv: (b: BenutzerZeile, wert: boolean) => Promise<void>;
  loeschen: (b: BenutzerZeile) => Promise<void>;
}) {
  if (!pwErlaubt && geschuetzt) return null;
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aktionen für ${b.name}`}>
          <MoreHorizontal />
        </Button>
      </MenuTrigger>
      <MenuContent>
        {pwErlaubt ? (
          <MenuItem onSelect={() => void pwLink(b)}>
            <KeyRound />
            Passwort-Link erstellen
          </MenuItem>
        ) : null}
        {!geschuetzt ? (
          <>
            {b.banned ? (
              <MenuItem onSelect={() => void aktiv(b, true)}>
                <CircleCheck />
                Aktivieren
              </MenuItem>
            ) : (
              <MenuItem onSelect={() => void aktiv(b, false)}>
                <Ban />
                Deaktivieren
              </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem destructive onSelect={() => void loeschen(b)}>
              <Trash2 />
              Löschen
            </MenuItem>
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}
