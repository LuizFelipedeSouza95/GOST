import { getEm } from '../_utils/orm';
import { Usuario } from '../../src/entities/usuarios.entity';

export default async function handler(req: any, res: any) {
	const { id } = req.query || {};
	if (!id || typeof id !== 'string') {
		res.status(400).json({ error: 'ID inválido' });
		return;
	}
	try {
		const em = await getEm();
		const user = await em.findOne(Usuario, { id });
		if (!user) {
			res.status(404).json({ error: 'Não encontrado' });
			return;
		}
		if (req.method === 'GET') {
			res.status(200).json(user);
			return;
		}
		if (req.method === 'PUT') {
			const allowed = ['googleId', 'email', 'name', 'picture', 'roles', 'lastLogin', 'password', 'comando_geral', 'comando_squad', 'classe', 'data_admissao_gost', 'patent', 'active', 'is_comandante_squad', 'nome_squad_subordinado', 'id_squad_subordinado', 'nome_guerra'];
			const body = req.body || {};
			for (const key of allowed) {
				if (key in body) (user as any)[key] = body[key];
			}
			await em.flush();
			res.status(200).json(user);
			return;
		}
		if (req.method === 'DELETE') {
			await em.removeAndFlush(user);
			res.status(204).end();
			return;
		}
		res.status(405).json({ error: 'Method Not Allowed' });
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
}


