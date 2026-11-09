import { Suspense } from "react";
import { BlattVonUnten } from "@/components/blatt-von-unten";
import { TerminSkelett } from "@/components/termin-skelett";
import { TerminDetail } from "@/components/termin-detail";

/** Termin angetippt in Liste oder Monat: als Blatt von unten, die Seite dahinter bleibt stehen. */
export default function TerminBlatt({ params }: PageProps<"/termin/[id]">) {
  return (
    <BlattVonUnten titel="Termin">
      <Suspense fallback={<TerminSkelett />}>
        <div className="animate-in fade-in-0 duration-200">
          <TerminDetail params={params} imBlatt />
        </div>
      </Suspense>
    </BlattVonUnten>
  );
}
