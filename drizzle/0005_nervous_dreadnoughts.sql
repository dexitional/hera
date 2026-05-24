ALTER TABLE "user" DROP CONSTRAINT "user_phone_unique";--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "start_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "end_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "paystack_customer_code";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "is_subscribed";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "subscription_plan";