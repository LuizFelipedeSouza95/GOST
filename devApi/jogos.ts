import type { Handler } from "./types";

export const handleJogos: Handler = async ({ req, res, url, id, method, em, readJson, send }) => {
    const { Jogo } = await import("../server/entities/jogos.entity.js");

    if (!id) {
        if (method === "GET") {
            const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
            const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "12", 10) || 12, 1), 100);
            const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
            const pastOnly = url.searchParams.get("pastOnly") === "1";
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const where: any = pastOnly ? { data_jogo: { $lt: todayStr } } : {};
            const list = await em.find(Jogo, where, { offset, limit, orderBy: { data_jogo: order as any } as any });
            return send(200, list);
        }
        if (method === "POST") {
            const body = await readJson(req);
            const { nome_jogo, data_jogo, local_jogo, descricao_jogo, hora_inicio, hora_fim, localizacao, confirmations, status, capa_url, capa_imagem_base64, mime } = body || {};
            if (!nome_jogo || !data_jogo) {
                return send(400, { error: "Informe pelo menos nome_jogo e data_jogo" });
            }
            const existing = await em.findOne(Jogo, { nome_jogo });
            if (existing) return send(409, { error: "Jogo com este nome já existe" });
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const todayStr = `${yyyy}-${mm}-${dd}`;
            const isPast = data_jogo < todayStr;
            let finalCover = capa_url || "";
            if (!finalCover && typeof capa_imagem_base64 === "string" && capa_imagem_base64) {
                const pref = `data:${typeof mime === "string" && mime ? mime : "image/png"};base64,`;
                finalCover = capa_imagem_base64.startsWith("data:") ? capa_imagem_base64 : (pref + capa_imagem_base64);
            }
            const jogo = em.create(Jogo, {
                nome_jogo,
                data_jogo,
                local_jogo: local_jogo ?? "Indefinido",
                descricao_jogo: descricao_jogo ?? "",
                hora_inicio: hora_inicio ?? "00:00",
                hora_fim: hora_fim ?? "00:01",
                localizacao: localizacao ?? "0,0",
                createdAt: now,
                updatedAt: now,
                confirmations: Array.isArray(confirmations) ? confirmations : [],
                status: status ?? (isPast ? "completed" : "scheduled"),
                capa_url: finalCover || null
            });
            await em.persistAndFlush(jogo);
            return send(201, jogo);
        }
        return;
    } else {
        const registro = await em.findOne(Jogo, { id });
        if (!registro) return send(404, { error: "Não encontrado" });
        if (method === "GET") return send(200, registro);
        if (method === "PUT") {
            const body = await readJson(req);
            const allowed = ["nome_jogo", "data_jogo", "local_jogo", "descricao_jogo", "hora_inicio", "hora_fim", "localizacao", "confirmations", "status", "capa_url"];
            if (body?.capa_imagem_base64) {
                const m = typeof body?.mime === "string" && body.mime ? body.mime : "image/png";
                const pref = `data:${m};base64,`;
                (registro as any).capa_url = String(body.capa_imagem_base64).startsWith("data:")
                    ? body.capa_imagem_base64
                    : (pref + body.capa_imagem_base64);
            }
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


