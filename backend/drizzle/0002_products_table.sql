CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_code" varchar(20) NOT NULL,
	"product_name" varchar(150) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code")
);
