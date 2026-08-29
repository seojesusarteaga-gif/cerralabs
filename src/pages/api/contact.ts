/**
 * Formulario de contacto — avisa de cada solicitud por Telegram y por email.
 *
 * Es la única ruta del sitio que se ejecuta en servidor; el resto son páginas
 * estáticas.
 *
 * Funciona sin JavaScript: el formulario hace POST nativo y el endpoint
 * responde con una redirección 303. En caso de éxito lleva a /gracias; si la
 * validación falla, devuelve una página de error con enlace de vuelta.
 *
 * Los dos canales se disparan en paralelo y de forma independiente: si Telegram
 * falla, el email sigue saliendo, y al revés.
 *
 * Protección frente a abuso: campo honeypot más limitación por IP. Ver la nota
 * en `demasiadasPeticiones`.
 */
import type { APIRoute } from 'astro';
import {
  BRAND,
  CONTACT_FIELDS,
  FACTURACION_OPCIONES,
  VERTICAL_OPCIONES,
} from '../../config/site.ts';

export const prerender = false;

const LIMITE_POR_VENTANA = 5;
const VENTANA_MS = 10 * 60 * 1000;

/**
 * Limitación por IP en memoria.
 *
 * Advertencia honesta: en Vercel cada instancia de la función tiene su propia
 * memoria y las instancias se reciclan, así que esto NO es un límite estricto.
 * Frena el caso realista —un script que dispara cientos de envíos seguidos—
 * pero no a un atacante decidido. Si algún día hay abuso real, la solución es
 * un almacén compartido (Upstash, Vercel KV) o un captcha invisible.
 */
const peticiones = new Map<string, number[]>();

