CREATE TABLE "event_withdrawals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" text NOT NULL,
	"recipient" text,
	"reference" text,
	"note" text,
	"paid_at" timestamp NOT NULL,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"voided_at" timestamp,
	"voided_by" text,
	"void_reason" text,
	CONSTRAINT "event_withdrawals_amount_positive" CHECK ("event_withdrawals"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "platform_fee_percent" numeric(5, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_withdrawals" ADD CONSTRAINT "event_withdrawals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_withdrawals" ADD CONSTRAINT "event_withdrawals_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_withdrawals" ADD CONSTRAINT "event_withdrawals_voided_by_user_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_withdrawals_event_idx" ON "event_withdrawals" USING btree ("event_id","paid_at");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_platform_fee_percent_range" CHECK ("events"."platform_fee_percent" >= 0 and "events"."platform_fee_percent" <= 100);