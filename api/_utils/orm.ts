// @ts-nocheck
import { MikroORM } from '@mikro-orm/core';
import ormConfig from '../../src/config/orm.js';

let ormInstance: MikroORM | null = null;

export async function getOrm(): Promise<MikroORM> {
	const clientUrl = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL;
	if (!clientUrl) {
		throw new Error('DATABASE_URL (ou GOST_DATABASE_URL) não definido no ambiente');
	}
	if (ormInstance) return ormInstance;
	ormInstance = await MikroORM.init(ormConfig);
	return ormInstance;
}

export async function getEm() {
	const orm = await getOrm();
	return orm.em.fork();
}