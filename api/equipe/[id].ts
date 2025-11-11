// @ts-nocheck
import { getEm } from '../_utils/orm.js';
import { Equipe } from '../../server/entities/equipe.entity.js';

export default async function handler(req: any, res: any) {
	const { id } = req.query || {};
	if (!id || typeof id !== "string") {
		res.status(400).json({ error: "ID inválido" });
		return;
	}
	try {
		const em = await getEm();
		const registro = await em.findOne(Equipe, { id });
		if (!registro) {
			res.status(404).json({ error: "Não encontrado" });
			return;
		}
		if (req.method === "GET") {
			res.status(200).json(registro);
			return;
		}
		// Upload/definição de imagem da equipe via POST (JSON)
		if (req.method === "POST") {
			try {
				let body: any = req.body;
				if (typeof body === "string") {
					try { body = JSON.parse(body); } catch { body = {}; }
				}
				const { imagem_url, imagem_base64, mime } = body || {};
				if (!imagem_url && !imagem_base64) {
					res.status(400).json({ error: "Informe 'imagem_url' ou 'imagem_base64'." });
					return;
				}
				if (imagem_url && typeof imagem_url === "string") {
					(registro as any).imagem_url = imagem_url;
				} else if (imagem_base64 && typeof imagem_base64 === "string") {
					const prefix = `data:${typeof mime === "string" && mime ? mime : "image/png"};base64,`;
					(registro as any).imagem_url = imagem_base64.startsWith("data:") ? imagem_base64 : (prefix + imagem_base64);
				}
				await em.flush();
				res.status(200).json(registro);
				return;
			} catch (e: any) {
				res.status(400).json({ error: "Payload inválido", detail: e?.message || String(e) });
				return;
			}
		}
		if (req.method === "PUT") {
			const allowed = ["email", "nome_equipe", "data_fundacao", "telefone", "whatsapp", "endereco", "cidade", "estado", "pais", "cep", "facebook", "instagram", "nome_significado_sigla", "imagem_url", "fundador", "co_fundadores", "descricao_patch"];
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