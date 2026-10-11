/**
 * Formulario comercial — avisa de cada solicitud por Telegram y por email.
 *
 * Funciona sin JavaScript: el formulario hace POST nativo y el endpoint
 * responde con una redirección 303. En caso de éxito lleva a /gracias; si la
 * validación falla, devuelve una página de error con enlace de vuelta.
 *
 * Cada solicitud se guarda en la base de datos y se avisa por Telegram y por
 * email. Los tres van en paralelo y de forma independiente: si uno falla, los
 * otros siguen. La base de datos es el registro duradero que alimenta el panel;
 * Telegram es el aviso inmediato.
 *
 * Las candidaturas de closer tienen su propio endpoint, `candidatura.ts`, y su
 * propia tabla. La fontanería común —limpieza, validación, honeypot, límite
 * por IP y envío— vive en `src/lib/formulario.ts`.
 */
import type { APIRoute } from 'astro';
import {
  BRAND,
  CONTACT_FIELDS,
  CONTACT_PATH,
  FACTURACION_OPCIONES,
  VERTICAL_OPCIONES,
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

const paginaError = (motivo: string) => errorHtml(motivo, CONTACT_PATH, BRAND.name, BRAND.email);

export interface Solicitud {
  nombre: string;
  email: string;
  telefono: string;
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
    telefono: d.telefono,
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

  if (demasiadasPeticiones(ipDe(request, clientAddress))) {
    return paginaError('Has enviado demasiadas solicitudes seguidas');
  }

  const d: Solicitud = {
    nombre: limpiar(form.get('nombre'), 100),
    email: limpiar(form.get('email'), 200),
    telefono: limpiar(form.get('telefono'), 30),
    empresa: limpiar(form.get('empresa'), 150),
    web: limpiar(form.get('web'), 200),
    facturacion: limpiar(form.get('facturacion'), 60),
    vertical: limpiar(form.get('vertical'), 40),
    mensaje: limpiar(form.get('mensaje'), 3000),
  };

  if (d.nombre.length < 2) return paginaError('Falta tu nombre');
  if (!emailValido(d.email)) return paginaError('El email no parece válido');
  if (!telefonoValido(d.telefono)) return paginaError('El teléfono no parece válido');
  if (d.empresa.length < 2) return paginaError('Falta el nombre de tu empresa');
  if (d.mensaje.length < 10) return paginaError('Cuéntanos un poco más en el mensaje');

  // Los desplegables solo aceptan valores conocidos: si llega otra cosa es un
  // envío manipulado y se descarta el campo en vez de propagarlo al aviso.
  if (d.facturacion && !FACTURACION_OPCIONES.includes(d.facturacion as never)) d.facturacion = '';
  if (d.vertical && !VERTICAL_OPCIONES.includes(d.vertical as never)) d.vertical = '';

  const { telegram: tgText, html, subject } = buildMessages(d);

  const tareas: { canal: string; run: Promise<unknown> }[] = [];

  // El registro en base de datos va primero en la lista porque es el que
  // alimenta el panel: si esto falla, el lead no aparecerá en /admin aunque
  // Jesús reciba el aviso, y eso es un hueco silencioso en los datos.
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
          facturacion: d.facturacion || null,
          vertical: d.vertical || null,
          mensaje: d.mensaje,
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
    // Sin base de datos ni canales la solicitud se perdería en silencio. Se
    // registra en el log y se avisa al visitante en vez de fingir éxito.
    console.error('[contacto] Solicitud recibida sin ningún destino configurado:', {
      nombre: d.nombre,
      email: d.email,
      telefono: d.telefono,
      empresa: d.empresa,
    });
    return paginaError('El formulario todavía no está operativo');
  }

  // Solo es error si fallan TODOS los destinos: con uno que llegue, el lead no
  // se pierde.
  const alguno = await repartir(tareas, 'contacto');
  if (!alguno) return paginaError('No hemos podido registrar tu solicitud');

  return redirigir('/gracias');
};

/** GET de cortesía: comprueba que la función está desplegada y qué falta. */
export const GET: APIRoute = async () => {
  const env = process.env;
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
