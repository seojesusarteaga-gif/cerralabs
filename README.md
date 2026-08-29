# Cerra Labs

Web de Cerra Labs, agencia de closing de ventas B2B. Sitio estático en Astro,
desplegado en Vercel.

## Desarrollo

```bash
npm install
npm run dev           # servidor de desarrollo en :4321
npm run build         # build de producción
npm run preview       # sirve el build
npm run og            # regenera la tarjeta social (public/og-cerra-labs.png)
npm run test:mensaje  # muestra el aviso de lead sin enviar nada
```

## Auditoría

```bash
npm run build
node scripts/audit-final.mjs dist   # los 10 puntos previos a indexar
bash scripts/crawl.sh               # crawl con Screaming Frog (requiere licencia)
```

`scripts/audit-final.mjs` comprueba consistencia de marca, H1 únicos y sin
ciudad, jerarquía de encabezados, JSON-LD, canonical, enlaces rotos y páginas
huérfanas, imágenes, `robots.txt`, `sitemap`, `agent.txt` y metadatos. Devuelve
código de salida distinto de cero si hay errores bloqueantes.

## Estructura

- `src/config/site.ts` — fuente única de verdad: dominio, marca, contacto,
  opciones del formulario y verticales. El cutover de dominio se resuelve aquí.
- `src/layouts/BaseLayout.astro` — metadatos, Open Graph y JSON-LD (`@graph`
  unificado por `@id`).
- `src/components/VerticalPage.astro` — plantilla de las cuatro páginas de
  vertical.
- `src/pages/api/contact.ts` — única ruta que se ejecuta en servidor. Recibe el
  formulario y avisa por Telegram y por email en paralelo.
- `src/content/blog/` — artículos en Markdown.
- `public/agent.txt` — descripción del negocio para agentes de IA.

## Convenciones

- Los H1 contienen la keyword de servicio y no se modifican por motivos de copy
  ni de longitud en SERP. Para acortar el `<title>` de un artículo existe el
  campo `metaTitle` en el frontmatter.
- Sin `LocalBusiness` en el schema: el servicio no es local y no hay ficha de
  Google Business Profile.
- Toda la conversión pasa por el formulario de `/contacto`, que hace POST
  nativo a `/api/contact` y funciona sin JavaScript. Sin Web3Forms ni otros
  intermediarios: el aviso sale directo a Telegram y a Resend.
- Sin datos inventados: nada de testimonios, cifras de resultados, fotografías
  de personas que no formen parte del equipo ni años de experiencia.
- `vercel.json` con `cleanUrls: true` antes del primer deploy.

## Pendientes

Ver [PENDIENTES.md](PENDIENTES.md).
