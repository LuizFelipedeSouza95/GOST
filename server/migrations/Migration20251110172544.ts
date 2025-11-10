import { Migration } from '@mikro-orm/migrations';

export class Migration20251110172544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "admin" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome_equipe" text null default '', "data_fundacao" text null default '', "email" text null default '', "telefone" text null default '', "whatsapp" text null default '', "endereco" text null default '', "cidade" text null default '', "estado" text null default '', "pais" text null default '', "cep" text null default '', "facebook" text null default '', "instagram" text null default '', "nome_significado_sigla" text null default '', "imagem_url" text null default '', "fundador" text null default '', "co_fundadores" text null default '', constraint "admin_pkey" primary key ("id"));`);
    this.addSql(`alter table "admin" add constraint "admin_nome_equipe_unique" unique ("nome_equipe");`);

    this.addSql(`create table "jogos" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome_jogo" text null default '', "data_jogo" text null default '', "local_jogo" text null default '', "descricao_jogo" text null default '', "hora_inicio" text null default '', "hora_fim" text null default '', "localizacao" text null default '', "confirmations" text null, constraint "jogos_pkey" primary key ("id"));`);
    this.addSql(`alter table "jogos" add constraint "jogos_nome_jogo_unique" unique ("nome_jogo");`);

    this.addSql(`drop table if exists "comando" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "comando" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "google_id" text null, "email" text not null, "name" text null, "picture" text null, "roles" jsonb not null default '["user"]', "last_login" timestamptz null, "password" text null, "classe" text null default '', "data_admissao_gost" text null default '', "patent" text null default 'comando', constraint "comando_pkey" primary key ("id"));`);
    this.addSql(`alter table "comando" add constraint "comando_google_id_unique" unique ("google_id");`);
    this.addSql(`alter table "comando" add constraint "comando_email_unique" unique ("email");`);

    this.addSql(`drop table if exists "admin" cascade;`);

    this.addSql(`drop table if exists "jogos" cascade;`);
  }

}
