/**
 * Cliente de Prisma para entorno serverless.
 *
 * Se crea de forma perezosa, en la primera consulta real. Crearlo al importar
 * el módulo haría que el build fallase mientras DATABASE_URL siga sin valor,
 * y el sitio público tiene que poder compilar sin base de datos.
 *
 * Una vez creado se guarda en globalThis: en Vercel varias invocaciones pueden
 * compartir proceso, y crear un cliente por petición abriría conexiones sin
 * control hasta agotar el límite de Neon.
 *
 * El adaptador de Neon habla por HTTP en vez de por el protocolo TCP de
 * Postgres, que es lo que hace viable Prisma en funciones de vida corta.
 */
import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaNeon } from '@prisma/adapter-neon';

const cache = globalThis as unknown as { __prisma?: PrismaClient };

/** True si hay cadena de conexión configurada. */
export function hayBaseDeDatos(): boolean {
  const v = process.env.DATABASE_URL;
  return Boolean(v && v !== 'PENDIENTE');
}

/** Devuelve el cliente, creándolo la primera vez. Lanza si no hay conexión. */
export function getDb(): PrismaClient {
  if (cache.__prisma) return cache.__prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString === 'PENDIENTE') {
    throw new Error(
      'DATABASE_URL sin configurar. El panel y el registro de leads necesitan la ' +
        'cadena de conexión de Neon.'
    );
  }

  const cliente = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: ['error', 'warn'],
  });

  cache.__prisma = cliente;
  return cliente;
}
