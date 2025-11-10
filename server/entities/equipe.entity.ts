// src/entities/Usuario.ts
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'equipe', schema: process.env.DB_SCHEMA || 'public' })
export class Equipe extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    nome_equipe: string = '';

    @Property({ type: 'text', nullable: true })
    data_fundacao: string = '';

    @Property({ type: 'text', nullable: true })
    email: string = '';

    @Property({ type: 'text', nullable: true })
    telefone: string = '';

    @Property({ type: 'text', nullable: true })
    whatsapp: string = '';

    @Property({ type: 'text', nullable: true })
    endereco: string = '';

    @Property({ type: 'text', nullable: true })
    cidade: string = '';

    @Property({ type: 'text', nullable: true })
    estado: string = '';

    @Property({ type: 'text', nullable: true })
    pais: string = '';

    @Property({ type: 'text', nullable: true })
    cep: string = '';

    @Property({ type: 'text', nullable: true })
    facebook: string = '';

    @Property({ type: 'text', nullable: true })
    instagram: string = '';

    @Property({ type: 'text', nullable: true })
    nome_significado_sigla: string = '';

    @Property({ type: 'text', nullable: true })
    imagem_url: string = '';

    @Property({ type: 'text', nullable: true })
    fundador: string = '';

    @Property({ type: 'text', nullable: true })
    co_fundadores: string = '';
}