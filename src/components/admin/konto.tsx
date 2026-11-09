"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Fingerprint, KeyRound, LogOut, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { abmelden, andereSitzungenBeenden, eigenenNamenAendern, passkeyLoeschen, sitzungBeenden } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Badge } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/overlay";
import { PageHeader, Section } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { zeitpunkt } from "@/lib/protokoll-text";
import type { AdminInfo } from "./shell";

interface PasskeyInfo {
  id: string;
  name: string | null;
  createdAt: string | null;
  deviceType: string;
}
interface SitzungInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  updatedAt: string;
  aktuell: boolean;
}

/** Grobe Gerätebeschreibung aus dem User-Agent */
function geraet(ua: string | null): { text: string; mobil: boolean } {
  if (!ua) return { text: "Unbekanntes Gerät", mobil: false };
  const mobil = /iPhone|Android|Mobile/i.test(ua);
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return { text: [browser, os].filter(Boolean).join(" auf "), mobil };
}

export function KontoSeite({
  admin,
  willkommen,
  passkeys,
  sitzungen,
}: {
  admin: AdminInfo;
  willkommen: boolean;
  passkeys: PasskeyInfo[];
  sitzungen: SitzungInfo[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [name, setName] = useState(admin.name);
  const [pw, setPw] = useState({ alt: "", neu: "", neu2: "" });
  const [laeuftName, starteName] = useTransition();
  const [laeuftPw, startePw] = useTransition();
  const [laeuftPk, setLaeuftPk] = useState(false);

  const nameSpeichern = (e: React.FormEvent) => {
    e.preventDefault();
    starteName(async () => {
      const r = await eigenenNamenAendern(name);
      if (!r.ok) return void toast.error(r.fehler);
      toast.success("Name gespeichert");
      router.refresh();
    });
  };

  const passwortAendern = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.neu !== pw.neu2) return void toast.error("Die neuen Passwörter stimmen nicht überein.");
    if (pw.neu.length < 10) return void toast.error("Das neue Passwort muss mindestens 10 Zeichen haben.");
    startePw(async () => {
      const r = await authClient.changePassword({ currentPassword: pw.alt, newPassword: pw.neu, revokeOtherSessions: true });
      if (r.error) return void toast.error(r.error.status === 400 || r.error.status === 401 ? "Das aktuelle Passwort ist falsch." : "Passwort ändern hat nicht geklappt.");
      setPw({ alt: "", neu: "", neu2: "" });
      toast.success("Passwort geändert", { description: "Andere Geräte wurden abgemeldet." });
      router.refresh();
    });
  };

  const passkeyHinzufuegen = async () => {
    setLaeuftPk(true);
    const r = await authClient.passkey.addPasskey({ name: geraet(navigator.userAgent).text });
    setLaeuftPk(false);
    if (r?.error) {
      const code = "code" in r.error ? r.error.code : "";
      if (code !== "REGISTRATION_CANCELLED" && code !== "AUTH_CANCELLED") toast.error("Passkey konnte nicht angelegt werden.");
      return;
    }
    toast.success("Passkey angelegt", { description: "Ab jetzt geht die Anmeldung mit Face ID, Fingerabdruck oder PIN." });
    router.refresh();
  };

  const passkeyEntfernen = async (p: PasskeyInfo) => {
    if (!(await confirm({ title: "Passkey entfernen?", description: p.name ?? undefined, confirmLabel: "Entfernen", destructive: true }))) return;
    const r = await passkeyLoeschen(p.id);
    if (!r.ok) return void toast.error(r.fehler);
    toast.success("Passkey entfernt");
    router.refresh();
  };

  return (
    <>
      <PageHeader eyebrow={admin.role === "superadmin" ? "Super-Admin" : "Administrator"} title="Mein Konto" description={admin.email} />
      <div className="space-y-6">
        {willkommen ? (
          <Callout tone="tip" title="Eingerichtet!">
            Tipp: Lege gleich einen Passkey an – dann meldest du dich künftig mit Face ID oder Fingerabdruck an, ganz ohne Passwort.
          </Callout>
        ) : null}

        <Section title="Name">
          <form onSubmit={nameSpeichern} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Angezeigter Name" className="flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </Field>
            <Button type="submit" loading={laeuftName} disabled={name.trim() === admin.name}>
              Speichern
            </Button>
          </form>
        </Section>

        <Section
          title="Passkeys"
          description="Anmelden mit Face ID, Fingerabdruck oder Geräte-PIN – sicherer und schneller als ein Passwort."
          action={
            <Button variant="primary" onClick={passkeyHinzufuegen} loading={laeuftPk}>
              <Plus />
              Passkey hinzufügen
            </Button>
          }
        >
          {passkeys.length === 0 ? (
            <p className="flex items-center gap-2 text-[13.5px] text-subtle">
              <Fingerprint className="size-4" />
              Noch kein Passkey angelegt.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {passkeys.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Fingerprint className="size-[18px] text-subtle" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{p.name ?? "Passkey"}</span>
                    <span className="block text-[12.5px] text-subtle">
                      {p.deviceType === "multiDevice" ? "Synchronisiert" : "Nur dieses Gerät"}
                      {p.createdAt ? ` · angelegt ${zeitpunkt(p.createdAt)}` : ""}
                    </span>
                  </span>
                  <Button variant="danger-ghost" size="icon-sm" aria-label="Passkey entfernen" onClick={() => void passkeyEntfernen(p)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Passwort ändern" description="Danach werden alle anderen Geräte abgemeldet.">
          <form onSubmit={passwortAendern} className="grid gap-4 sm:grid-cols-2">
            <Field label="Aktuelles Passwort" className="sm:col-span-2">
              <Input type="password" required autoComplete="current-password" value={pw.alt} onChange={(e) => setPw({ ...pw, alt: e.target.value })} />
            </Field>
            <Field label="Neues Passwort" hint="Mindestens 10 Zeichen.">
              <Input type="password" required minLength={10} autoComplete="new-password" value={pw.neu} onChange={(e) => setPw({ ...pw, neu: e.target.value })} />
            </Field>
            <Field label="Neues Passwort wiederholen">
              <Input type="password" required minLength={10} autoComplete="new-password" value={pw.neu2} onChange={(e) => setPw({ ...pw, neu2: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={laeuftPw}>
                <KeyRound />
                Passwort ändern
              </Button>
            </div>
          </form>
        </Section>

        <Section
          title="Angemeldete Geräte"
          action={
            sitzungen.length > 1 ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  const r = await andereSitzungenBeenden();
                  if (!r.ok) return void toast.error(r.fehler);
                  toast.success("Andere Geräte abgemeldet");
                  router.refresh();
                }}
              >
                Alle anderen abmelden
              </Button>
            ) : null
          }
        >
          <ul className="divide-y divide-line">
            {sitzungen.map((s) => {
              const g = geraet(s.userAgent);
              const Icon = g.mobil ? Smartphone : Monitor;
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <Icon className="size-[18px] text-subtle" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[14px] font-medium">
                      {g.text}
                      {s.aktuell ? <Badge tone="success">Dieses Gerät</Badge> : null}
                    </span>
                    <span className="block text-[12.5px] text-subtle">
                      zuletzt aktiv {zeitpunkt(s.updatedAt)}
                      {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                    </span>
                  </span>
                  {s.aktuell ? (
                    <Button variant="ghost" size="sm" onClick={() => void abmelden()}>
                      <LogOut />
                      Abmelden
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const r = await sitzungBeenden(s.id);
                        if (!r.ok) return void toast.error(r.fehler);
                        router.refresh();
                      }}
                    >
                      Abmelden
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </>
  );
}
