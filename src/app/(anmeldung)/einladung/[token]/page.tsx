import { Suspense } from "react";
import { connection } from "next/server";
import { Callout } from "@/components/ui/callout";
import { hatDatenbank } from "@/db";
import { ladeEinladung } from "@/lib/benutzer";
import { EinladungsFormular } from "../../formulare";

export const metadata = { title: "Einladung" };

export default function Seite({ params }: PageProps<"/einladung/[token]">) {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">Lade …</p>}>
      <Einladung params={params} />
    </Suspense>
  );
}

async function Einladung({ params }: Pick<PageProps<"/einladung/[token]">, "params">) {
  const { token } = await params;
  await connection();
  const e = hatDatenbank() ? await ladeEinladung(token) : null;
  if (!e)
    return (
      <Callout tone="danger" title="Link ungültig">
        Dieser Link ist abgelaufen oder wurde schon verwendet. Bitte einen Administrator um einen neuen.
      </Callout>
    );
  return <EinladungsFormular token={token} zweck={e.zweck} email={e.email} name={e.name} />;
}
