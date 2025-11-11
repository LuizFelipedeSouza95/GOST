import { useEffect, useMemo, useRef, useState } from "react";

type Jogo = { id: string; nome_jogo: string; data_jogo: string; descricao_jogo?: string; capa_url?: string | null };
type GaleriaItem = {
	id: string;
	imagem_url: string;
	jogo_id: string | null;
	is_operacao: boolean;
	nome_operacao?: string | null;
	data_operacao?: string | null;
	descricao?: string | null;
	createdAt?: string;
};

export default function Galeria() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jogos, setJogos] = useState<Jogo[]>([]);
	const [jogosOffset, setJogosOffset] = useState(0);
	const [jogosHasMore, setJogosHasMore] = useState(true);
	const [loadingJogos, setLoadingJogos] = useState(false);
	const sectionRef = useRef<HTMLElement | null>(null);
	const [ready, setReady] = useState(false);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [idJogo, setIdJogo] = useState<string>(""); // jogo alvo do modal de fotos
	const [descricao, setDescricao] = useState("");
	const [toDelete, setToDelete] = useState<GaleriaItem | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);

	// modal criar nova galeria
	const [createOpen, setCreateOpen] = useState(false);
	const [novoNome, setNovoNome] = useState("");
	const [novaData, setNovaData] = useState("");
	const [createFiles, setCreateFiles] = useState<File[]>([]);
	const [creating, setCreating] = useState(false);
	// alterar capa
	const [coverOpen, setCoverOpen] = useState(false);
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [coverSaving, setCoverSaving] = useState(false);

	// fotos do jogo (detalhe) com paginação
	const [fotos, setFotos] = useState<GaleriaItem[]>([]);
	const [fotosOffset, setFotosOffset] = useState(0);
	const [fotosHasMore, setFotosHasMore] = useState(true);
	const [loadingFotos, setLoadingFotos] = useState(false);
	const modalScrollRef = useRef<HTMLDivElement | null>(null);
	const fotosBottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		try {
			const raw = localStorage.getItem("currentUser");
			if (raw) {
				const u = JSON.parse(raw);
				const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
				const patent = String(u?.patent || "").toLowerCase();
				const admin = roles.includes("admin") || patent.includes("comandante");
				setIsAdmin(!!admin);
			}
		} catch { }
	}, []);

	// Lazy load da seção (IntersectionObserver)
	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						setReady(true);
					}
				}
			},
			{ root: null, rootMargin: "200px", threshold: 0.01 }
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	// Carregar primeira página de jogos quando a seção estiver pronta
	useEffect(() => {
		if (!ready || loadingJogos || jogos.length > 0) return;
		loadMoreJogos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ready]);

	async function loadMoreJogos() {
		if (loadingJogos || !jogosHasMore) return;
		try {
			setLoadingJogos(true);
			const limit = 12;
			const res = await fetch(`/api/jogos?offset=${jogosOffset}&limit=${limit}&order=desc`);
			const arr = await res.json().catch(() => []);
			if (!res.ok) throw new Error("Falha ao carregar jogos");
			const next = Array.isArray(arr) ? arr : [];
			setJogos((prev) => [...prev, ...next]);
			setJogosOffset((prev) => prev + next.length);
			if (next.length < limit) setJogosHasMore(false);
		} catch (e: any) {
			setError(e?.message || "Erro ao carregar jogos");
			setJogosHasMore(false);
		} finally {
			setLoadingJogos(false);
			setLoading(false);
		}
	}

	// Infinite scroll para jogos (sentinela no fim da grade)
	useEffect(() => {
		if (!bottomRef.current) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						loadMoreJogos();
					}
				}
			},
			{ root: null, rootMargin: "200px", threshold: 0 }
		);
		io.observe(bottomRef.current);
		return () => io.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bottomRef.current, ready, jogosHasMore]);

	const jogosOptions = useMemo(() => {
		return jogos
			.slice()
			.sort((a, b) => (a.data_jogo > b.data_jogo ? -1 : 1))
			.map((j) => ({ id: j.id, label: `${j.data_jogo} • ${j.nome_jogo}` }));
	}, [jogos]);

	async function handleUpload() {
		if (!isAdmin) {
			setError("Apenas administradores podem adicionar fotos.");
			return;
		}
		if (!files.length) return;
		try {
			setUploading(true);
			for (const file of files) {
				const dataUrl: string = await new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve(String(r.result || ""));
					r.onerror = () => reject(new Error("Falha ao ler arquivo"));
					r.readAsDataURL(file);
				});
				const mime = file.type || "image/jpeg";
				const base64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
				const payload: any = {
					imagem_base64: base64,
					mime,
					jogo_id: idJogo || null,
					descricao: descricao || null
				};
				const res = await fetch("/api/galeria", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const j = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(j?.error || `Falha ao enviar imagem (${res.status})`);
			}
			// reload fotos do jogo atual (reset paginação)
			await reloadFotosDoJogo(idJogo);
			setModalOpen(false);
			setFiles([]);
			setDescricao("");
		} catch (e: any) {
			setError(e?.message || "Erro no upload");
		} finally {
			setUploading(false);
		}
	}

	async function reloadFotosDoJogo(targetId?: string) {
		const jogoTarget = targetId || idJogo;
		if (!jogoTarget) return;
		try {
			setLoadingFotos(true);
			const limit = 20;
			const res = await fetch(`/api/galeria?jogo_id=${jogoTarget}&offset=0&limit=${limit}`);
			const arr = await res.json().catch(() => []);
			if (!res.ok) throw new Error("Falha ao carregar fotos");
			setFotos(Array.isArray(arr) ? arr : []);
			setFotosOffset((arr?.length || 0));
			setFotosHasMore((arr?.length || 0) >= limit);
		} catch (e: any) {
			setError(e?.message || "Erro ao carregar fotos");
		} finally {
			setLoadingFotos(false);
		}
	}

	async function loadMoreFotos() {
		if (!idJogo || loadingFotos || !fotosHasMore) return;
		try {
			setLoadingFotos(true);
			const limit = 20;
			const res = await fetch(`/api/galeria?jogo_id=${idJogo}&offset=${fotosOffset}&limit=${limit}`);
			const arr = await res.json().catch(() => []);
			if (!res.ok) throw new Error("Falha ao carregar fotos");
			const next = Array.isArray(arr) ? arr : [];
			setFotos((prev) => [...prev, ...next]);
			setFotosOffset((prev) => prev + next.length);
			if (next.length < limit) setFotosHasMore(false);
		} catch (e: any) {
			setError(e?.message || "Erro ao carregar fotos");
			setFotosHasMore(false);
		} finally {
			setLoadingFotos(false);
		}
	}

	async function handleCreateAlbum() {
		if (!isAdmin) {
			setError("Apenas administradores podem criar galerias.");
			return;
		}
		if (!novoNome || !novaData || createFiles.length === 0) {
			setError("Informe nome, data e selecione ao menos uma imagem.");
			return;
		}
		// só permitir datas passadas
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		const todayStr = `${yyyy}-${mm}-${dd}`;
		if (novaData >= todayStr) {
			setError("A data do jogo deve ser anterior a hoje para anexar fotos.");
			return;
		}
		try {
			setCreating(true);
			// cria jogo minimal
			let coverBase64: string | null = null;
			let coverMime: string | null = null;
			// tenta usar a primeira imagem como capa, se desejar, ou mantenha somente se forneceremos um input dedicado
			// Aqui: se o usuário quiser uma capa dedicada, podemos aproveitar a primeira imagem do array createFiles como capa
			if (createFiles.length > 0) {
				const cf = createFiles[0];
				const dataUrl: string = await new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve(String(r.result || ""));
					r.onerror = () => reject(new Error("Falha ao ler arquivo"));
					r.readAsDataURL(cf);
				});
				coverMime = cf.type || "image/jpeg";
				coverBase64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
			}
			const rj = await fetch("/api/jogos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nome_jogo: novoNome, data_jogo: novaData, capa_imagem_base64: coverBase64, mime: coverMime })
			});
			const jogo = await rj.json().catch(() => ({}));
			if (!rj.ok || !jogo?.id) throw new Error(jogo?.error || "Falha ao criar galeria (jogo)");
			// envia imagens
			for (const f of createFiles) {
				const dataUrl: string = await new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve(String(r.result || ""));
					r.onerror = () => reject(new Error("Falha ao ler arquivo"));
					r.readAsDataURL(f);
				});
				const mime = f.type || "image/jpeg";
				const base64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
				const payload: any = { imagem_base64: base64, mime, jogo_id: jogo.id, descricao: "" };
				const res = await fetch("/api/galeria", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const j = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(j?.error || `Falha ao enviar imagem (${res.status})`);
			}
			// recarrega lista de jogos (resetando paginação)
			setJogos([]);
			setJogosOffset(0);
			setJogosHasMore(true);
			await loadMoreJogos();
			// fecha modal e abre detalhe do novo jogo
			setCreateOpen(false);
			setNovoNome("");
			setNovaData("");
			setCreateFiles([]);
			setIdJogo(jogo.id);
			setModalOpen(false);
		} catch (e: any) {
			setError(e?.message || "Erro ao criar galeria");
		} finally {
			setCreating(false);
		}
	}

	async function handleUpdateCover() {
		if (!isAdmin) {
			setError("Apenas administradores podem alterar a capa.");
			return;
		}
		if (!idJogo || !coverFile) return;
		try {
			setCoverSaving(true);
			const dataUrl: string = await new Promise((resolve, reject) => {
				const r = new FileReader();
				r.onload = () => resolve(String(r.result || ""));
				r.onerror = () => reject(new Error("Falha ao ler arquivo"));
				r.readAsDataURL(coverFile);
			});
			const mime = coverFile.type || "image/jpeg";
			const base64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
			const res = await fetch(`/api/jogos/${idJogo}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ capa_imagem_base64: base64, mime })
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(j?.error || "Falha ao atualizar capa");
			// atualiza na lista local de jogos
			setJogos((prev) => prev.map((g) => (g.id === idJogo ? { ...g, capa_url: j?.capa_url || g.capa_url } : g)));
			setCoverOpen(false);
			setCoverFile(null);
		} catch (e: any) {
			setError(e?.message || "Erro ao atualizar capa");
		} finally {
			setCoverSaving(false);
		}
	}

	async function handleDelete() {
		if (!isAdmin) {
			setError("Apenas administradores podem excluir fotos.");
			return;
		}
		if (!toDelete) return;
		try {
			const res = await fetch(`/api/galeria/${toDelete.id}`, { method: "DELETE" });
			if (!res.ok && res.status !== 204) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j?.error || "Falha ao excluir");
			}
			await reloadFotosDoJogo();
			setToDelete(null);
		} catch (e: any) {
			setError(e?.message || "Erro ao excluir");
		}
	}

	const today = useMemo(() => {
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	}, []);

	const jogoMap = useMemo(() => {
		const m = new Map<string, Jogo>();
		for (const j of jogos) m.set(j.id, j);
		return m;
	}, [jogos]);

	const jogosOrdenados = useMemo(() => {
		return jogos.slice().sort((a, b) => (a.data_jogo > b.data_jogo ? -1 : 1));
	}, [jogos]);

	// Infinite scroll dentro do modal de fotos (usa o container como root)
	useEffect(() => {
		const rootEl = modalScrollRef.current;
		const target = fotosBottomRef.current;
		if (!rootEl || !target || !idJogo) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						loadMoreFotos();
					}
				}
			},
			{ root: rootEl, rootMargin: "200px", threshold: 0 }
		);
		io.observe(target);
		return () => io.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modalScrollRef.current, fotosBottomRef.current, idJogo, fotosHasMore]);

	return (
		<section className="max-w-6xl mx-auto" ref={sectionRef as any}>
			<div className="flex items-center justify-between mb-4 ">
				<h2 className="text-2xl font-bold text-slate-800">Galeria</h2>
				{isAdmin && (
					<button
						className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-2"
						onClick={() => setCreateOpen(true)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
						</svg>
					</button>
				)}
			</div>
			{error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
			{loading ? (
				<p className="text-slate-600">Carregando...</p>
			) : (
				<>
					{/* Grade de cards de jogos */}
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{jogosOrdenados.map((j) => {
							const capa = j.capa_url || "/path_gost.svg";
							return (
								<button
									key={j.id}
									className="text-left rounded border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow overflow-hidden"
									onClick={() => {
										setIdJogo(j.id);
										setModalOpen(false);
										// carregar fotos do jogo
										setFotos([]);
										setFotosOffset(0);
										setFotosHasMore(true);
										reloadFotosDoJogo(j.id);
									}}
								>
									<div className="w-full aspect-video bg-slate-100">
										<img
											src={capa}
											alt={j.nome_jogo}
											className="w-full h-full object-cover"
											referrerPolicy="no-referrer"
											crossOrigin="anonymous"
											loading="lazy"
											onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/path_gost.svg"; }}
										/>
									</div>
									<div className="p-3">
										<div className="font-semibold text-slate-800">{j.nome_jogo}</div>
										<div className="text-xs text-slate-500">{j.data_jogo}</div>
									</div>
								</button>
							);
						})}
					</div>
					<div ref={bottomRef} className="h-8" />

					{/* Detalhe da galeria do jogo selecionado */}
					{idJogo && (
						<div className="fixed inset-0 z-[2200] flex items-center justify-center">
							<div className="absolute inset-0 bg-black/40" onClick={() => setIdJogo("")} />
							<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-1.5rem)] md:w-[90%] lg:w-[80%] max-h-[90vh] p-4 md:p-6 overflow-y-auto" ref={modalScrollRef}>
								<div className="flex items-center justify-between mb-4">
									<div>
										<div className="text-lg font-semibold">{jogoMap.get(idJogo)?.nome_jogo}</div>
										<div className="text-xs text-slate-500">{jogoMap.get(idJogo)?.data_jogo}</div>
									</div>
									<div className="flex items-center gap-2">
										{isAdmin && (
											<button
												className={`p-2 rounded border border-slate-300 ${((jogoMap.get(idJogo)?.data_jogo || "") < today) ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"}`}
												onClick={() => {
													if (!((jogoMap.get(idJogo)?.data_jogo || "") < today)) return;
													setModalOpen(true);
												}}
												title={((jogoMap.get(idJogo)?.data_jogo || "") < today) ? "Adicionar fotos" : "Somente jogos já realizados podem receber fotos"}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
													<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
												</svg>
											</button>
										)}
										{isAdmin && (
											<button
												className="p-2 rounded border border-slate-300 hover:bg-slate-50"
												onClick={() => setCoverOpen(true)}
												title="Alterar capa da galeria"
											>
												Capa
											</button>
										)}
										<button className="p-2 rounded hover:bg-slate-100" onClick={() => setIdJogo("")} aria-label="Fechar">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
												<path d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									{fotos.map((it) => (
										<div key={it.id} className="rounded border border-slate-200 overflow-hidden bg-white shadow-sm">
											<div className="w-full aspect-square bg-slate-100">
												<img src={it.imagem_url} alt={jogoMap.get(idJogo)?.nome_jogo || it.id} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" loading="lazy" />
											</div>
											<div className="p-2 text-xs text-slate-700 flex items-center justify-between">
												{/* {it.descricao ? <div className="text-[11px] text-slate-600 pr-2">{it.descricao}</div> : <span className="text-[11px] text-slate-400">Sem descrição</span>} */}
												{isAdmin && (
													<button className="p-1 rounded hover:bg-slate-100" onClick={() => setToDelete(it)} aria-label="Excluir foto">
														<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
															<path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6v12m6-12v12M4 6l1 14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l1-14M10 6l1-2h2l1 2" />
														</svg>
													</button>
												)}
											</div>
										</div>
									))}
								</div>
								{fotosHasMore && <div ref={fotosBottomRef} className="h-8" />}
							</div>
						</div>
					)}
				</>
			)}

			{modalOpen && (
				<div className="fixed inset-0 z-[2200] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
					<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-full sm:max-w-xl p-4 sm:p-6 mx-2">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-lg font-semibold">Adicionar Fotos</h4>
							<button className="p-2 rounded hover:bg-slate-100" onClick={() => setModalOpen(false)} aria-label="Fechar">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
									<path d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="grid grid-cols-1 gap-3">
							<div className="text-sm text-slate-700">
								Jogo selecionado: <span className="font-medium">{jogoMap.get(idJogo)?.nome_jogo} ({jogoMap.get(idJogo)?.data_jogo})</span>
							</div>
							<div>
								<label className="block text-sm text-slate-600">Imagens</label>
								<input
									type="file"
									accept="image/*"
									multiple
									className="mt-1 w-full rounded border px-3 py-2"
									onChange={(e) => setFiles(Array.from(e.target.files || []))}
								/>
								{files.length > 1 && <div className="text-xs text-slate-500 mt-1">{files.length} arquivos selecionados</div>}
							</div>
							<div>
								<label className="block text-sm text-slate-600">Descrição (opcional)</label>
								<textarea className="mt-1 w-full rounded border px-3 py-2" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
							</div>
						</div>
						{error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
						<div className="mt-4 flex items-center justify-end gap-3">
							<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setModalOpen(false)} disabled={uploading}>Cancelar</button>
							<button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60" onClick={handleUpload} disabled={uploading || files.length === 0 || !idJogo}>
								{uploading ? "Enviando..." : "Adicionar fotos"}
							</button>
						</div>
					</div>
				</div>
			)}

			{isAdmin && createOpen && (
				<div className="fixed inset-0 z-[2300] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/30" onClick={() => setCreateOpen(false)} />
					<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-full sm:max-w-xl p-4 sm:p-6 mx-2">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
								</svg>
								<h4 className="text-lg font-semibold">Nova galeria</h4>
							</div>
							<button className="p-2 rounded hover:bg-slate-100" onClick={() => setCreateOpen(false)} aria-label="Fechar">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
									<path d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="grid grid-cols-1 gap-3">
							<div>
								<label className="block text-sm text-slate-600">Nome do jogo</label>
								<input className="mt-1 w-full rounded border px-3 py-2" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
							</div>
							<div>
								<label className="block text-sm text-slate-600">Data do jogo</label>
								<input className="mt-1 w-full rounded border px-3 py-2" type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
							</div>
							<div>
								<label className="block text-sm text-slate-600">Capa da galeria (opcional)</label>
								<input
									type="file"
									accept="image/*"
									className="mt-1 w-full rounded border px-3 py-2"
									onChange={(e) => {
										const fs = Array.from(e.target.files || []);
										// coloca a capa como primeiro arquivo e mantém createFiles
										if (fs[0]) {
											// não armazenamos separadamente; handleCreateAlbum lê createFiles[0] como capa
											setCreateFiles((prev) => (prev.length ? [fs[0], ...prev] : [fs[0]]));
										}
									}}
								/>
							</div>
							<div>
								<label className="block text-sm text-slate-600">Imagens</label>
								<input
									type="file"
									accept="image/*"
									multiple
									className="mt-1 w-full rounded border px-3 py-2"
									onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
								/>
								{createFiles.length > 1 && <div className="text-xs text-slate-500 mt-1">{createFiles.length} arquivos selecionados</div>}
							</div>
						</div>
						{error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
						<div className="mt-4 flex items-center justify-end gap-3">
							<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</button>
							<button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60" onClick={handleCreateAlbum} disabled={creating || !novoNome || !novaData || createFiles.length === 0}>
								{creating ? "Criando..." : "Criar galeria"}
							</button>
						</div>
					</div>
				</div>
			)}

			{coverOpen && (
				<div className="fixed inset-0 z-[2400] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/30" onClick={() => setCoverOpen(false)} />
					<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-full sm:max-w-md p-4 mx-2">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-lg font-semibold">Alterar capa</h4>
							<button className="p-2 rounded hover:bg-slate-100" onClick={() => setCoverOpen(false)} aria-label="Fechar">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
									<path d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div>
							<label className="block text-sm text-slate-600">Capa</label>
							<input type="file" accept="image/*" className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
						</div>
						<div className="mt-4 flex items-center justify-end gap-3">
							<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setCoverOpen(false)} disabled={coverSaving}>Cancelar</button>
							<button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60" onClick={handleUpdateCover} disabled={coverSaving || !coverFile}>
								{coverSaving ? "Salvando..." : "Salvar"}
							</button>
						</div>
					</div>
				</div>
			)}

			{isAdmin && toDelete && (
				<div className="fixed inset-0 z-[2300] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/30" onClick={() => setToDelete(null)} />
					<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-full sm:max-w-md p-4 mx-2">
						<h4 className="text-lg font-semibold text-slate-800 mb-2">Excluir foto</h4>
						<p className="text-sm text-slate-600">Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.</p>
						<div className="mt-4 flex items-center justify-end gap-3">
							<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setToDelete(null)}>Cancelar</button>
							<button className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700" onClick={handleDelete}>Excluir</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}