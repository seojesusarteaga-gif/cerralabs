/**
 * Fuente única de verdad de Cerra Labs.
 *
 * Todo dato de marca y contacto vive aquí y solo aquí. El cutover de dominio se
 * resuelve editando este archivo, sin rastrear las páginas una por una.
 */

/* Dominio del sitio.
 *
 * De esta constante cuelgan el canonical, og:url, el sitemap y los @id del
 * schema. Debe coincidir siempre con `site` en astro.config.mjs y con la línea
 * Sitemap de public/robots.txt.
 *
 * La URL de Vercel sigue funcionando y sirve el mismo contenido, pero el
 * canonical apunta aquí para que Google consolide el dominio propio.
 */
export const SITE_URL = 'https://cerralabs.es';

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
  { id: 'telefono', label: 'Teléfono', required: true },
  { id: 'empresa', label: 'Empresa', required: true },
  { id: 'web', label: 'Web', required: false },
  { id: 'facturacion', label: 'Facturación anual', required: false },
  { id: 'vertical', label: 'Vertical', required: false },
  { id: 'mensaje', label: 'Mensaje', required: true },
] as const;

/* ─── Criterio de encaje ───────────────────────────────────────────────────
 *
 * Ticket medio mínimo para que el modelo funcione. Única fuente de la cifra:
 * la usan las cuatro páginas de vertical, la portada, la landing de campaña y
 * los `fit` de VERTICALS. Si cambia aquí, cambia en todas a la vez.
 *
 * Dos sitios no pueden leerla y llevan la cifra escrita a mano: public/agent.txt,
 * que es texto plano, y los tramos de TICKET_OPCIONES, que son rangos con dos
 * extremos. Al tocar esta constante hay que repasarlos.
 */
export const TICKET_MINIMO = '1.000 €';

/**
 * Excepción para /abogados, y solo para esa página.
 *
 * En un despacho el encargo no se mide como una operación suelta: una iguala
 * de 500 € al mes vale por su recurrencia, no por su importe. Por eso tiene su
 * propio mínimo. No sustituye a TICKET_MINIMO ni se usa en ninguna otra
 * página.
 */
export const TICKET_MINIMO_ABOGADOS = '500 € al mes';

/* ─── Landing de campaña ───────────────────────────────────────────────────
 *
 * Página de destino de la campaña de ChatGPT Ads. Vive aparte del embudo
 * normal: sin menú y sin enlaces al resto del sitio. Es tráfico de pago y la
 * página tiene un solo trabajo, que es el formulario; cualquier salida es una
 * fuga que se paga a precio de clic.
 *
 * Los envíos se guardan como Lead, igual que los de /contacto, pero marcados
 * con `origen` para poder separarlos de los orgánicos.
 */

export const LANDING_PATH = '/cerrar-mas-ventas';

/** Etiqueta que encabeza el aviso y se guarda en Lead.origen. */
export const LANDING_ORIGEN = 'Lead landing ChatGPT Ads';

/** Ticket medio. El primer tramo está por debajo del mínimo a propósito: quien
 *  lo marca puede enviar igual el formulario y el dato viaja en el aviso, para
 *  descartar en la llamada con el número delante y no antes. */
export const TICKET_OPCIONES = [
  'Menos de 1.000 €',
  'Entre 1.000 € y 3.000 €',
  'Entre 3.000 € y 10.000 €',
  'Más de 10.000 €',
] as const;

/** Volumen mensual de oportunidades cualificadas. */
export const LEADS_OPCIONES = [
  'Menos de 10 al mes',
  'Entre 10 y 30 al mes',
  'Entre 30 y 100 al mes',
  'Más de 100 al mes',
] as const;

/** Campos de la landing, en el orden en que aparecen en el aviso. */
export const LANDING_FIELDS = [
  { id: 'nombre', label: 'Nombre', required: true },
  { id: 'empresa', label: 'Empresa', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'telefono', label: 'Teléfono', required: true },
  { id: 'web', label: 'Web', required: false },
  { id: 'ticket', label: 'Ticket medio', required: false },
  { id: 'leads', label: 'Oportunidades al mes', required: false },
  { id: 'mensaje', label: 'Qué vende y en qué necesita ayuda', required: true },
] as const;

/* ─── Candidaturas de closer ───────────────────────────────────────────────
 *
 * Flujo separado del comercial a propósito: /contacto recibe empresas y
 * /unete-como-closer recibe personas que quieren cerrar. Mezclarlos
 * ensuciaría el embudo de ventas con currículums.
 */

export const CANDIDATURA_PATH = '/unete-como-closer';

/** Tramos de experiencia. El orden va de menos a más y se respeta en el aviso. */
export const EXPERIENCIA_OPCIONES = [
  'Sin experiencia',
  'Experiencia en ventas, pero no como closer',
  'Menos de un año como closer',
  'Entre uno y tres años como closer',
  'Más de tres años como closer',
] as const;

/** Campos de la candidatura, en el orden en que aparecen en el aviso. */
export const CANDIDATURA_FIELDS = [
  { id: 'nombre', label: 'Nombre y apellidos', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'telefono', label: 'Teléfono o WhatsApp', required: true },
  { id: 'experiencia', label: 'Experiencia comercial', required: true },
  { id: 'enlace', label: 'LinkedIn o CV', required: false },
  { id: 'mensaje', label: 'Experiencia contada', required: false },
] as const;

