ALTER TABLE "events" ADD COLUMN "settlement_type" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "settlement_provider" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "settlement_branch" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "settlement_account_number" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "settlement_account_name" text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_settlement_type_values" CHECK ("events"."settlement_type" is null or "events"."settlement_type" in ('momo', 'bank'));