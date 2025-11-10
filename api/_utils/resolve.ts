// @ts-nocheck
export async function importAny<T = any>(candidates: string[]): Promise<T> {
	for (const path of candidates) {
		try {
			// eslint-disable-next-line no-await-in-loop
			return (await import(path)) as any;
		} catch {
			// tenta próximo
		}
	}
	throw new Error(`Não foi possível importar nenhum módulo: ${candidates.join(", ")}`);
}


