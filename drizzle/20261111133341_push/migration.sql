CREATE TABLE "push_abos" (
	"endpoint" text PRIMARY KEY,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"pin_schluessel" text,
	"erstellt_am" timestamp with time zone DEFAULT now() NOT NULL,
	"zuletzt_zugestellt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "einstellungen" ADD COLUMN "vapid_oeffentlich" text;--> statement-breakpoint
ALTER TABLE "einstellungen" ADD COLUMN "vapid_privat" text;--> statement-breakpoint
-- Wie alle anderen Tabellen: für die öffentliche Supabase-Schnittstelle gesperrt (die App greift als Eigentümer zu).
-- einstellungen fehlte bisher – dort liegen PIN und Push-Schlüssel.
ALTER TABLE "einstellungen" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "push_abos" ENABLE ROW LEVEL SECURITY;
