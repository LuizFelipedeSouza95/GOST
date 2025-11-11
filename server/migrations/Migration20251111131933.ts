import { Migration } from '@mikro-orm/migrations';

export class Migration20251111131933 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "equipe" add column "descricao_patch" text null default '';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "equipe" drop column "descricao_patch";`);
  }

}
