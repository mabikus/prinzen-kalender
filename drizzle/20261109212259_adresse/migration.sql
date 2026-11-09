ALTER TABLE "termine" ADD COLUMN "strasse" text;--> statement-breakpoint
ALTER TABLE "termine" ADD COLUMN "plz" text;--> statement-breakpoint
ALTER TABLE "termine" ADD COLUMN "stadt" text;--> statement-breakpoint
-- „Häusje“ heißt jetzt „Hotel zum Stern“
UPDATE "termine" SET "treffpunkt" = 'Hotel zum Stern' WHERE "treffpunkt" = 'Häusje';--> statement-breakpoint
UPDATE "termine" SET "ort" = 'Hotel zum Stern' WHERE "ort" = 'Häusje';
