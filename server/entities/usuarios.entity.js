// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'users', schema: process.env.DB_SCHEMA || 'public' })
export class Usuario extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    googleId = null;

    @Property({ type: 'text', unique: true })
    email = '';

    @Property({ type: 'text', nullable: true })
    name = null;

    @Property({ type: 'text', nullable: true })
    picture = null;

    @Property({ type: 'json', default: '["user"]' })
    roles = ['user'];

    @Property({ type: 'Date', nullable: true })
    lastLogin = null;

    @Property({ type: 'text', nullable: true })
    password = null;

    @Property({ type: 'json', nullable: true })
    comando_geral = [];

    @Property({ type: 'text', nullable: true })
    comando_squad = null;

    @Property({ type: 'text', nullable: true })
    classe = '';

    @Property({ type: 'text', nullable: true })
    data_admissao_gost = '';

    @Property({ type: 'text', nullable: true, default: 'recruta' })
    patent = '';

    @Property({ type: 'boolean', nullable: false, default: true })
    active = true;

    @Property({ type: 'boolean', nullable: false, default: true })
    is_comandante_squad = false;

    @Property({ type: 'text', nullable: true })
    nome_squad_subordinado = null;

    @Property({ type: 'text', nullable: true })
    id_squad_subordinado = null;

    @Property({ type: 'text', nullable: true })
    nome_guerra = null;
}