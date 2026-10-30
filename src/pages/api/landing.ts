/**
 * Formulario de la landing de campaña (/cerrar-mas-ventas).
 *
 * Es un lead comercial como los de /contacto, así que se guarda en la misma
 * tabla `Lead`. Lo que cambia es el origen: se marca con `LANDING_ORIGEN` para
 * poder separar lo que produce la campaña de lo que llega solo, y el aviso se
 * encabeza con esa misma etiqueta para distinguirlo de un vistazo en Telegram.
 *
 * Los campos tampoco son los mismos: la landing pregunta ticket medio y
 * volumen de oportunidades, que es lo que decide el encaje en esta campaña, y
 * no pregunta vertical ni facturación.
 *
 * Fontanería común en `src/lib/formulario.ts`, igual que los otros dos
 * formularios del sitio.
 */
import type { APIRoute } from 'astro';
import {
  BRAND,
  LANDING_FIELDS,
  LANDING_ORIGEN,
  LANDING_PATH,
  LEADS_OPCIONES,
  TICKET_OPCIONES,
} from '../../config/site.ts';
import { getDb, hayBaseDeDatos } from '../../lib/db.ts';
import {
  demasiadasPeticiones,
  emailValido,
  enviarEmail,
  enviarTelegram,
  esc,
  ipDe,
  limpiar,
  paginaError as errorHtml,
  puesto,
  redirigir,
  remitente,
  repartir,
  telefonoValido,
} from '../../lib/formulario.ts';

export const prerender = false;

const GRACIAS = '/gracias-llamada';

const paginaError = (motivo: string) => errorHtml(motivo, LANDING_PATH, BRAND.name, BRAND.email);

export interface SolicitudLanding {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  web: string;
  ticket: string;
  leads: string;
  mensaje: string;
  utm: string;
}

/**
 * Construye los dos avisos. Exportada para poder verificarla sin enviar nada
 * (ver scripts/test-mensaje.mjs).
 */
