import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import Inicio from "./components/sections/Inicio";
import Hierarquia from "./components/sections/Hierarquia";
import Recrutamento from "./components/sections/Recrutamento";
import Disciplina from "./components/sections/Disciplina";
import Uniformes from "./components/sections/Uniformes";
import Briefing from "./components/sections/Briefing";
import Logistica from "./components/sections/Logistica";
import Membros from "./components/sections/Membros";
import Configuracao from "./components/sections/Configuracao";

export type SectionKey =
    | "inicio"
    | "hierarquia"
    | "recrutamento"
    | "disciplina"
    | "uniformes"
    | "briefing"
    | "logistica"
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
    // const isTransitioningRef = useRef(false);
    // const touchStartYRef = useRef<number | null>(null);
    // const lastTouchYRef = useRef<number | null>(null);
    // const touchActiveRef = useRef(false);
    const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
        inicio: null,
        hierarquia: null,
        recrutamento: null,
        disciplina: null,
        uniformes: null,
        briefing: null,
        logistica: null,
        membros: null,
        configuracao: null
    });
    const scrollByNavRef = useRef(false);

    useEffect(() => {
        const handlePopState = () => {
            const p = window.location.pathname.replace(/^\/+/, "");
            const key = (p || "inicio") as SectionKey;
            if (sectionsOrder.includes(key)) {
                setActiveSection(key);
                setMobileOpen(false);
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        const path = activeSection === "inicio" ? "/" : `/${activeSection}`;
        if (window.location.pathname !== path) history.pushState(null, "", path);
    }, [activeSection]);

    // Ao trocar de seção (se veio do menu), rola até ela e fecha menu mobile
    useEffect(() => {
        const node = sectionRefs.current[activeSection];
        if (scrollByNavRef.current && node && mainRef.current) {
            node.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        scrollByNavRef.current = false;
        setMobileOpen(false);
    }, [activeSection]);

    // IntersectionObserver para atualizar seção ativa com scroll
    useEffect(() => {
        const root = mainRef.current;
        if (!root) return;
        const observer = new IntersectionObserver(
            (entries) => {
                let bestKey: SectionKey | null = null;
                let bestRatio = 0;
                for (const entry of entries) {
                    const key = (entry.target as HTMLElement).dataset.sectionKey as SectionKey;
                    if (entry.intersectionRatio > bestRatio) {
                        bestRatio = entry.intersectionRatio;
                        bestKey = key;
                    }
                }
                if (bestKey && bestKey !== activeSection && bestRatio >= 0.51) {
                    setActiveSection(bestKey);
                }
            },
            { root, threshold: [0.25, 0.51, 0.75] }
        );
        sectionsOrder.forEach((key) => {
            const el = sectionRefs.current[key];
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [activeSection]);

    // Fechar sidebar com ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        if (sidebarOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [sidebarOpen]);

    const handleNavChange = useCallback((key: SectionKey) => {
        const node = sectionRefs.current[key];
        if (node && mainRef.current) {
            scrollByNavRef.current = true;
            setActiveSection(key);
            // scroll happens in effect
        } else {
            setActiveSection(key);
        }
    }, []);

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
            case "membros":
                return <Membros />;
            case "configuracao":
                return <Configuracao />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-slate-100 ml-5">
            <MobileHeader active={activeSection} onChange={handleNavChange} />
            {/* Menu desktop (escondido no mobile) */}
            <div className="hidden md:block">
                {/* Botão global para abrir sidebar (apenas desktop, se desejar colapsar) */}
                <button
                    aria-label="Abrir menu"
                    className="fixed top-3 left-3 z-[1600] p-2 rounded bg-slate-900 text-white shadow hover:bg-slate-800"
                    aria-expanded={sidebarOpen}
                    onClick={() => setSidebarOpen((v) => !v)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                {/* Overlay desktop opcional */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-[1499]"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <Sidebar active={activeSection} onChange={handleNavChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
            <main
                ref={mainRef}
                className="flex-1 mt-16 md:mt-0 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen snap-y snap-proximity"
            >
                {sectionsOrder.map((key) => (
                    <div
                        key={key}
                        ref={(el) => (sectionRefs.current[key] = el)}
                        data-section-key={key}
                        className="snap-start min-h-[calc(100vh-4rem)] md:min-h-screen p-6 md:p-10"
                    >
                        {renderSectionByKey(key)}
                    </div>
                ))}
            </main>
        </div>
    );
}