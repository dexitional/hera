ALTER TABLE "voters" ALTER COLUMN "invite_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "voters" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "voters" ADD COLUMN "token_enc" text;--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_token_hash_unique" UNIQUE("token_hash");