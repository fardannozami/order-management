CREATE TYPE "public"."customer_gender" AS ENUM('Pria', 'Wanita');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(150) NOT NULL,
	"customer_address" varchar(255) NOT NULL,
	"gender" "customer_gender" NOT NULL,
	"birth_date" date NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
