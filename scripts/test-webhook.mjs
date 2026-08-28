/**
 * Prueba del webhook de Cal.com sin necesidad de una reserva real.
 *
 *   node scripts/test-webhook.mjs [url] [secreto]
 *
 * Por defecto apunta al servidor de desarrollo. Comprueba tres cosas: que una
 * firma válida se acepta, que una inválida se rechaza con 401 y que un cuerpo
 * sin firma se rechaza también.
 */
import crypto from 'node:crypto';

const URL_BASE = process.argv[2] || 'http://localhost:4321';
const SECRET = process.argv[3] || 'secreto-de-prueba';
const ENDPOINT = `${URL_BASE}/api/booking-notification`;

const payload = {
  triggerEvent: 'BOOKING_CREATED',
  createdAt: new Date().toISOString(),
  payload: {
    title: 'Diagnóstico entre Cerra Labs y Prueba S.L.',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    uid: 'prueba-uid-123',
    eventType: { slug: 'diagnostico-agencias', title: 'Diagnóstico · Agencias' },
    attendees: [
      {
        name: 'Nombre De Prueba',
        email: 'prueba@ejemplo.com',
        timeZone: 'Europe/Madrid',
      },
    ],
    responses: {
      name: { label: 'Nombre', value: 'Nombre De Prueba' },
      email: { label: 'Email', value: 'prueba@ejemplo.com' },
      empresa: { label: 'Empresa y web', value: 'Prueba S.L. — prueba.es' },
      facturacion: { label: 'Facturación anual aproximada', value: 'Entre 300.000 € y 1 M€' },
      'leads-mes': { label: 'Leads calificados al mes', value: '25' },
      'ticket-medio': { label: 'Ticket medio', value: '4.500 €' },
      'ciclo-venta': { label: 'Ciclo de venta actual', value: 'Discovery, propuesta y cierre, unas 3 semanas' },
      expectativas: { label: 'Qué espera de Cerra Labs', value: 'Dejar de cerrar yo todas las propuestas' },
      timeline: { label: 'Cuándo quiere empezar', value: 'Este mes' },
    },
  },
};

const raw = JSON.stringify(payload);
const good = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

async function probe(nombre, headers, esperado) {
  let res, body;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: raw,
    });
    body = await res.text();
  } catch (e) {
    console.log(`  ${nombre.padEnd(28)} ERROR DE RED: ${e.message}`);
    return false;
  }
  const ok = res.status === esperado;
  console.log(
    `  ${nombre.padEnd(28)} ${String(res.status).padEnd(5)} ${ok ? 'ok' : `FALLO (esperado ${esperado})`}  ${body.slice(0, 110)}`
  );
  return ok;
}

console.log(`\nProbando ${ENDPOINT}\n`);

const gres = await fetch(ENDPOINT).catch(() => null);
if (gres) console.log(`  GET de estado               ${gres.status}    ${(await gres.text()).slice(0, 140)}\n`);

const resultados = [
  await probe('firma válida', { 'x-cal-signature-256': good }, 200),
  await probe('firma inválida', { 'x-cal-signature-256': 'a'.repeat(64) }, 401),
  await probe('sin cabecera de firma', {}, 401),
];

console.log(`\n${resultados.every(Boolean) ? 'TODAS LAS COMPROBACIONES OK' : 'HAY COMPROBACIONES FALLIDAS'}\n`);
process.exit(resultados.every(Boolean) ? 0 : 1);
