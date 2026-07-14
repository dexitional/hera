-- Enforces idempotency at the DB level for Paystack-credited votes: a given
-- pay_ref can only ever be recorded once, even under concurrent requests
-- (e.g. the client's verify call and the webhook firing for the same charge
-- at nearly the same time). Partial index (WHERE pay_ref IS NOT NULL) so
-- manually-entered admin transactions without a payRef are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS "event_transactions_pay_ref_uniq_idx" ON "event_transactions" USING btree ("pay_ref") WHERE "pay_ref" IS NOT NULL;
