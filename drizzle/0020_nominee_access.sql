CREATE TABLE "nominee_access" (
	"contestant_id" uuid PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"code_enc" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"invited_by" text,
	"invite_count" integer DEFAULT 1 NOT NULL,
	"activated_at" timestamp,
	"last_login_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "contestants" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "nominee_access" ADD CONSTRAINT "nominee_access_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominee_access" ADD CONSTRAINT "nominee_access_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nominee_access_code_hash_uniq" ON "nominee_access" USING btree ("code_hash");