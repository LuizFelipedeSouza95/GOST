// @ts-nocheck
import { getEm } from './_utils/orm.js';
import { Jogo } from '../server/entities/jogos.entity.js';

export default async function handler(req: any, res: any) {
    try {
        if (req.method === 'GET') {
            const em = await getEm();
            const url = req.url || '';
            const u = new URL(url, 'http://localhost');
            const offset = Math.max(parseInt(u.searchParams.get('offset') || '0', 10) || 0, 0);
            const limit = Math.min(Math.max(parseInt(u.searchParams.get('limit') || '12', 10) || 12, 1), 100);
            const order = (u.searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
            const pastOnly = u.searchParams.get('pastOnly') === '1';
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const where: any = pastOnly ? { data_jogo: { $lt: todayStr } } : {};
            const list = await em.find(Jogo, where, { offset, limit, orderBy: { data_jogo: order as any } as any });
            res.status(200).json(list);
            return;
        }
        if (req.method === 'POST') {
            const {
                nome_jogo,
                data_jogo,
                local_jogo,
                descricao_jogo,
                hora_inicio,
                hora_fim,
                localizacao,
                confirmations,
                status,
                capa_url,
                capa_imagem_base64,
                mime
            } = req.body || {};
            if (!nome_jogo || !data_jogo) {
                res.status(400).json({ error: 'Informe pelo menos nome_jogo e data_jogo' });
                return;
            }
            const em = await getEm();
            const existing = await em.findOne(Jogo, { nome_jogo });
            if (existing) {
                res.status(409).json({ error: 'Jogo com este nome já existe' });
                return;
            }
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const isPast = data_jogo < todayStr;
            let finalCover = capa_url || '';
            if (!finalCover && typeof capa_imagem_base64 === 'string' && capa_imagem_base64) {
                const prefix = `data:${typeof mime === 'string' && mime ? mime : 'image/png'};base64,`;
                finalCover = capa_imagem_base64.startsWith('data:') ? capa_imagem_base64 : (prefix + capa_imagem_base64);
            }
            const jogo = em.create(Jogo, {
                nome_jogo,
                data_jogo,
                local_jogo: local_jogo ?? 'Indefinido',
                descricao_jogo: descricao_jogo ?? '',
                hora_inicio: hora_inicio ?? '00:00',
                hora_fim: hora_fim ?? '00:01',
                localizacao: localizacao ?? '0,0',
                confirmations: Array.isArray(confirmations) ? confirmations : [],
                status: status ?? (isPast ? 'completed' : 'scheduled'),
                capa_url: finalCover || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await em.persistAndFlush(jogo);
            res.status(201).json(jogo);
            return;
        }
        res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}