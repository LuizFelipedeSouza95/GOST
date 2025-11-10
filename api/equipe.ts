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
			const { email, nome_equipe, data_fundacao, email, telefone, whatsapp, endereco, cidade, estado, pais, cep, facebook, instagram, nome_significado_sigla, imagem_url, fundador, co_fundadores } = req.body || {};
			if (!email || !nome_equipe || !data_fundacao || !email || !telefone || !whatsapp || !endereco || !cidade || !estado || !pais || !cep || !facebook || !instagram || !nome_significado_sigla || !imagem_url || !fundador || !co_fundadores) {
				res.status(400).json({ error: 'Todos os campos são obrigatórios' });
				return;
			}
			const em = await getEm();
			const existing = await em.findOne(Equipe, { nome_equipe });
			if (existing) {
				res.status(409).json({ error: 'Equipe com este nome de equipe já existe' });
				return;
			}
			const equipe = em.create(Equipe, {
				nome_equipe,
				data_fundacao,
				email: email || null,
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