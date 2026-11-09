import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
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
  const a = await brauchtAdmin();
  return <AdminShell admin={{ id: a.id, name: a.name, email: a.email, role: a.role }}>{children}</AdminShell>;
}
