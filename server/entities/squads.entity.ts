// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'squads', schema: process.env.DB_SCHEMA || 'public' })
export class Squads extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    nome!: string;

    @Property({ type: 'json', nullable: true })
    comando_geral: string[] = [];

    @Property({ type: 'text', nullable: true })
    comando_squad: string | null = null;
}