CREATE TABLE "nominee_chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"contestant_id" uuid,
	"admin_id" text,
	"author_type" text NOT NULL,
	"body" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp (3),
	"deleted_by" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3) NOT NULL,
	CONSTRAINT "nominee_chat_author_type_values" CHECK ("nominee_chat_messages"."author_type" in ('nominee', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "nominee_chat_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nominee_access" ADD COLUMN "chat_muted_at" timestamp;--> statement-breakpoint
ALTER TABLE "nominee_chat_messages" ADD CONSTRAINT "nominee_chat_messages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominee_chat_messages" ADD CONSTRAINT "nominee_chat_messages_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominee_chat_messages" ADD CONSTRAINT "nominee_chat_messages_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nominee_chat_event_updated_idx" ON "nominee_chat_messages" USING btree ("event_id","updated_at");--> statement-breakpoint
CREATE INDEX "nominee_chat_event_created_idx" ON "nominee_chat_messages" USING btree ("event_id","created_at");