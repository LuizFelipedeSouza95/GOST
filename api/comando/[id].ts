// @ts-nocheck
import { getEm } from '../_utils/orm.js';
import { Comando } from '../../src/entities/comando.entity.js';

export default async function handler(req: any, res: any) {
	const { id } = req.query || {};
	if (!id || typeof id !== "string") {
		res.status(400).json({ error: "ID inválido" });
		return;
	}
	try {
		const em = await getEm();
		const registro = await em.findOne(Comando, { id });
		if (!registro) {
			res.status(404).json({ error: "Não encontrado" });
			return;
		}
		if (req.method === "GET") {
			res.status(200).json(registro);
			return;
		}
		if (req.method === "PUT") {
			const allowed = ["email", "name", "classe", "data_admissao_gost", "patent", "picture"];
			const body = req.body || {};
			for (const k of allowed) if (k in (body || {})) (registro as any)[k] = body[k];
			await em.flush();
			res.status(200).json(registro);
			return;
		}
		if (req.method === "DELETE") {
			await em.removeAndFlush(registro);
			res.status(204).end();
			return;
		}
		res.status(405).json({ error: "Method Not Allowed" });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: "Erro interno" });
	}
}


