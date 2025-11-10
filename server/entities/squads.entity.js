// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'squads', schema: process.env.DB_SCHEMA || 'public' })
export class Squads extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    nome = '';

    @Property({ type: 'json', nullable: true })
    comando_geral = [];

    @Property({ type: 'text', nullable: true })
    comando_squad = null;
}