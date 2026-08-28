import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TBD DOMINIO: sustituir por https://cerralabs.com cuando el dominio esté
// comprado y apuntado. Hasta entonces el canonical apunta a la URL de Vercel.
const SITE = 'https://cerralabs.vercel.app';

export default defineConfig({
  site: SITE,
  output: 'static',
  // /gracias es una página de confirmación post-booking: va con noindex y
  // fuera del sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/gracias') })],
  build: {
    inlineStylesheets: 'auto',
  },
});
