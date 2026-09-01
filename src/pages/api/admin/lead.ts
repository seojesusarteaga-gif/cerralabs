/**
 * Cambio de estado y notas de un lead.
 *
 * Protegido por el middleware: sin sesión devuelve 401 antes de llegar aquí.
 * Responde con redirección para que el formulario del panel funcione sin
 * JavaScript.
 */
import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db.ts';
import { esEstado } from '../../../lib/estados.ts';

export const prerender = false;

const volver = (query: string) =>
  new Response(null, { status: 303, headers: { location: `/admin${query}` } });

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return volver('?error=formulario');
  }

  const id = String(form.get('id') ?? '').trim();
  const estado = String(form.get('estado') ?? '').trim();
  const notasCrudas = String(form.get('notas') ?? '');

  if (!id) return volver('?error=falta-id');
  if (!esEstado(estado)) return volver('?error=estado');

  // Se limpian los caracteres de control y se recorta, igual que en el
  // formulario público.
  const notas = notasCrudas
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 2000);

  try {
    await getDb().lead.update({
      where: { id },
      data: { estado, notas: notas || null },
    });
  } catch (e) {
    console.error('[panel] Error al actualizar el lead', id, e);
    return volver('?error=guardar');
  }

  return volver('?guardado=1');
};
