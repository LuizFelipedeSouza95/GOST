// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'comando', schema: process.env.DB_SCHEMA || 'public' })
export class Comando extends BaseEntity {
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

    @Property({ type: 'text', nullable: true })
    classe = '';

    @Property({ type: 'text', nullable: true })
    data_admissao_gost = '';

    @Property({ type: 'text', nullable: true, default: 'comando' })
    patent = 'comando';
}