import type { Handler } from "./types";

export const handleSquads: Handler = async ({ req, res, url, id, method, em, readJson, send }) => {
	const { Squads } = await import("../server/entities/squads.entity.js");
	const { Usuario } = await import("../server/entities/usuarios.entity.js");

	if (!id) {
		if (method === "GET") {
			const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
			const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 200);
			const list = await em.find(Squads, {}, { offset, limit, orderBy: { createdAt: "desc" } as any });
			return send(200, list);
		}
		if (method === "POST") {
			const body = await readJson(req);
			const { nome } = body || {};
			if (!nome) return send(400, { error: "Nome é obrigatório" });
			const existing = await em.findOne(Squads, { nome });
			if (existing) return send(409, { error: "Squad com este nome já existe" });
			const ids = (body.comando_geral ?? body.comando_geral_id) || [];
			let comando_geral: string[] = [];
			if (Array.isArray(ids) && ids.length) {
				const us = await em.find(Usuario, { id: { $in: ids } as any });
				comando_geral = us.map(u => u.name || u.email);
			}
			let comando_squad: string | null = null;
			const cmdId = body.comando_squad ?? body.comando_squad_id ?? null;
			if (cmdId) {
				const u = await em.findOne(Usuario, { id: cmdId });
				comando_squad = u ? (u.name || u.email) : null;
			}
			const squad = em.create(Squads, { nome, comando_geral, comando_squad });
			await em.persistAndFlush(squad);
			return send(201, squad);
		}
		return;
	} else {
		const registro = await em.findOne(Squads, { id });
		if (!registro) return send(404, { error: "Não encontrado" });
		if (method === "GET") return send(200, registro);
		if (method === "PUT") {
			const body = await readJson(req);
			if ("nome" in (body || {})) (registro as any).nome = body.nome;
			if ("comando_geral" in (body || {}) || "comando_geral_id" in (body || {})) {
				const ids = body.comando_geral ?? body.comando_geral_id ?? [];
				if (Array.isArray(ids) && ids.length) {
					const us = await em.find(Usuario, { id: { $in: ids } as any });
					(registro as any).comando_geral = us.map(u => u.name || u.email);
				} else {
					(registro as any).comando_geral = [];
				}
			}
			if ("comando_squad" in (body || {}) || "comando_squad_id" in (body || {})) {
				const cmdId = body.comando_squad ?? body.comando_squad_id ?? null;
				if (cmdId) {
					const u = await em.findOne(Usuario, { id: cmdId });
					(registro as any).comando_squad = u ? (u.name || u.email) : null;
				} else {
					(registro as any).comando_squad = null;
				}
			}
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


