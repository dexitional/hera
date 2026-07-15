-- Catches up the migration history with schema.ts changes that were applied to
-- production directly via `drizzle-kit push` rather than through a migration:
-- user.organization/job_title/address (the Better Auth profile fields that were
-- missing here, causing session lookups to fail), elections/events.is_active's
-- default, and event_transactions.pay_amount's type.

ALTER TABLE "elections" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_transactions" ALTER COLUMN "pay_amount" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "organization" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "address" text;