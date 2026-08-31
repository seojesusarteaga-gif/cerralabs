import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Dominio del sitio. Debe coincidir siempre con SITE_URL de src/config/site.ts.
// El definitivo es cerralabs.es, pendiente de que Banahosting active el DNS.
const SITE = 'https://cerralabs.vercel.app';
// const SITE = 'https://cerralabs.es';

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
