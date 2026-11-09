"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Mail, MessageCircle, Share } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { toast } from "@/components/ui/toast";

const KNOPF =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-semibold transition active:scale-[0.98]";

/** Kann der Browser das Teilen-Menü des Geräts öffnen (iPhone, Android)? */
function useTeilenMoeglich() {
  return useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

/**
 * Link teilen: Teilen-Menü des Geräts (WhatsApp, Nachrichten, AirDrop …), Kopieren, WhatsApp und E-Mail.
 * `text` ist der Begleittext, der Link wird angehängt.
 */
export function TeilenKnoepfe({
  url,
  titel,
  text,
  kompakt,
}: {
  url: string;
  titel: string;
  text: string;
  kompakt?: boolean;
}) {
  const [kopiert, setKopiert] = useState(false);
  const teilenMoeglich = useTeilenMoeglich();
  const nachricht = `${text}\n${url}`;

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setKopiert(true);
      toast.success("Link kopiert");
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      toast.error("Kopieren nicht möglich – bitte den Link lange antippen.");
    }
  };

  const teilen = async () => {
    try {
      await navigator.share({ title: titel, text, url });
    } catch {
      // abgebrochen
    }
  };

  return (
    <div className={cn("grid gap-2", kompakt ? "grid-cols-2 sm:flex sm:flex-wrap" : "grid-cols-2 sm:grid-cols-4")}>
      {teilenMoeglich ? (
        <button type="button" onClick={teilen} className={cn(KNOPF, "col-span-2 bg-accent text-accent-fg sm:col-span-1")}>
          <Share className="size-[18px]" />
          Teilen …
        </button>
      ) : null}
      <button type="button" onClick={kopieren} className={cn(KNOPF, "bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]")}>
        {kopiert ? <Check className="size-[18px] text-success" /> : <Copy className="size-[18px]" />}
        {kopiert ? "Kopiert" : "Kopieren"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(nachricht)}`}
        target="_blank"
        rel="noreferrer"
        className={cn(KNOPF, "bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]")}
      >
        <MessageCircle className="size-[18px]" />
        WhatsApp
      </a>
      {kompakt ? null : (
        <a
          href={`mailto:?subject=${encodeURIComponent(titel)}&body=${encodeURIComponent(nachricht)}`}
          className={cn(KNOPF, "bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]", !teilenMoeglich && "col-span-2 sm:col-span-1")}
        >
          <Mail className="size-[18px]" />
          E-Mail
        </a>
      )}
    </div>
  );
}
