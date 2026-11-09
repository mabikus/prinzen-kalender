import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { ladeMarke } from "@/lib/marke-laden";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: { default: "Verwaltung", template: "%s · Verwaltung" } };

export default function VerwaltungLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-subtle">Lade Verwaltung …</div>}>
      <Rahmen>{children}</Rahmen>
    </Suspense>
  );
}

async function Rahmen({ children }: { children: React.ReactNode }) {
  const [a, marke] = await Promise.all([brauchtAdmin(), ladeMarke()]);
  return (
    <AdminShell admin={{ id: a.id, name: a.name, email: a.email, role: a.role }} marke={{ name: marke.name, logoStand: marke.logoStand }}>
      {children}
    </AdminShell>
  );
}
