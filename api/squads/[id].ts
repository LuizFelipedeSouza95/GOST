// @ts-nocheck
import { getEm } from '../_utils/orm.js';
import { Squads } from '../../server/entities/squads.entity.js';
import { Usuario } from '../../server/entities/usuarios.entity.js';

export default async function handler(req: any, res: any) {
	const { id } = req.query || {};
	if (!id || typeof id !== 'string') {
		res.status(400).json({ error: 'ID inválido' });
		return;
	}
	try {
		const em = await getEm();
		const registro = await em.findOne(Squads, { id });
		if (!registro) {
			res.status(404).json({ error: 'Não encontrado' });
			return;
		}
		if (req.method === 'GET') {
			res.status(200).json(registro);
			return;
		}
		if (req.method === 'PUT') {
			const body = req.body || {};
			if ('nome' in body) registro.nome = body.nome;

			// comando_geral pode vir como array de IDs; salvar nomes
			if ('comando_geral' in body || 'comando_geral_id' in body) {
				const ids = body.comando_geral ?? body.comando_geral_id ?? [];
				if (Array.isArray(ids) && ids.length) {
					const em2 = await getEm();
					const us = await em2.find(Usuario, { id: { $in: ids } as any });
					(registro as any).comando_geral = us.map(u => u.name || u.email);
				} else {
					(registro as any).comando_geral = [];
				}
			}

			// comando_squad pode vir como ID; salvar nome
			if ('comando_squad' in body || 'comando_squad_id' in body) {
				const idCmd = body.comando_squad ?? body.comando_squad_id ?? null;
				if (idCmd) {
					const em2 = await getEm();
					const u = await em2.findOne(Usuario, { id: idCmd });
					(registro as any).comando_squad = u ? (u.name || u.email) : null;
				} else {
					(registro as any).comando_squad = null;
				}
			}
			await em.flush();
			res.status(200).json(registro);
			return;
		}
		if (req.method === 'DELETE') {
			await em.removeAndFlush(registro);
			res.status(204).end();
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
}


