/**
 * Candidaturas de closer — formulario de /unete-como-closer.
 *
 * Mismo patrón que `contact.ts` y misma fontanería (`src/lib/formulario.ts`),
 * pero flujo separado de punta a punta: otro destino, otro aviso y otra tabla.
 * El motivo es operativo: una candidatura no es una oportunidad de venta, y
 * mezclarlas obligaría a filtrar basura del embudo comercial cada semana.
 *
 * El aviso se identifica siempre como «Candidatura closer» para que se
 * distinga de un vistazo en Telegram.
 */
import type { APIRoute } from 'astro';
import {
  BRAND,
  CANDIDATURA_FIELDS,
  CANDIDATURA_PATH,
  EXPERIENCIA_OPCIONES,
} from '../../config/site.ts';
import { getDb, hayBaseDeDatos } from '../../lib/db.ts';
import {
  demasiadasPeticiones,
  emailValido,
  enlaceValido,
  enviarEmail,
  enviarTelegram,
  esc,
  ipDe,
  limpiar,
  normalizarEnlace,
  paginaError as errorHtml,
  puesto,
  redirigir,
  remitente,
  repartir,
  telefonoValido,
} from '../../lib/formulario.ts';

export const prerender = false;

const GRACIAS = '/gracias-candidatura';
const TITULO = 'Candidatura closer';

const paginaError = (motivo: string) =>
  errorHtml(motivo, CANDIDATURA_PATH, BRAND.name, BRAND.email);

export interface Candidatura {
  nombre: string;
  email: string;
  telefono: string;
  experiencia: string;
  enlace: string;
  mensaje: string;
}

/**
 * Construye los dos avisos. Exportada para poder verificarla sin enviar nada
 * (ver scripts/test-mensaje.mjs).
 */