export function buildLanding(d: SolicitudLanding) {
  const cuando = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(new Date());

  const valores: Record<string, string> = {
    nombre: d.nombre,
    empresa: d.empresa,
    email: d.email,
    telefono: d.telefono,
    web: d.web,
    ticket: d.ticket,
    leads: d.leads,
    mensaje: d.mensaje,
  };

  const lineas = [`<b>${esc(LANDING_ORIGEN)}</b>`, ''];
  for (const f of LANDING_FIELDS) {
    if (f.id === 'mensaje') continue;
    const v = valores[f.id];
    if (!v) continue;
    lineas.push(`· <b>${esc(f.label)}:</b> ${esc(v)}`);
  }
  lineas.push('', '<b>Qué vende y en qué necesita ayuda</b>', esc(d.mensaje));
  // Los UTM van al final: interesan al revisar la campaña, no al leer el aviso.
  if (d.utm) lineas.push('', `<b>Campaña:</b> ${esc(d.utm)}`);
  lineas.push('', `Recibido: ${esc(cuando)}`);

  const filas = LANDING_FIELDS.filter((f) => f.id !== 'mensaje' && valores[f.id])
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${esc(
          f.label
        )}</td><td style="padding:6px 0">${esc(valores[f.id])}</td></tr>`
    )
    .join('');

  const bloqueUtm = d.utm
    ? `<p style="font-size:13px;color:#6b7280;margin:0 0 18px"><b>Campaña:</b> ${esc(d.utm)}</p>`
    : '<p style="font-size:13px;color:#6b7280;margin:0 0 18px">Sin parámetros de campaña en la URL.</p>';

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14171c;max-width:620px">
<p style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:0 0 4px">${esc(LANDING_ORIGEN)}</p>
<h1 style="font-size:21px;margin:0 0 4px">${esc(d.nombre)}</h1>
<p style="margin:0 0 18px;color:#3d434e">${esc(d.empresa)}</p>
<table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">${filas}</table>
<h2 style="font-size:16px;margin:0 0 8px">Qué vende y en qué necesita ayuda</h2>
<p style="white-space:pre-wrap;margin:0 0 18px">${esc(d.mensaje)}</p>
${bloqueUtm}
<p style="font-size:14px"><a href="mailto:${esc(d.email)}" style="color:#1d4ed8">Responder a ${esc(d.nombre)}</a></p>
<p style="font-size:12px;color:#6b7280;margin-top:22px;border-top:1px solid #e3e5e9;padding-top:12px">Recibido el ${esc(cuando)} desde ${esc(LANDING_PATH)}.</p>
</div>`;

  return {
    telegram: lineas.join('\n'),
    html,
    subject: `${LANDING_ORIGEN}: ${d.nombre} — ${d.empresa}`,
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
    return paginaError('Has enviado demasiadas solicitudes seguidas');
  }

  const d: SolicitudLanding = {
    nombre: limpiar(form.get('nombre'), 100),
    empresa: limpiar(form.get('empresa'), 150),
    email: limpiar(form.get('email'), 200),
    telefono: limpiar(form.get('telefono'), 30),
    web: limpiar(form.get('web'), 200),
    ticket: limpiar(form.get('ticket'), 60),
    leads: limpiar(form.get('leads'), 60),
    mensaje: limpiar(form.get('mensaje'), 3000),
    // Viene de un campo oculto que rellena la página con lo que traía la URL.
    utm: limpiar(form.get('utm'), 400),
  };

  if (d.nombre.length < 2) return paginaError('Falta tu nombre');
  if (d.empresa.length < 2) return paginaError('Falta el nombre de tu empresa');
  if (!emailValido(d.email)) return paginaError('El email no parece válido');
  if (!telefonoValido(d.telefono)) return paginaError('El teléfono no parece válido');
  if (d.mensaje.length < 10) return paginaError('Cuéntanos un poco más sobre lo que vendes');

  // Los desplegables solo aceptan valores conocidos: si llega otra cosa es un
  // envío manipulado y se descarta el campo en vez de propagarlo al aviso.
  if (d.ticket && !TICKET_OPCIONES.includes(d.ticket as never)) d.ticket = '';
  if (d.leads && !LEADS_OPCIONES.includes(d.leads as never)) d.leads = '';

  const { telegram: tgText, html, subject } = buildLanding(d);

  const tareas: { canal: string; run: Promise<unknown> }[] = [];

  if (hayBaseDeDatos()) {
    tareas.push({
      canal: 'bd',
      run: getDb().lead.create({
        data: {
          nombre: d.nombre,
          email: d.email,
          telefono: d.telefono,
          empresa: d.empresa,
          web: d.web || null,
          mensaje: d.mensaje,
          ticket: d.ticket || null,
          leads: d.leads || null,
          origen: LANDING_ORIGEN,
          utm: d.utm || null,
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
    console.error('[landing] Solicitud recibida sin ningún destino configurado:', {
      nombre: d.nombre,
      email: d.email,
      telefono: d.telefono,
      empresa: d.empresa,
    });
    return paginaError('El formulario todavía no está operativo');
  }

  const alguno = await repartir(tareas, 'landing');
  if (!alguno) return paginaError('No hemos podido registrar tu solicitud');

  return redirigir(GRACIAS);
};

/** GET de cortesía: comprueba que la función está desplegada y qué falta. */
export const GET: APIRoute = async () => {
  const env = process.env;
  return new Response(
    JSON.stringify({
      endpoint: 'landing',
      metodo: 'POST',
      origen: LANDING_ORIGEN,
      configurado: {
        telegram: puesto(env.TELEGRAM_BOT_TOKEN) && puesto(env.TELEGRAM_CHAT_ID),
        resend: puesto(env.RESEND_API_KEY) && puesto(env.LEAD_NOTIFICATION_EMAIL),
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};
