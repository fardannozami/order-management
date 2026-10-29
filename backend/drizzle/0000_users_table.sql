CREATE TABLE IF NOT EXISTS "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
