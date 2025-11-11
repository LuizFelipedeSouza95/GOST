import type { Handler } from "./types";

export const handleGaleria: Handler = async ({ req, res, url, id, method, em, readJson, send }) => {
	const { Galeria } = await import("../server/entities/galeria.entity.js");
	const { Jogo } = await import("../server/entities/jogos.entity.js");

	if (!id) {
		if (method === "GET") {
			const jogoId = url.searchParams.get("jogo_id");
			const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
			const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 100);
			const where: any = jogoId ? { jogo_id: jogoId } : {};
			const list = await em.find(Galeria, where, { offset, limit, orderBy: { createdAt: "desc" } as any });
			return send(200, list);
		}
		if (method === "POST") {
			const body = await readJson(req);
			const { imagem_url, imagem_base64, mime, jogo_id, is_operacao, nome_operacao, data_operacao, descricao } = body || {};
			let finalUrl = imagem_url || "";
			if (!finalUrl && typeof imagem_base64 === "string" && imagem_base64) {
				const prefix = `data:${typeof mime === "string" && mime ? mime : "image/png"};base64,`;
				finalUrl = imagem_base64.startsWith("data:") ? imagem_base64 : (prefix + imagem_base64);
			}
			if (!finalUrl) return send(400, { error: "Informe imagem_url ou imagem_base64" });
			if (!jogo_id || typeof jogo_id !== "string") return send(400, { error: "Selecione um jogo para vincular (jogo_id obrigatório)" });
			// Validar jogo e se já ocorreu
			const jogo = await em.findOne(Jogo, { id: jogo_id });
			if (!jogo) return send(404, { error: "Jogo não encontrado" });
			const now = new Date();
			const yyyy = now.getFullYear();
			const mm = String(now.getMonth() + 1).padStart(2, "0");
			const dd = String(now.getDate()).padStart(2, "0");
			const todayStr = `${yyyy}-${mm}-${dd}`;
			if ((jogo as any).data_jogo >= todayStr) return send(400, { error: "Só é permitido anexar fotos a jogos já realizados" });
			const item = em.create(Galeria, {
				imagem_url: finalUrl,
				jogo_id,
				is_operacao: false,
				nome_operacao: null,
				data_operacao: null,
				descricao: descricao || null
			});
			await em.persistAndFlush(item);
			return send(201, item);
		}
		return;
	} else {
		const registro = await em.findOne(Galeria, { id });
		if (!registro) return send(404, { error: "Não encontrado" });
		if (method === "GET") return send(200, registro);
		if (method === "PUT") {
			const body = await readJson(req);
			const allowed = ["imagem_url", "jogo_id", "is_operacao", "nome_operacao", "data_operacao", "descricao"];
			for (const k of allowed) if (k in (body || {})) (registro as any)[k] = body[k];
			await em.flush();
			return send(200, registro);
		}
		if (method === "DELETE") {
			await em.removeAndFlush(registro);
			res.statusCode = 204;
			res.end();
			return;
		}
	}
}; 


