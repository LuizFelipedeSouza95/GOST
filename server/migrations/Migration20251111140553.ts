import { Migration } from '@mikro-orm/migrations';

export class Migration20251111140553 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "galeria" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "imagem_url" text not null default '', "jogo_id" text null, "is_operacao" boolean not null default false, "nome_operacao" text null, "data_operacao" text null, "descricao" text null, constraint "galeria_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "galeria" cascade;`);
  }

}
