ALTER TABLE "elections" ADD COLUMN "status" text DEFAULT 'staged' NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "order" integer;