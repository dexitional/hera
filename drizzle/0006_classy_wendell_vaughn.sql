ALTER TABLE "voters" DROP CONSTRAINT "voters_email_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_event_id_events_id_fk";
--> statement-breakpoint
ALTER TABLE "contestants" DROP CONSTRAINT "contestants_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_contestant_id_contestants_id_fk";
--> statement-breakpoint
ALTER TABLE "election_votes" ALTER COLUMN "candidate_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "is_active" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "auto_stop" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD COLUMN "auto_sync" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "election_votes_lookup_idx" ON "election_votes" USING btree ("election_id","position_id");--> statement-breakpoint
CREATE INDEX "votes_voter_phone_idx" ON "votes" USING btree ("voter_phone");--> statement-breakpoint
CREATE INDEX "votes_contestant_idx" ON "votes" USING btree ("contestant_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_event_id_code_unique" UNIQUE("event_id","code");--> statement-breakpoint
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_category_id_code_unique" UNIQUE("category_id","code");--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_election_id_email_unique" UNIQUE("election_id","email");--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_election_id_username_unique" UNIQUE("election_id","username");