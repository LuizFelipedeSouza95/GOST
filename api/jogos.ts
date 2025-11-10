// @ts-nocheck
import { getEm } from './_utils/orm.js';
import { Jogo } from '../server/entities/jogos.entity.js';

export default async function handler(req: any, res: any) {
    try {
        if (req.method === 'GET') {
            const em = await getEm();
            const list = await em.find(Jogo, {}, { limit: 50, orderBy: { createdAt: 'desc' } as any });
            res.status(200).json(list);
            return;
        }
        if (req.method === 'POST') {
            const { nome_jogo, data_jogo, local_jogo, descricao_jogo, hora_inicio, hora_fim, localizacao, confirmations } = req.body || {};
            if (!nome_jogo || !data_jogo || !local_jogo || !descricao_jogo || !hora_inicio || !hora_fim || !localizacao || !confirmations) {
                res.status(400).json({ error: 'Todos os campos são obrigatórios' });
                return;
            }
            const em = await getEm();
            const existing = await em.findOne(Jogo, { nome_jogo });
            if (existing) {
                res.status(409).json({ error: 'Jogo com este nome já existe' });
                return;
            }
            const jogo = em.create(Jogo, {
                nome_jogo,
                data_jogo,
                local_jogo,
                descricao_jogo,
                hora_inicio,
                hora_fim,
                localizacao,
                confirmations,
                status: 'scheduled',
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