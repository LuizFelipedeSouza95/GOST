// @ts-nocheck
import { MikroORM } from '@mikro-orm/core';
import { importAny } from './resolve';

let ormInstance: MikroORM | null = null;

export async function getOrm(): Promise<MikroORM> {
	const clientUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
	if (!clientUrl) {
		throw new Error('DATABASE_URL (ou GOST_DATABASE_URL) não definido no ambiente');
	}
	if (ormInstance) return ormInstance;
	const cfgMod: any = await importAny(['../../dist/config/orm.js', '../../src/config/orm']);
	const cfg = cfgMod?.default || cfgMod;
	ormInstance = await MikroORM.init(cfg);
	return ormInstance;
}

export async function getEm() {
	const orm = await getOrm();
	return orm.em.fork();
}