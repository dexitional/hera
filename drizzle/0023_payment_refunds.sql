ALTER TABLE "event_transactions" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "event_transactions" ADD COLUMN "refund_reason" text;