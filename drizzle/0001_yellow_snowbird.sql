ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
DROP TABLE "user_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "elections" RENAME COLUMN "org_id" TO "admin_id";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "org_id" TO "admin_id";--> statement-breakpoint
ALTER TABLE "elections" DROP CONSTRAINT "elections_org_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_org_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;