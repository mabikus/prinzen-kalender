CREATE TABLE "einstellungen" (
	"id" text PRIMARY KEY,
	"app_name" text NOT NULL,
	"untertitel" text NOT NULL,
	"logo" bytea,
	"logo_klein" bytea,
	"logo_stand" integer DEFAULT 0 NOT NULL,
	"geaendert_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Wie alle Tabellen: nur über den Server erreichbar, nicht über die öffentliche Supabase-API
ALTER TABLE "einstellungen" ENABLE ROW LEVEL SECURITY;
