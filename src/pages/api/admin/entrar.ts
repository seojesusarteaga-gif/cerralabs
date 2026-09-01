/**
 * Login por formulario.
 *
 * Better Auth espera JSON; el formulario envía datos de formulario. Este
 * endpoint hace de puente para que el panel funcione sin JavaScript: traduce,
 * llama a la API de Better Auth, traslada la cookie de sesión y redirige.
 */
import type { APIRoute } from 'astro';
import { getAuth, hayAuth } from '../../../lib/auth.ts';

export const prerender = false;

const alLogin = (error: string) =>
  new Response(null, { status: 303, headers: { location: `/admin/login?error=${error}` } });

export const POST: APIRoute = async ({ request }) => {
  if (!hayAuth()) {
    return new Response('El panel todavía no está configurado.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return alLogin('faltan');
  }

  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return alLogin('faltan');

  try {
    const res = await getAuth().api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!res.ok) return alLogin('credenciales');

    // Se conservan las cabeceras Set-Cookie que emite Better Auth y se cambia
    // el cuerpo por una redirección al panel.
    const headers = new Headers();
    for (const [k, v] of res.headers.entries()) {
      if (k.toLowerCase() === 'set-cookie') headers.append('set-cookie', v);
    }
    headers.set('location', '/admin');
    return new Response(null, { status: 303, headers });
  } catch (e) {
    console.error('[panel] Error al iniciar sesión:', e);
    return alLogin('credenciales');
  }
};