export const BRAND = {
  name: 'Cerra Labs',
  legalName: 'Jesús Arteaga Fernández',
  tagline: 'Agencia de closing B2B',
  // Buzón real del fundador. Todo el sitio lo lee de aquí: no hay ninguna
  // dirección escrita a mano en las páginas.
  email: 'jesusarteaga@cerralabs.es',
  emailActive: true,
  country: 'ES',
  logo: '/logo-cerra-labs.svg',
  mark: '/mark-cerra-labs.svg',
  // Tarjeta social. Se regenera con `node scripts/generate-og.mjs`.
  ogImage: '/og-cerra-labs.png',
  // Perfiles de la marca. Los personales de Jesús van en la Person del
  // JSON-LD, no aquí.
  sameAs: ['https://www.linkedin.com/company/cerra-labs/'] as string[],
} as const;

/* ─── Fundador ─────────────────────────────────────────────────────────────
 *
 * Perfiles personales de Jesús, no de la marca. Van en el `sameAs` de la
 * entidad Person del JSON-LD, no en el de la Organization: son cuentas suyas.
 * Cuando exista la página de empresa en LinkedIn (RD6), esa sí irá en
 * BRAND.sameAs.
 *
 * `enFooter` marca cuáles salen en el pie. Hoy solo LinkedIn, por decisión
 * suya: Instagram se queda en /sobre-nosotros.
 */
/* Enlaces de la línea «Síguenos» del pie.
 *
 * `personal` distingue el perfil de una persona del de la marca: solo los
 * primeros llevan rel="me", que es la convención para decir «esta cuenta es
 * mía». En la página de empresa esa marca no tiene sentido.
 */
export const REDES_PIE = [
  {
    etiqueta: 'Cerra Labs',
    url: 'https://www.linkedin.com/company/cerra-labs/',
    personal: false,
  },
  {
    etiqueta: 'Jesús Arteaga',
    url: 'https://www.linkedin.com/in/jesus-arteaga-fernandez79/',
    personal: true,
  },
] as const;

export const FUNDADOR = {
  nombre: 'Jesús Arteaga Fernández',
  cargo: 'Fundador y CEO',
  perfiles: [
    {
      red: 'LinkedIn',
      url: 'https://www.linkedin.com/in/jesus-arteaga-fernandez79/',
      enFooter: true,
    },
    {
      red: 'Instagram',
      url: 'https://www.instagram.com/jesusarteagacerralabs/',
      enFooter: false,
    },
  ],
} as const;

export const VERTICALS = [
  {
    slug: 'agencias',
    nav: 'Agencias',
    card: 'Agencias de marketing, diseño, desarrollo y consultoría',
    summary:
      'El fundador cierra todas las ventas y se ha convertido en el cuello de botella del crecimiento.',
    fit: `Facturación anual desde 100.000 €, ticket de servicio desde ${TICKET_MINIMO}.`,
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
    fit: `Facturación desde 20.000 € al mes, tickets entre ${TICKET_MINIMO} y 10.000 €.`,
  },
  {
    slug: 'abogados',
    nav: 'Abogados',
    card: 'Despachos de abogados',
    summary:
      'Entran consultas, pero una parte se queda sin encargo entre la primera visita y la aceptación de los honorarios.',
    fit: `Encargos desde ${TICKET_MINIMO_ABOGADOS}, de particulares o de empresa, con propuestas de honorarios pendientes de respuesta.`,
  },
  {
    slug: 'clinicas',
    nav: 'Clínicas',
    card: 'Clínicas privadas y salud premium',
    summary:
      'Las valoraciones se llenan, pero una parte grande de pacientes no llega a confirmar el tratamiento.',
    fit: `Ticket de tratamiento desde ${TICKET_MINIMO}, consultas de valoración presenciales o por videollamada.`,
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

/* Columna «Servicio» del pie.
 *
 * Es NAV más la vertical de abogados. El menú de cabecera ya tiene siete
 * enlaces y un botón; un octavo lo desborda en pantallas intermedias. En el
 * pie no hay esa limitación y las cinco verticales deben estar juntas.
 */
export const FOOTER_SERVICIO = [
  { href: '/servicio', label: 'Cómo trabajamos' },
  { href: '/agencias', label: 'Agencias' },
  { href: '/saas', label: 'SaaS' },
  { href: '/infoproductores', label: 'Infoproductores' },
  { href: '/abogados', label: 'Abogados' },
  { href: '/clinicas', label: 'Clínicas' },
  { href: '/sobre-nosotros', label: 'Quiénes somos' },
  { href: '/unete-como-closer', label: 'Únete como closer' },
] as const;

// /casos existe y es rastreable, pero se mantiene fuera de la navegación
// principal hasta que haya dos casos con métricas reales publicables.
/* Páginas legales. Viven aparte de la navegación: no son servicio, pero
 * tienen que estar accesibles desde cualquier página y desde el formulario. */
export const LEGAL = [
  { href: '/privacidad', label: 'Política de privacidad' },
  { href: '/aviso-legal', label: 'Aviso legal' },
] as const;

export const FOOTER_EXTRA = [
  { href: '/casos', label: 'Casos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
] as const;
