/**
 * Webhook de Cal.com — avisa de cada reserva por Telegram y por email.
 *
 * Es la única ruta del sitio que se ejecuta en servidor; el resto son páginas
 * estáticas.
 *
 * Seguridad: Cal.com firma cada envío con HMAC-SHA256 sobre el cuerpo crudo,
 * usando el secreto del webhook, y lo manda en la cabecera `x-cal-signature-256`.
 * Se verifica antes de tocar nada. Sin `CALCOM_WEBHOOK_SECRET` configurado el
 * endpoint devuelve 503 y no procesa: un webhook abierto es un canal de spam
 * directo al Telegram de Jesús.
 *
 * Los dos canales se disparan en paralelo y de forma independiente: si Telegram
 * falla, el email sigue saliendo, y al revés.
 */
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
// Con extensión explícita para que scripts/test-mensaje.mjs pueda importar
// este módulo directamente con Node, sin pasar por el bundler.
import { BOOKING_EVENT_LABELS, BOOKING_QUESTIONS, BRAND } from '../../config/site.ts';

export const prerender = false;

interface CalAttendee {
  name?: string;
  email?: string;
  timeZone?: string;
  phoneNumber?: string;
}

interface CalPayload {
  type?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  uid?: string;
  attendees?: CalAttendee[];
  responses?: Record<string, { label?: string; value?: unknown }>;
  userFieldsResponses?: Record<string, { label?: string; value?: unknown }>;
  eventType?: { slug?: string; title?: string };
  organizer?: { name?: string; email?: string; timeZone?: string };
  metadata?: Record<string, unknown>;
}

interface CalBody {
  triggerEvent?: string;
  createdAt?: string;
  payload?: CalPayload;
}

const MADRID = 'Europe/Madrid';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  // Cal.com envía el hex a secas; algunos proxies añaden el prefijo "sha256=".
  const received = header.startsWith('sha256=') ? header.slice(7) : header;
  return timingSafeEqual(expected, received.toLowerCase());
}

function fmtDate(iso?: string): string {
  if (!iso) return 'sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'sin fecha';
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID,
  }).format(d);
}

/** Aplana el valor de una respuesta de Cal.com, que puede venir de varias formas. */
function flatten(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('value' in v) return flatten(v.value);
    if ('optionValue' in v) return flatten(v.optionValue);
    return '';
  }
  return String(value).trim();
}

