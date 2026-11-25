CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "candidates_position_id_idx" ON "candidates" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "contestants_category_id_idx" ON "contestants" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "election_votes_candidate_idx" ON "election_votes" USING btree ("candidate_id","position_id");--> statement-breakpoint
CREATE INDEX "election_votes_position_candidate_idx" ON "election_votes" USING btree ("position_id","candidate_id");--> statement-breakpoint
CREATE INDEX "election_votes_election_created_idx" ON "election_votes" USING btree ("election_id","created_at");--> statement-breakpoint
CREATE INDEX "elections_tag_idx" ON "elections" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "elections_admin_id_idx" ON "elections" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "events_admin_id_idx" ON "events" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "positions_election_id_idx" ON "positions" USING btree ("election_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voters_election_login_idx" ON "voters" USING btree ("election_id",lower(replace("username", ' ', '')));--> statement-breakpoint
CREATE INDEX "voters_election_has_voted_idx" ON "voters" USING btree ("election_id","has_voted");