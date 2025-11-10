import { getEm } from './_utils/orm.js';
import { Usuario } from '../src/entities/usuarios.entity';

export default async function handler(req: any, res: any) {
	try {
		if (req.method === 'GET') {
			const em = await getEm();
			const users = await em.find(Usuario, {}, { limit: 200, orderBy: { createdAt: 'desc' } as any });
			res.status(200).json(users.map(u => ({
				id: u.id,
				googleId: (u as any).googleId ?? null,
				email: u.email,
				name: u.name,
				picture: (u as any).picture ?? null,
				roles: u.roles,
				lastLogin: (u as any).lastLogin ?? null,
				password: (u as any).password ?? null,
				patent: u.patent,
				comando_geral: u.comando_geral,
				comando_squad: u.comando_squad,
				active: (u as any).active ?? true,
				nome_guerra: (u as any).nome_guerra ?? null,
				is_comandante_squad: (u as any).is_comandante_squad ?? false,
				nome_squad_subordinado: (u as any).nome_squad_subordinado ?? null,
				id_squad_subordinado: (u as any).id_squad_subordinado ?? null,
				classe: (u as any).classe ?? '',
				data_admissao_gost: (u as any).data_admissao_gost ?? ''
			})));
			return;
		}
		if (req.method === 'POST') {
			const contentType = (req.headers?.['content-type'] || '') as string;
			let body: any = req.body;
			if (typeof body === 'string') {
				try {
					body = JSON.parse(body);
				} catch {
					try {
						const params = new URLSearchParams(body);
						body = Object.fromEntries(params.entries());
					} catch {
						body = {};
					}
				}
			}
			if (!body && contentType.includes('application/json')) {
				body = {};
			}
			const { email, name, password } = body || {};
			if (!email) {
				res.status(400).json({ error: 'Email é obrigatório' });
				return;
			}
			const em = await getEm();
			const existing = await em.findOne(Usuario, { email });
			if (existing) {
				res.status(409).json({ error: 'Usuário já existe' });
				return;
			}
			const user = em.create(Usuario, {
				email,
				name: name || null,
				password: password || null,
				roles: ['user'],
				active: true,
				comando_geral: [],
				classe: '',
				data_admissao_gost: '',
				patent: 'recruta',
				createdAt: new Date(),
				updatedAt: new Date(),
				lastLogin: null,
				picture: null,
				comando_squad: null,
				is_comandante_squad: false,
				nome_squad_subordinado: null,
				nome_guerra: null,
			});
			await em.persistAndFlush(user);
			res.status(201).json({ id: user.id, email: user.email, name: user.name });
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error('POST /api/users error:', err);
		res.status(500).json({ error: 'Erro interno', detail: err?.message || String(err) });
	}
}


