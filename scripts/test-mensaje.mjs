/**
 * Muestra el aviso exacto que se enviará por Telegram y por email a partir de
 * una solicitud de ejemplo, sin necesidad de enviar nada ni de credenciales.
 *
 *   npm run test:mensaje
 */
import { buildMessages } from '../src/pages/api/contact.ts';
import { buildLanding } from '../src/pages/api/landing.ts';

const ejemplo = {
  nombre: 'Marta Ruiz',
  email: 'marta@estudionorte.es',
  telefono: '+34 612 34 56 78',
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

// ─── Landing de campaña ──────────────────────────────────────────────────────
// El aviso tiene que distinguirse de un lead normal de un vistazo y llevar los
// parámetros de campaña, que son la única forma de atribuir el envío.
const landing = buildLanding({
  nombre: 'Álvaro Gil',
  empresa: 'Escuela Vértice',
  email: 'alvaro@escuelavertice.es',
  telefono: '+34 611 22 33 44',
  web: 'escuelavertice.es',
  ticket: 'Entre 1.500 € y 3.000 €',
  leads: 'Entre 30 y 100 al mes',
  mensaje:
    'Vendemos un programa de formación en analítica. Llenamos la agenda con contenido pero cierro yo todas las llamadas.',
  utm: 'utm_source=chatgpt&utm_medium=cpc&utm_campaign=cierre-q4',
});

console.log('\n─── AVISO DE LA LANDING DE CAMPAÑA ─────────────────────────────');
console.log(landing.subject);
console.log('');
console.log(landing.telegram.replace(/<\/?b>/g, ''));

const etiquetada =
  landing.subject.startsWith('Lead landing ChatGPT Ads') &&
  landing.telegram.startsWith('<b>Lead landing ChatGPT Ads</b>') &&
  landing.telegram.includes('utm_campaign=cierre-q4');

// Sin UTM el aviso no debe inventarse una línea de campaña vacía.
const sinUtm = buildLanding({
  nombre: 'Álvaro Gil',
  empresa: 'Escuela Vértice',
  email: 'alvaro@escuelavertice.es',
  telefono: '+34 611 22 33 44',
  web: '',
  ticket: '',
  leads: '',
  mensaje: 'Entrada directa sin parámetros de campaña en la URL.',
  utm: '',
});
const sinUtmLimpio =
  !sinUtm.telegram.includes('Campaña:') &&
  !sinUtm.telegram.includes('Web:') &&
  !sinUtm.telegram.includes('Ticket medio:');

console.log('\n─── ATRIBUCIÓN DE LA CAMPAÑA ──────────────────────────────────');
console.log(
  etiquetada
    ? 'ok: el aviso se identifica como campaña y lleva los UTM'
    : 'FALLO: el aviso no se distingue de un lead orgánico'
);
console.log(
  sinUtmLimpio
    ? 'ok: sin UTM y sin opcionales, no aparecen líneas vacías'
    : 'FALLO: aparecen campos vacíos'
);

process.exit(limpio && !fuga && etiquetada && sinUtmLimpio ? 0 : 1);
