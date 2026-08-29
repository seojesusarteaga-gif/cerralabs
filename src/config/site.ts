/**
 * Fuente única de verdad de Cerra Labs.
 *
 * Todo dato de marca y contacto vive aquí y solo aquí. El cutover de dominio se
 * resuelve editando este archivo, sin rastrear las páginas una por una.
 */

// TBD DOMINIO: al comprar cerralabs.com, cambiar aquí y en astro.config.mjs.
export const SITE_URL = 'https://cerralabs.vercel.app';

/* ─── Formulario de contacto ───────────────────────────────────────────────
 *
 * Toda la conversión pasa por /contacto. No hay booking externo: el visitante
 * envía el formulario, el endpoint /api/contact avisa por Telegram y por email,
 * y Jesús responde para acordar la llamada.
 *
 * Opciones de los desplegables. Los valores viajan tal cual en el envío, así
 * que cambiarlos aquí cambia también lo que aparece en el aviso.
 */

export const CONTACT_PATH = '/contacto';

export const FACTURACION_OPCIONES = [
  'Menos de 100.000 €',
  'Entre 100.000 € y 500.000 €',
  'Entre 500.000 € y 2 M€',
  'Más de 2 M€',
] as const;

export const VERTICAL_OPCIONES = [
  'Agencias',
  'SaaS',
  'Infoproductores',
  'Clínicas',
  'Otro',
] as const;

/** Campos del formulario, en el orden en que aparecen en el aviso de lead. */
export const CONTACT_FIELDS = [
  { id: 'nombre', label: 'Nombre', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'empresa', label: 'Empresa', required: true },
  { id: 'web', label: 'Web', required: false },
  { id: 'facturacion', label: 'Facturación anual', required: false },
  { id: 'vertical', label: 'Vertical', required: false },
  { id: 'mensaje', label: 'Mensaje', required: true },
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
