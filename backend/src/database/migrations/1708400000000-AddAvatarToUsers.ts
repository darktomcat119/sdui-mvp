import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarToUsers1708400000000 implements MigrationInterface {
  name = 'AddAvatarToUsers1708400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "avatar_filename" VARCHAR(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "avatar_filename"`,
    );
  }
}
