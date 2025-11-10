import { Migration } from '@mikro-orm/migrations';

export class Migration20251110191459 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "jogos" add column "status" text null default 'scheduled';`);
    this.addSql(`alter table "jogos" alter column "confirmations" type jsonb using ("confirmations"::jsonb);`);
    this.addSql(`alter table "jogos" alter column "confirmations" set default '[]';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "jogos" drop column "status";`);

    this.addSql(`alter table "jogos" alter column "confirmations" drop default;`);
    this.addSql(`alter table "jogos" alter column "confirmations" type text using ("confirmations"::text);`);
  }

}
