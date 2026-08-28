# Cerra Labs

Web de Cerra Labs, agencia de closing de ventas B2B. Sitio estático en Astro,
desplegado en Vercel.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo en :4321
npm run build      # build de producción en dist/
npm run preview    # sirve el build
npm run og         # regenera la tarjeta social (public/og-cerra-labs.png)
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
  booking y verticales. El cutover de dominio y la conexión de Cal.com se
  resuelven aquí.
- `src/layouts/BaseLayout.astro` — metadatos, Open Graph y JSON-LD (`@graph`
  unificado por `@id`).
- `src/components/VerticalPage.astro` — plantilla de las cuatro páginas de
  vertical.
- `src/content/blog/` — artículos en Markdown.
- `public/agent.txt` — descripción del negocio para agentes de IA.

## Convenciones

- Los H1 contienen la keyword de servicio y no se modifican por motivos de copy
  ni de longitud en SERP. Para acortar el `<title>` de un artículo existe el
  campo `metaTitle` en el frontmatter.
- Sin `LocalBusiness` en el schema: el servicio no es local y no hay ficha de
  Google Business Profile.
- Sin formularios abiertos. Toda conversión pasa por booking pre-cualificado.
- Sin datos inventados: nada de testimonios, cifras de resultados, fotografías
  de personas que no formen parte del equipo ni años de experiencia.
- `vercel.json` con `cleanUrls: true` antes del primer deploy.

## Pendientes

Ver [PENDIENTES.md](PENDIENTES.md).
