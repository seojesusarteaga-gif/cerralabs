import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// TBD DOMINIO: sustituir por https://cerralabs.com cuando el dominio esté
// comprado y apuntado. Hasta entonces el canonical apunta a la URL de Vercel.
const SITE = 'https://cerralabs.vercel.app';

export default defineConfig({
  site: SITE,

  // Las 14 páginas se siguen generando como HTML estático. El adaptador existe
  // solo para que el webhook de Cal.com pueda ejecutarse como función
  // serverless: src/pages/api/booking-notification.ts es la única ruta con
  // `prerender = false`.
  output: 'static',
  adapter: vercel(),

  // /gracias es una página de confirmación post-booking: va con noindex y
  // fuera del sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/gracias') })],

  build: {
    inlineStylesheets: 'auto',
  },
});
