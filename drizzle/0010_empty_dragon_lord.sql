CREATE TABLE "event_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestant_id" integer NOT NULL,
	"pay_amount" integer,
	"pay_status" boolean DEFAULT false NOT NULL,
	"pay_ref" text,
	"pay_phone" text NOT NULL,
	"trans_ref" text,
	"votes" integer DEFAULT 0 NOT NULL,
	"channel" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "votes" CASCADE;--> statement-breakpoint
ALTER TABLE "event_transactions" ADD CONSTRAINT "event_transactions_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trans_voter_phone_idx" ON "event_transactions" USING btree ("pay_phone");--> statement-breakpoint
CREATE INDEX "event_contestant_idx" ON "event_transactions" USING btree ("contestant_id");