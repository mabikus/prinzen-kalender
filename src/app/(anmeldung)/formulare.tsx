"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { anmelden, einladungAnnehmen, einrichten, nachPasskeyAnmeldung, type Zustand } from "./aktionen";

const START: Zustand = {};

function Fehler({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <Callout tone="danger" className="mb-4">
      {text}
    </Callout>
  );
}

export function AnmeldeFormular({ weiter }: { weiter: string }) {
  const [zustand, aktion, laeuft] = useActionState(anmelden, START);
  const [passkeyFehler, setPasskeyFehler] = useState<string>();
  const [passkeyLaeuft, setPasskeyLaeuft] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const mitPasskey = async (autoFill = false) => {
    if (!autoFill) setPasskeyLaeuft(true);
    setPasskeyFehler(undefined);
    const r = await authClient.signIn.passkey({ autoFill });
    setPasskeyLaeuft(false);
    if (r?.error) {
      if (!autoFill) setPasskeyFehler("Anmeldung mit Passkey hat nicht geklappt.");
      return;
    }
    if (await nachPasskeyAnmeldung()) router.replace(weiter.startsWith("/") ? weiter : "/verwaltung");
  };

  // Passkey direkt im E-Mail-Feld anbieten (Browser-Autovervollständigung)
  useEffect(() => {
    if (typeof PublicKeyCredential !== "undefined" && PublicKeyCredential.isConditionalMediationAvailable) {
      void PublicKeyCredential.isConditionalMediationAvailable().then((ja) => ja && void mitPasskey(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Anmelden</h1>
        <p className="mt-1 text-sm text-subtle">Verwaltung für Administratoren.</p>
      </div>
      <Fehler text={zustand.fehler ?? passkeyFehler} />
      <Button variant="secondary" size="lg" className="w-full" loading={passkeyLaeuft} onClick={() => mitPasskey()}>
        <Fingerprint />
        Mit Passkey anmelden
      </Button>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
        <span className="h-px flex-1 bg-line" />
        oder
        <span className="h-px flex-1 bg-line" />
      </div>
      <form action={aktion} className="space-y-4">
        <input type="hidden" name="weiter" value={weiter} />
        <Field label="E-Mail">
          <Input
            name="email"
            type="email"
            required
            autoComplete="username webauthn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Passwort">
          <Input name="passwort" type="password" required autoComplete="current-password" />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={laeuft}>
          <KeyRound />
          Anmelden
        </Button>
      </form>
      <p className="text-xs text-subtle">
        Passwort vergessen? Ein anderer Administrator kann unter „Benutzer“ einen Link zum Zurücksetzen erstellen.
      </p>
    </div>
  );
}

function PasswortFelder() {
  return (
    <>
      <Field label="Passwort" hint="Mindestens 10 Zeichen.">
        <Input name="passwort" type="password" required minLength={10} autoComplete="new-password" />
      </Field>
      <Field label="Passwort wiederholen">
        <Input name="passwort2" type="password" required minLength={10} autoComplete="new-password" />
      </Field>
    </>
  );
}

export function EinrichtungsFormular({ email }: { email: string | null }) {
  const [zustand, aktion, laeuft] = useActionState(einrichten, START);
  return (
    <form action={aktion} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Einrichtung</h1>
        <p className="mt-1 text-sm text-subtle">
          Lege den <strong>Super-Admin</strong> an. Dieses Konto verwaltet alle anderen und kann nicht gelöscht werden.
        </p>
      </div>
      <Fehler text={zustand.fehler} />
      <Field label="Name">
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label="E-Mail" hint={email ? "Vorgegeben (SUPERADMIN_EMAIL)." : undefined}>
        <Input name="email" type="email" required autoComplete="username" defaultValue={email ?? ""} readOnly={!!email} />
      </Field>
      <PasswortFelder />
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={laeuft}>
        Super-Admin anlegen
      </Button>
    </form>
  );
}

export function EinladungsFormular({
  token,
  zweck,
  email,
  name,
}: {
  token: string;
  zweck: "einladung" | "passwort";
  email: string;
  name: string | null;
}) {
  const [zustand, aktion, laeuft] = useActionState(einladungAnnehmen, START);
  return (
    <form action={aktion} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {zweck === "einladung" ? "Willkommen" : "Neues Passwort"}
        </h1>
        <p className="mt-1 text-sm text-subtle">
          {zweck === "einladung"
            ? "Du wurdest als Administrator eingeladen. Lege dein Passwort fest."
            : "Lege ein neues Passwort fest. Alle bisherigen Anmeldungen werden beendet."}
        </p>
      </div>
      <Fehler text={zustand.fehler} />
      <Field label="E-Mail">
        <Input value={email} readOnly autoComplete="username" />
      </Field>
      {zweck === "einladung" && (
        <Field label="Name">
          <Input name="name" required defaultValue={name ?? ""} autoComplete="name" />
        </Field>
      )}
      <PasswortFelder />
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={laeuft}>
        {zweck === "einladung" ? "Konto anlegen" : "Passwort speichern"}
      </Button>
    </form>
  );
}
