import { useEffect, useMemo, useRef, useState } from "react";

type Confirmation = {
    id_user: string;
    name: string;
};

type Jogo = {
    id: string;
    nome_jogo: string;
    data_jogo: string; // formato esperado: YYYY-MM-DD
    local_jogo: string;
    descricao_jogo: string;
    hora_inicio: string; // HH:mm
    hora_fim: string; // HH:mm
    localizacao: string;
    confirmations: Confirmation[];
    status?: 'scheduled' | 'canceled' | 'completed';
    createdAt?: string;
    updatedAt?: string;
};

function getTodayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(iso: string): Date {
    // Garante timezone local consistente
    return new Date(iso + "T00:00:00");
}

function formatISODate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function startOfWeekMonday(d: Date): Date {
    const r = new Date(d);
    const dow = r.getDay(); // 0=Dom, 1=Seg, ... 6=Sab
    const diff = dow === 0 ? -6 : 1 - dow; // volta para segunda-feira
    r.setDate(r.getDate() + diff);
    return r;
}

function endOfWeekFromStartMonday(d: Date): Date {
    // dado o início de semana (segunda), soma 6 para chegar ao domingo
    return addDays(d, 6);
}

function useCurrentUser() {
    const [user, setUser] = useState<any | null>(null);
    useEffect(() => {
        try {
            const raw = localStorage.getItem("currentUser");
            setUser(raw ? JSON.parse(raw) : null);
        } catch {
            setUser(null);
        }
        const onStorage = (e: StorageEvent) => {
            if (e.key === "currentUser") {
                try {
                    setUser(e.newValue ? JSON.parse(e.newValue) : null);
                } catch {
                    setUser(null);
                }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    const isAdmin = useMemo(() => {
        const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
        if (roles.includes("admin")) return true;
        const patent = user?.patent;
        return !!(patent && patent !== "soldado");
    }, [user]);
    return { user, isAdmin };
}

function isValidMapUrl(value: string): boolean {
    if (!value || typeof value !== "string") return false;
    try {
        const u = new URL(value.trim());
        const host = u.hostname.toLowerCase();
        // aceita domínios do Google (inclui .com, .com.br, etc) e shorteners do maps
        const isGoogle = host.includes("google.") || host.includes("google.com");
        const isMapsShort = host.includes("maps.app.goo.gl") || host.includes("goo.gl");
        return (u.protocol === "http:" || u.protocol === "https:") && (isGoogle || isMapsShort);
    } catch {
        return false;
    }
}

function buildEmbedSrc(value: string): string {
    // Se já for um embed do Google Maps, usa direto
    try {
        const u = new URL(value);
        if (u.hostname.includes("google.com") && (u.pathname.includes("/maps/embed") || u.searchParams.get("output") === "embed")) {
            return value;
        }
    } catch { /* ignore */ }
    // Caso contrário, usa o q= com a URL original para o Maps resolver
    return `https://www.google.com/maps?output=embed&q=${encodeURIComponent(value)}`;
}

async function ensureLeafletLoaded(): Promise<any | null> {
    if ((window as any).L) return (window as any).L;
    // CSS
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }
    // JS
    await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[src*="leaflet@1.9.4"]') as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject());
            if ((window as any).L) resolve();
            return;
        }
        const s = document.createElement("script");
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.head.appendChild(s);
    });
    return (window as any).L || null;
}

type FormState = {
    nome_jogo: string;
    data_jogo: string;
    local_jogo: string;
    descricao_jogo: string;
    hora_inicio: string;
    hora_fim: string;
    localizacao: string;
};

const emptyForm = (data_jogo: string): FormState => ({
    nome_jogo: "",
    data_jogo,
    local_jogo: "",
    descricao_jogo: "",
    hora_inicio: "09:00",
    hora_fim: "11:00",
    localizacao: ""
});

