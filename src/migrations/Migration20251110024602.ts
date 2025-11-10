import { Migration } from '@mikro-orm/migrations';

export class Migration20251110024602 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "id_squad_subordinado" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "id_squad_subordinado";`);
  }

}
