import type { SectionKey } from "../App";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
	active: SectionKey;
	onChange: (section: SectionKey) => void;
};

const items: { key: SectionKey; label: string }[] = [
	{ key: "inicio", label: "Início" },
	{ key: "recrutamento", label: "Recrutamento (Q&A)" },
	{ key: "hierarquia", label: "Hierarquia" },
	{ key: "disciplina", label: "Conduta e Disciplina" },
	{ key: "uniformes", label: "Uniformes (Kit GOST)" },
	{ key: "briefing", label: "Briefing de Missão" },
	{ key: "logistica", label: "Logística e Horários" },
	{ key: "membros", label: "Membros" },
	{ key: "configuracao", label: "Configuração" }
];

export default function MobileHeader({ active, onChange }: Props) {
	const [open, setOpen] = useState(false);
	const [userOpen, setUserOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement | null>(null);
	const googleBtnRef = useRef<HTMLDivElement | null>(null);
	const [currentUser, setCurrentUser] = useState<any | null>(() => {
		try {
			const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	});

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === "currentUser") {
				try { setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { setCurrentUser(null); }
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (!userOpen) return;
			const el = userMenuRef.current;
			if (el && !el.contains(e.target as Node)) setUserOpen(false);
		};
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [userOpen]);

	// Renderiza botão de login Google no mobile quando deslogado
	useEffect(() => {
		if (currentUser || !open) return; // somente quando o menu estiver aberto e deslogado
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
									let hydrated = j;
									try {
										if (j?.id) {
											const g = await fetch(`/api/users/${j.id}`);
											if (g.ok) {
												const full = await g.json();
												hydrated = { ...j, ...full };
											}
										}
									} catch (_e) { }
									try { localStorage.setItem("currentUser", JSON.stringify(hydrated)); } catch (_e) { }
									setCurrentUser(hydrated);
									setUserOpen(false);
									setOpen(false);
								} else {
									console.error("Falha no login:", j);
								}
							} catch (e) {
								console.error(e);
							}
						}
					});
					try { googleBtnRef.current.innerHTML = ""; } catch (_e) { }
					(window as any).google.accounts.id.renderButton(googleBtnRef.current, {
						theme: "outline",
						size: "large",
						type: "standard",
						shape: "rectangular",
						text: "signin_with"
					});
				} catch (_e) { }
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
		const id = setTimeout(ensureScriptAndRender, 0);
		return () => clearTimeout(id);
	}, [open, currentUser]);

	const canAccessConfig = useMemo(() => {
		if (!currentUser) return false;
		if (Array.isArray(currentUser?.roles) && currentUser.roles.includes("admin")) return true;
		const patent = currentUser?.patent;
		return patent && patent !== "soldado";
	}, [currentUser]);
	return (
		<header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white border-b border-slate-700">
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex flex-col items-start gap-1">
					<div className="flex flex-row items-center gap-2 relative" ref={userMenuRef}>
						{/* Ícone de usuário à esquerda com avatar (só logado) */}
						{currentUser && (
							<button
								aria-label="Abrir usuário"
								className="p-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								onClick={() => setUserOpen((v) => !v)}
							>
								{currentUser?.picture ? (
									<img
										src={currentUser.picture}
										alt={currentUser?.name || "Usuário"}
										className="w-8 h-8 rounded-full object-cover"
										referrerPolicy="no-referrer"
										crossOrigin="anonymous"
									/>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
										<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z" />
									</svg>
								)}
							</button>
						)}
						{/* <a href="/"><img src="/path_gost.svg" alt="Logo GOST" className="w-8 h-8 object-cover rounded-md" /></a> */}
						<span className="font-semibold">GOST</span>
						{userOpen && (
							<div className="absolute top-10 left-0 bg-white text-slate-800 rounded shadow-lg border border-slate-200 py-2 min-w-40 z-50">
								{canAccessConfig && (
									<button
										className="w-full text-left px-4 py-2 hover:bg-slate-100"
										onClick={() => {
											onChange("configuracao");
											setUserOpen(false);
										}}
									>
										Configuração
									</button>
								)}
								{currentUser && (
									<button
										className="w-full text-left px-4 py-2 hover:bg-slate-100"
										onClick={() => {
											try {
												if ((window as any).google?.accounts?.id?.disableAutoSelect) {
													(window as any).google.accounts.id.disableAutoSelect();
												}
												const email = currentUser?.email;
												if (email && (window as any).google?.accounts?.id?.revoke) {
													try { (window as any).google.accounts.id.revoke(email, () => { }); } catch { }
												}
											} catch { }
											try { localStorage.removeItem("currentUser"); } catch { }
											setCurrentUser(null);
											setUserOpen(false);
										}}
									>
										Sair
									</button>
								)}
							</div>
						)}
					</div>
					<span className="text-xs text-white italic text-left">Grupamento Operacional de Supressão Tatica</span>
				</div>
				<button
					aria-label="Abrir menu"
					className="p-2 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
					onClick={() => setOpen((v) => !v)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
						<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				</button>
			</div>
			{open && (
				<nav className="px-2 pb-3">
					<ul>
						{items.map((item) => (
							<li key={item.key}>
								<a
									href={item.key === "inicio" ? "/" : `/${item.key}`}
									className={`nav-link block px-3 py-2 rounded text-base ${active === item.key ? "active" : ""}`}
									onClick={(e) => {
										e.preventDefault();
										onChange(item.key);
										setOpen(false);
									}}
								>
									{item.label}
								</a>
							</li>
						))}
					</ul>
					{!currentUser && (
						<div className="mt-3">
							<div ref={googleBtnRef} className="inline-flex"></div>
						</div>
					)}
				</nav>
			)}
		</header>
	);
}