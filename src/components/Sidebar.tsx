import type { SectionKey } from "../App";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchEquipeOnce, readEquipeFromLocal } from "../lib/equipeClient";

type Props = {
    active: SectionKey;
    onChange: (section: SectionKey) => void;
    open?: boolean;
    onClose?: () => void;
};

const items: { key: SectionKey; label: string }[] = [
    { key: "inicio", label: "Início" },
    { key: "recrutamento", label: "Recrutamento (Q&A)" },
    { key: "hierarquia", label: "Hierarquia" },
    { key: "disciplina", label: "Conduta e Disciplina" },
    { key: "uniformes", label: "Uniformes (Kit GOST)" },
    { key: "briefing", label: "Briefing de Missão" },
    { key: "logistica", label: "Logística e Horários" },
    { key: "galeria", label: "Galeria" },
    { key: "jogos", label: "Jogos" },
    { key: "membros", label: "Membros" }
];

export default function Sidebar({ active, onChange, open = false, onClose }: Props) {
    const [userOpen, setUserOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);
    const googleBtnRef = useRef<HTMLDivElement | null>(null);
    const [teamImage, setTeamImage] = useState<string>(() => {
        try {
            const eq = readEquipeFromLocal();
            return eq?.imagem_url || "/path_gost.svg";
        } catch { return "/path_gost.svg"; }
    });
    const [teamName, setTeamName] = useState<string>(() => {
        try {
            const eq = readEquipeFromLocal();
            return eq?.nome_equipe || "GOST";
        } catch { return "GOST"; }
    });
    const [teamMeaning, setTeamMeaning] = useState<string>(() => {
        try {
            const eq = readEquipeFromLocal();
            return eq?.nome_significado_sigla || "Grupamento Operacional de Supressão Tatica";
        } catch { return "Grupamento Operacional de Supressão Tatica"; }
    });
    const [currentUser, setCurrentUser] = useState<any | null>(() => {
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
            const u = raw ? JSON.parse(raw) : null;
            return u?.picture || null;
        } catch { return null; }
    });
    const isAdmin = useMemo(() => {
        return Array.isArray(currentUser?.roles) && currentUser.roles.includes("admin");
    }, [currentUser]);
    const canSeeConfig = useMemo(() => {
        const byRole = Array.isArray(currentUser?.roles) && currentUser.roles.includes("admin");
        const byPatent = currentUser?.patent && currentUser.patent !== "soldado";
        return !!(byRole || byPatent);
    }, [currentUser]);
    const canAccessConfig = useMemo(() => {
        const byRole = Array.isArray(currentUser?.roles) && currentUser.roles.includes("admin");
        const byPatent = currentUser?.patent && currentUser.patent !== "soldado";
        return !!(byRole || byPatent);
    }, [currentUser]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setUserOpen(false);
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (!userOpen) return;
            const el = userMenuRef.current;
            if (el && !el.contains(e.target as Node)) {
                setUserOpen(false);
            }
        };
        document.addEventListener("keydown", handleKey);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userOpen]);

    // Renderiza botão de login do Google no rodapé (em dev/produção)
    useEffect(() => {
        if (!open || currentUser) return; // renderiza quando a sidebar abrir e só se não logado
        const ensureScriptAndRender = () => {
            const renderGoogle = () => {
                try {
                    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
                    if (!clientId || !googleBtnRef.current) return;
                    (window as any).google.accounts.id.initialize({
                        client_id: clientId,
                        callback: async (resp: any) => {
                            try {
                                const r = await fetch("/api/auth/google", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ credential: resp?.credential })
                                });
                                const j = await r.json();
                                if (r.ok) {
                                    // Puxa do banco o registro atualizado (roles/picture etc.)
                                    let hydrated = j;
                                    try {
                                        if (j?.id) {
                                            const g = await fetch(`/api/users/${j.id}`);
                                            if (g.ok) {
                                                const full = await g.json();
                                                hydrated = { ...j, ...full };
                                            }
                                        }
                                    } catch { }
                                    localStorage.setItem("currentUser", JSON.stringify(hydrated));
                                    setCurrentUser(hydrated);
                                    setAvatarUrl(hydrated?.picture || null);
                                    try { window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(hydrated) })); } catch { }
                                    setUserOpen(false);
                                    onClose?.();
                                } else {
                                    console.error("Falha no login:", j);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    });
                    // limpa antes de renderizar para evitar duplicatas
                    try { googleBtnRef.current.innerHTML = ""; } catch { }
                    (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
                        theme: "outline",
                        size: "large",
                        type: "standard",
                        shape: "rectangular",
                        text: "signin_with"
                    });
                } catch { }
            };
            if (!(window as any).google) {
                const s = document.createElement("script");
                s.src = "https://accounts.google.com/gsi/client";
                s.async = true;
                s.defer = true;
                s.onload = () => renderGoogle();
                document.head.appendChild(s);
            } else {
                renderGoogle();
            }
        };
        // aguarda o DOM montar o ref
        const id = setTimeout(ensureScriptAndRender, 0);
        return () => clearTimeout(id);
    }, [open, currentUser]);

    // Ouve alterações de login em outras abas
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "currentUser") {
                try {
                    const parsed = e.newValue ? JSON.parse(e.newValue) : null;
                    setCurrentUser(parsed);
                    setAvatarUrl(parsed?.picture || null);
                } catch { }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Carrega imagem da equipe (imediato do cache + atualização em segundo plano)
    useEffect(() => {
        const cached = readEquipeFromLocal();
        if (cached) {
            if (cached?.imagem_url) setTeamImage(cached.imagem_url);
            if (cached?.nome_equipe) setTeamName(cached.nome_equipe);
            if (cached?.nome_significado_sigla) setTeamMeaning(cached.nome_significado_sigla);
        }
        fetchEquipeOnce().then((data) => {
            if (!data) return;
            if (data?.imagem_url) setTeamImage(data.imagem_url);
            if (data?.nome_equipe) setTeamName(data.nome_equipe);
            if (data?.nome_significado_sigla) setTeamMeaning(data.nome_significado_sigla);
        }).catch(() => {});
    }, []);

    // Sincroniza usuário com o servidor para refletir mudanças de roles/patent feitas no banco
    useEffect(() => {
        const sync = async () => {
            try {
                if (!currentUser?.id) return;
                const r = await fetch(`/api/users/${currentUser.id}`);
                if (!r.ok) return;
                const fresh = await r.json();
                const merged = { ...currentUser, ...fresh };
                setCurrentUser(merged);
                setAvatarUrl(merged?.picture || null);
                try { localStorage.setItem("currentUser", JSON.stringify(merged)); } catch { }
            } catch { }
        };
        // sincroniza quando abrir a sidebar e quando houver id
        if (open && currentUser?.id) sync();
    }, [open, currentUser?.id]);

    const handleAccessClick = () => {
        if (currentUser) return; // já logado, não abre prompt
        try {
            if ((window as any).google?.accounts?.id?.prompt) {
                (window as any).google.accounts.id.prompt();
                return;
            }
            const btn = googleBtnRef.current?.querySelector('[role="button"]') as HTMLElement | null;
            if (btn) btn.click();
        } catch { }
    };

    return (
        <nav
            className={`fixed z-[1500] bg-slate-900 text-gray-300 shadow-lg transform transition-none duration-0 md:transition-none md:duration-0 motion-reduce:transition-none
                top-0 left-0 right-0 w-full rounded-b-lg
                ${open ? "translate-y-0 md:translate-x-0" : "-translate-y-full md:-translate-x-full"}
                md:top-0 md:left-0 md:right-auto md:h-screen md:w-64 md:rounded-none md:overflow-visible md:translate-y-0`}
            aria-hidden={false}
        >
            <div className="flex flex-col items-center justify-center gap-1 border-b border-slate-700 overflow-visible mt-2">
                <div className="flex flex-row items-center justify-center relative">
                    <a href="/"><img src={teamImage} alt={teamName || "Logo GOST"} className="w-9 h-9 object-cover rounded-md" referrerPolicy="no-referrer" crossOrigin="anonymous" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/path_gost.svg"; }} /></a>
                    <span className="text-2xl font-bold text-white">{teamName}</span><br />
                </div>
                <span className="text-base text-white italic text-center mb-1">{teamMeaning}</span>
            </div>
            <div className="flex-1">
                <ul id="desktop-nav">
                    {items.map((item) => (
                        <li key={item.key}>
                            <a
                                href={item.key === "inicio" ? "/" : `/${item.key}`}
                                className={`nav-link block px-3 py-2 text-base ${active === item.key ? "active" : ""
                                    }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onChange(item.key);
                                    onClose?.();
                                }}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Rodapé com login */}
            <div className="border-t border-slate-700 p-3">
                {currentUser ? (
                    <div className="mb-2" ref={userMenuRef}>
                        <button
                            type="button"
                            className="flex items-center gap-3 w-full text-left cursor-pointer"
                            aria-haspopup="true"
                            aria-expanded={userOpen}
                            onClick={() => setUserOpen((v) => !v)}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={currentUser?.name || "Usuário"}
                                    className="w-8 h-8 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={() => setAvatarUrl(null)}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-sm text-white">{currentUser?.name || currentUser?.email}</span>
                        </button>
                        {userOpen && (
                            <div className="mt-2">
                                <button
                                    className="w-full text-left px-4 py-2 text-sm rounded hover:bg-slate-800"
                                    onClick={() => {
                                        try {
                                            const email = currentUser?.email;
                                            if ((window as any).google?.accounts?.id?.disableAutoSelect) {
                                                (window as any).google.accounts.id.disableAutoSelect();
                                            }
                                            if (email && (window as any).google?.accounts?.id?.revoke) {
                                                try { (window as any).google.accounts.id.revoke(email, () => { }); } catch { }
                                            }
                                        } catch { }
                                        try { localStorage.setItem("currentUser", ""); } catch { }
                                        try { localStorage.removeItem("currentUser"); } catch { }
                                        try { window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: null })); } catch { }
                                        setCurrentUser(null);
                                        setAvatarUrl(null);
                                        setUserOpen(false);
                                        onClose?.();
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-2">
                        <div ref={googleBtnRef} className="inline-flex"></div>
                    </div>
                )}
                {canAccessConfig && (
                    <button
                        className="w-full mb-2 px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 text-left"
                        onClick={() => {
                            onChange("configuracao");
                            onClose?.();
                        }}
                    >
                        Configuração
                    </button>
                )}
            </div>
        </nav>
    );
}