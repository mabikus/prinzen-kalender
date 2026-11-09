-- Zugriff nur über den Server (eigene Datenbankverbindung). Über die öffentliche Supabase-API
-- (anon/authenticated) ist nichts lesbar: RLS an, keine Richtlinien.
ALTER TABLE "gruppen" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "termine" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "termin_gruppen" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "protokoll" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "einladungen" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "passkey" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Höchstens ein Super-Admin
CREATE UNIQUE INDEX "user_ein_superadmin" ON "user" ("role") WHERE "role" = 'superadmin';--> statement-breakpoint

-- Der Super-Admin kann weder gelöscht, noch herabgestuft, noch deaktiviert werden –
-- auch nicht durch einen Fehler in der App.
CREATE OR REPLACE FUNCTION "superadmin_schuetzen"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."role" = 'superadmin' THEN
      RAISE EXCEPTION 'Der Super-Admin kann nicht gelöscht werden.' USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD."role" = 'superadmin' AND (NEW."role" <> 'superadmin' OR NEW."banned") THEN
    RAISE EXCEPTION 'Der Super-Admin kann nicht herabgestuft oder deaktiviert werden.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint

CREATE TRIGGER "user_superadmin_schutz"
  BEFORE UPDATE OR DELETE ON "user"
  FOR EACH ROW EXECUTE FUNCTION "superadmin_schuetzen"();
