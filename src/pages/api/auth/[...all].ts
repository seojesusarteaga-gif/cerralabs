/**
 * Rutas de Better Auth: login, logout y sesión.
 *
 * El alta está desactivada en la configuración, así que /sign-up devuelve
 * error aunque la ruta exista.
 */
import type { APIRoute } from 'astro';
import { getAuth, hayAuth } from '../../../lib/auth.ts';

export const prerender = false;

const noConfigurado = () =>
  new Response(JSON.stringify({ error: 'Autenticación sin configurar' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  });

export const ALL: APIRoute = async ({ request }) => {
  if (!hayAuth()) return noConfigurado();
  return getAuth().handler(request);
};
