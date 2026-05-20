import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotesTable1748000000000 implements MigrationInterface {
  name = 'CreateNotesTable1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id"         UUID                     NOT NULL DEFAULT uuid_generate_v4(),
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP                NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP                NOT NULL DEFAULT now(),
        "title"      CHARACTER VARYING(255)   NOT NULL,
        "content"    TEXT                     NOT NULL,
        "status"     CHARACTER VARYING        NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_notes" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notes"`);
  }
}
