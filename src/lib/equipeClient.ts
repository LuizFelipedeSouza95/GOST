let inFlight: Promise<any> | null = null;

export async function fetchEquipeOnce(): Promise<any | null> {
	if (typeof window === "undefined") return null;
	try {
		// sessão: evita múltiplas chamadas na mesma navegação
		const ss = window.sessionStorage;
		const cachedRaw = ss.getItem("equipe_session_cache");
		if (cachedRaw) {
			try {
				return JSON.parse(cachedRaw);
			} catch { /* ignore */ }
		}
		if (inFlight) return await inFlight;
		const origin = window.location.origin || "";
		inFlight = fetch(`${origin}/api/equipe`, { cache: "no-store" })
			.then(async (r) => {
				const data = await r.json().catch(() => []);
				const first = Array.isArray(data) ? (data[0] || null) : null;
				try { ss.setItem("equipe_session_cache", JSON.stringify(first || {})); } catch {}
				try { localStorage.setItem("equipe_cache", JSON.stringify(first || {})); } catch {}
				return first;
			})
			.finally(() => { inFlight = null; });
		return await inFlight;
	} catch {
		return null;
	}
}

export function readEquipeFromLocal(): any | null {
	try {
		const cached = localStorage.getItem("equipe_cache") || sessionStorage.getItem("equipe_session_cache");
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

