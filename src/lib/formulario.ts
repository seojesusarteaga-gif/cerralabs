/**
 * Piezas comunes de los formularios del sitio.
 *
 * Hay dos flujos distintos y deliberadamente separados: /contacto recibe
 * solicitudes comerciales y /unete-como-closer recibe candidaturas. Comparten
 * la fontanería —limpieza de entrada, validación, límite por IP, avisos por
 * Telegram y por email— pero no los datos ni el destino.
 *
 * Todo lo que vive aquí se escribió primero para /api/contact; se extrajo al
 * añadir el segundo formulario para no mantener dos copias que se separan con
 * el tiempo.
 */

/** Escapa lo que va a viajar dentro de HTML, en el email y en Telegram. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Normaliza un campo del formulario: salta de línea unificado, fuera los
 * caracteres de control —que solo sirven para inyectar cabeceras o meter
 * basura invisible— y recorte a la longitud máxima.
 */
export function limpiar(v: FormDataEntryValue | null, max: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

/** Validación de email suficientemente estricta sin caer en regex imposibles. */
export function emailValido(v: string): boolean {
  if (v.length > 200 || /\s/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

/**
 * Teléfono: solo dígitos y los separadores habituales, con entre 9 y 15
 * dígitos (15 es el máximo de E.164). No se normaliza: se guarda tal cual lo
 * escribió la persona, que es como se va a marcar.
 */
export function telefonoValido(v: string): boolean {
  if (!/^[0-9+ ().-]+$/.test(v)) return false;
  const digitos = v.replace(/\D/g, '').length;
  return digitos >= 9 && digitos <= 15;
}

/**
 * Enlace opcional. Solo http y https: un `javascript:` o un `data:` guardado
 * tal cual acabaría siendo un enlace en el aviso y en el panel.
 */
export function enlaceValido(v: string): boolean {
  if (v.length > 300) return false;
  try {
    const u = new URL(v.includes('://') ? v : `https://${v}`);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname.includes('.'));
  } catch {
    return false;
  }
}

/** Añade el esquema cuando la persona escribe solo el dominio. */
export function normalizarEnlace(v: string): string {
  return v.includes('://') ? v : `https://${v}`;
}

const LIMITE_POR_VENTANA = 5;
const VENTANA_MS = 10 * 60 * 1000;

/**
 * Limitación por IP en memoria, compartida por los dos formularios.
 *
 * Advertencia honesta: en Vercel cada instancia de la función tiene su propia
 * memoria y las instancias se reciclan, así que esto NO es un límite estricto.
 * Frena el caso realista —un script que dispara cientos de envíos seguidos—
 * pero no a un atacante decidido. Si algún día hay abuso real, la solución es
 * un almacén compartido (Upstash, Vercel KV) o un captcha invisible.
 */
const peticiones = new Map<string, number[]>();

export function demasiadasPeticiones(ip: string): boolean {
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

/** IP de la petición, con el encabezado de Vercel como respaldo. */
export function ipDe(request: Request, clientAddress?: string): string {
  return (
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'desconocida'
  );
}

/**
 * Página de error. Sin JavaScript no hay validación en cliente que sobreviva a
 * un envío manipulado, así que el servidor responde con una página propia y un
 * 422, en vez de un redirect que perdería el motivo.
 */
export function paginaError(motivo: string, volverA: string, marca: string, email: string): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>No se pudo enviar | ${marca}</title></head>
<body style="margin:0;background:#fff;color:#14171c;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65">
<div style="max-width:640px;margin:0 auto;padding:4rem 1.25rem">
<p style="font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 .85rem">No se pudo enviar</p>
<h1 style="font-size:1.9rem;line-height:1.2;margin:0 0 .6em;letter-spacing:-.02em">${esc(motivo)}</h1>
<p style="color:#3d434e;margin:0 0 1.5rem">Vuelve al formulario y revisa los campos. Si el problema se repite, escríbenos a ${esc(email)} y lo miramos.</p>
<a href="${esc(volverA)}" style="display:inline-flex;padding:.85rem 1.5rem;border-radius:10px;background:#14171c;color:#fff;text-decoration:none;font-weight:500">Volver al formulario</a>
</div></body></html>`;
  return new Response(html, {
    status: 422,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export function redirigir(destino: string): Response {
  return new Response(null, { status: 303, headers: { location: destino } });
}

export async function enviarTelegram(token: string, chatId: string, text: string) {
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

export async function enviarEmail(
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

/** True si la variable está puesta y no es el marcador de pendiente. */
export const puesto = (v?: string) => Boolean(v && v !== 'PENDIENTE');

/**
 * Remitente de los avisos.
 *
 * TBD DOMINIO: al verificar cerralabs.es en Resend, cambiar RESEND_FROM a
 * avisos@cerralabs.es. onboarding@resend.dev es el remitente compartido que
 * Resend permite sin dominio verificado.
 */
export function remitente(env: NodeJS.ProcessEnv): string {
  return puesto(env.RESEND_FROM) ? env.RESEND_FROM! : 'Cerra Labs <onboarding@resend.dev>';
}

/**
 * Lanza las tareas de aviso en paralelo y decide si el envío cuenta como
 * recibido. Solo es error si fallan TODAS: con un destino que llegue, el
 * mensaje no se pierde.
 */
export async function repartir(
  tareas: { canal: string; run: Promise<unknown> }[],
  etiqueta: string
): Promise<boolean> {
  const resultados = await Promise.allSettled(tareas.map((t) => t.run));
  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      const canal = tareas[i].canal;
      // El fallo de la base de datos se marca aparte: el visitante no lo nota
      // y el aviso llega igual, pero el registro no estará en el panel.
      const prefijo =
        canal === 'bd'
          ? `[${etiqueta}] NO GUARDADO EN BASE DE DATOS`
          : `[${etiqueta}] Fallo en ${canal}`;
      console.error(prefijo, r.reason);
    }
  });
  return resultados.some((r) => r.status === 'fulfilled');
}
