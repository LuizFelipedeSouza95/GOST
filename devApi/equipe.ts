import type { Handler } from "./types";

export const handleEquipe: Handler = async ({ req, res, url, id, method, em, readJson, send }) => {
	const { Equipe } = await import("../server/entities/equipe.entity.js");
	if (!id) {
		if (method === "GET") {
			const list = await em.find(Equipe, {}, { limit: 50, orderBy: { createdAt: "desc" } as any });
			return send(200, list);
		}
		if (method === "POST") {
			const body = await readJson(req);
			const { nome_equipe, data_fundacao, email, telefone, whatsapp, endereco, cidade, estado, pais, cep, facebook, instagram, nome_significado_sigla, imagem_url, fundador, co_fundadores, descricao_patch } = body || {};
			if (!email) return send(400, { error: "Email é obrigatório" });
			const existing = await em.findOne(Equipe, { email });
			if (existing) return send(409, { error: "Equipe com este email já existe" });
			const equipe = em.create(Equipe, {
				nome_equipe: nome_equipe || "",
				data_fundacao: data_fundacao || "",
				email: email || "",
				telefone: telefone || "",
				whatsapp: whatsapp || "",
				endereco: endereco || "",
				cidade: cidade || "",
				estado: estado || "",
				pais: pais || "",
				cep: cep || "",
				facebook: facebook || "",
				instagram: instagram || "",
				nome_significado_sigla: nome_significado_sigla || "",
				imagem_url: imagem_url || "",
				fundador: fundador || "",
				co_fundadores: co_fundadores || "",
				descricao_patch: descricao_patch || "",
			});
			await em.persistAndFlush(equipe);
			return send(201, { id: equipe.id, email: equipe.email, name: equipe.name });
		}
		return;
	} else {
		const registro = await em.findOne(Equipe, { id });
		if (!registro) return send(404, { error: "Não encontrado" });
		if (method === "GET") return send(200, registro);
		if (method === "POST") {
			const body = await readJson(req);
			const { imagem_url, imagem_base64, mime } = body || {};
			if (!imagem_url && !imagem_base64) return send(400, { error: "Informe 'imagem_url' ou 'imagem_base64'." });
			if (typeof imagem_url === "string" && imagem_url) {
				(registro as any).imagem_url = imagem_url;
			} else if (typeof imagem_base64 === "string" && imagem_base64) {
				const prefix = `data:${typeof mime === "string" && mime ? mime : "image/png"};base64,`;
				(registro as any).imagem_url = imagem_base64.startsWith("data:") ? imagem_base64 : (prefix + imagem_base64);
			}
			await em.flush();
			return send(200, registro);
		}
		if (method === "PUT") {
			const body = await readJson(req);
			const allowed = ["nome_equipe", "data_fundacao", "email", "telefone", "whatsapp", "endereco", "cidade", "estado", "pais", "cep", "facebook", "instagram", "nome_significado_sigla", "imagem_url", "fundador", "co_fundadores", "descricao_patch"];
			for (const k of allowed) if (k in (body || {})) (registro as any)[k] = body[k];
			await em.flush();
			return send(200, registro);
		}
		if (method === "DELETE") {
			await em.removeAndFlush(registro);
			res.statusCode = 204;
			return res.end();
		}
	}
};


