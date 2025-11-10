import { useEffect, useState } from "react";

function UserIcon({ size = 36 }: { size?: number }) {
    return (
        <div className="flex items-center justify-center rounded-full bg-slate-200 border border-slate-300 shadow-sm"
            style={{ width: size, height: size }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-600">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z"></path>
                <path d="M12 14c-4.418 0-8 2.239-8 5v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.761-3.582-5-8-5z"></path>
            </svg>
        </div>
    );
}

function PersonNode({ name, color, picture }: { name: string; color: "rose" | "amber" | "slate"; picture?: string | null }) {
    const bg =
        color === "rose" ? "bg-rose-500" :
            color === "amber" ? "bg-amber-500" : "bg-slate-600";
    const ring =
        color === "rose" ? "ring-rose-200" :
            color === "amber" ? "ring-amber-200" : "ring-slate-200";
    const src = (picture && String(picture).trim().length ? picture : "/path_gost.svg") as string;
    const isDefault = src === "/path_gost.svg";
    return (
        <div className="flex flex-col items-center">
            <div
                className={`rounded-full overflow-hidden ${!isDefault ? `${bg} ring-2 ${ring}` : ""}`}
                style={{ width: 36, height: 36 }}
            >
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src.endsWith("/path_gost.svg")) return;
                        img.src = "/path_gost.svg";
                    }}
                />
            </div>
            <div className="mt-1 text-[11px] leading-none text-slate-700 text-center break-words max-w-full">{name}</div>
        </div>
    );
}

type DbUser = {
    id: string;
    email: string;
    name?: string | null;
    picture?: string | null;
    roles: string[];
    comando_geral_id: string[];
    comando_squad_id: string | null;
    patent: "comando" | "comando_squad" | "soldado" | "sub_comando";
};

export default function Membros() {
    const [usuarios, setUsuarios] = useState<DbUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const r = await fetch("/api/users");
                const j = await r.json();
                if (!r.ok) throw new Error(j?.error || "Falha ao carregar usuários");
                setUsuarios(Array.isArray(j) ? j : []);
            } catch (e: any) {
                setError(e?.message || "Erro ao carregar");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    return (
        <section id="membros" className="overflow-x-hidden">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">Membros e Cadeia de Comando</h1>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                {loading && <p className="text-slate-600">Carregando...</p>}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <h2 className="text-2xl font-semibold text-slate-700">Árvore Hierárquica</h2>
                </div>

                {/* Legenda simples */}
                <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-700">
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-rose-500" /> Comando
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Comando de squad
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-slate-600" /> Soldado
                    </span>
                </div>

                {/* Árvore dinâmica a partir do banco */}
                {!loading && !error && (
                    <>
                        <div className="hidden md:block">
                            <Hierarquia data={usuarios} />
                        </div>
                        <div className="md:hidden overflow-x-hidden">
                            <HierarquiaMobile data={usuarios} />
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function Hierarquia({ data }: { data: DbUser[] }) {
    const byPatent = {
        comando: data.filter((u) => u.patent === "comando"),
        squads: data.filter((u) => u.patent === "comando_squad"),
        soldados: data.filter((u) => u.patent === "soldado")
    };

    const squadsByComando: Record<string, DbUser[]> = {};
    byPatent.comando.forEach((c) => {
        squadsByComando[c.id] = byPatent.squads.filter((s) => s.comando_geral_id.includes(c.id));
    });

    const soldadosBySquadCmd: Record<string, DbUser[]> = {};
    byPatent.squads.forEach((s) => {
        soldadosBySquadCmd[s.id] = byPatent.soldados.filter((u) => u.comando_squad_id === s.id);
    });

    return (
        <div className="flex flex-col items-center">
            {/* Comando */}
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Comando</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl items-start justify-items-center">
                {byPatent.comando.map((c) => (
                    <div key={c.id} className="flex flex-col items-center w-full">
                        <PersonNode name={c.name || c.email} color="rose" picture={c.picture} />

                        {/* Linha descendo do comando */}
                        <div className="h-6 w-px bg-slate-300 mt-2"></div>

                        {/* Linha horizontal e grid de comandos de squad desse comando */}
                        <div className="relative w-full">
                            <div className="absolute left-6 right-6 top-0 h-px bg-slate-300"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-3 place-items-center">
                                {squadsByComando[c.id].map((sq) => (
                                    <div key={sq.id} className="flex flex-col items-center w-full">
                                        <PersonNode name={sq.name || sq.email} color="amber" picture={sq.picture} />
                                        {/* Conector para soldados do squad */}
                                        {soldadosBySquadCmd[sq.id]?.length ? (
                                            <>
                                                <div className="h-6 w-px bg-slate-300 mt-2"></div>
                                                <div className="relative w-full">
                                                    <div className="absolute left-8 right-8 top-0 h-px bg-slate-300"></div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 place-items-center">
                                                        {soldadosBySquadCmd[sq.id].map((sd) => (
                                                            <PersonNode key={sd.id} name={sd.name || sd.email} color="slate" picture={sd.picture} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HierarquiaMobile({ data }: { data: DbUser[] }) {
    const byPatent = {
        comando: data.filter((u) => u.patent === "comando"),
        squads: data.filter((u) => u.patent === "comando_squad"),
        soldados: data.filter((u) => u.patent === "soldado")
    };
    const squadsByComando: Record<string, DbUser[]> = {};
    byPatent.comando.forEach((c) => {
        squadsByComando[c.id] = byPatent.squads.filter((s) => s.comando_geral_id.includes(c.id));
    });
    const soldadosBySquadCmd: Record<string, DbUser[]> = {};
    byPatent.squads.forEach((s) => {
        soldadosBySquadCmd[s.id] = byPatent.soldados.filter((u) => u.comando_squad_id === s.id);
    });

    return (
        <div className="grid gap-3 overflow-x-hidden">
            {byPatent.comando.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm w-full">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0"><UserIcon /></div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 break-words">{c.name || c.email}</div>
                            <div className="text-[11px] text-rose-600">Comando</div>
                        </div>
                    </div>
                    {squadsByComando[c.id]?.length ? (
                        <div className="mt-3">
                            <div className="text-xs font-medium text-slate-700 mb-1">Comandos de squad</div>
                            <div className="grid gap-2">
                                {squadsByComando[c.id].map((sq) => (
                                    <div key={sq.id} className="rounded border border-slate-200 p-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-xs font-semibold text-slate-800 break-words">{sq.name || sq.email}</div>
                                            <span className="text-[11px] text-amber-600">Comando de squad</span>
                                        </div>
                                        {soldadosBySquadCmd[sq.id]?.length ? (
                                            <div className="mt-1 text-[11px] text-slate-600">{soldadosBySquadCmd[sq.id].length} soldados</div>
                                        ) : (
                                            <div className="mt-1 text-[11px] text-slate-400">Sem soldados</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    );
}