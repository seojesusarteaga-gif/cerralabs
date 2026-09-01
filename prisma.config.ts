/**
 * Configuración de Prisma 7.
 *
 * Desde la versión 7 las cadenas de conexión salen de schema.prisma y viven
 * aquí. El cliente en tiempo de ejecución no las usa: recibe el adaptador de
 * Neon ya construido desde src/lib/db.ts. Este archivo lo consume la CLI para
 * generar y aplicar migraciones.
 *
 * La conexión se declara solo si DIRECT_URL existe, para que `prisma generate`
 * funcione sin base de datos. Las migraciones sí la necesitan, y avisan solas
 * si falta.
 */
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

// Carga .env.local si existe, para no tener que exportar las variables a mano.
// Es el fichero que genera `vercel env pull`.
if (fs.existsSync('.env.local')) {
  for (const linea of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// La directa: aplicar una migración a través del pooler de Neon falla.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(url && url !== 'PENDIENTE' ? { datasource: { url } } : {}),
});
