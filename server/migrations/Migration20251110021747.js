import { Migration } from '@mikro-orm/migrations';

export class Migration20251110021747 extends Migration {

  async up() {
    this.addSql(`alter table "users" add column "is_comandante_squad" boolean not null default true, add column "nome_squad_subordinado" text null, add column "nome_guerra" text null;`);
  }

  async down() {
    this.addSql(`alter table "users" drop column "is_comandante_squad", drop column "nome_squad_subordinado", drop column "nome_guerra";`);
  }

}
