// @ts-nocheck
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { importAny } from './resolve.js';

let ormInstance: MikroORM | null = null;

export async function getOrm(): Promise<MikroORM> {
	const clientUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
	if (!clientUrl) {
		throw new Error('DATABASE_URL (ou GOST_DATABASE_URL) não definido no ambiente');
	}
	if (ormInstance) return ormInstance;

	// Carrega driver Postgres dinamicamente para evitar problemas de bundling
	const { PostgreSqlDriver } = await import('@mikro-orm/postgresql');

	// Carrega entidades dinamicamente (prioriza compiladas em server/, cai para src/ em dev)
	const { Usuario } = await importAny(['../../server/entities/usuarios.entity.js', '../../src/entities/usuarios.entity']);
	const { Comando } = await importAny(['../../server/entities/comando.entity.js', '../../src/entities/comando.entity']);
	const { Squads } = await importAny(['../../server/entities/squads.entity.js', '../../src/entities/squads.entity']);

	// SSL automático quando não é localhost
	const isLocal = /localhost|127\.0\.0\.1/i.test(clientUrl);

	const cfg: any = {
		driver: PostgreSqlDriver,
		clientUrl,
		schema: process.env.DB_SCHEMA || 'public',
		entities: [Usuario, Comando, Squads],
		debug: process.env.NODE_ENV !== 'production',
		driverOptions: isLocal ? undefined : { connection: { ssl: { rejectUnauthorized: false } } },
	};

	ormInstance = await MikroORM.init(cfg);
	return ormInstance;
}

export async function getEm() {
	const orm = await getOrm();
	return orm.em.fork();
}