export default function JogosSection() {
    const { isAdmin } = useCurrentUser();
    const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
    const [viewDate, setViewDate] = useState<Date>(() => parseISODate(getTodayISO()));
    const [jogos, setJogos] = useState<Jogo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);
    const [ready, setReady] = useState(false);

    // UI state para criar/editar
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [form, setForm] = useState<FormState>(emptyForm(selectedDate));
    const isEditing = !!editingId;
    const [autoUpdating, setAutoUpdating] = useState<boolean>(false);
    const [mapPickerOpen, setMapPickerOpen] = useState<boolean>(false);
    const [mapPickerLoading, setMapPickerLoading] = useState<boolean>(false);
    const [mapPickerQuery, setMapPickerQuery] = useState<string>("");
    const [mapPickerResults, setMapPickerResults] = useState<any[]>([]);
    const [mapPickerPos, setMapPickerPos] = useState<{ lat: number; lng: number } | null>(null);
    const mapRef = useState<{ el: HTMLDivElement | null; map: any | null; marker: any | null }>({ el: null, map: null, marker: null })[0];

    const mapUrlValue = (form.localizacao || "").trim();
    const isMapUrlInvalid = mapUrlValue.length > 0 && !isValidMapUrl(mapUrlValue);

    useEffect(() => {
        setForm((prev) => ({ ...prev, data_jogo: selectedDate }));
        // Ajusta o mês em exibição ao escolher uma data
        setViewDate(parseISODate(selectedDate));
    }, [selectedDate]);

    async function fetchJogos() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/jogos", { method: "GET" });
            if (!res.ok) throw new Error(`Erro ao buscar jogos (${res.status})`);
            const data = (await res.json()) as Jogo[];
            setJogos(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.message || "Falha ao carregar jogos");
        } finally {
            setLoading(false);
        }
    }

    // Lazy load: só busca quando a seção entrar na viewport
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) setReady(true);
                }
            },
            { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!ready) return;
        fetchJogos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    const jogosDoDia = useMemo(() => {
        return jogos.filter((j) => j.data_jogo === selectedDate);
    }, [jogos, selectedDate]);

    function computeStatus(j: Jogo): 'scheduled' | 'canceled' | 'completed' {
        if (j.status === 'canceled') return 'canceled';
        // Se já estiver explicitamente completed, respeita
        if (j.status === 'completed') return 'completed';
        // Calcula a partir de data e hora_fim
        try {
            const end = new Date(`${j.data_jogo}T${(j.hora_fim || '23:59')}:00`);
            if (!isNaN(end.getTime()) && end.getTime() < Date.now()) return 'completed';
        } catch { /* ignore */ }
        return 'scheduled';
    }

    async function updateStatus(id: string, status: 'scheduled' | 'canceled' | 'completed') {
        try {
            const res = await fetch(`/api/jogos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || "Erro ao atualizar status");
            }
            await fetchJogos();
        } catch (e: any) {
            setError(e?.message || "Falha ao atualizar status");
        }
    }

    // Modais de confirmação
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [confirmCancelLoading, setConfirmCancelLoading] = useState(false);
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
    const [confirmCancelName, setConfirmCancelName] = useState<string>("");

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

    async function handleCancelConfirm() {
        if (!confirmCancelId) return;
        setConfirmCancelLoading(true);
        try {
            await updateStatus(confirmCancelId, 'canceled');
        } finally {
            setConfirmCancelLoading(false);
            setConfirmCancelOpen(false);
            setConfirmCancelId(null);
            setConfirmCancelName("");
        }
    }

    // Marca automaticamente como completed quando passar do horário de fim
    useEffect(() => {
        let canceled = false;
        (async () => {
            // Evita loop de atualizações contínuas
            if (autoUpdating) return;
            setAutoUpdating(true);
            try {
                const toComplete = jogos.filter((j) => computeStatus(j) === 'completed' && j.status !== 'completed' && j.status !== 'canceled');
                for (const j of toComplete) {
                    if (canceled) break;
                    await updateStatus(j.id, 'completed');
                }
            } finally {
                setAutoUpdating(false);
            }
        })();
        return () => { canceled = true; };
    }, [jogos]);

    const jogosCountByDate = useMemo(() => {
        const m = new Map<string, number>();
        for (const j of jogos) {
            const key = j.data_jogo;
            m.set(key, (m.get(key) || 0) + 1);
        }
        return m;
    }, [jogos]);

    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const monthLabel = useMemo(() => {
        try {
            const fmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
            // capitalize
            const s = fmt.format(viewDate);
            return s.charAt(0).toUpperCase() + s.slice(1);
        } catch {
            return `${viewDate.getMonth() + 1}/${viewDate.getFullYear()}`;
        }
    }, [viewDate]);

    const calendarDays = useMemo(() => {
        const startMonth = startOfMonth(viewDate);
        const endMonth = endOfMonth(viewDate);
        const start = startOfWeekMonday(startMonth);
        const end = endOfWeekFromStartMonday(startOfWeekMonday(endMonth));
        const days: Date[] = [];
        let cursor = start;
        while (cursor <= end) {
            days.push(cursor);
            cursor = addDays(cursor, 1);
        }
        return days;
    }, [viewDate]);

    function resetForm(date: string) {
        setEditingId(null);
        setForm(emptyForm(date));
    }

    function handleEdit(jogo: Jogo) {
        setEditingId(jogo.id);
        setForm({
            nome_jogo: jogo.nome_jogo || "",
            data_jogo: jogo.data_jogo || selectedDate,
            local_jogo: jogo.local_jogo || "",
            descricao_jogo: jogo.descricao_jogo || "",
            hora_inicio: jogo.hora_inicio || "09:00",
            hora_fim: jogo.hora_fim || "11:00",
            localizacao: jogo.localizacao || ""
        });
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const payload: any = {
            ...form,
            confirmations: [] as Confirmation[]
        };
        // Se estava cancelado e estamos editando, volta para agendado
        if (isEditing && editingId) {
            const old = jogos.find((x) => x.id === editingId) || null;
            if (old && computeStatus(old) === 'canceled') {
                payload.status = 'scheduled';
            }
        }
        try {
            const res = await fetch(isEditing ? `/api/jogos/${editingId}` : "/api/jogos", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const detail = await safeJson(res);
                throw new Error(detail?.error || `Erro ao ${isEditing ? "atualizar" : "criar"} jogo`);
            }
            await fetchJogos();
            setShowForm(false);
            resetForm(selectedDate);
        } catch (e: any) {
            setError(e?.message || "Falha ao salvar jogo");
        }
    }

    async function handleDeleteConfirm() {
        if (!confirmDeleteId) return;
        setError(null);
        try {
            const res = await fetch(`/api/jogos/${confirmDeleteId}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) {
                const detail = await safeJson(res);
                throw new Error(detail?.error || "Erro ao excluir jogo");
            }
            await fetchJogos();
        } catch (e: any) {
            setError(e?.message || "Falha ao excluir jogo");
        } finally {
            setConfirmDeleteLoading(false);
            setConfirmDeleteOpen(false);
            setConfirmDeleteId(null);
            setConfirmDeleteName("");
        }
    }

    return (
        <section className="max-w-7xl mx-auto" ref={sectionRef as any}>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Calendário de Jogos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendário e ações */}
                <div className="rounded-lg bg-white shadow p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                aria-label="Mês anterior"
                                className="p-2 rounded border border-slate-300 hover:bg-slate-100"
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M15.53 4.47a.75.75 0 0 1 0 1.06L9.06 12l6.47 6.47a.75.75 0 1 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <div className="text-base font-medium text-slate-900">{monthLabel}</div>
                            <button
                                aria-label="Próximo mês"
                                className="p-2 rounded border border-slate-300 hover:bg-slate-100"
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M8.47 4.47a.75.75 0 0 1 1.06 0l7 7a.75.75 0 0 1 0 1.06l-7 7a.75.75 0 1 1-1.06-1.06L14.94 12 8.47 5.53a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        {isAdmin && (
                            <button
                                aria-label="Adicionar jogo"
                                className="ml-auto p-2 rounded border border-slate-300 hover:bg-slate-50"
                                onClick={() => {
                                    resetForm(selectedDate);
                                    setShowForm(true);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Cabeçalho dos dias da semana */}
                    <div className="mt-4 grid grid-cols-7 gap-1 text-xs text-slate-500">
                        {weekDays.map((wd) => (
                            <div key={wd} className="text-center py-1">{wd}</div>
                        ))}
                    </div>
                    {/* Grade do calendário */}
                    <div className="grid grid-cols-7 gap-1 mt-1">
                        {calendarDays.map((day) => {
                            const dStr = formatISODate(day);
                            const inMonth = day.getMonth() === viewDate.getMonth();
                            const isSelected = dStr === selectedDate;
                            const isToday = dStr === getTodayISO();
                            const count = jogosCountByDate.get(dStr) || 0;
                            const base = "relative h-16 p-2 rounded cursor-pointer select-none";
                            const color =
                                isSelected
                                    ? "bg-slate-900 text-white"
                                    : inMonth
                                        ? "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200"
                                        : "bg-white text-slate-400 border border-slate-200";
                            const ring = !isSelected && isToday ? " ring-1 ring-slate-900" : "";
                            return (
                                <div
                                    key={dStr}
                                    className={`${base} ${color}${ring}`}
                                    onClick={() => setSelectedDate(dStr)}
                                >
                                    <div className="text-sm">{day.getDate()}</div>
                                    {count > 0 && (
                                        <div className="absolute right-1 bottom-1">
                                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px]">
                                                {count}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Modal de criação/edição (somente admin) */}
                {isAdmin && showForm && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); resetForm(selectedDate); }}></div>
                        <div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] max-w-2xl p-4 sm:p-6 mx-2">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold">{isEditing ? "Editar jogo" : "Criar jogo"}</h4>
                                <button className="p-2 rounded hover:bg-slate-100" onClick={() => { setShowForm(false); resetForm(selectedDate); }} aria-label="Fechar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-sm text-slate-600">Nome do jogo</label>
                                    <input
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        value={form.nome_jogo}
                                        onChange={(e) => setForm((f) => ({ ...f, nome_jogo: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Data</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        value={form.data_jogo}
                                        onChange={(e) => setForm((f) => ({ ...f, data_jogo: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Local</label>
                                    <input
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        value={form.local_jogo}
                                        onChange={(e) => setForm((f) => ({ ...f, local_jogo: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Início</label>
                                    <input
                                        type="time"
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        value={form.hora_inicio}
                                        onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600">Fim</label>
                                    <input
                                        type="time"
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        value={form.hora_fim}
                                        onChange={(e) => setForm((f) => ({ ...f, hora_fim: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm text-slate-600">Localização (URL do Google Maps do campo)</label>
                                    <input
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        placeholder="Ex.: https://www.google.com/maps/embed?pb=..."
                                        value={form.localizacao}
                                        onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))}
                                        required
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-sm"
                                            onClick={() => {
                                                setMapPickerOpen(true);
                                                setTimeout(async () => {
                                                    try {
                                                        setMapPickerLoading(true);
                                                        const L = await ensureLeafletLoaded();
                                                        if (!L) return;
                                                        if (!mapRef.el) return;
                                                        if (mapRef.map) {
                                                            try { mapRef.map.remove(); } catch { }
                                                            mapRef.map = null;
                                                            mapRef.marker = null;
                                                        }
                                                        let initial = mapPickerPos as { lat: number; lng: number } | null;
                                                        if (!initial) {
                                                            const userPos = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
                                                                try {
                                                                    if (!navigator.geolocation) return resolve(null);
                                                                    navigator.geolocation.getCurrentPosition(
                                                                        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                                                        () => resolve(null),
                                                                        { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
                                                                    );
                                                                } catch {
                                                                    resolve(null);
                                                                }
                                                            });
                                                            if (userPos) {
                                                                initial = userPos;
                                                                setMapPickerPos(userPos);
                                                            }
                                                        }
                                                        if (!initial) initial = { lat: -22.47447035292868, lng: -45.61494031678348 }; // fallback: Brasil (Brazopolis)
                                                        mapRef.map = L.map(mapRef.el).setView([initial.lat, initial.lng], mapPickerPos ? 12 : 14);
                                                        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                                                            attribution: '&copy; OpenStreetMap contributors'
                                                        }).addTo(mapRef.map);
                                                        mapRef.marker = L.marker([initial.lat, initial.lng]).addTo(mapRef.map);
                                                        mapRef.map.on("click", (e: any) => {
                                                            const { lat, lng } = e.latlng || e;
                                                            setMapPickerPos({ lat, lng });
                                                            if (mapRef.marker) {
                                                                mapRef.marker.setLatLng([lat, lng]);
                                                            } else {
                                                                mapRef.marker = L.marker([lat, lng]).addTo(mapRef.map);
                                                            }
                                                        });
                                                    } finally {
                                                        setMapPickerLoading(false);
                                                    }
                                                }, 0);
                                            }}
                                        >
                                            Selecionar no mapa
                                        </button>
                                        {isMapUrlInvalid && (
                                            <span className="text-xs text-rose-600">Informe uma URL válida do Google Maps</span>
                                        )}
                                    </div>
                                    {isMapUrlInvalid && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            Informe uma URL válida do Google Maps (do campo).
                                        </p>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm text-slate-600">Descrição</label>
                                    <textarea
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
                                        rows={3}
                                        value={form.descricao_jogo}
                                        onChange={(e) => setForm((f) => ({ ...f, descricao_jogo: e.target.value }))}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="md:col-span-2 text-sm text-red-600">{error}</div>
                                )}
                                <div className="md:col-span-2 flex items-center justify-end gap-3 mt-1">
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
                                        onClick={() => { setShowForm(false); resetForm(selectedDate); }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={isMapUrlInvalid}

                                    >
                                        {isEditing ? "Salvar" : "Criar jogo"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Confirmar Cancelamento */}
                {confirmCancelOpen && (
                    <div className="fixed inset-0 z-[2100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmCancelOpen(false)}></div>
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h4 className="text-lg font-semibold mb-2">Cancelar jogo</h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Tem certeza que deseja cancelar o jogo {confirmCancelName ? `"${confirmCancelName}"` : ""}? Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setConfirmCancelOpen(false)} disabled={confirmCancelLoading}>
                                    Voltar
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                                    onClick={handleCancelConfirm}
                                    disabled={confirmCancelLoading}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Confirmar Exclusão */}
                {confirmDeleteOpen && (
                    <div className="fixed inset-0 z-[2100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteOpen(false)}></div>
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h4 className="text-lg font-semibold mb-2">Excluir jogo</h4>
                            <p className="text-sm text-slate-600 mb-4">
                                Tem certeza que deseja excluir o jogo {confirmDeleteName ? `"${confirmDeleteName}"` : ""}? Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setConfirmDeleteOpen(false)} disabled={confirmDeleteLoading}>
                                    Voltar
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                    onClick={handleDeleteConfirm}
                                    disabled={confirmDeleteLoading}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Seletor de Mapa */}
                {isAdmin && mapPickerOpen && (
                    <div className="fixed inset-0 z-[2100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMapPickerOpen(false)}></div>
                        <div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] max-w-3xl p-4 sm:p-6 mx-2">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold">Selecionar localização no mapa</h4>
                                <button className="p-2 rounded hover:bg-slate-100" onClick={() => setMapPickerOpen(false)} aria-label="Fechar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-3 flex items-center gap-2">
                                <input
                                    className="flex-1 border border-slate-300 rounded px-3 py-2"
                                    placeholder="Buscar endereço, nome do campo..."
                                    value={mapPickerQuery}
                                    onChange={(e) => setMapPickerQuery(e.target.value)}
                                />
                                <button
                                    className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                                    onClick={async () => {
                                        if (!mapPickerQuery.trim()) return;
                                        try {
                                            setMapPickerLoading(true);
                                            const q = encodeURIComponent(mapPickerQuery.trim());
                                            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${q}`, {
                                                headers: { "Accept-Language": "pt-BR" }
                                            });
                                            const data = await resp.json();
                                            setMapPickerResults(Array.isArray(data) ? data : []);
                                        } finally {
                                            setMapPickerLoading(false);
                                        }
                                    }}
                                    type="button"
                                    disabled={mapPickerLoading}
                                >
                                    {mapPickerLoading ? "Buscando..." : "Buscar"}
                                </button>
                            </div>
                            {mapPickerResults.length > 0 && (
                                <div className="mb-3 max-h-40 overflow-auto border border-slate-200 rounded">
                                    {mapPickerResults.map((r: any, idx: number) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-b-0"
                                            onClick={() => {
                                                const lat = parseFloat(r.lat);
                                                const lng = parseFloat(r.lon);
                                                setMapPickerPos({ lat, lng });
                                                try {
                                                    const L = (window as any).L;
                                                    if (L && mapRef.map) {
                                                        mapRef.map.setView([lat, lng], 15);
                                                        if (mapRef.marker) mapRef.marker.setLatLng([lat, lng]);
                                                        else mapRef.marker = L.marker([lat, lng]).addTo(mapRef.map);
                                                    }
                                                } catch { }
                                            }}
                                        >
                                            <div className="text-sm text-slate-800">{r.display_name}</div>
                                            <div className="text-xs text-slate-500">{r.type} • {r.class}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="w-full h-80 rounded border overflow-hidden mb-3">
                                <div ref={(el) => (mapRef.el = el)} className="w-full h-full" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setMapPickerOpen(false)} type="button">
                                    Cancelar
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                    onClick={() => {
                                        if (!mapPickerPos) return;
                                        const { lat, lng } = mapPickerPos;
                                        const url = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(`${lat},${lng}`)}`;
                                        setForm((f) => ({ ...f, localizacao: url }));
                                        // limpar campos do seletor
                                        setMapPickerQuery("");
                                        setMapPickerResults([]);
                                        setMapPickerPos(null);
                                        setMapPickerOpen(false);
                                    }}
                                    type="button"
                                    disabled={!mapPickerPos}
                                >
                                    Usar este local
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Painel do dia selecionado */}
                <div className="rounded-lg bg-white shadow p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900">
                            {new Date(selectedDate + "T00:00:00").toLocaleDateString()}
                        </h3>
                        <span className="text-sm text-slate-500">
                            {loading ? "Carregando..." : `${jogosDoDia.length} jogo(s)`}
                        </span>
                    </div>
                    {error && !showForm && (
                        <div className="mt-3 text-sm text-red-600">{error}</div>
                    )}
                    <ul className="mt-4 space-y-3">
                        {jogosDoDia.map((j) => (
                            <li key={j.id} className="border border-slate-200 rounded p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-slate-900">{j.nome_jogo}</div>
                                            {/* Badge de status */}
                                            {(() => {
                                                const st = computeStatus(j);
                                                const map: Record<string, { label: string; cls: string }> = {
                                                    scheduled: { label: "Agendado", cls: "bg-slate-100 text-slate-700" },
                                                    canceled: { label: "Cancelado", cls: "bg-rose-100 text-rose-700" },
                                                    completed: { label: "Concluído", cls: "bg-emerald-100 text-emerald-700" },
                                                };
                                                const it = map[st];
                                                return <span className={`text-[11px] px-2 py-0.5 rounded ${it.cls}`}>{it.label}</span>;
                                            })()}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            {j.hora_inicio} - {j.hora_fim} • {j.local_jogo}
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                aria-label="Editar"
                                                className="p-2 rounded hover:bg-slate-100 disabled:opacity-50"
                                                onClick={() => handleEdit(j)}
                                                disabled={computeStatus(j) === 'completed'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                </svg>
                                            </button>
                                            {computeStatus(j) === 'scheduled' && (
                                                <button
                                                    className="px-2 py-1 rounded text-xs bg-rose-600 text-white hover:bg-rose-500"
                                                    onClick={() => {
                                                        setConfirmCancelId(j.id);
                                                        setConfirmCancelName(j.nome_jogo || "");
                                                        setConfirmCancelOpen(true);
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                            <button
                                                aria-label="Excluir"
                                                className="p-2 rounded hover:bg-red-50"
                                                onClick={() => {
                                                    setConfirmDeleteId(j.id);
                                                    setConfirmDeleteName(j.nome_jogo || "");
                                                    setConfirmDeleteOpen(true);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h10z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {j.descricao_jogo && (
                                    <p className="mt-2 text-sm text-slate-700">{j.descricao_jogo}</p>
                                )}
                                {j.localizacao && (
                                    <div className="mt-1">
                                        {/* <p className="text-xs text-slate-500">Localização: {j.localizacao}</p> */}
                                        <div className="mt-2 w-full h-40 rounded border overflow-hidden">
                                            <iframe
                                                title={`Mapa de ${j.nome_jogo}`}
                                                className="w-full h-full"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                src={buildEmbedSrc(j.localizacao)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    {!loading && jogosDoDia.length === 0 && (
                        <div className="mt-4 text-sm text-slate-600">
                            Nenhum jogo marcado para esta data.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

async function safeJson(res: Response): Promise<any | null> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/* Modais de confirmação */
export function JogosConfirmModals({
    confirmCancelOpen, setConfirmCancelOpen, confirmCancelLoading, confirmCancelName, onCancelConfirm,
    confirmDeleteOpen, setConfirmDeleteOpen, confirmDeleteLoading, confirmDeleteName, onDeleteConfirm
}: {
    confirmCancelOpen: boolean; setConfirmCancelOpen: (v: boolean) => void; confirmCancelLoading: boolean; confirmCancelName: string; onCancelConfirm: () => void;
    confirmDeleteOpen: boolean; setConfirmDeleteOpen: (v: boolean) => void; confirmDeleteLoading: boolean; confirmDeleteName: string; onDeleteConfirm: () => void;
}) {
    return null;
}