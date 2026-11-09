CREATE TYPE "gruppen_farbe" AS ENUM('rot', 'orange', 'gelb', 'gruen', 'tuerkis', 'blau', 'lila', 'pink', 'grau');--> statement-breakpoint
CREATE TYPE "termin_anmeldung" AS ENUM('eintrittskarte', 'voranmeldung');--> statement-breakpoint
CREATE TYPE "termin_art" AS ENUM('intern', 'extern');--> statement-breakpoint
CREATE TYPE "termin_status" AS ENUM('bestaetigt', 'vorbehalt');--> statement-breakpoint
CREATE TYPE "termin_umfang" AS ENUM('auswahl', 'alle', 'jeder_verfuegbare');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "einladungen" (
	"id" text PRIMARY KEY,
	"zweck" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"benutzer_id" text,
	"erstellt_von" text,
	"erstellt_am" timestamp with time zone DEFAULT now() NOT NULL,
	"laeuft_ab" timestamp with time zone NOT NULL,
	"eingeloest_am" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "gruppen" (
	"id" text PRIMARY KEY,
	"kuerzel" text NOT NULL,
	"name" text NOT NULL,
	"beschreibung" text,
	"personen" integer,
	"farbe" "gruppen_farbe" DEFAULT 'grau'::"gruppen_farbe" NOT NULL,
	"in_alle" boolean DEFAULT true NOT NULL,
	"sortierung" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protokoll" (
	"id" serial PRIMARY KEY,
	"zeitpunkt" timestamp with time zone DEFAULT now() NOT NULL,
	"benutzer_id" text,
	"benutzer_name" text,
	"aktion" text NOT NULL,
	"objekt_id" text,
	"titel" text,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY,
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL UNIQUE,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "termin_gruppen" (
	"termin_id" text,
	"gruppe_id" text,
	CONSTRAINT "termin_gruppen_pkey" PRIMARY KEY("termin_id","gruppe_id")
);
--> statement-breakpoint
CREATE TABLE "termine" (
	"id" text PRIMARY KEY,
	"datum" date NOT NULL,
	"treffzeit" time,
	"treffpunkt" text,
	"beginn" time,
	"ort" text,
	"ende" time,
	"anschluss_an" text,
	"titel" text NOT NULL,
	"tagesprogramm" text,
	"veranstalter" text,
	"art" "termin_art" DEFAULT 'extern'::"termin_art" NOT NULL,
	"status" "termin_status" DEFAULT 'bestaetigt'::"termin_status" NOT NULL,
	"umfang" "termin_umfang" DEFAULT 'auswahl'::"termin_umfang" NOT NULL,
	"anmeldung" "termin_anmeldung",
	"karten_bestellt" integer,
	"hinweis" text,
	"bemerkung" text,
	"quelle" text[] DEFAULT '{}'::text[] NOT NULL,
	"pruefen" text,
	"erstellt_am" timestamp with time zone DEFAULT now() NOT NULL,
	"geaendert_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_user_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "protokoll_zeitpunkt_idx" ON "protokoll" ("zeitpunkt");--> statement-breakpoint
CREATE INDEX "protokoll_objekt_idx" ON "protokoll" ("objekt_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "termine_datum_idx" ON "termine" ("datum");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "termin_gruppen" ADD CONSTRAINT "termin_gruppen_termin_id_termine_id_fkey" FOREIGN KEY ("termin_id") REFERENCES "termine"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "termin_gruppen" ADD CONSTRAINT "termin_gruppen_gruppe_id_gruppen_id_fkey" FOREIGN KEY ("gruppe_id") REFERENCES "gruppen"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "termine" ADD CONSTRAINT "termine_anschluss_an_termine_id_fkey" FOREIGN KEY ("anschluss_an") REFERENCES "termine"("id") ON DELETE SET NULL;