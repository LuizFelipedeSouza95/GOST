// @ts-nocheck
import { getEm } from './_utils/orm.js';
import { importAny } from './_utils/resolve.js';

export default async function handler(req: any, res: any) {
	try {
		if (req.method === 'GET') {
			const em = await getEm();
			const { Comando } = await importAny(['../server/entities/comando.entity.js', '../src/entities/comando.entity']);
			const list = await em.find(Comando, {}, { limit: 50, orderBy: { createdAt: 'desc' } as any });
			res.status(200).json(list);
			return;
		}
		if (req.method === 'POST') {
			const { Comando } = await importAny(['../server/entities/comando.entity.js', '../src/entities/comando.entity']);
			const { email, name, classe, data_admissao_gost, patent } = req.body || {};
			if (!email) {
				res.status(400).json({ error: 'Email é obrigatório' });
				return;
			}
			const em = await getEm();
			const existing = await em.findOne(Comando, { email });
			if (existing) {
				res.status(409).json({ error: 'Comando com este email já existe' });
				return;
			}
			const comando = em.create(Comando, {
				email,
				name: name || null,
				classe: classe || '',
				data_admissao_gost: data_admissao_gost || '',
				patent: patent || 'comando',
				createdAt: new Date(),
				updatedAt: new Date(),
				roles: ['user'],
			});
			await em.persistAndFlush(comando);
			res.status(201).json({ id: comando.id, email: comando.email, name: comando.name });
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
}


