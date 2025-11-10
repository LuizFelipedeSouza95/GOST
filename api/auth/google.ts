// @ts-nocheck
import { OAuth2Client } from 'google-auth-library';
import { getEm } from '../_utils/orm.js';
import { importAny } from '../_utils/resolve';

export default async function handler(req: any, res: any) {
	// CORS headers (dev/prod)
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	const method = (req.method || '').toUpperCase();
	if (method === 'OPTIONS') {
		res.status(204).end();
		return;
	}
	if (method !== 'POST') {
		res.status(405).json({ error: 'Method Not Allowed' });
		return;
	}
	try {
		let body: any = req.body;
		if (typeof body === 'string') {
			try { body = JSON.parse(body); } catch { body = {}; }
		}
		if (!body || typeof body !== 'object') body = {};
		const credential = body?.credential;
		if (!credential) return res.status(400).json({ error: 'credential ausente' });

		const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
		if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID não configurado' });

		const client = new OAuth2Client(clientId);
		const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
		const payload = ticket.getPayload();
		if (!payload) return res.status(401).json({ error: 'Token inválido' });

		const googleId = payload.sub;
		const email = payload.email as string | undefined;
		const name = payload.name as string | undefined;
		const picture = payload.picture as string | undefined;

		if (!email) return res.status(400).json({ error: 'Email não presente no token' });

		const em = await getEm();
		const { Usuario } = await importAny(['../../server/entities/usuarios.entity.js', '../../src/entities/usuarios.entity']);
		let user = await em.findOne(Usuario, { email });
		if (user && (user as any).active === false) {
			res.status(403).json({ error: 'Usuário inativo' });
			return;
		}
		if (!user) {
			user = em.create(Usuario, {
				email,
				name: name || null,
				picture: picture || null,
				googleId,
				roles: ['user'],
				is_comandante_squad: false,
				nome_squad_subordinado: null,
				nome_guerra: null,
				id_squad_subordinado: null,
				active: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				comando_geral: [],
				classe: '',
				data_admissao_gost: '',
				patent: 'recruta',
				comando_squad: null
			});
			await em.persistAndFlush(user);
		} else {
			user.googleId = googleId;
			user.picture = picture || user.picture || null;
			user.name = name || user.name || null;
			user.updatedAt = new Date();
			await em.flush();
		}

		res.status(200).json({
			id: user.id,
			email: user.email,
			name: user.name,
			picture: user.picture,
			roles: user.roles,
			patent: user.patent,
		});
	} catch (err: any) {
		console.error('POST /api/auth/google error:', err);
		res.status(500).json({ error: 'Erro interno', detail: err?.message || String(err) });
	}
}


