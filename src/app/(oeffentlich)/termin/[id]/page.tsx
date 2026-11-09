import { Suspense } from "react";
import { TerminDetail } from "@/components/termin-detail";

export default function TerminSeite({ params }: PageProps<"/termin/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade Termin …</p>}>
      <TerminDetail params={params} />
    </Suspense>
  );
}
