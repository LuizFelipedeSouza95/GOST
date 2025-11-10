import { Migration } from '@mikro-orm/migrations';

export class Migration20251110214237 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "equipe" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome_equipe" text null default '', "data_fundacao" text null default '', "email" text null default '', "telefone" text null default '', "whatsapp" text null default '', "endereco" text null default '', "cidade" text null default '', "estado" text null default '', "pais" text null default '', "cep" text null default '', "facebook" text null default '', "instagram" text null default '', "nome_significado_sigla" text null default '', "imagem_url" text null default '', "fundador" text null default '', "co_fundadores" text null default '', constraint "equipe_pkey" primary key ("id"));`);
    this.addSql(`alter table "equipe" add constraint "equipe_nome_equipe_unique" unique ("nome_equipe");`);

    this.addSql(`drop table if exists "admin" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "admin" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome_equipe" text null default '', "data_fundacao" text null default '', "email" text null default '', "telefone" text null default '', "whatsapp" text null default '', "endereco" text null default '', "cidade" text null default '', "estado" text null default '', "pais" text null default '', "cep" text null default '', "facebook" text null default '', "instagram" text null default '', "nome_significado_sigla" text null default '', "imagem_url" text null default '', "fundador" text null default '', "co_fundadores" text null default '', constraint "admin_pkey" primary key ("id"));`);
    this.addSql(`alter table "admin" add constraint "admin_nome_equipe_unique" unique ("nome_equipe");`);

    this.addSql(`drop table if exists "equipe" cascade;`);
  }

}
