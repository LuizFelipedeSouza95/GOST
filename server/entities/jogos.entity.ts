import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity.js';

interface Confirmation {
    id_user: string;
    name: string;
}

@Entity({ tableName: 'jogos', schema: process.env.DB_SCHEMA || 'public' })
export class Jogo extends BaseEntity {
    @Property({ type: 'text', unique: true, nullable: true })
    nome_jogo: string = '';

    @Property({ type: 'text', nullable: true })
    data_jogo: string = '';

    @Property({ type: 'text', nullable: true })
    local_jogo: string = '';

    @Property({ type: 'text', nullable: true })
    descricao_jogo: string = '';

    @Property({ type: 'text', nullable: true })
    hora_inicio: string = '';

    @Property({ type: 'text', nullable: true })
    hora_fim: string = '';

    @Property({ type: 'text', nullable: true })
    localizacao: string = '';

    @Property({ type: 'json', nullable: true, default: '[]' })
    confirmations: Confirmation[] = [];

	@Property({ type: 'text', nullable: true, default: 'scheduled' })
	status: 'scheduled' | 'canceled' | 'completed' = 'scheduled';
}