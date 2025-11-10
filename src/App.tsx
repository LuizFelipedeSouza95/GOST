import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import Inicio from "./components/sections/Inicio";
import Hierarquia from "./components/sections/Hierarquia";
import Recrutamento from "./components/sections/Recrutamento";
import Disciplina from "./components/sections/Disciplina";
import Uniformes from "./components/sections/Uniformes";
import Briefing from "./components/sections/Briefing";
import Logistica from "./components/sections/Logistica";
import Membros from "./components/sections/Membros";
import Configuracao from "./components/sections/Configuracao";
import Jogos from "./components/sections/jogos";

// Tempo de guarda para rolagem programática terminar antes de reativar detecção de scroll
const TIMEOUT_MS = 1200;

export type SectionKey =
    | "inicio"
    | "hierarquia"
    | "recrutamento"
    | "disciplina"
    | "uniformes"
    | "briefing"
    | "logistica"
    | "jogos"
    | "membros"
    | "configuracao";

const sectionsOrder: SectionKey[] = [
    "inicio",
    "recrutamento",
    "hierarquia",
    "disciplina",
    "uniformes",
    "briefing",
    "logistica",
    "jogos",
    "membros",
    "configuracao"
];

export default function App() {
    const initialSection = useMemo<SectionKey>(() => {
        const p = window.location.pathname.replace(/^\/+/, "");
        const key = (p || "inicio") as SectionKey;
        return (sectionsOrder.includes(key) ? key : "inicio") as SectionKey;
    }, []);
    const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const mainRef = useRef<HTMLDivElement | null>(null);
    const [appUser, setAppUser] = useState<any | null>(() => {
        try {
            const raw = localStorage.getItem("currentUser");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const canAccessConfig = useMemo(() => {
        const roles = Array.isArray(appUser?.roles) ? appUser.roles : [];
        if (roles.includes("admin")) return true;
        const patent = appUser?.patent;
        return !!(patent && patent !== "soldado");
    }, [appUser]);

    const visibleSections = useMemo<SectionKey[]>(() => {
        return canAccessConfig ? sectionsOrder : (sectionsOrder.filter((k) => k !== "configuracao") as SectionKey[]);
    }, [canAccessConfig]);

    const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
        inicio: null,
        hierarquia: null,
        recrutamento: null,
        disciplina: null,
        uniformes: null,
        briefing: null,
        logistica: null,
        jogos: null,
        membros: null,
        configuracao: null
    });

    // Flag para indicar que a rolagem foi iniciada pela navegação (menu)
    const scrollByNavRef = useRef(false);
    // Timer para desativar scrollByNavRef após a rolagem suave
    const scrollEndTimerRef = useRef<number | null>(null);

    // Estado para controlar a classe snap-none (snap desativado permanentemente para estabilidade)
    const [disableSnap, setDisableSnap] = useState(true);


    // Efeito para atualizar o histórico de navegação (URL)
    useEffect(() => {
        const path = activeSection === "inicio" ? "/" : `/${activeSection}`;
        // Só atualiza o histórico se não estiver sendo rolado pela navegação para evitar interrupções
        if (window.location.pathname !== path && !scrollByNavRef.current) {
            history.pushState(null, "", path);
        }
    }, [activeSection]);

    // Lógica para sincronizar a barra lateral e a URL quando o usuário usa o botão "voltar" do navegador
    useEffect(() => {
        const handlePopState = () => {
            const p = window.location.pathname.replace(/^\/+/, "");
            const key = (p || "inicio") as SectionKey;
            if (sectionsOrder.includes(key)) {
                // Ao usar o popstate, o navegador já posiciona, não precisa de rolagem programática.
                setActiveSection(key);
                setMobileOpen(false);
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Atualiza usuário quando login/logout ocorrer (eventos storage)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "currentUser") {
                try {
                    const parsed = e.newValue ? JSON.parse(e.newValue) : null;
                    setAppUser(parsed);
                } catch {
                    setAppUser(null);
                }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Se perder acesso à config, redireciona para "inicio"
    useEffect(() => {
        if (!canAccessConfig && activeSection === "configuracao") {
            setActiveSection("inicio");
        }
    }, [canAccessConfig, activeSection]);

    // 👇 Lógica Principal de Rolagem (Disparada quando activeSection muda via navegação)
    useEffect(() => {
        // Se não foi a navegação do menu que causou a mudança, ignora a rolagem
        if (!scrollByNavRef.current) return;

        const node = sectionRefs.current[activeSection];
        const root = mainRef.current;

        if (node && root) {
            // 1. Snap permanece desativado para estabilidade

            // 2. Tenta rolar suavemente
            try {
                // Calcula a posição relativa: posição absoluta do topo do nó - posição absoluta do topo do container + scroll atual do container
                const targetTop = node.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
                root.scrollTo({ top: targetTop, behavior: "smooth" });
            } catch {
                // Fallback para scrollIntoView
                node.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            // 3. Limpa timers antigos e configura o novo para reabilitar o snap
            if (scrollEndTimerRef.current) {
                clearTimeout(scrollEndTimerRef.current);
            }

            scrollEndTimerRef.current = window.setTimeout(() => {
                // A flag de navegação só deve ser desativada DEPOIS que a rolagem termina
                scrollByNavRef.current = false;
                scrollEndTimerRef.current = null;
            }, TIMEOUT_MS);
        } else {
            // Caso a seção não seja encontrada, reseta o flag imediatamente
            scrollByNavRef.current = false;
        }

        // Fecha o menu móvel
        setMobileOpen(false);
        setSidebarOpen(false); // Fecha a sidebar em geral
    }, [activeSection]);


    // Atualiza seção ativa com base no scroll (para rolagem manual)
    useEffect(() => {
        const root = mainRef.current;
        if (!root) return;
        let rafId: number | null = null;

        const onScroll = () => {
            // ⛔ Bloqueia a atualização se a rolagem foi iniciada pelo menu
            if (scrollByNavRef.current) return;

            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                try {
                    const rootRect = root.getBoundingClientRect();
                    let bestKey: SectionKey | null = null;
                    let bestDist = Number.POSITIVE_INFINITY;

                    // Ponto de referência: o topo do container de scroll (rootRect.top)
                    const referenceTop = rootRect.top;

                    for (const key of visibleSections) { // Itera apenas pelas visíveis
                        const el = sectionRefs.current[key];
                        if (!el) continue;

                        const rect = el.getBoundingClientRect();
                        // Calcula a distância absoluta do topo da seção em relação ao topo do container
                        const topWithinRoot = rect.top - referenceTop;
                        const dist = Math.abs(topWithinRoot);

                        // Seleciona a seção cujo topo está mais próximo do topo do container
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestKey = key;
                        }
                    }

                    if (bestKey && bestKey !== activeSection) {
                        setActiveSection(bestKey);
                        // Atualiza a URL aqui para rolagem manual
                        const path = bestKey === "inicio" ? "/" : `/${bestKey}`;
                        if (window.location.pathname !== path) history.replaceState(null, "", path);
                    }
                } catch { /* ignore */ }
            });
        };

        root.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            root.removeEventListener("scroll", onScroll);
            if (rafId != null) cancelAnimationFrame(rafId);
        };
    }, [activeSection, visibleSections]);

    // Fechar sidebar com ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        if (sidebarOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [sidebarOpen]);

    // Função de clique no item de navegação
    const handleNavChange = useCallback((key: SectionKey) => {
        // Redirecionamento de segurança
        if (key === "configuracao" && !canAccessConfig) {
            setActiveSection("inicio");
            return;
        }

        const node = sectionRefs.current[key];
        if (node && mainRef.current) {
            // 1. Ativa a flag de navegação ANTES de mudar o estado 
            scrollByNavRef.current = true;
            // 2. A mudança de estado aciona o useEffect que lida com a rolagem
            setActiveSection(key);
            // 3. Atualiza a URL imediatamente (ou no efeito)
            const path = key === "inicio" ? "/" : `/${key}`;
            if (window.location.pathname !== path) history.pushState(null, "", path);
        } else {
            // Se a seção não existe (ex: configuracao foi removida), apenas muda o estado.
            setActiveSection(key);
        }
    }, [canAccessConfig]); // Dependências do useCallback

    const renderSectionByKey = (key: SectionKey) => {
        switch (key) {
            case "inicio":
                return <Inicio />;
            case "recrutamento":
                return <Recrutamento />;
            case "hierarquia":
                return <Hierarquia />;
            case "disciplina":
                return <Disciplina />;
            case "uniformes":
                return <Uniformes />;
            case "briefing":
                return <Briefing />;
            case "logistica":
                return <Logistica />;
            case "jogos":
                return <Jogos />;
            case "membros":
                return <Membros />;
            case "configuracao":
                return <Configuracao />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-slate-100 ml-4">
            {/* Botão global para abrir sidebar - mobile */}
            <button
                aria-label="Abrir menu"
                className="fixed top-3 right-3 z-[1600] p-2 rounded bg-slate-900 text-white shadow hover:bg-slate-800 md:hidden"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((v) => !v)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
            {/* Botão global para abrir sidebar - desktop */}
            <button
                aria-label="Abrir menu"
                className="hidden md:inline-flex fixed top-3 right-3 z-[1600] p-2 rounded bg-slate-900 text-white shadow hover:bg-slate-800"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((v) => !v)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
            {/* Overlay para qualquer breakpoint */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[1499] md:bg-black/20"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* Sidebar única (mobile topo; desktop esquerda) */}
            <Sidebar active={activeSection} onChange={handleNavChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main
                ref={mainRef}
                className={`flex-1 overflow-y-auto min-h-screen transition-[margin] duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-0"}`}
            >
                {visibleSections.map((key, idx) => (
                    <div
                        key={key}
                        ref={(el) => (sectionRefs.current[key] = el)}
                        data-section-key={key}
                        className="min-h-[calc(100vh-4rem)] md:min-h-screen p-6 md:p-10"
                    >
                        {idx > 0 && <div className="h-px bg-slate-200 mb-6 -mt-6" aria-hidden="true" />}
                        {renderSectionByKey(key)}
                    </div>
                ))}
            </main>
        </div>
    );
}