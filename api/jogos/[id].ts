// @ts-nocheck
import { getEm } from '../_utils/orm.js';
import { Jogo } from '../../server/entities/jogos.entity.js';

export default async function handler(req: any, res: any) {
    const { id } = req.query || {};
    if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID inválido' });
        return;
    }
    try {
        const em = await getEm();
        const registro = await em.findOne(Jogo, { id });
        if (!registro) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        if (req.method === 'GET') {
            res.status(200).json(registro);
            return;
        }
		if (req.method === 'PUT') {
			const allowed = ["nome_jogo", "data_jogo", "local_jogo", "descricao_jogo", "hora_inicio", "hora_fim", "localizacao", "confirmations", "status", "capa_url"];
			let body = req.body || {};
			if (typeof body === 'string') {
				try { body = JSON.parse(body); } catch { body = {}; }
			}
			// suporte a upload base64 de capa
			if (body?.capa_imagem_base64) {
				const mime = typeof body?.mime === 'string' && body.mime ? body.mime : 'image/png';
				const prefix = `data:${mime};base64,`;
				(registro as any).capa_url = String(body.capa_imagem_base64).startsWith('data:')
					? body.capa_imagem_base64
					: (prefix + body.capa_imagem_base64);
			}
			for (const k of allowed) if (k in (body || {})) (registro as any)[k] = body[k];
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