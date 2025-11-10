import { getEm } from './_utils/orm';
import { Squads } from '../src/entities/squads.entity';
import { Usuario } from '../src/entities/usuarios.entity';

export default async function handler(req: any, res: any) {
	try {
		if (req.method === 'GET') {
			const em = await getEm();
			const list = await em.find(Squads, {}, { limit: 50, orderBy: { createdAt: 'desc' } as any });
			res.status(200).json(list);
			return;
		}
		if (req.method === 'POST') {
			const { nome } = req.body || {};
			if (!nome) {
				res.status(400).json({ error: "Nome é obrigatório" });
				return;
			}
			const em = await getEm();
			const existing = await em.findOne(Squads, { nome });
			if (existing) {
				res.status(409).json({ error: "Squad com este nome já existe" });
				return;
			}
			const comando_geral_ids: string[] = (req.body?.comando_geral ?? req.body?.comando_geral_id) || [];
			const comando_squad_id: string | null = req.body?.comando_squad ?? req.body?.comando_squad_id ?? null;

			// Traduz IDs de usuários para nomes (ou email como fallback)
			let comando_geral: string[] = [];
			if (Array.isArray(comando_geral_ids) && comando_geral_ids.length) {
				const us = await em.find(Usuario, { id: { $in: comando_geral_ids } as any });
				comando_geral = us.map(u => u.name || u.email);
			}
			let comando_squad: string | null = null;
			if (comando_squad_id) {
				const u = await em.findOne(Usuario, { id: comando_squad_id });
				comando_squad = u ? (u.name || u.email) : null;
			}

			const squad = em.create(Squads, {
				nome,
				comando_geral,
				comando_squad,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await em.persistAndFlush(squad);
			res.status(201).json(squad);
			return;
		}
		res.status(405).json({ error: "Method Not Allowed" });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: "Erro interno" });
	}
}
