// @ts-nocheck
import { getEm } from './_utils/orm.js';
import { Galeria } from '../server/entities/galeria.entity.js';
import { Jogo } from '../server/entities/jogos.entity.js';

export default async function handler(req: any, res: any) {
	try {
		const em = await getEm();
		if (req.method === 'GET') {
			const url = req.url || '';
			const u = new URL(url, 'http://localhost');
			const jogoId = u.searchParams.get('jogo_id');
			const offset = Math.max(parseInt(u.searchParams.get('offset') || '0', 10) || 0, 0);
			const limit = Math.min(Math.max(parseInt(u.searchParams.get('limit') || '20', 10) || 20, 1), 100);
			const where: any = jogoId ? { jogo_id: jogoId } : {};
			const list = await em.find(Galeria, where, { offset, limit, orderBy: { createdAt: 'desc' } as any });
			res.status(200).json(list);
			return;
		}
		if (req.method === 'POST') {
			let body = req.body;
			if (typeof body === 'string') {
				try { body = JSON.parse(body); } catch { body = {}; }
			}
			const { imagem_url, imagem_base64, mime, jogo_id, is_operacao, nome_operacao, data_operacao, descricao } = body || {};
			let finalUrl = imagem_url || '';
			if (!finalUrl && typeof imagem_base64 === 'string' && imagem_base64) {
				const prefix = `data:${typeof mime === 'string' && mime ? mime : 'image/png'};base64,`;
				finalUrl = imagem_base64.startsWith('data:') ? imagem_base64 : (prefix + imagem_base64);
			}
			if (!finalUrl) {
				res.status(400).json({ error: 'Informe imagem_url ou imagem_base64' });
				return;
			}
			if (!jogo_id || typeof jogo_id !== 'string') {
				res.status(400).json({ error: 'Selecione um jogo para vincular a foto (jogo_id obrigatório)' });
				return;
			}
			// Validar jogo e se já ocorreu
			const jogo = await em.findOne(Jogo, { id: jogo_id });
			if (!jogo) {
				res.status(404).json({ error: 'Jogo não encontrado' });
				return;
			}
			const today = new Date();
			const yyyy = today.getFullYear();
			const mm = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			const todayStr = `${yyyy}-${mm}-${dd}`;
			if ((jogo as any).data_jogo >= todayStr) {
				res.status(400).json({ error: 'Só é permitido anexar fotos a jogos já realizados' });
				return;
			}

			const item = em.create(Galeria, {
				imagem_url: finalUrl,
				jogo_id,
				// Política atual: sempre vinculado a jogo; não trata operação aqui
				is_operacao: false,
				nome_operacao: null,
				data_operacao: null,
				descricao: descricao || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			await em.persistAndFlush(item);
			res.status(201).json(item);
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
}

