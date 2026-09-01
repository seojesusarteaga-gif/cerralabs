/**
 * Cierre de sesión por formulario.
 *
 * Va por POST y no por enlace: un GET que cierra sesión lo puede disparar
 * cualquier imagen o prefetch ajeno.
 */
import type { APIRoute } from 'astro';
import { getAuth, hayAuth } from '../../../lib/auth.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers({ location: '/admin/login' });

  if (hayAuth()) {
    try {
      const res = await getAuth().api.signOut({
        headers: request.headers,
        asResponse: true,
      });
      for (const [k, v] of res.headers.entries()) {
        if (k.toLowerCase() === 'set-cookie') headers.append('set-cookie', v);
      }
    } catch (e) {
      console.error('[panel] Error al cerrar sesión:', e);
    }
  }

  return new Response(null, { status: 303, headers });
};
