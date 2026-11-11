import { redirect } from "next/navigation";

// Alte Bearbeiten-Adresse (Links aus Ansicht, Suche, Lesezeichen): öffnet jetzt den Termin-Drawer in der Liste
export default async function Seite({ params, searchParams }: PageProps<"/verwaltung/termine/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (id === "neu") {
    const datum = typeof sp.datum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.datum) ? `&datum=${sp.datum}` : "";
    redirect(`/verwaltung/termine?neu=1${datum}`);
  }
  redirect(`/verwaltung/termine?t=${encodeURIComponent(decodeURIComponent(id))}`);
}
