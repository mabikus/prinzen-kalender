ALTER TABLE "einstellungen" ADD COLUMN "pin" text;--> statement-breakpoint
ALTER TABLE "termine" ADD COLUMN "vertraulich" boolean DEFAULT false NOT NULL;