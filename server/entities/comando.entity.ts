// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'comando', schema: process.env.DB_SCHEMA || 'public' })
export class Comando extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    googleId?: string | null;

    @Property({ type: 'text', unique: true })
    email!: string;

    @Property({ type: 'text', nullable: true })
    name?: string | null;

    @Property({ type: 'text', nullable: true })
    picture?: string | null;

    @Property({ type: 'json', default: '["user"]' })
    roles: string[] = ['user'];

    @Property({ type: 'Date', nullable: true })
    lastLogin?: Date;

    @Property({ type: 'text', nullable: true })
    password?: string | null;

    @Property({ type: 'text', nullable: true })
    classe: string = '';

    @Property({ type: 'text', nullable: true })
    data_admissao_gost: string = '';

    @Property({ type: 'text', nullable: true, default: 'comando' })
    patent: "comando" | "comando_squad" | "soldado" | "sub_comando" = 'comando';
}