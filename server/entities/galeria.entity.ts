import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

@Entity({ tableName: 'galeria', schema: process.env.DB_SCHEMA || 'public' })
export class Galeria extends BaseEntity {
	@Property({ type: 'text' })
	imagem_url: string = '';

	@Property({ type: 'text', nullable: true })
	jogo_id: string | null = null;

	@Property({ type: 'boolean', default: false })
	is_operacao: boolean = false;

	@Property({ type: 'text', nullable: true })
	nome_operacao: string | null = null;

	@Property({ type: 'text', nullable: true })
	data_operacao: string | null = null;

	@Property({ type: 'text', nullable: true })
	descricao: string | null = null;
}