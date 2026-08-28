import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserRole1777800000000 implements MigrationInterface {
  name = 'DropUserRole1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('OWNER', 'COLLECTOR')`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" "users_role_enum"`);
  }
}
