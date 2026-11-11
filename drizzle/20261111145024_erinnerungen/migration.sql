CREATE TABLE "push_erinnerungen" (
	"endpoint" text,
	"termin_id" text,
	"start" timestamp with time zone,
	"gesendet_am" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_erinnerungen_pkey" PRIMARY KEY("endpoint","termin_id","start")
);
--> statement-breakpoint
ALTER TABLE "push_abos" ADD COLUMN "aenderungen" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "push_abos" ADD COLUMN "erinnerung_minuten" integer;--> statement-breakpoint
ALTER TABLE "push_erinnerungen" ADD CONSTRAINT "push_erinnerungen_endpoint_push_abos_endpoint_fkey" FOREIGN KEY ("endpoint") REFERENCES "push_abos"("endpoint") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "push_erinnerungen" ENABLE ROW LEVEL SECURITY;
