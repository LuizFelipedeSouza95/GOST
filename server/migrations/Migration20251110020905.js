import { Migration } from '@mikro-orm/migrations';
export class Migration20251110020905 extends Migration {
    async up() {
        this.addSql(`alter table "users" add column "active" boolean not null default true;`);
        this.addSql(`alter table "users" alter column "patent" type text using ("patent"::text);`);
        this.addSql(`alter table "users" alter column "patent" set default 'recruta';`);
    }
    async down() {
        this.addSql(`alter table "users" drop column "active";`);
        this.addSql(`alter table "users" alter column "patent" type text using ("patent"::text);`);
        this.addSql(`alter table "users" alter column "patent" set default 'comando';`);
    }
}
