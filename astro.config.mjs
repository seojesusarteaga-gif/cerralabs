import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Dominio del sitio. Debe coincidir siempre con SITE_URL de src/config/site.ts.
const SITE = 'https://cerralabs.es';

export default defineConfig({
  site: SITE,

  // Las 14 páginas públicas se siguen generando como HTML estático. El
  // adaptador existe para las rutas que necesitan servidor: el formulario de
  // contacto y el panel de /admin, que son las únicas con `prerender = false`.
  output: 'static',
  adapter: vercel(),

  // Sin barra final, para que coincida con `trailingSlash: false` de
  // vercel.json y con el canonical que emite BaseLayout. Antes el sitemap
  // salía con barra y las doce rutas internas redirigían con 308 a su versión
  // canónica, lo que ensucia el informe de cobertura y gasta rastreo.
  trailingSlash: 'never',

  // Fuera del sitemap: /gracias es la confirmación del formulario y va con
  // noindex, y /admin es el panel privado.
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/gracias') && !page.includes('/admin'),
    }),
  ],

  build: {
    inlineStylesheets: 'auto',
  },
});
