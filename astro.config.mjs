import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Dominio del sitio. Debe coincidir siempre con SITE_URL de src/config/site.ts.
const SITE = 'https://cerralabs.es';

export default defineConfig({
  site: SITE,

  // Las 17 páginas públicas se siguen generando como HTML estático. El
  // adaptador existe para las rutas que necesitan servidor: el formulario de
  // contacto y el panel de /admin, que son las únicas con `prerender = false`.
  output: 'static',
  adapter: vercel(),

  // Sin barra final, para que coincida con `trailingSlash: false` de
  // vercel.json y con el canonical que emite BaseLayout. Antes el sitemap
  // salía con barra y las doce rutas internas redirigían con 308 a su versión
  // canónica, lo que ensucia el informe de cobertura y gasta rastreo.
  trailingSlash: 'never',

  // Fuera del sitemap: las páginas de confirmación (/gracias*) van con
  // noindex, /admin es el panel privado y /cerrar-mas-ventas es la landing de
  // campaña, que también va con noindex por ser tráfico de pago.
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/gracias') &&
        !page.includes('/admin') &&
        !page.includes('/cerrar-mas-ventas'),
    }),
  ],

  build: {
    inlineStylesheets: 'auto',
  },
});
