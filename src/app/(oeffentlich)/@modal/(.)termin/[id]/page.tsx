import { Suspense } from "react";
import { BlattVonUnten } from "@/components/blatt-von-unten";
import { Punkte } from "@/components/ui/laden";
import { TerminDetail } from "@/components/termin-detail";

/** Termin angetippt in Liste oder Monat: als Blatt von unten, die Seite dahinter bleibt stehen. */
export default function TerminBlatt({ params }: PageProps<"/termin/[id]">) {
  return (
    <BlattVonUnten titel="Termin">
      <Suspense
        fallback={
          <div className="grid place-items-center py-16 text-grau">
            <Punkte />
          </div>
        }
      >
        <TerminDetail params={params} imBlatt />
      </Suspense>
    </BlattVonUnten>
  );
}
