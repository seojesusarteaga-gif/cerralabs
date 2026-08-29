/**
 * Muestra el aviso exacto que se enviará por Telegram y por email a partir de
 * una solicitud de ejemplo, sin necesidad de enviar nada ni de credenciales.
 *
 *   npm run test:mensaje
 */
import { buildMessages } from '../src/pages/api/contact.ts';

const ejemplo = {
  nombre: 'Marta Ruiz',
  email: 'marta@estudionorte.es',
  empresa: 'Estudio Norte',
  web: 'estudionorte.es',
  facturacion: 'Entre 500.000 € y 2 M€',
  vertical: 'Agencias',
  mensaje:
    'Nos entran unos 18 leads calificados al mes por referencias y contenido.\nCierro yo todas las propuestas y no doy abasto. Ticket medio 6.000 €, ciclo de unas 3 semanas.',
};

const m = buildMessages(ejemplo);

console.log('\n─── ASUNTO DEL EMAIL ───────────────────────────────────────────');
console.log(m.subject);

console.log('\n─── MENSAJE DE TELEGRAM (sin las etiquetas de formato) ─────────');
console.log(m.telegram.replace(/<\/?b>/g, ''));

// El campo opcional vacío no debe aparecer en el aviso.
const sinOpcionales = buildMessages({
  ...ejemplo,
  web: '',
  facturacion: '',
  vertical: '',
});
const limpio =
  !sinOpcionales.telegram.includes('Web:') &&
  !sinOpcionales.telegram.includes('Facturación') &&
  !sinOpcionales.telegram.includes('Vertical');

console.log('\n─── CAMPOS OPCIONALES VACÍOS ───────────────────────────────────');
console.log(limpio ? 'ok: se omiten en vez de aparecer en blanco' : 'FALLO: aparecen vacíos');
console.log(
  sinOpcionales.subject.startsWith('Nueva solicitud de contacto')
    ? 'ok: sin vertical, el asunto es genérico'
    : 'FALLO: asunto incorrecto sin vertical'
);

// Escapado de HTML procedente del visitante.
const malicioso = buildMessages({
  ...ejemplo,
  nombre: '<script>alert(1)</script>',
  mensaje: 'Hola & <b>negrita</b> "comillas"',
});
const fuga =
  malicioso.telegram.includes('<script>') ||
  malicioso.html.includes('<script>') ||
  malicioso.html.includes('<b>negrita</b>');

console.log('\n─── ESCAPADO DE HTML ───────────────────────────────────────────');
console.log(fuga ? 'FALLO: se filtra HTML sin escapar' : 'ok: el HTML del visitante se escapa');

process.exit(limpio && !fuga ? 0 : 1);