function demasiadasPeticiones(ip: string): boolean {
  const ahora = Date.now();
  const previas = (peticiones.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previas.push(ahora);
  peticiones.set(ip, previas);

  // Poda para que el Map no crezca sin límite en instancias longevas.
  if (peticiones.size > 500) {
    for (const [k, v] of peticiones) {
      if (v.every((t) => ahora - t >= VENTANA_MS)) peticiones.delete(k);
    }
  }
  return previas.length > LIMITE_POR_VENTANA;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Validación de email suficientemente estricta sin caer en regex imposibles. */
function emailValido(v: string): boolean {
  if (v.length > 200 || /\s/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

function limpiar(v: FormDataEntryValue | null, max: number): string {
  if (typeof v !== 'string') return '';
  // Se normalizan los saltos de línea y se eliminan el resto de caracteres de
  // control, que solo sirven para inyectar cabeceras o meter basura invisible.
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

function paginaError(motivo: string): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>No se pudo enviar | ${BRAND.name}</title></head>
<body style="margin:0;background:#fff;color:#14171c;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65">
<div style="max-width:640px;margin:0 auto;padding:4rem 1.25rem">
<p style="font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 .85rem">No se pudo enviar</p>
<h1 style="font-size:1.9rem;line-height:1.2;margin:0 0 .6em;letter-spacing:-.02em">${esc(motivo)}</h1>
<p style="color:#3d434e;margin:0 0 1.5rem">Vuelve al formulario y revisa los campos. Si el problema se repite, escríbenos a ${esc(BRAND.email)} y lo miramos.</p>
<a href="/contacto" style="display:inline-flex;padding:.85rem 1.5rem;border-radius:10px;background:#14171c;color:#fff;text-decoration:none;font-weight:500">Volver al formulario</a>
</div></body></html>`;
  return new Response(html, {
    status: 422,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function redirigir(destino: string): Response {
  return new Response(null, { status: 303, headers: { location: destino } });
}

async function enviarTelegram(token: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function enviarEmail(
  apiKey: string,
  from: string,
  to: string,
  replyTo: string,
  subject: string,
  html: string
) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export interface Solicitud {
  nombre: string;
  email: string;
  empresa: string;
  web: string;
  facturacion: string;
  vertical: string;
  mensaje: string;
}

/**
 * Construye los dos avisos. Exportada para poder verificarla sin enviar nada
 * (ver scripts/test-mensaje.mjs).
 */
export function buildMessages(d: Solicitud) {
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
    empresa: d.empresa,
    web: d.web,
    facturacion: d.facturacion,
    vertical: d.vertical,
    mensaje: d.mensaje,
  };

  const titulo = d.vertical ? `Nueva solicitud — ${d.vertical}` : 'Nueva solicitud de contacto';

  const lineas = [`<b>${esc(titulo)}</b>`, ''];
  for (const f of CONTACT_FIELDS) {
    if (f.id === 'mensaje') continue;
    const v = valores[f.id];
    if (!v) continue;
    lineas.push(`· <b>${esc(f.label)}:</b> ${esc(v)}`);
  }
  lineas.push('', '<b>Mensaje</b>', esc(d.mensaje), '', `Recibido: ${esc(cuando)}`);

  const filas = CONTACT_FIELDS.filter((f) => f.id !== 'mensaje' && valores[f.id])
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${esc(
          f.label
        )}</td><td style="padding:6px 0">${esc(valores[f.id])}</td></tr>`
    )
    .join('');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14171c;max-width:620px">
<p style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:0 0 4px">${esc(titulo)}</p>
<h1 style="font-size:21px;margin:0 0 4px">${esc(d.nombre)}</h1>
<p style="margin:0 0 18px;color:#3d434e">${esc(d.empresa)}</p>
<table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">${filas}</table>
<h2 style="font-size:16px;margin:0 0 8px">Mensaje</h2>
<p style="white-space:pre-wrap;margin:0 0 18px">${esc(d.mensaje)}</p>
<p style="font-size:14px"><a href="mailto:${esc(d.email)}" style="color:#1d4ed8">Responder a ${esc(d.nombre)}</a></p>
<p style="font-size:12px;color:#6b7280;margin-top:22px;border-top:1px solid #e3e5e9;padding-top:12px">Recibido el ${esc(cuando)} desde el formulario de ${esc(BRAND.name)}.</p>
</div>`;

  return {
    telegram: lineas.join('\n'),
    html,
    subject: `${titulo}: ${d.nombre} — ${d.empresa}`,
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

  // Honeypot: campo oculto que una persona nunca rellena. Si viene con algo,
  // se responde como si todo hubiera ido bien para no darle pistas al bot.
  if (limpiar(form.get('botcheck'), 100)) {
    return redirigir('/gracias');
  }

  const ip =
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'desconocida';
  if (demasiadasPeticiones(ip)) {
    return paginaError('Has enviado demasiadas solicitudes seguidas');
  }

  const d: Solicitud = {
    nombre: limpiar(form.get('nombre'), 100),
    email: limpiar(form.get('email'), 200),
    empresa: limpiar(form.get('empresa'), 150),
    web: limpiar(form.get('web'), 200),
    facturacion: limpiar(form.get('facturacion'), 60),
    vertical: limpiar(form.get('vertical'), 40),
    mensaje: limpiar(form.get('mensaje'), 3000),
  };

  if (d.nombre.length < 2) return paginaError('Falta tu nombre');
  if (!emailValido(d.email)) return paginaError('El email no parece válido');
  if (d.empresa.length < 2) return paginaError('Falta el nombre de tu empresa');
  if (d.mensaje.length < 10) return paginaError('Cuéntanos un poco más en el mensaje');

  // Los desplegables solo aceptan valores conocidos: si llega otra cosa es un
  // envío manipulado y se descarta el campo en vez de propagarlo al aviso.
  if (d.facturacion && !FACTURACION_OPCIONES.includes(d.facturacion as never)) d.facturacion = '';
  if (d.vertical && !VERTICAL_OPCIONES.includes(d.vertical as never)) d.vertical = '';

  const { telegram: tgText, html, subject } = buildMessages(d);

  const tareas: { canal: string; run: Promise<void> }[] = [];
  const puesto = (v?: string) => Boolean(v && v !== 'PENDIENTE');

  if (puesto(env.TELEGRAM_BOT_TOKEN) && puesto(env.TELEGRAM_CHAT_ID)) {
    tareas.push({
      canal: 'telegram',
      run: enviarTelegram(env.TELEGRAM_BOT_TOKEN!, env.TELEGRAM_CHAT_ID!, tgText),
    });
  }

  if (puesto(env.RESEND_API_KEY) && puesto(env.LEAD_NOTIFICATION_EMAIL)) {
    // TBD DOMINIO: al verificar cerralabs.com en Resend, cambiar RESEND_FROM a
    // avisos@cerralabs.com. onboarding@resend.dev es el remitente compartido
    // que Resend permite sin dominio verificado.
    const from =
      env.RESEND_FROM && env.RESEND_FROM !== 'PENDIENTE'
        ? env.RESEND_FROM
        : 'Cerra Labs <onboarding@resend.dev>';
    tareas.push({
      canal: 'resend',
      run: enviarEmail(
        env.RESEND_API_KEY!,
        from,
        env.LEAD_NOTIFICATION_EMAIL!,
        d.email,
        subject,
        html
      ),
    });
  }

  if (tareas.length === 0) {
    // Sin canales configurados la solicitud se perdería en silencio. Se
    // registra en el log y se avisa al visitante en vez de fingir éxito.
    console.error('[contacto] Solicitud recibida sin ningún canal configurado:', {
      nombre: d.nombre,
      email: d.email,
      empresa: d.empresa,
    });
    return paginaError('El formulario todavía no está operativo');
  }

  const resultados = await Promise.allSettled(tareas.map((t) => t.run));
  resultados.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[contacto] Fallo en ${tareas[i].canal}:`, r.reason);
  });

  // Solo se considera error si fallan TODOS los canales: con uno que llegue,
  // Jesús se entera del lead.
  if (resultados.every((r) => r.status === 'rejected')) {
    return paginaError('No hemos podido registrar tu solicitud');
  }

  return redirigir('/gracias');
};

/** GET de cortesía: comprueba que la función está desplegada y qué falta. */
export const GET: APIRoute = async () => {
  const env = process.env;
  const puesto = (v?: string) => Boolean(v && v !== 'PENDIENTE');
  return new Response(
    JSON.stringify({
      endpoint: 'contact',
      metodo: 'POST',
      configurado: {
        telegram: puesto(env.TELEGRAM_BOT_TOKEN) && puesto(env.TELEGRAM_CHAT_ID),
        resend: puesto(env.RESEND_API_KEY) && puesto(env.LEAD_NOTIFICATION_EMAIL),
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};
