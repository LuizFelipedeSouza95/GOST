import { Migration } from '@mikro-orm/migrations';

export class Migration20251111164828 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "jogos" add column "capa_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "jogos" drop column "capa_url";`);
  }

}
