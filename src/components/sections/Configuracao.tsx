import { useEffect, useState } from "react";

type ApiResult = { ok: boolean; message: string };

function useSubmit(url: string) {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ApiResult | null>(null);

	const submit = async (data: any) => {
		setLoading(true);
		setResult(null);
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			const json = await res.json();
			if (!res.ok) {
				setResult({ ok: false, message: json?.error || "Erro" });
				return false;
			} else {
				setResult({ ok: true, message: "Criado com sucesso" });
				return true;
			}
		} catch (e) {
			setResult({ ok: false, message: "Falha de rede" });
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, result, submit };
}

function ComandoGeralPicker({ users, value, onChange }: { users: any[]; value: string[]; onChange: (vals: string[]) => void }) {
	const [open, setOpen] = useState(false);
	const selected = new Set(value || []);
	const summary = (() => {
		const names = users.filter((u) => selected.has(u.id)).map((u) => u.name || u.email);
		if (!names.length) return "Selecionar";
		if (names.length <= 2) return names.join(", ");
		return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
	})();

	const toggle = (id: string) => {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id); else next.add(id);
		onChange(Array.from(next));
	};

	return (
		<div className="relative">
			<button type="button" className="mt-1 w-full rounded border px-3 py-2 text-left hover:bg-slate-50" onClick={() => setOpen((v) => !v)}>
				{summary}
			</button>
			{open && (
				<div className="absolute z-[10] mt-1 w-full bg-white border rounded shadow max-h-60 overflow-y-auto">
					<div className="p-2">
						{users.map((u) => (
							<label key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
								<input
									type="checkbox"
									checked={selected.has(u.id)}
									onChange={() => toggle(u.id)}
								/>
								<span className="text-sm">{u.name || u.email}</span>
							</label>
						))}
						<div className="flex items-center justify-end gap-2 mt-2">
							<button type="button" className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setOpen(false)}>Concluir</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function Configuracao() {
	// Usuário
	const [userName, setUserName] = useState("");
	const [userEmail, setUserEmail] = useState("");
	const [userPassword, setUserPassword] = useState("");
	const userApi = useSubmit("/api/users");

	// Squad
	const [squadNome, setSquadNome] = useState("");
	const squadApi = useSubmit("/api/squads");
	const [squads, setSquads] = useState<any[]>([]);
	const [loadingSquads, setLoadingSquads] = useState(false);
	// Modal de squads
	const [squadModalOpen, setSquadModalOpen] = useState(false);
	const [squadIsCreate, setSquadIsCreate] = useState(false);
	const [squadEditLoading, setSquadEditLoading] = useState(false);
	const [squadEditId, setSquadEditId] = useState<string | null>(null);
	const [squadForm, setSquadForm] = useState<any>(null);

	// Users (listar e alterar patente)
	const [users, setUsers] = useState<any[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [rowMsgByUser, setRowMsgByUser] = useState<Record<string, string>>({});

	// Modal de edição
	const [editOpen, setEditOpen] = useState(false);
	const [editLoading, setEditLoading] = useState(false);
	const [editUserId, setEditUserId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<any>(null);
	const [isCreateMode, setIsCreateMode] = useState(false);

	// Modal de confirmação de (des)ativação
	const [confirmActiveOpen, setConfirmActiveOpen] = useState(false);
	const [confirmActiveLoading, setConfirmActiveLoading] = useState(false);
	const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
	const [confirmNextActive, setConfirmNextActive] = useState<boolean>(true);

	// Modal de confirmação de exclusão de squad
	const [confirmSquadOpen, setConfirmSquadOpen] = useState(false);
	const [confirmSquadLoading, setConfirmSquadLoading] = useState(false);
	const [confirmSquadId, setConfirmSquadId] = useState<string | null>(null);
	const [confirmSquadName, setConfirmSquadName] = useState<string>("");

	// Opções de classe (airsoft)
	const CLASS_OPTIONS = ["Assalt", "DMR", "Sniper", "Suporte"];

	// Máscara de data (DD/MM/AAAA)
	const maskDateBR = (value: string) => {
		const digits = (value || "").replace(/\D/g, "").slice(0, 8);
		const parts = [];
		if (digits.length > 0) parts.push(digits.slice(0, 2));
		if (digits.length > 2) parts.push(digits.slice(2, 4));
		if (digits.length > 4) parts.push(digits.slice(4, 8));
		return parts.join("/");
	};

	const loadUsers = async () => {
		setLoadingUsers(true);
		try {
			const res = await fetch("/api/users");
			const data = await res.json();
			if (Array.isArray(data)) {
				setUsers(data);
			}
		} catch {
			// ignore
		} finally {
			setLoadingUsers(false);
		}
	};

	const loadSquads = async () => {
		setLoadingSquads(true);
		try {
			const res = await fetch("/api/squads");
			const data = await res.json();
			if (Array.isArray(data)) {
				setSquads(data);
			}
		} catch {
			// ignore
		} finally {
			setLoadingSquads(false);
		}
	};

	useEffect(() => {
		loadUsers();
		loadSquads();
	}, []);

	const openEdit = async (userId: string) => {
		setEditOpen(true);
		setIsCreateMode(false);
		setEditLoading(true);
		setEditUserId(userId);
		setEditForm(null);
		try {
			// garante squads atualizadas
			if (!squads.length) await loadSquads();
			const r = await fetch(`/api/users/${userId}`);
			const j = await r.json();
			if (!r.ok) throw new Error(j?.error || "Falha ao carregar usuário");
			setEditForm({
				name: j.name || "",
				nome_guerra: j.nome_guerra || "",
				email: j.email || "",
				patent: j.patent || "soldado",
				roles: Array.isArray(j.roles) ? j.roles : [],
				classe: j.classe || "",
				data_admissao_gost: j.data_admissao_gost || "",
				picture: j.picture || "",
				comando_geral: Array.isArray(j.comando_geral) ? j.comando_geral : [],
				comando_squad: j.comando_squad || "",
				id_squad_subordinado: j.id_squad_subordinado || "",
				is_comandante_squad: !!j.is_comandante_squad,
				nome_squad_subordinado: j.nome_squad_subordinado || "",
				active: j.active || true
			});
		} catch (e: any) {
			setRowMsgByUser((p) => ({ ...p, [userId]: e?.message || "Erro ao abrir edição" }));
			setEditOpen(false);
		} finally {
			setEditLoading(false);
		}
	};

	const openCreate = async () => {
		setEditOpen(true);
		setIsCreateMode(true);
		setEditLoading(true);
		setEditUserId(null);
		try {
			if (!squads.length) await loadSquads();
			setEditForm({
				name: "",
				nome_guerra: "",
				email: "",
				patent: "soldado",
				roles: [],
				classe: "",
				data_admissao_gost: "",
				picture: "",
				comando_geral: [],
				comando_squad: "",
				id_squad_subordinado: "",
				nome_squad_subordinado: "",
				is_comandante_squad: false,
				active: true
			});
		} finally {
			setEditLoading(false);
		}
	};

	const saveEdit = async () => {
		if (!editUserId || !editForm) return;
		try {
			const payload: any = {
				name: editForm.name || null,
				nome_guerra: editForm.nome_guerra || null,
				patent: editForm.patent,
				roles: editForm.roles,
				classe: editForm.classe || "",
				data_admissao_gost: editForm.data_admissao_gost || "",
				picture: editForm.picture || null,
				is_comandante_squad: !!editForm.is_comandante_squad,
				nome_squad_subordinado: editForm.is_comandante_squad ? (editForm.nome_squad_subordinado || null) : null,
				comando_geral: editForm.comando_geral || [],
				comando_squad: editForm.comando_squad || null,
				id_squad_subordinado: editForm.id_squad_subordinado || null
			};
			// Em modo edição, não alterar email
			if (isCreateMode) {
				payload.email = editForm.email;
			}
			const res = await fetch(`/api/users/${editUserId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) {
				alert(j?.error || "Erro ao salvar");
				return;
			}
			setEditOpen(false);
			await loadUsers();
		} catch (e: any) {
			alert(e?.message || "Erro ao salvar");
		}
	};

	const saveCreate = async () => {
		if (!editForm) return;
		try {
			// criação mínima
			const res = await fetch(`/api/users`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: editForm.email, name: editForm.name })
			});
			const j = await res.json();
			if (!res.ok) {
				alert(j?.error || "Erro ao criar");
				return;
			}
			// atualização dos campos extras (se houver)
			if (j?.id) {
				const update = await fetch(`/api/users/${j.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						patent: editForm.patent,
						roles: editForm.roles,
						classe: editForm.classe || "",
						data_admissao_gost: editForm.data_admissao_gost || "",
						picture: editForm.picture || null,
						nome_guerra: editForm.nome_guerra || null,
						is_comandante_squad: !!editForm.is_comandante_squad,
						nome_squad_subordinado: editForm.is_comandante_squad ? (editForm.nome_squad_subordinado || null) : null,
						comando_geral: editForm.comando_geral || [],
						comando_squad: editForm.comando_squad || null,
						id_squad_subordinado: editForm.id_squad_subordinado || null
					})
				});
				if (!update.ok) {
					const uj = await update.json().catch(() => ({}));
					alert(uj?.error || "Criado, mas falha ao aplicar detalhes");
				}
			}
			setEditOpen(false);
			await loadUsers();
		} catch (e: any) {
			alert(e?.message || "Erro ao criar");
		}
	};

	// Squads - criar/editar
	const openSquadCreate = () => {
		setSquadModalOpen(true);
		setSquadIsCreate(true);
		setSquadEditLoading(false);
		setSquadEditId(null);
		setSquadForm({ nome: "" });
	};

	const openSquadEdit = async (id: string) => {
		setSquadModalOpen(true);
		setSquadIsCreate(false);
		setSquadEditLoading(true);
		setSquadEditId(id);
		try {
			const r = await fetch(`/api/squads/${id}`);
			const j = await r.json();
			if (!r.ok) throw new Error(j?.error || "Falha ao carregar squad");
			// mapear nomes -> IDs de usuários para preencher selects
			const mapNameToUserId = (name: string) => {
				const u = (users || []).find((x: any) => (x.name || x.email) === name);
				return u?.id || "";
			};
			const comandoSquadId = j?.comando_squad ? mapNameToUserId(j.comando_squad) : "";
			const comandoGeralIds = Array.isArray(j?.comando_geral)
				? (j.comando_geral.map((nm: string) => mapNameToUserId(nm)).filter((v: string) => !!v))
				: [];
			setSquadForm({
				nome: j.nome || "",
				comando_squad_id: comandoSquadId,
				comando_geral_id: comandoGeralIds
			});
		} catch (e) {
			alert((e as any)?.message || "Erro ao abrir edição");
			setSquadModalOpen(false);
		} finally {
			setSquadEditLoading(false);
		}
	};

	const saveSquadCreate = async () => {
		try {
			const res = await fetch(`/api/squads`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nome: squadForm?.nome,
					comando_geral: squadForm?.comando_geral_id || [],
					comando_squad: squadForm?.comando_squad_id || null
				})
			});
			const j = await res.json();
			if (!res.ok) {
				alert(j?.error || "Erro ao criar squad");
				return;
			}
			setSquadModalOpen(false);
			await loadSquads();
		} catch (e) {
			alert((e as any)?.message || "Erro ao criar squad");
		}
	};

	const saveSquadEdit = async () => {
		if (!squadEditId) return;
		try {
			const res = await fetch(`/api/squads/${squadEditId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nome: squadForm?.nome,
					comando_geral: squadForm?.comando_geral_id || [],
					comando_squad: squadForm?.comando_squad_id || null
				})
			});
			const j = await res.json().catch(() => ({}));
			if (!res.ok) {
				alert(j?.error || "Erro ao salvar squad");
				return;
			}
			setSquadModalOpen(false);
			await loadSquads();
		} catch (e) {
			alert((e as any)?.message || "Erro ao salvar squad");
		}
	};

	return (
		<section className="max-w-5xl mx-auto">
			<h2 className="text-3xl font-bold text-slate-800 mb-6">Configuração</h2>

			<div className="grid md:grid-cols-2 gap-6">

				{/* Usuários: editar via modal */}
				<div className="bg-white rounded-lg shadow p-5 border border-slate-200 md:col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-xl font-semibold">Usuários</h3>
						<div className="flex items-center gap-2">
							<button
								className="text-sm px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
								onClick={loadUsers}
							>
								Recarregar
							</button>
							<button
								aria-label="Adicionar usuário"
								className="p-2 rounded border border-slate-300 hover:bg-slate-50"
								onClick={openCreate}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
								</svg>
							</button>
						</div>
					</div>
					{loadingUsers ? (
						<p className="text-slate-600">Carregando...</p>
					) : (
						<>
							<div className="hidden md:block overflow-x-auto">
								<table className="min-w-full text-sm">
									<thead className="text-left text-slate-500 border-b">
										<tr>
											<th className="py-2 pr-4">Nome</th>
											<th className="py-2 pr-4">Email</th>
											<th className="py-2 pr-4">Patente</th>
											<th className="py-2 pr-4">Ação</th>
											<th className="py-2 pr-4">Ativo</th>
										</tr>
									</thead>
									<tbody>
										{users.map((u) => (
											<tr key={u.id} className="border-b last:border-0">
												<td className="py-2 pr-4">{u.name || "-"}</td>
												<td className="py-2 pr-4">{u.email}</td>
												<td className="py-2 pr-4 capitalize">{u.patent || "soldado"}</td>
												<td className="py-2 pr-4">
													<button
														aria-label="Editar"
														className="p-2 rounded hover:bg-slate-100"
														onClick={() => openEdit(u.id)}
													>
														<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
															<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
														</svg>
													</button>
												</td>
												<td className="py-2 pr-4">
													<label className="inline-flex items-center gap-2 cursor-pointer select-none">
														<input
															type="checkbox"
															checked={!!u.active}
															onChange={async (e) => {
																setConfirmUserId(u.id);
																setConfirmNextActive(e.currentTarget.checked);
																setConfirmActiveOpen(true);
															}}
														/>
														<span className={`text-xs ${u.active ? "text-emerald-700" : "text-slate-500"}`}>{u.active ? "Ativo" : "Inativo"}</span>
													</label>
												</td>
												<td className="py-2 pr-4 text-xs">
													{rowMsgByUser[u.id] && (
														<span className="text-slate-600">{rowMsgByUser[u.id]}</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="md:hidden grid gap-3">
								{users.map((u) => (
									<div key={u.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
										<div className="flex items-start justify-between">
											<div>
												<div className="font-semibold text-slate-800 text-sm">{u.name || "-"}</div>
												<div className="text-slate-600 text-xs break-all">{u.email}</div>
											</div>
											<button
												aria-label="Editar"
												className="p-2 rounded hover:bg-slate-100"
												onClick={() => openEdit(u.id)}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
													<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
												</svg>
											</button>
										</div>
										<div className="mt-2 flex items-center justify-between">
											<span className="text-xs capitalize text-slate-700">{u.patent || "soldado"}</span>
											<label className="inline-flex items-center gap-2 cursor-pointer select-none">
												<input
													type="checkbox"
													checked={!!u.active}
													onChange={(e) => {
														setConfirmUserId(u.id);
														setConfirmNextActive(e.currentTarget.checked);
														setConfirmActiveOpen(true);
													}}
												/>
												<span className={`text-xs ${u.active ? "text-emerald-700" : "text-slate-500"}`}>{u.active ? "Ativo" : "Inativo"}</span>
											</label>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>

				{/* Usuários: Modal de edição */}
				{editOpen && (
					<div className="fixed inset-0 z-[2000] flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={() => setEditOpen(false)}></div>
						<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] max-w-lg p-4 sm:w-full sm:max-w-2xl sm:p-6 mx-2">
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-lg font-semibold">Editar usuário</h4>
								<button className="p-2 rounded hover:bg-slate-100" onClick={() => setEditOpen(false)} aria-label="Fechar">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
										<path d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							{editLoading || !editForm ? (
								<p className="text-slate-600">Carregando...</p>
							) : (
								<form
									className="grid grid-cols-1 md:grid-cols-2 gap-4"
									onSubmit={(e) => {
										e.preventDefault();
										if (isCreateMode) saveCreate(); else saveEdit();
									}}
								>
									<div>
										<label className="block text-sm text-slate-600">Nome</label>
										<input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
									</div>
									<div>
										<label className="block text-sm text-slate-600">Nome de guerra</label>
										<input value={editForm.nome_guerra} onChange={(e) => setEditForm({ ...editForm, nome_guerra: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
									</div>
									<div>
										<label className="block text-sm text-slate-600">Email</label>
										<input
											value={editForm.email}
											onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
											className={`mt-1 w-full rounded border px-3 py-2 ${!isCreateMode ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
											readOnly={!isCreateMode}
										/>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Patente</label>
										<select
											value={editForm.patent}
											onChange={(e) => setEditForm({ ...editForm, patent: e.target.value })}
											className="mt-1 w-full rounded border px-3 py-2"
										>
											<option value="comando">comando</option>
											<option value="sub_comando">sub_comando</option>
											<option value="comando_squad">comando_squad</option>
											<option value="soldado">soldado</option>
										</select>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Roles (separar por vírgula)</label>
										<input
											value={(editForm.roles || []).join(",")}
											onChange={(e) => setEditForm({ ...editForm, roles: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
											className="mt-1 w-full rounded border px-3 py-2"
										/>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Classe</label>
										<select
											value={editForm.classe}
											onChange={(e) => setEditForm({ ...editForm, classe: e.target.value })}
											className="mt-1 w-full rounded border px-3 py-2"
										>
											<option value="">Selecione</option>
											{CLASS_OPTIONS.map((c) => (
												<option key={c} value={c}>{c}</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Data admissão</label>
										<input
											value={editForm.data_admissao_gost}
											onChange={(e) => setEditForm({ ...editForm, data_admissao_gost: maskDateBR(e.target.value) })}
											className="mt-1 w-full rounded border px-3 py-2"
											placeholder="dd/mm/aaaa"
											inputMode="numeric"
											maxLength={10}
										/>
									</div>
									<div>
										<label className="inline-flex items-center gap-2 text-sm text-slate-600">
											<input
												type="checkbox"
												checked={!!editForm.is_comandante_squad}
												onChange={async (e) => {
													const checked = e.target.checked;
													const next = {
														...editForm,
														is_comandante_squad: checked,
														// quando vira comandante: esconde e zera comando_squad
														// quando deixa de ser: esconde e zera id_squad_subordinado/nome
														comando_squad: checked ? "" : (editForm.comando_squad || ""),
														id_squad_subordinado: checked ? (editForm.id_squad_subordinado || "") : "",
														nome_squad_subordinado: checked ? (editForm.nome_squad_subordinado || "") : ""
													};
													setEditForm(next);
													try {
														if (editUserId) {
															const payload: any = { is_comandante_squad: checked };
															if (checked) {
																payload.comando_squad = null; // limpa vínculo de membro
															} else {
																payload.id_squad_subordinado = null; // limpa subordinação
																payload.nome_squad_subordinado = null;
															}
															const res = await fetch(`/api/users/${editUserId}`, {
																method: "PUT",
																headers: { "Content-Type": "application/json" },
																body: JSON.stringify(payload)
															});
															if (!res.ok) {
																const j = await res.json().catch(() => ({}));
																setRowMsgByUser((p) => ({ ...p, [editUserId]: j?.error || "Erro ao atualizar" }));
															}
														}
													} catch (err: any) {
														if (editUserId) setRowMsgByUser((p) => ({ ...p, [editUserId]: err?.message || "Erro ao atualizar" }));
													}
												}}
											/>
											<span>É comandante de squad</span>
										</label>
									</div>
									{(!editForm.is_comandante_squad) && (
										<div>
											<label className="block text-sm text-slate-600">Squad</label>
											<select
												value={editForm.comando_squad || ""}
												onChange={async (e) => {
													const val = e.target.value || ""; // nome da squad
													const sq = (squads || []).find((s: any) => s.nome === val);
													setEditForm({
														...editForm,
														comando_squad: sq?.nome || ""
													});
												}}
												className="mt-1 w-full rounded border px-3 py-2"
											>
												<option value="">Selecione a squad</option>
												{(squads || []).map((s) => (
													<option key={s.id} value={s.nome || ""}>{s.nome || s.id}</option>
												))}
											</select>
											{loadingSquads && <p className="text-xs text-slate-500 mt-1">Carregando squads...</p>}
										</div>
									)}
									{editForm.is_comandante_squad && (
										<div>
											<label className="block text-sm text-slate-600">Squad subordinada</label>
											<select
												value={editForm.id_squad_subordinado || ""}
												onChange={(e) => {
													const selId = e.target.value;
													const sq = (squads || []).find((s: any) => s.id === selId);
													setEditForm({
														...editForm,
														id_squad_subordinado: selId || "",
														nome_squad_subordinado: sq?.nome || ""
													});
												}}
												className="mt-1 w-full rounded border px-3 py-2"
											>
												<option value="">Selecione a squad</option>
												{(squads || []).map((s) => (
													<option key={s.id} value={s.id}>{s.nome || s.id}</option>
												))}
											</select>
										</div>
									)}
									<div className="md:col-span-2">
										<label className="block text-sm text-slate-600">Foto (URL)</label>
										<input value={editForm.picture} onChange={(e) => setEditForm({ ...editForm, picture: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
									</div>
									<div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
										<button type="button" className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setEditOpen(false)}>
											Cancelar
										</button>
										<button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
											{isCreateMode ? "Criar usuário" : "Salvar"}
										</button>
									</div>
								</form>
							)}
						</div>
					</div>
				)}

				{/* Squads: listar e editar/criar via modal */}
				<div className="bg-white rounded-lg shadow p-5 border border-slate-200 md:col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-xl font-semibold">Squads</h3>
						<div className="flex items-center gap-2">
							<button
								className="text-sm px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
								onClick={loadSquads}
							>
								Recarregar
							</button>
							<button
								aria-label="Adicionar squad"
								className="p-2 rounded border border-slate-300 hover:bg-slate-50"
								onClick={openSquadCreate}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
								</svg>
							</button>
						</div>
					</div>
					{loadingSquads ? (
						<p className="text-slate-600">Carregando...</p>
					) : (
						<>
							<div className="hidden md:block overflow-x-auto">
								<table className="min-w-full text-sm">
									<thead className="text-left text-slate-500 border-b">
										<tr>
											<th className="py-2 pr-4">Nome</th>
											<th className="py-2 pr-4">Comando Geral</th>
											<th className="py-2 pr-4">Comandante</th>
											<th className="py-2 pr-4">Ação</th>
										</tr>
									</thead>
									<tbody>
										{(squads || []).map((s) => (
											<tr key={s.id} className="border-b last:border-0">
												<td className="py-2 pr-4">{s.nome || "-"}</td>
												<td className="py-2 pr-4">{s.comando_geral.join(", ")}</td>
												<td className="py-2 pr-4">{s.comando_squad || "-"}</td>
												<td className="py-2 pr-4">
													<button
														aria-label="Editar"
														className="p-2 rounded hover:bg-slate-100"
														onClick={() => openSquadEdit(s.id)}
													>
														<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
															<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
														</svg>
													</button>
													<button
														aria-label="Excluir"
														className="p-2 rounded hover:bg-red-50 ml-1"
														onClick={() => {
															setConfirmSquadId(s.id);
															setConfirmSquadName(s.nome || "");
															setConfirmSquadOpen(true);
														}}
													>
														<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-600">
															<path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h10z" />
														</svg>
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="md:hidden grid gap-3">
								{(squads || []).map((s) => (
									<div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
										<div className="flex items-start justify-between">
											<div>
												<div className="font-semibold text-slate-800 text-sm">{s.nome || "-"}</div>
												<div className="text-slate-600 text-xs">{s.comando_squad || "-"}</div>
											</div>
											<div className="flex items-center gap-1">
												<button
													aria-label="Editar"
													className="p-2 rounded hover:bg-slate-100"
													onClick={() => openSquadEdit(s.id)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
														<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
													</svg>
												</button>
												<button
													aria-label="Excluir"
													className="p-2 rounded hover:bg-red-50"
													onClick={() => {
														setConfirmSquadId(s.id);
														setConfirmSquadName(s.nome || "");
														setConfirmSquadOpen(true);
													}}
												>
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-600">
														<path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h10z" />
													</svg>
												</button>
											</div>
										</div>
										<div className="mt-2 text-xs text-slate-600">
											<span className="font-medium text-slate-700">Comando Geral:</span> {s.comando_geral.join(", ")}
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>

				{/* Modal Squad */}
				{squadModalOpen && (
					<div className="fixed inset-0 z-[2000] flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={() => setSquadModalOpen(false)}></div>
						<div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] max-w-md p-4 sm:p-6 mx-2">
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-lg font-semibold">{squadIsCreate ? "Criar squad" : "Editar squad"}</h4>
								<button className="p-2 rounded hover:bg-slate-100" onClick={() => setSquadModalOpen(false)} aria-label="Fechar">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
										<path d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							{squadEditLoading || !squadForm ? (
								<p className="text-slate-600">Carregando...</p>
							) : (
								<form
									className="grid grid-cols-1 gap-4"
									onSubmit={(e) => {
										e.preventDefault();
										if (squadIsCreate) saveSquadCreate(); else saveSquadEdit();
									}}
								>
									<div>
										<label className="block text-sm text-slate-600">Nome</label>
										<input
											value={squadForm.nome}
											onChange={(e) => setSquadForm({ ...squadForm, nome: e.target.value })}
											className="mt-1 w-full rounded border px-3 py-2"
											required
										/>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Comando Squad (1)</label>
										<select
											value={squadForm.comando_squad_id || ""}
											onChange={(e) => setSquadForm({ ...squadForm, comando_squad_id: e.target.value || "" })}
											className="mt-1 w-full rounded border px-3 py-2"
										>
											<option value="">Não definido</option>
											{users.map((u) => (
												<option key={u.id} value={u.id}>{u.name || u.email}</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm text-slate-600">Comando Geral (múltiplos)</label>
										<ComandoGeralPicker
											users={users}
											value={squadForm.comando_geral_id || []}
											onChange={(vals) => setSquadForm({ ...squadForm, comando_geral_id: vals })}
										/>
									</div>
									<div className="flex items-center justify-end gap-3 mt-2">
										<button type="button" className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setSquadModalOpen(false)}>
											Cancelar
										</button>
										<button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
											{squadIsCreate ? "Criar squad" : "Salvar"}
										</button>
									</div>
								</form>
							)}
						</div>
					</div>
				)}

				{/* Modal Confirmar (Des)ativação */}
				{confirmActiveOpen && (
					<div className="fixed inset-0 z-[2100] flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={() => setConfirmActiveOpen(false)}></div>
						<div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
							<h4 className="text-lg font-semibold mb-2">{confirmNextActive ? "Ativar usuário" : "Inativar usuário"}</h4>
							<p className="text-sm text-slate-600 mb-4">
								{confirmNextActive
									? "Confirma ativar este usuário? Ele poderá fazer login novamente."
									: "Confirma inativar este usuário? Ele não poderá fazer login enquanto estiver inativo."}
							</p>
							<div className="flex items-center justify-end gap-3">
								<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setConfirmActiveOpen(false)} disabled={confirmActiveLoading}>
									Cancelar
								</button>
								<button
									className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
									onClick={async () => {
										if (!confirmUserId) return;
										setConfirmActiveLoading(true);
										try {
											const res = await fetch(`/api/users/${confirmUserId}`, {
												method: "PUT",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({ active: confirmNextActive })
											});
											if (!res.ok) {
												const j = await res.json().catch(() => ({}));
												alert(j?.error || "Erro ao atualizar status");
											} else {
												await loadUsers();
											}
										} catch (e: any) {
											alert(e?.message || "Erro ao atualizar status");
										} finally {
											setConfirmActiveLoading(false);
											setConfirmActiveOpen(false);
											setConfirmUserId(null);
										}
									}}
									disabled={confirmActiveLoading}
								>
									Confirmar
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Modal Confirmar Exclusão de Squad */}
				{confirmSquadOpen && (
					<div className="fixed inset-0 z-[2100] flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={() => setConfirmSquadOpen(false)}></div>
						<div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
							<h4 className="text-lg font-semibold mb-2">Excluir squad</h4>
							<p className="text-sm text-slate-600 mb-4">
								Tem certeza que deseja excluir a squad {confirmSquadName ? `"${confirmSquadName}"` : ""}? Essa ação não pode ser desfeita.
							</p>
							<div className="flex items-center justify-end gap-3">
								<button className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={() => setConfirmSquadOpen(false)} disabled={confirmSquadLoading}>
									Cancelar
								</button>
								<button
									className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
									onClick={async () => {
										if (!confirmSquadId) return;
										setConfirmSquadLoading(true);
										try {
											const res = await fetch(`/api/squads/${confirmSquadId}`, { method: "DELETE" });
											if (!res.ok) {
												const j = await res.json().catch(() => ({}));
												alert(j?.error || "Erro ao excluir squad");
											} else {
												await loadSquads();
											}
										} catch (e: any) {
											alert(e?.message || "Erro ao excluir squad");
										} finally {
											setConfirmSquadLoading(false);
											setConfirmSquadOpen(false);
											setConfirmSquadId(null);
											setConfirmSquadName("");
										}
									}}
									disabled={confirmSquadLoading}
								>
									Excluir
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}