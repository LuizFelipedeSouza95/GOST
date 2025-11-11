import { useEffect, useRef, useState } from "react";
import { fetchEquipeOnce, readEquipeFromLocal } from "../../lib/equipeClient";

const emblemImage = "/path_gost.svg";

export default function Inicio() {
    const [teamImage, setTeamImage] = useState<string | null>(null);
    const [nome_significado_sigla, setNomeSignificadoSigla] = useState<string | null>(null);
    const [descricaoPatch, setDescricaoPatch] = useState<string | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Lazy load via IntersectionObserver
        const el = sectionRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) if (e.isIntersecting) setReady(true);
            },
            { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (!ready) return;
        (async () => {
            try {
                // Fallback imediato de cache local (útil em mobile/offline)
                const cached = readEquipeFromLocal();
                if (cached && !cancelled) {
                    if (cached.imagem_url) setTeamImage(cached.imagem_url as string);
                    if (cached.nome_significado_sigla) setNomeSignificadoSigla(cached.nome_significado_sigla as string);
                    if (cached.descricao_patch) setDescricaoPatch(cached.descricao_patch as string);
                }
                const first = await fetchEquipeOnce();
                if (!cancelled && first) {
                    if (first.imagem_url) setTeamImage(first.imagem_url as string);
                    if (first.nome_significado_sigla) setNomeSignificadoSigla(first.nome_significado_sigla as string);
                    if (first.descricao_patch) setDescricaoPatch(first.descricao_patch as string);
                }
            } catch {
                if (!cancelled && !teamImage) setTeamImage(null);
            }
        })();
        return () => { cancelled = true; };
    }, [ready]);

    function renderDescricao(text?: string | null) {
        const src = String(text || "").trim();
        if (!src) return null;
        const escapeHtml = (s: string) => s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        const formatInline = (s: string) => {
            // negrito **texto**
            return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        };
        const lines = src.replace(/\r\n/g, "\n").split("\n");
        let html = "";
        let listItems: string[] = [];
        const flushList = () => {
            if (listItems.length) {
                html += `<ul class="list-disc pl-6 text-left space-y-1">` +
                    listItems.map((li) => `<li>${formatInline(li)}</li>`).join("") +
                    `</ul>`;
                listItems = [];
            }
        };
        for (const raw of lines) {
            const line = raw.trimEnd();
            if (!line) { flushList(); continue; }
            if (/^#{2,6}\s+/.test(line)) {
                flushList();
                const text = line.replace(/^#{2,6}\s+/, "");
                html += `<h3 class="text-lg font-semibold text-slate-700 mt-4">${formatInline(text)}</h3>`;
            } else if (/^[-*]\s+/.test(line)) {
                listItems.push(line.replace(/^[-*]\s+/, ""));
            } else {
                flushList();
                html += `<p class="text-lg">${formatInline(line)}</p>`;
            }
        }
        flushList();
        return <div className="text-gray-600 max-w-2xl mx-auto space-y-2" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return (
        <section id="inicio" data-section-key="inicio" ref={sectionRef as any}>
            <h1 className="text-4xl font-bold text-slate-800 mb-6">ESTATUTO DE CONDUTA E OPERAÇÃO DO GOST</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <div className="mb-6 flex justify-center">
                    <img
                        src={teamImage || emblemImage}
                        alt="Emblema oficial da GOST"
                        className="h-60 w-60 object-contain rounded-md"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src.endsWith("/path_gost.svg")) return;
                            img.src = "/path_gost.svg";
                        }}
                    />
                </div>
                {nome_significado_sigla && <h2 className="text-2xl font-semibold text-slate-700 text-center mb-4">{nome_significado_sigla}</h2>}
                {renderDescricao(descricaoPatch)}
            </div>
        </section>
    );
}