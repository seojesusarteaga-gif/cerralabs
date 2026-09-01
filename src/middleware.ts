/**
 * Guarda del panel.
 *
 * Protege `/admin` y `/api/admin`. Proteger solo las páginas dejaría los
 * endpoints abiertos: cualquiera podría cambiar el estado de un lead con un
 * POST aunque no pudiera ver el listado.
 *
 * La sesión validada se deja en `locals` para que las páginas no tengan que
 * volver a consultarla.
 */
import { defineMiddleware } from 'astro:middleware';
import { getAuth, hayAuth } from './lib/auth.ts';

const LOGIN = '/admin/login';

/**
 * Rutas del panel que tienen que ser accesibles sin sesión: son justamente las
 * que sirven para obtenerla o soltarla. Si el guardián las cubriera, el login
 * respondería 401 y no se podría entrar nunca.
 */
const PUBLICAS = new Set(['/api/admin/entrar', '/api/admin/salir']);

export const onRequest = defineMiddleware(async (context, next) => {
  const ruta = context.url.pathname.replace(/\/$/, '') || '/';
  const esPanel = ruta === '/admin' || ruta.startsWith('/admin/');
  const esApiPanel = ruta.startsWith('/api/admin');

  if (PUBLICAS.has(ruta)) return next();
  if (!esPanel && !esApiPanel) return next();

  // Sin configuración no se puede validar nada. Se responde con 503 en vez de
  // dejar pasar: fallar cerrado, nunca abierto.
  if (!hayAuth()) {
    return new Response(
      'El panel todavía no está configurado. Faltan DATABASE_URL o BETTER_AUTH_SECRET.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }

  let sesion: Awaited<ReturnType<ReturnType<typeof getAuth>['api']['getSession']>> = null;
  try {
    sesion = await getAuth().api.getSession({ headers: context.request.headers });
  } catch (e) {
    console.error('[panel] Error al leer la sesión:', e);
    sesion = null;
  }

  // La propia pantalla de login es pública; si ya hay sesión, se salta.
  if (ruta === LOGIN) {
    if (sesion) return context.redirect('/admin', 302);
    return next();
  }

  if (!sesion) {
    if (esApiPanel) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    return context.redirect(LOGIN, 302);
  }

  context.locals.usuario = { id: sesion.user.id, email: sesion.user.email, nombre: sesion.user.name };
  return next();
});
