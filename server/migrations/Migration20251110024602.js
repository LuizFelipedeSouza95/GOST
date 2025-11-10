import { Migration } from '@mikro-orm/migrations';
export class Migration20251110024602 extends Migration {
    async up() {
        this.addSql(`alter table "users" add column "id_squad_subordinado" text null;`);
    }
    async down() {
        this.addSql(`alter table "users" drop column "id_squad_subordinado";`);
    }
}
