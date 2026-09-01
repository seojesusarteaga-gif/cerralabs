/**
 * Autenticación del panel.
 *
 * Solo servidor: no se carga cliente de Better Auth en el navegador. El login
 * es un formulario HTML que hace POST, la sesión viaja en cookie y el
 * middleware la valida. Así el sitio entero sigue sin enviar JavaScript.
 *
 * REGISTRO CERRADO. `disableSignUp` apaga el alta por email. Sin eso, la ruta
 * /api/auth/sign-up/email queda abierta y cualquiera se crea una cuenta con
 * acceso al panel y a los datos de contacto de los prospectos. La cuenta de
 * administrador se crea una sola vez con scripts/seed-admin.mjs.
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { getDb } from './db.ts';

let cache: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (cache) return cache;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret === 'PENDIENTE') {
    throw new Error('BETTER_AUTH_SECRET sin configurar');
  }

  cache = betterAuth({
    database: prismaAdapter(getDb(), { provider: 'postgresql' }),
    secret,
    baseURL: process.env.BETTER_AUTH_URL || 'https://cerralabs.vercel.app',

    emailAndPassword: {
      enabled: true,
      // Ver la nota de cabecera: sin esto el panel queda abierto a cualquiera.
      disableSignUp: true,
      minPasswordLength: 12,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },

    advanced: {
      // El panel y el sitio comparten origen, así que Lax basta y protege de
      // CSRF en peticiones entre sitios.
      defaultCookieAttributes: {
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  });

  return cache;
}

/** True si la autenticación tiene todo lo que necesita para funcionar. */
export function hayAuth(): boolean {
  const s = process.env.BETTER_AUTH_SECRET;
  const d = process.env.DATABASE_URL;
  return Boolean(s && s !== 'PENDIENTE' && d && d !== 'PENDIENTE');
}
