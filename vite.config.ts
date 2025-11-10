import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";

const EMBED_API = process.env.VITE_EMBED_DEV_API === "1";

export default defineConfig({
    plugins: [react(), EMBED_API ? devApiPlugin() : null].filter(Boolean) as any,
    server: {
        port: 5173,
        strictPort: false,
        proxy: EMBED_API
            ? undefined
            : {
                "/api": {
                    target: "http://localhost:3000",
                    changeOrigin: true,
                    secure: false
                }
            }
    }
});

function devApiPlugin() {
    return {
        name: "dev-api-middleware",
        configureServer(server: any) {
            // Apenas em dev: expõe /api usando o próprio Vite (mesma porta do front)
            const getEm = (() => {
                let ormPromise: Promise<any> | null = null;
                return async () => {
                    if (!ormPromise) {
                        const { MikroORM } = await import("@mikro-orm/core");
                        const ormCfg = (await import("./src/config/orm")).default;
                        ormPromise = MikroORM.init(ormCfg);
                    }
                    const orm = await ormPromise;
                    return orm.em.fork();
                };
            })();

            const readJson = async (req: IncomingMessage) => {
                const chunks: Buffer[] = [];
                await new Promise<void>((resolve) => {
                    req.on("data", (c) => chunks.push(c));
                    req.on("end", () => resolve());
                });
                const raw = Buffer.concat(chunks).toString("utf8");
                if (!raw) return {};
                try {
                    return JSON.parse(raw);
                } catch {
                    try {
                        const params = new URLSearchParams(raw);
                        return Object.fromEntries(params.entries());
                    } catch {
                        return {};
                    }
                }
            };

            server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
                const url = req.url || "";
                if (!url.startsWith("/api/")) return next();
                try {
                    const u = new URL(url, "http://localhost");
                    // Rota auth/google direta (usa handler já existente)
                    if (u.pathname === "/api/auth/google" || u.pathname === "/api/auth/google/") {
                        // CORS/preflight básico
                        if (req.method?.toUpperCase() === "OPTIONS") {
                            res.statusCode = 204;
                            res.setHeader("Access-Control-Allow-Origin", "*");
                            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                            return res.end();
                        }
                        // parse body manual para o handler
                        const chunks: Buffer[] = [];
                        await new Promise<void>((resolve) => {
                            req.on("data", (c) => chunks.push(c));
                            req.on("end", () => resolve());
                        });
                        const raw = Buffer.concat(chunks).toString("utf8");
                        (req as any).body = raw || "{}";
                        // adapta ServerResponse para interface com .status().json()
                        const expressLikeRes: any = res;
                        expressLikeRes.status = (code: number) => {
                            res.statusCode = code;
                            return expressLikeRes;
                        };
                        expressLikeRes.json = (obj: any) => {
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify(obj));
                        };
                        expressLikeRes.send = (body: any) => {
                            if (typeof body === "object") {
                                expressLikeRes.json(body);
                            } else {
                                res.end(String(body));
                            }
                        };
                        // Handler inline para evitar depender de arquivos de API (que em prod importam dist/)
                        const bodyRaw = (req as any).body as string;
                        let body: any = {};
                        try { body = bodyRaw ? JSON.parse(bodyRaw) : {}; } catch { body = {}; }
                        const credential = body?.credential;
                        if (!credential) {
                            expressLikeRes.status(400).json({ error: "credential ausente" });
                            return;
                        }
                        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
                        if (!clientId) {
                            expressLikeRes.status(500).json({ error: "GOOGLE_CLIENT_ID não configurado" });
                            return;
                        }
                        const { OAuth2Client } = await import("google-auth-library");
                        const client = new OAuth2Client(clientId);
                        const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
                        const payload = ticket.getPayload();
                        if (!payload) {
                            expressLikeRes.status(401).json({ error: "Token inválido" });
                            return;
                        }
                        const googleId = payload.sub as string;
                        const email = payload.email as string | undefined;
                        const name = payload.name as string | undefined;
                        const picture = payload.picture as string | undefined;
                        if (!email) {
                            expressLikeRes.status(400).json({ error: "Email não presente no token" });
                            return;
                        }
                        const em2 = await getEm();
                        const { Usuario } = await import("./src/entities/usuarios.entity");
                        let user = await em2.findOne(Usuario, { email });
                        if (user && (user as any).active === false) {
                            expressLikeRes.status(403).json({ error: "Usuário inativo" });
                            return;
                        }
                        if (!user) {
                            user = em2.create(Usuario, {
                                email,
                                name: name || null,
                                picture: picture || null,
                                googleId,
                                roles: ["user"],
                                is_comandante_squad: false,
                                nome_squad_subordinado: null,
                                nome_guerra: null,
                                id_squad_subordinado: null,
                                active: true,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                comando_geral: [],
                                classe: "",
                                data_admissao_gost: "",
                                patent: "recruta",
                                comando_squad: null
                            });
                            await em2.persistAndFlush(user);
                        } else {
                            (user as any).googleId = googleId;
                            (user as any).picture = picture || (user as any).picture || null;
                            (user as any).name = name || (user as any).name || null;
                            (user as any).updatedAt = new Date();
                            await em2.flush();
                        }
                        return expressLikeRes.status(200).json({
                            id: (user as any).id,
                            email: (user as any).email,
                            name: (user as any).name,
                            picture: (user as any).picture,
                            roles: (user as any).roles,
                            patent: (user as any).patent,
                        });
                    }
                    const parts = u.pathname.split("/").filter(Boolean); // ["api","resource",":id"?]
                    const resource = parts[1];
                    const id = parts[2];
                    const method = (req.method || "GET").toUpperCase();
                    const em = await getEm();

                    // Importa entidades on-demand
                    const { Usuario } = await import("./src/entities/usuarios.entity");
                    const { Comando } = await import("./src/entities/comando.entity");
                    const { Squads } = await import("./src/entities/squads.entity");

                    const send = (code: number, body: any) => {
                        res.statusCode = code;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(body));
                    };

                    if (resource === "users") {
                        if (!id) {
                            if (method === "GET") {
                                const list = await em.find(Usuario, {}, { limit: 200, orderBy: { createdAt: "desc" } as any });
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
                    }

                    if (resource === "comando") {
                        if (!id) {
                            if (method === "GET") {
                                const list = await em.find(Comando, {}, { limit: 50, orderBy: { createdAt: "desc" } as any });
                                return send(200, list);
                            }
                            if (method === "POST") {
                                const body = await readJson(req);
                                const { email, name, classe, data_admissao_gost, patent } = body || {};
                                if (!email) return send(400, { error: "Email é obrigatório" });
                                const existing = await em.findOne(Comando, { email });
                                if (existing) return send(409, { error: "Comando com este email já existe" });
                                const now = new Date();
                                const validPatents = ["comando", "comando_squad", "soldado", "sub_comando"];
                                const comando = em.create(Comando, {
                                    email,
                                    name: name || null,
                                    classe: classe || "",
                                    data_admissao_gost: data_admissao_gost || "",
                                    patent: validPatents.includes(patent) ? patent : "comando",
                                    roles: ["user"],
                                    createdAt: now,
                                    updatedAt: now
                                });
                                await em.persistAndFlush(comando);
                                return send(201, { id: comando.id, email: comando.email, name: comando.name });
                            }
                        } else {
                            const registro = await em.findOne(Comando, { id });
                            if (!registro) return send(404, { error: "Não encontrado" });
                            if (method === "GET") return send(200, registro);
                            if (method === "PUT") {
                                const body = await readJson(req);
                                const allowed = ["email", "name", "classe", "data_admissao_gost", "patent", "picture"];
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
                    }

                    if (resource === "squads") {
                        if (!id) {
                            if (method === "GET") {
                                const list = await em.find(Squads, {}, { limit: 50, orderBy: { createdAt: "desc" } as any });
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
                                return res.end();
                            }
                        }
                    }

                    return send(405, { error: "Method Not Allowed" });
                } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Erro interno", detail: err?.message || String(err) }));
                }
            });
        }
    };
}

