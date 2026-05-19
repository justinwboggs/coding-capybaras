CREATE TABLE IF NOT EXISTS "platform_journey" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_stage" text DEFAULT 'project' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_journey" ADD CONSTRAINT "platform_journey_user_id_platform_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."platform_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
