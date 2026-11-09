import { Suspense } from "react";
import { TerminDetail } from "@/components/termin-detail";
import { TerminSkelett } from "@/components/termin-skelett";

export default function TerminSeite({ params }: PageProps<"/termin/[id]">) {
  return (
    <Suspense fallback={<TerminSkelett />}>
      <TerminDetail params={params} />
    </Suspense>
  );
}