export function buildCandidatura(d: Candidatura) {
  const cuando = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(new Date());

  const valores: Record<string, string> = {
    nombre: d.nombre,
    email: d.email,
    telefono: d.telefono,
    experiencia: d.experiencia,
    enlace: d.enlace,
    mensaje: d.mensaje,
  };

  const lineas = [`<b>${esc(TITULO)}</b>`, ''];
  for (const f of CANDIDATURA_FIELDS) {
    if (f.id === 'mensaje') continue;
    const v = valores[f.id];
    if (!v) continue;
    lineas.push(`· <b>${esc(f.label)}:</b> ${esc(v)}`);
  }
  if (d.mensaje) lineas.push('', '<b>Su experiencia, contada por él</b>', esc(d.mensaje));
  lineas.push('', `Recibida: ${esc(cuando)}`);

  const filas = CANDIDATURA_FIELDS.filter((f) => f.id !== 'mensaje' && valores[f.id])
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${esc(
          f.label
        )}</td><td style="padding:6px 0">${esc(valores[f.id])}</td></tr>`
    )
    .join('');

  const bloqueMensaje = d.mensaje
    ? `<h2 style="font-size:16px;margin:0 0 8px">Su experiencia, contada por él</h2>
<p style="white-space:pre-wrap;margin:0 0 18px">${esc(d.mensaje)}</p>`
    : '<p style="margin:0 0 18px;color:#6b7280">No ha rellenado el texto libre.</p>';

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14171c;max-width:620px">
<p style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:0 0 4px">${esc(TITULO)}</p>
<h1 style="font-size:21px;margin:0 0 4px">${esc(d.nombre)}</h1>
<p style="margin:0 0 18px;color:#3d434e">${esc(d.experiencia)}</p>
<table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">${filas}</table>
${bloqueMensaje}
<p style="font-size:14px"><a href="mailto:${esc(d.email)}" style="color:#1d4ed8">Responder a ${esc(d.nombre)}</a></p>
<p style="font-size:12px;color:#6b7280;margin-top:22px;border-top:1px solid #e3e5e9;padding-top:12px">Recibida el ${esc(cuando)} desde ${esc(CANDIDATURA_PATH)} en ${esc(BRAND.name)}.</p>
</div>`;

  return {
    telegram: lineas.join('\n'),
    html,
    subject: `${TITULO}: ${d.nombre} — ${d.experiencia}`,
  };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = process.env;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return paginaError('No hemos podido leer el formulario');
  }

  if (limpiar(form.get('botcheck'), 100)) {
    return redirigir(GRACIAS);
  }

  if (demasiadasPeticiones(ipDe(request, clientAddress))) {
    return paginaError('Has enviado demasiadas candidaturas seguidas');
  }

  const d: Candidatura = {
    nombre: limpiar(form.get('nombre'), 120),
    email: limpiar(form.get('email'), 200),
    telefono: limpiar(form.get('telefono'), 30),
    experiencia: limpiar(form.get('experiencia'), 80),
    enlace: limpiar(form.get('enlace'), 300),
    mensaje: limpiar(form.get('mensaje'), 2000),
  };

  if (d.nombre.length < 3) return paginaError('Falta tu nombre y apellidos');
  if (!emailValido(d.email)) return paginaError('El email no parece válido');
  if (!telefonoValido(d.telefono)) return paginaError('El teléfono no parece válido');

  // El desplegable solo acepta los tramos conocidos. Aquí sí se rechaza en vez
  // de vaciar el campo: la experiencia es obligatoria y es lo primero que se
  // mira al revisar la candidatura.
  if (!EXPERIENCIA_OPCIONES.includes(d.experiencia as never)) {
    return paginaError('Elige tu nivel de experiencia comercial');
  }

  if (d.enlace) {
    if (!enlaceValido(d.enlace)) {
      return paginaError('El enlace a tu LinkedIn o CV no parece válido');
    }
    d.enlace = normalizarEnlace(d.enlace);
  }

  const { telegram: tgText, html, subject } = buildCandidatura(d);

  const tareas: { canal: string; run: Promise<unknown> }[] = [];

  if (hayBaseDeDatos()) {
    tareas.push({
      canal: 'bd',
      run: getDb().candidatura.create({
        data: {
          nombre: d.nombre,
          email: d.email,
          telefono: d.telefono,
          experiencia: d.experiencia,
          enlace: d.enlace || null,
          mensaje: d.mensaje || null,
        },
      }),
    });
  }

  if (puesto(env.TELEGRAM_BOT_TOKEN) && puesto(env.TELEGRAM_CHAT_ID)) {
    tareas.push({
      canal: 'telegram',
      run: enviarTelegram(env.TELEGRAM_BOT_TOKEN!, env.TELEGRAM_CHAT_ID!, tgText),
    });
  }

  // Las candidaturas van al mismo buzón que los leads: hoy las lee la misma
  // persona. El asunto empieza por «Candidatura closer», así que filtrarlas a
  // otra carpeta es una regla de correo, no un cambio de código.
  if (puesto(env.RESEND_API_KEY) && puesto(env.LEAD_NOTIFICATION_EMAIL)) {
    tareas.push({
      canal: 'resend',
      run: enviarEmail(
        env.RESEND_API_KEY!,
        remitente(env),
        env.LEAD_NOTIFICATION_EMAIL!,
        d.email,
        subject,
        html
      ),
    });
  }

  if (tareas.length === 0) {
    console.error('[candidatura] Recibida sin ningún destino configurado:', {
      nombre: d.nombre,
      email: d.email,
      telefono: d.telefono,
      experiencia: d.experiencia,
    });
    return paginaError('El formulario de candidaturas todavía no está operativo');
  }

  const alguno = await repartir(tareas, 'candidatura');
  if (!alguno) return paginaError('No hemos podido registrar tu candidatura');

  return redirigir(GRACIAS);
};

/** GET de cortesía: comprueba que la función está desplegada y qué falta. */
export const GET: APIRoute = async () => {
  const env = process.env;
  return new Response(
    JSON.stringify({
      endpoint: 'candidatura',
      metodo: 'POST',
      configurado: {
        telegram: puesto(env.TELEGRAM_BOT_TOKEN) && puesto(env.TELEGRAM_CHAT_ID),
        resend: puesto(env.RESEND_API_KEY) && puesto(env.LEAD_NOTIFICATION_EMAIL),
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};
