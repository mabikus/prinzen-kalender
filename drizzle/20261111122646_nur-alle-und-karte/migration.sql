-- „Jeder Verfügbare“ und „Voranmeldung“ entfallen (Wunsch des Auftraggebers, 11.11.2026)
ALTER TABLE "termine" ALTER COLUMN "anmeldung" SET DATA TYPE text;--> statement-breakpoint
-- Nur noch „Karte“: bisherige Voranmeldungen gelten als Karte (Bedarf und Bestellt bleiben erhalten)
UPDATE "termine" SET "anmeldung" = 'eintrittskarte' WHERE "anmeldung" = 'voranmeldung';--> statement-breakpoint
DROP TYPE "termin_anmeldung";--> statement-breakpoint
CREATE TYPE "termin_anmeldung" AS ENUM('eintrittskarte');--> statement-breakpoint
ALTER TABLE "termine" ALTER COLUMN "anmeldung" SET DATA TYPE "termin_anmeldung" USING "anmeldung"::"termin_anmeldung";--> statement-breakpoint
ALTER TABLE "termine" ALTER COLUMN "umfang" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "termine" ALTER COLUMN "umfang" DROP DEFAULT;--> statement-breakpoint
-- Nur noch „Alle“ oder „Auswahl“: „Jeder Verfügbare“ wird zu „Alle“
UPDATE "termine" SET "umfang" = 'alle' WHERE "umfang" = 'jeder_verfuegbare';--> statement-breakpoint
DROP TYPE "termin_umfang";--> statement-breakpoint
CREATE TYPE "termin_umfang" AS ENUM('auswahl', 'alle');--> statement-breakpoint
ALTER TABLE "termine" ALTER COLUMN "umfang" SET DATA TYPE "termin_umfang" USING "umfang"::"termin_umfang";--> statement-breakpoint
ALTER TABLE "termine" ALTER COLUMN "umfang" SET DEFAULT 'auswahl'::"termin_umfang";