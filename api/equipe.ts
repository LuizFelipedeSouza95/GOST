// @ts-nocheck
import { getEm } from './_utils/orm.js';
import { Equipe } from '../server/entities/equipe.entity.js';

export default async function handler(req: any, res: any) {
	try {
		if (req.method === 'GET') {
			const em = await getEm();
			const list = await em.find(Equipe, {}, { limit: 50, orderBy: { createdAt: 'desc' } as any });
			res.status(200).json(list);
			return;
		}
		if (req.method === 'POST') {
			let body = req.body;
			if (typeof body === "string") {
				try { body = JSON.parse(body); } catch { body = {}; }
			}
			const { email, nome_equipe, data_fundacao, telefone, whatsapp, endereco, cidade, estado, pais, cep, facebook, instagram, nome_significado_sigla, imagem_url, fundador, co_fundadores, descricao_patch } = body || {};
			// Validação mínima (alinhado ao dev server): exigir pelo menos email ou nome_equipe
			if (!email && !nome_equipe) {
				res.status(400).json({ error: 'Informe ao menos email ou nome_equipe' });
				return;
			}
			const em = await getEm();
			// Evita duplicidade pelo nome_equipe quando fornecido
			if (nome_equipe) {
				const existing = await em.findOne(Equipe, { nome_equipe });
				if (existing) {
					res.status(409).json({ error: 'Equipe com este nome de equipe já existe' });
					return;
				}
			}
			const equipe = em.create(Equipe, {
				nome_equipe,
				data_fundacao,
				email: email || '',
				telefone,
				whatsapp,
				endereco,
				cidade,
				estado,
				pais,
				cep,
				facebook,
				instagram,
				nome_significado_sigla,
				imagem_url,
				fundador,
				co_fundadores,
				descricao_patch,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			await em.persistAndFlush(equipe);
			res.status(201).json({ id: equipe.id, email: equipe.email, nome_equipe: equipe.nome_equipe });
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
}