import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1735776000000 implements MigrationInterface {
  name = 'Initial1735776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('OWNER', 'COLLECTOR')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "firebase_uid" varchar NOT NULL,
        "name" varchar(120) NOT NULL,
        "email" varchar NOT NULL,
        "role" "users_role_enum",
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "disabled_at" timestamptz,
        CONSTRAINT "users_firebase_uid_unique" UNIQUE ("firebase_uid"),
        CONSTRAINT "users_email_unique" UNIQUE ("email")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "collection_requests_material_type_enum" AS ENUM (
         'ALUMINUM','CARDBOARD','PLASTIC','GLASS','METAL','COOKING_OIL','SMALL_ELECTRONICS','MIXED'
       )`,
    );
    await queryRunner.query(
      `CREATE TYPE "collection_requests_quantity_estimate_enum" AS ENUM ('SMALL','MEDIUM','LARGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "collection_requests_status_enum" AS ENUM ('OPEN','RESERVED','COMPLETED','CANCELLED','EXPIRED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "collection_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_by_user_id" uuid NOT NULL,
        "reserved_by_user_id" uuid,
        "material_type" "collection_requests_material_type_enum" NOT NULL,
        "quantity_estimate" "collection_requests_quantity_estimate_enum" NOT NULL,
        "notes" text,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "location_reference" text,
        "status" "collection_requests_status_enum" NOT NULL DEFAULT 'OPEN',
        "reserved_until" timestamptz,
        "completed_at" timestamptz,
        "cancelled_at" timestamptz,
        "expired_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "collection_requests_created_by_fk"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "collection_requests_reserved_by_fk"
          FOREIGN KEY ("reserved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "collection_requests_status_idx" ON "collection_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "collection_requests_created_by_idx" ON "collection_requests" ("created_by_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "collection_requests_reserved_by_idx" ON "collection_requests" ("reserved_by_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "collection_requests_status_lat_lng_idx" ON "collection_requests" ("status", "latitude", "longitude")`,
    );

    await queryRunner.query(`
      CREATE TABLE "request_images" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL,
        "image_key" varchar NOT NULL,
        "image_url" varchar NOT NULL,
        "content_type" varchar(64) NOT NULL,
        "size_bytes" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_images_request_id_unique" UNIQUE ("request_id"),
        CONSTRAINT "request_images_request_id_fk"
          FOREIGN KEY ("request_id") REFERENCES "collection_requests"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "request_images"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "collection_requests_status_lat_lng_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "collection_requests_reserved_by_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "collection_requests_created_by_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "collection_requests_status_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collection_requests"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "collection_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "collection_requests_quantity_estimate_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "collection_requests_material_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
