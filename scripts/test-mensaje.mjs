/**
 * Muestra el aviso exacto que se enviará por Telegram y por email a partir de
 * un webhook de ejemplo, sin necesidad de una reserva real ni de credenciales.
 *
 *   node scripts/test-mensaje.mjs
 */
import { buildMessages } from '../src/pages/api/booking-notification.ts';

const ejemplo = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    startTime: '2026-09-03T09:30:00.000Z',
    uid: 'abc123xyz',
    eventType: { slug: 'diagnostico-agencias', title: 'Diagnóstico · Agencias' },
    attendees: [
      { name: 'Marta Ruiz', email: 'marta@estudionorte.es', timeZone: 'Europe/Madrid' },
    ],
    responses: {
      name: { label: 'Nombre', value: 'Marta Ruiz' },
      email: { label: 'Email', value: 'marta@estudionorte.es' },
      empresa: { label: 'Empresa y web', value: 'Estudio Norte — estudionorte.es' },
      facturacion: { label: 'Facturación anual aproximada', value: 'Entre 300.000 € y 1 M€' },
      'leads-mes': { label: 'Leads calificados al mes', value: '18' },
      'ticket-medio': { label: 'Ticket medio', value: '6.000 €' },
      'ciclo-venta': { label: 'Ciclo de venta actual', value: 'Discovery, propuesta y cierre. Unas 3 semanas.' },
      expectativas: { label: 'Qué espera de Cerra Labs', value: 'Dejar de cerrar yo todas las propuestas' },
      timeline: { label: 'Cuándo quiere empezar', value: 'Este mes' },
    },
  },
};

const m = buildMessages(ejemplo);

console.log('\n─── ASUNTO DEL EMAIL ───────────────────────────────────────────');
console.log(m.subject);

console.log('\n─── MENSAJE DE TELEGRAM (así se ve, sin las etiquetas) ─────────');
console.log(m.telegram.replace(/<\/?b>/g, ''));

console.log(`\n─── RESPUESTAS DETECTADAS: ${m.answersFound} de 7 ──────────────────────────`);
console.log(m.answersFound === 7 ? 'Las 7 preguntas del manual se extraen bien.' : 'ATENCIÓN: faltan respuestas.');

// Comprobaciones de escapado, por si un prospecto escribe HTML en un campo.
const malicioso = structuredClone(ejemplo);
malicioso.payload.attendees[0].name = '<script>alert(1)</script> & "comillas"';
const esc = buildMessages(malicioso);
const fuga = esc.telegram.includes('<script>') || esc.html.includes('<script>');
console.log('\n─── ESCAPADO DE HTML ───────────────────────────────────────────');
console.log(fuga ? 'FALLO: se filtra HTML sin escapar' : 'ok: el HTML del visitante se escapa');

process.exit(m.answersFound === 7 && !fuga ? 0 : 1);
