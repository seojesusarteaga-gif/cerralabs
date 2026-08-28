/**
 * Fuente única de verdad de Cerra Labs.
 *
 * Todo dato de marca, contacto y booking vive aquí y solo aquí. El cutover de
 * dominio y la conexión de Cal.com se resuelven editando este archivo, sin
 * rastrear las páginas una por una.
 */

// TBD DOMINIO: al comprar cerralabs.com, cambiar aquí y en astro.config.mjs.
export const SITE_URL = 'https://cerralabs.vercel.app';

/* ─── Cal.com ──────────────────────────────────────────────────────────────
 *
 * Para activar el booking hacen falta dos cosas:
 *
 *   1. `CALCOM_USERNAME` con el usuario real de la cuenta de Cal.com.
 *   2. `BOOKING_ENABLED = true`.
 *
 * Los slugs de abajo son los que hay que crear en Cal.com como tipos de
 * evento. Si allí se nombran distinto, se corrigen aquí y no hace falta tocar
 * ninguna página: los CTA leen de este archivo.
 *
 * Mientras `BOOKING_ENABLED` sea false, los botones se renderizan visibles
 * pero inertes, para no publicar enlaces rotos.
 */

// TBD CAL.COM: sustituir por el usuario real de la cuenta.
const CALCOM_USERNAME = 'cerralabs';

const BOOKING_ENABLED = false;

export const CALCOM_EVENT_GENERAL = 'diagnostico';
export const CALCOM_EVENT_AGENCIAS = 'diagnostico-agencias';
export const CALCOM_EVENT_SAAS = 'diagnostico-saas';
export const CALCOM_EVENT_INFOPRODUCTORES = 'diagnostico-infoproductores';
export const CALCOM_EVENT_CLINICAS = 'diagnostico-clinicas';
export const CALCOM_EVENT_CLOSER = 'entrevista-closer';

export const BOOKING = {
  enabled: BOOKING_ENABLED,
  username: CALCOM_USERNAME,
  base: `https://cal.com/${CALCOM_USERNAME}`,
  events: {
    general: CALCOM_EVENT_GENERAL,
    agencias: CALCOM_EVENT_AGENCIAS,
    saas: CALCOM_EVENT_SAAS,
    infoproductores: CALCOM_EVENT_INFOPRODUCTORES,
    clinicas: CALCOM_EVENT_CLINICAS,
    closer: CALCOM_EVENT_CLOSER,
  },
} as const;

export type BookingEvent = keyof typeof BOOKING.events;

export function bookingUrl(event: BookingEvent = 'general'): string | null {
  if (!BOOKING.enabled) return null;
  return `${BOOKING.base}/${BOOKING.events[event]}`;
}

/** Etiqueta legible de cada evento, para el aviso de lead. */
export const BOOKING_EVENT_LABELS: Record<string, string> = {
  [CALCOM_EVENT_GENERAL]: 'Diagnóstico general',
  [CALCOM_EVENT_AGENCIAS]: 'Diagnóstico · Agencias',
  [CALCOM_EVENT_SAAS]: 'Diagnóstico · SaaS',
  [CALCOM_EVENT_INFOPRODUCTORES]: 'Diagnóstico · Infoproductores',
  [CALCOM_EVENT_CLINICAS]: 'Diagnóstico · Clínicas',
  [CALCOM_EVENT_CLOSER]: 'Entrevista de closer',
};

/**
 * Preguntas de pre-cualificación. Se configuran en Cal.com, en cada tipo de
 * evento, con estas mismas identificaciones para que el webhook las reconozca
 * y las ordene igual en el aviso. Si cambia un identificador en Cal.com, hay
 * que cambiarlo aquí también.
 */
export const BOOKING_QUESTIONS = [
  { id: 'empresa', label: 'Empresa y web' },
  { id: 'facturacion', label: 'Facturación anual aproximada' },
  { id: 'leads-mes', label: 'Leads calificados al mes' },
  { id: 'ticket-medio', label: 'Ticket medio' },
  { id: 'ciclo-venta', label: 'Ciclo de venta actual' },
  { id: 'expectativas', label: 'Qué espera de Cerra Labs' },
  { id: 'timeline', label: 'Cuándo quiere empezar' },
] as const;

export const BRAND = {
  name: 'Cerra Labs',
  legalName: 'Cerra Labs',
  tagline: 'Agencia de closing B2B',
  // TBD EMAIL: la cuenta se crea con el dominio. Hasta entonces se muestra
  // como texto, nunca como mailto activo.
  email: 'hola@cerralabs.com',
  emailActive: false,
  country: 'ES',
  logo: '/logo-cerra-labs.svg',
  mark: '/mark-cerra-labs.svg',
  // Tarjeta social. Se regenera con `node scripts/generate-og.mjs`.
  ogImage: '/og-cerra-labs.png',
  // TBD REDES: añadir la URL de LinkedIn Company Page cuando se cree (RD6).
  sameAs: [] as string[],
} as const;

export const VERTICALS = [
  {
    slug: 'agencias',
    nav: 'Agencias',
    card: 'Agencias de marketing, diseño, desarrollo y consultoría',
    summary:
      'El fundador cierra todas las ventas y se ha convertido en el cuello de botella del crecimiento.',
    fit: 'Facturación anual desde 300.000 €, entre 5 y 30 empleados, ticket de servicio desde 3.000 €.',
  },
  {
    slug: 'saas',
    nav: 'SaaS',
    card: 'SaaS y tecnología B2B',
    summary:
      'Llegan demos cualificadas de forma recurrente pero el ratio de cierre se queda por debajo del 25 %.',
    fit: 'ARR entre 500.000 € y 5 millones, 20 o más demos cualificadas al mes.',
  },
  {
    slug: 'infoproductores',
    nav: 'Infoproductores',
    card: 'Infoproductores y formación high-ticket',
    summary:
      'El sistema de captación funciona, pero el cierre depende del fundador o de un freelance sin método.',
    fit: 'Facturación desde 20.000 € al mes, tickets entre 2.000 € y 10.000 €.',
  },
  {
    slug: 'clinicas',
    nav: 'Clínicas',
    card: 'Clínicas privadas y salud premium',
    summary:
      'Las valoraciones se llenan, pero una parte grande de pacientes no llega a confirmar el tratamiento.',
    fit: 'Ticket de tratamiento desde 3.000 €, consultas de valoración presenciales o por videollamada.',
  },
] as const;

export const NAV = [
  { href: '/servicio', label: 'Cómo trabajamos' },
  { href: '/agencias', label: 'Agencias' },
  { href: '/saas', label: 'SaaS' },
  { href: '/infoproductores', label: 'Infoproductores' },
  { href: '/clinicas', label: 'Clínicas' },
  { href: '/sobre-nosotros', label: 'Quiénes somos' },
  { href: '/unete-como-closer', label: 'Únete como closer' },
] as const;

// /casos existe y es rastreable, pero se mantiene fuera de la navegación
// principal hasta que haya dos casos con métricas reales publicables.
export const FOOTER_EXTRA = [
  { href: '/casos', label: 'Casos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
] as const;
