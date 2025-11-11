import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";

const EMBED_API = process.env.VITE_EMBED_DEV_API === "1";

export default defineConfig({
    plugins: [react(), EMBED_API ? devApiPlugin() : null].filter(Boolean) as any,
    build: {
        emptyOutDir: false
    },
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
                        const ormCfg = (await import("./server/config/orm")).default;
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
                        const { Usuario } = await import("./server/entities/usuarios.entity.js");
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

                    const send = (code: number, body: any) => {
                        res.statusCode = code;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(body));
                    };

                    const { handleGaleria } = await import("./devApi/galeria");
                    const { handleUsers } = await import("./devApi/users");
                    const { handleSquads } = await import("./devApi/squads");
                    const { handleEquipe } = await import("./devApi/equipe");
                    const { handleJogos } = await import("./devApi/jogos");
                    if (resource === "galeria") { await handleGaleria({ req, res, url: u, id, method, em, readJson, send }); return; }
                    if (resource === "users") { await handleUsers({ req, res, url: u, id, method, em, readJson, send }); return; }
                    if (resource === "squads") { await handleSquads({ req, res, url: u, id, method, em, readJson, send }); return; }
                    if (resource === "equipe") { await handleEquipe({ req, res, url: u, id, method, em, readJson, send }); return; }
                    if (resource === "jogos") { await handleJogos({ req, res, url: u, id, method, em, readJson, send }); return; }

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

