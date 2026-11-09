import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { KontoSeite } from "@/components/admin/konto";
import { Page } from "@/components/ui/page";
import { db, schema } from "@/db";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: "Mein Konto" };

export default function Seite({ searchParams }: PageProps<"/verwaltung/konto">) {
  return (
    <Page width="narrow">
      <Suspense fallback={<p className="text-sm text-subtle">Lade …</p>}>
        <Inhalt searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Inhalt({ searchParams }: Pick<PageProps<"/verwaltung/konto">, "searchParams">) {
  const a = await brauchtAdmin();
  const sp = await searchParams;
  const [passkeys, sitzungen] = await Promise.all([
    db().select().from(schema.passkey).where(eq(schema.passkey.userId, a.id)).orderBy(desc(schema.passkey.createdAt)),
    db().select().from(schema.session).where(eq(schema.session.userId, a.id)).orderBy(desc(schema.session.updatedAt)),
  ]);
  return (
    <KontoSeite
      admin={{ id: a.id, name: a.name, email: a.email, role: a.role }}
      willkommen={sp.willkommen === "1"}
      passkeys={passkeys.map((p) => ({ id: p.id, name: p.name, createdAt: p.createdAt?.toISOString() ?? null, deviceType: p.deviceType }))}
      sitzungen={sitzungen
        .filter((s) => s.expiresAt > new Date())
        .map((s) => ({
          id: s.id,
          userAgent: s.userAgent,
          ipAddress: s.ipAddress,
          updatedAt: s.updatedAt.toISOString(),
          aktuell: s.id === a.sessionId,
        }))}
    />
  );
}
