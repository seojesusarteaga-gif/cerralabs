/**
 * Crea la cuenta de administrador del panel. Se ejecuta una sola vez.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOMBRE="Jesús Arteaga" \
 *     node scripts/seed-admin.mjs
 *
 * Hace falta porque el alta por email está desactivada en Better Auth: dejarla
 * abierta permitiría a cualquiera crearse una cuenta con acceso al panel.
 *
 * Lee DATABASE_URL y BETTER_AUTH_SECRET del entorno. Para ejecutarlo contra la
 * base de datos de producción, traer las variables antes con:
 *
 *   vercel env pull .env.local
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { PrismaNeon } from '@prisma/adapter-neon';
import fs from 'node:fs';

// Carga .env.local si existe, para no tener que exportar a mano.
if (fs.existsSync('.env.local')) {
  for (const linea of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const nombre = process.env.ADMIN_NOMBRE || 'Administrador';

function salir(msg) {
  console.error('\n  ' + msg + '\n');
  process.exit(1);
}

if (!email || !password) salir('Faltan ADMIN_EMAIL o ADMIN_PASSWORD.');
if (password.length < 12) salir('La contraseña debe tener al menos 12 caracteres.');
if (!process.env.DATABASE_URL) salir('Falta DATABASE_URL.');
if (!process.env.BETTER_AUTH_SECRET) salir('Falta BETTER_AUTH_SECRET.');

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const existente = await prisma.user.findUnique({ where: { email } });
if (existente) {
  console.log(`\n  Ya existe una cuenta con ${email}. No se hace nada.\n`);
  process.exit(0);
}

// Se instancia Better Auth con el alta habilitada solo para esta ejecución,
// de modo que la contraseña se cifre con el mismo algoritmo que usa el login.
const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'https://cerralabs.vercel.app',
  emailAndPassword: { enabled: true, minPasswordLength: 12 },
});

try {
  await auth.api.signUpEmail({ body: { email, password, name: nombre } });
  console.log(`\n  Cuenta creada: ${email}`);
  console.log('  Ya puedes entrar en /admin/login\n');
} catch (e) {
  salir('No se ha podido crear la cuenta: ' + (e?.message ?? e));
} finally {
  await prisma.$disconnect();
}
