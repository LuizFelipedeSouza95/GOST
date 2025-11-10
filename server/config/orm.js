import 'reflect-metadata';
import 'dotenv/config';
import { ReflectMetadataProvider } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Usuario } from '../entities/usuarios.entity.js';
import { Comando } from '../entities/comando.entity.js';
import { Squads } from '../entities/squads.entity.js';

const config = {
  migrations: {
    path: './dist/migrations',
    pathTs: './server/migrations',
    tableName: 'gost_migrations',
    transactional: true,
  },
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL || process.env.GOST_DATABASE_URL,
  schema: process.env.DB_SCHEMA || 'public',
  entities: [Usuario, Comando, Squads],
  metadataProvider: ReflectMetadataProvider,
  debug: process.env.NODE_ENV !== 'production',
  driverOptions: (() => {
    const url = process.env.DATABASE_URL || process.env.GOST_DATABASE_URL || '';
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    if (isLocal) return undefined;
    return {
      connection: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    };
  })(),
};

export default config;