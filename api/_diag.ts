// @ts-nocheck
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
	try {
		const cwd = process.cwd();
		const candidates = [
			path.join(cwd, 'server', 'config', 'orm.js'),
			path.join(cwd, 'server', 'entities', 'usuarios.entity.js'),
			path.join(cwd, 'server', 'entities', 'comando.entity.js'),
			path.join(cwd, 'server', 'entities', 'squads.entity.js'),
		];
		const results = candidates.map((p) => ({
			path: p,
			exists: fs.existsSync(p),
			size: fs.existsSync(p) ? fs.statSync(p).size : 0,
		}));

		// Lista rápida do diretório server se existir
		let serverListing: any[] = [];
		const serverDir = path.join(cwd, 'server');
		if (fs.existsSync(serverDir)) {
			serverListing = fs.readdirSync(serverDir, { withFileTypes: true }).map((d) => ({
				name: d.name,
				dir: d.isDirectory(),
			}));
		}

		res.status(200).json({
			cwd,
			results,
			serverListing,
			env: {
				node: process.version,
			},
		});
	} catch (e: any) {
		res.status(500).json({ error: 'diag_failed', detail: e?.message || String(e) });
	}
}