/** Extrae las 7 respuestas de pre-cualificación, en el orden del manual. */
function extractAnswers(payload: CalPayload): { label: string; value: string }[] {
  const pools = [payload.responses ?? {}, payload.userFieldsResponses ?? {}];
  const seen = new Set<string>();
  const out: { label: string; value: string }[] = [];

  // Primero las preguntas conocidas, en su orden canónico.
  for (const q of BOOKING_QUESTIONS) {
    for (const pool of pools) {
      const entry = pool[q.id];
      if (!entry) continue;
      const value = flatten(entry.value);
      if (value) {
        out.push({ label: q.label, value });
        seen.add(q.id);
      }
      break;
    }
  }

  // Después, cualquier otra respuesta que Cal.com haya incluido y no sea de
  // sistema, para no perder información si se añade una pregunta nueva.
  const SYSTEM = new Set(['name', 'email', 'location', 'title', 'notes', 'guests', 'rescheduleReason', 'smsReminderNumber', 'attendeePhoneNumber']);
  for (const pool of pools) {
    for (const [key, entry] of Object.entries(pool)) {
      if (seen.has(key) || SYSTEM.has(key)) continue;
      const value = flatten(entry?.value);
      if (!value) continue;
      out.push({ label: entry?.label || key, value });
      seen.add(key);
    }
  }
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegram(token: string, chatId: string, text: string) {
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

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const TRIGGERS: Record<string, string> = {
  BOOKING_CREATED: 'Nueva reserva',
  BOOKING_RESCHEDULED: 'Reserva reprogramada',
  BOOKING_CANCELLED: 'Reserva cancelada',
  BOOKING_REQUESTED: 'Reserva solicitada',
};

/**
 * Construye los dos avisos a partir del cuerpo del webhook.
 * Exportada para poder verificarla sin depender de una reserva real
 * (ver scripts/test-mensaje.mjs).
 */
export function buildMessages(body: CalBody) {
  const trigger = body.triggerEvent ?? 'DESCONOCIDO';
  const payload = body.payload ?? {};
  const attendee = payload.attendees?.[0] ?? {};
  const name = attendee.name?.trim() || 'Sin nombre';
  const email = attendee.email?.trim() || 'sin email';
  const slug = payload.eventType?.slug ?? '';
  const eventLabel =
    BOOKING_EVENT_LABELS[slug] ?? payload.eventType?.title ?? payload.title ?? 'Reserva';
  const when = fmtDate(payload.startTime);
  const answers = extractAnswers(payload);
  const heading = TRIGGERS[trigger] ?? trigger;

  const tgLines = [
    `<b>${esc(heading)} — ${esc(eventLabel)}</b>`,
    '',
    `<b>${esc(name)}</b>`,
    `${esc(email)}`,
    attendee.phoneNumber ? esc(attendee.phoneNumber) : '',
    '',
    `Cuándo: ${esc(when)}`,
    attendee.timeZone ? `Zona horaria: ${esc(attendee.timeZone)}` : '',
  ].filter(Boolean);

  if (answers.length) {
    tgLines.push('', '<b>Pre-cualificación</b>');
    for (const a of answers) tgLines.push(`· <b>${esc(a.label)}:</b> ${esc(a.value)}`);
  } else {
    tgLines.push('', 'Sin respuestas de pre-cualificación en el envío.');
  }
  if (payload.uid) tgLines.push('', `Reserva: https://cal.com/booking/${esc(payload.uid)}`);

  const rows = answers
    .map(
      (a) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${esc(
          a.label
        )}</td><td style="padding:6px 0">${esc(a.value)}</td></tr>`
    )
    .join('');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#14171c;max-width:620px">
<p style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:0 0 4px">${esc(heading)}</p>
<h1 style="font-size:21px;margin:0 0 4px">${esc(name)}</h1>
<p style="margin:0 0 18px;color:#3d434e">${esc(eventLabel)} · ${esc(when)}</p>
<table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">
<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap">Email</td><td style="padding:6px 0">${esc(email)}</td></tr>
${attendee.phoneNumber ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap">Teléfono</td><td style="padding:6px 0">${esc(attendee.phoneNumber)}</td></tr>` : ''}
${attendee.timeZone ? `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap">Zona horaria</td><td style="padding:6px 0">${esc(attendee.timeZone)}</td></tr>` : ''}
</table>
${rows ? `<h2 style="font-size:16px;margin:0 0 8px">Pre-cualificación</h2><table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">${rows}</table>` : '<p style="color:#6b7280;font-size:14px">Sin respuestas de pre-cualificación en el envío.</p>'}
${payload.uid ? `<p style="font-size:14px"><a href="https://cal.com/booking/${esc(payload.uid)}" style="color:#1d4ed8">Ver la reserva en Cal.com</a></p>` : ''}
<p style="font-size:12px;color:#6b7280;margin-top:22px;border-top:1px solid #e3e5e9;padding-top:12px">Aviso automático de ${esc(BRAND.name)}.</p>
</div>`;

  return {
    telegram: tgLines.join('\n'),
    html,
    subject: `${heading}: ${name} — ${eventLabel}`,
    answersFound: answers.length,
  };
}

export const POST: APIRoute = async ({ request }) => {
  const env = process.env;
  const secret = env.CALCOM_WEBHOOK_SECRET;

  // Sin secreto no se procesa nada. Ver comentario de cabecera.
  if (!secret || secret === 'PENDIENTE') {
    return new Response(
      JSON.stringify({ ok: false, error: 'CALCOM_WEBHOOK_SECRET sin configurar' }),
      { status: 503, headers: { 'content-type': 'application/json' } }
    );
  }

  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get('x-cal-signature-256'), secret)) {
    return new Response(JSON.stringify({ ok: false, error: 'Firma no válida' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: CalBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON no válido' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { telegram: tgText, html, subject } = buildMessages(body);

  // ── Envío en paralelo ─────────────────────────────────────────────────────
  const tasks: { canal: string; run: Promise<void> }[] = [];

  const tgToken = env.TELEGRAM_BOT_TOKEN;
  const tgChat = env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat && tgToken !== 'PENDIENTE' && tgChat !== 'PENDIENTE') {
    tasks.push({ canal: 'telegram', run: sendTelegram(tgToken, tgChat, tgText) });
  }

  const resendKey = env.RESEND_API_KEY;
  const to = env.LEAD_NOTIFICATION_EMAIL;
  if (resendKey && to && resendKey !== 'PENDIENTE' && to !== 'PENDIENTE') {
    // TBD DOMINIO: al verificar cerralabs.com en Resend, cambiar el remitente
    // a algo como avisos@cerralabs.com. onboarding@resend.dev es el remitente
    // compartido que Resend permite usar sin dominio verificado.
    const from = env.RESEND_FROM || 'Cerra Labs <onboarding@resend.dev>';
    tasks.push({ canal: 'resend', run: sendEmail(resendKey, from, to, subject, html) });
  }

  if (tasks.length === 0) {
    console.warn('[booking] Reserva recibida pero ningún canal configurado.');
    return new Response(
      JSON.stringify({ ok: true, warning: 'Ningún canal de aviso configurado' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }

  const results = await Promise.allSettled(tasks.map((t) => t.run));
  const estado: Record<string, string> = {};
  results.forEach((r, i) => {
    const canal = tasks[i].canal;
    if (r.status === 'fulfilled') estado[canal] = 'ok';
    else {
      estado[canal] = 'error';
      console.error(`[booking] Fallo en ${canal}:`, r.reason);
    }
  });

  // Siempre 200 mientras la firma sea válida: si devolviéramos error, Cal.com
  // reintentaría y Jesús recibiría el mismo aviso varias veces por el canal
  // que sí funcionó.
  return new Response(JSON.stringify({ ok: true, canales: estado }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

/** GET de cortesía: sirve para comprobar que la función está desplegada. */
export const GET: APIRoute = async () => {
  const env = process.env;
  const conf = (v?: string) => Boolean(v && v !== 'PENDIENTE');
  return new Response(
    JSON.stringify({
      endpoint: 'booking-notification',
      metodo: 'POST',
      configurado: {
        webhookSecret: conf(env.CALCOM_WEBHOOK_SECRET),
        telegram: conf(env.TELEGRAM_BOT_TOKEN) && conf(env.TELEGRAM_CHAT_ID),
        resend: conf(env.RESEND_API_KEY) && conf(env.LEAD_NOTIFICATION_EMAIL),
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};
