import { Migration } from '@mikro-orm/migrations';
export class Migration20251109230403 extends Migration {
    async up() {
        this.addSql(`create table "comando" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "google_id" text null, "email" text not null, "name" text null, "picture" text null, "roles" jsonb not null default '["user"]', "last_login" timestamptz null, "password" text null, "classe" text null default '', "data_admissao_gost" text null default '', "patent" text null default 'comando', constraint "comando_pkey" primary key ("id"));`);
        this.addSql(`alter table "comando" add constraint "comando_google_id_unique" unique ("google_id");`);
        this.addSql(`alter table "comando" add constraint "comando_email_unique" unique ("email");`);
        this.addSql(`create table "squads" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "nome" text null, "comando_geral_id" jsonb null, "comando_squad_id" text null, "squad_id" text null, constraint "squads_pkey" primary key ("id"));`);
        this.addSql(`alter table "squads" add constraint "squads_nome_unique" unique ("nome");`);
        this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "google_id" text null, "email" text not null, "name" text null, "picture" text null, "roles" jsonb not null default '["user"]', "last_login" timestamptz null, "password" text null, "comando_geral_id" jsonb null, "comando_squad_id" text null, "squad_id" text null, "classe" text null default '', "data_admissao_gost" text null default '', "patent" text null default 'comando', constraint "users_pkey" primary key ("id"));`);
        this.addSql(`alter table "users" add constraint "users_google_id_unique" unique ("google_id");`);
        this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
        this.addSql(`drop table if exists "usuarios" cascade;`);
    }
    async down() {
        this.addSql(`create table "usuarios" ("id" uuid not null, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "google_id" text null, "email" text not null, "name" text null, "picture" text null, "roles" jsonb not null default '["user"]', "last_login" timestamptz(6) null, "password" text null, "comando_geral_id" jsonb null, "comando_squad_id" text null, "squad_id" text null, "classe" text null default '', "data_admissao_gost" text null default '', "patent" text null default 'comando', constraint "usuarios_pkey" primary key ("id"));`);
        this.addSql(`alter table "usuarios" add constraint "usuarios_email_unique" unique ("email");`);
        this.addSql(`alter table "usuarios" add constraint "usuarios_google_id_unique" unique ("google_id");`);
        this.addSql(`drop table if exists "comando" cascade;`);
        this.addSql(`drop table if exists "squads" cascade;`);
        this.addSql(`drop table if exists "users" cascade;`);
    }
}
