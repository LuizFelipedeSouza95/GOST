import { Migration } from '@mikro-orm/migrations';

export class Migration20251110013605 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "squads" drop column "comando_squad_id", drop column "squad_id";`);

    this.addSql(`alter table "squads" add column "comando_squad" text null;`);
    this.addSql(`alter table "squads" rename column "comando_geral_id" to "comando_geral";`);

    this.addSql(`alter table "users" drop column "comando_squad_id", drop column "squad_id";`);

    this.addSql(`alter table "users" add column "comando_squad" text null;`);
    this.addSql(`alter table "users" rename column "comando_geral_id" to "comando_geral";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "squads" add column "squad_id" text null;`);
    this.addSql(`alter table "squads" rename column "comando_geral" to "comando_geral_id";`);
    this.addSql(`alter table "squads" rename column "comando_squad" to "comando_squad_id";`);

    this.addSql(`alter table "users" add column "squad_id" text null;`);
    this.addSql(`alter table "users" rename column "comando_geral" to "comando_geral_id";`);
    this.addSql(`alter table "users" rename column "comando_squad" to "comando_squad_id";`);
  }

}
