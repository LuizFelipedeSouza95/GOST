import type { Handler } from "./types";

export const handleUsers: Handler = async ({ req, res, url, id, method, em, readJson, send }) => {
	const { Usuario } = await import("../server/entities/usuarios.entity.js");
	if (!id) {
		if (method === "GET") {
			const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
			const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 200);
			const list = await em.find(Usuario, {}, { offset, limit, orderBy: { createdAt: "desc" } as any });
			return send(200, list.map(u => ({
				id: u.id,
				googleId: (u as any).googleId ?? null,
				email: u.email,
				name: (u as any).name ?? null,
				picture: (u as any).picture ?? null,
				roles: (u as any).roles ?? [],
				lastLogin: (u as any).lastLogin ?? null,
				password: (u as any).password ?? null,
				comando_geral: (u as any).comando_geral ?? [],
				comando_squad: (u as any).comando_squad ?? null,
				classe: (u as any).classe ?? "",
				data_admissao_gost: (u as any).data_admissao_gost ?? "",
				patent: (u as any).patent ?? null,
				active: (u as any).active ?? true,
				is_comandante_squad: (u as any).is_comandante_squad ?? false,
				nome_squad_subordinado: (u as any).nome_squad_subordinado ?? null,
				id_squad_subordinado: (u as any).id_squad_subordinado ?? null,
				nome_guerra: (u as any).nome_guerra ?? null
			})));
		}
		if (method === "POST") {
			const body = await readJson(req);
			const { email, name } = body || {};
			if (!email) return send(400, { error: "Email é obrigatório" });
			const existing = await em.findOne(Usuario, { email });
			if (existing) return send(409, { error: "Usuário já existe" });
			const now = new Date();
			const user = em.create(Usuario, {
				email,
				name: name || null,
				roles: ["user"],
				comando_geral: [],
				classe: "",
				data_admissao_gost: "",
				patent: "recruta",
				createdAt: now,
				updatedAt: now,
				lastLogin: null,
				picture: null,
				comando_squad: null,
				id_squad_subordinado: null,
				active: true,
				is_comandante_squad: false,
				nome_squad_subordinado: null,
				nome_guerra: null
			});
			await em.persistAndFlush(user);
			return send(201, { id: user.id, email: user.email, name: user.name });
		}
		return;
	} else {
		const user = await em.findOne(Usuario, { id });
		if (!user) return send(404, { error: "Não encontrado" });
		if (method === "GET") return send(200, user);
		if (method === "PUT") {
			const body = await readJson(req);
			const allowed = ["googleId", "email", "name", "picture", "roles", "lastLogin", "password", "comando_geral", "comando_squad", "classe", "data_admissao_gost", "patent", "active", "is_comandante_squad", "nome_squad_subordinado", "id_squad_subordinado", "nome_guerra"];
			for (const k of allowed) if (k in (body || {})) (user as any)[k] = body[k];
			await em.flush();
			return send(200, user);
		}
		if (method === "DELETE") {
			await em.removeAndFlush(user);
			res.statusCode = 204;
			return res.end();
		}
	}
};


