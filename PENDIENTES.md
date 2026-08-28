# Cerra Labs — pendientes

Estado: Fases RD1 y M5.5 completadas. 14 páginas construidas y optimizadas,
auditoría interna sin incidencias. Falta lo que depende de decisiones tuyas o de
cuentas externas.

Nota sobre M5.5: no había librerías de skills disponibles en el entorno, así que
la pasada de SEO, UX y copy se hizo con criterio propio. Los 14 H1 se verificaron
idénticos antes y después.

## Bloqueantes antes de publicar

| Qué | Dónde se toca | Nota |
|---|---|---|
| Comprar `cerralabs.com` | Don Dominio (DNS editable) | Preferir `.com`. Banahosting no vale si quieres el flujo con agente de navegador. |
| Cambiar `SITE_URL` | `src/config/site.ts` y `astro.config.mjs` | Dos líneas. También `public/robots.txt`. |
| Crear cuenta Cal.com | — | Con los seis tipos de evento ya nombrados en `site.ts`. |
| Activar booking | `src/config/site.ts` → `BOOKING.enabled = true` | Hasta entonces los 35 CTA salen visibles pero inertes. |
| Crear `hola@cerralabs.com` | Proveedor de correo | Luego `BRAND.emailActive = true`. Hoy el email es texto, no enlace. |

## Decisiones tuyas

- **Casos reales.** `/casos` está construida y detecta sola si hay casos: en
  cuanto rellenes el array `cases` en `src/pages/casos.astro`, la página cambia
  de la nota honesta a las tarjetas con métricas. Cuando haya dos, añade
  `/casos` a `NAV` en `site.ts` para que entre en el menú principal.
- **Porcentaje de rev-share.** No aparece ninguna cifra en la web, a propósito.
  Si quieres publicar una horquilla, dímelo y la añado al bloque de modelo
  económico y al `agent.txt`.
- **Fuente Inter.** Ahora mismo usa la pila del sistema. Si quieres self-hosted
  como pide el manual, hay que descargar el woff2 subset latin a
  `public/fonts/` y descomentar el `@font-face` en `src/styles/global.css`.
- **Tarjeta social.** `public/og-cerra-labs.png` se regenera con `npm run og`
  editando `scripts/generate-og.mjs`. Es lo que ve quien recibe tu enlace en
  LinkedIn: si cambias el mensaje del hero, cámbialo también ahí.

## Fases siguientes del manual

1. **M5.6 / M5.7** — auditoría final y Screaming Frog.
2. **M4** — GitHub (repo sin guiones: `cerralabs`) y Vercel.
3. **M4.5** — dominio y cutover. `vercel domains add` **antes** del ticket DNS.
4. **M6** — Search Console y GA4. Imposible sin dominio real.
5. **RD3** — Cal.com real más notificaciones a Telegram y Resend.
6. **RD5** — dashboard.
7. **RD6** — LinkedIn Company Page, mínimo 2 posts por semana.

## Reglas aplicadas en esta construcción

- Sin `LocalBusiness` en el schema: esto no es SEO local, no hay Maps que ganar.
- Ningún H1 contiene ciudad. Verificado en las 14 páginas.
- Cero formularios abiertos. Todo va a booking pre-cualificado.
- Cero emojis, cero burbuja de chat flotante, cero cronómetros de urgencia.
- Cero datos inventados: sin testimonios, sin cifras de resultados, sin fotos de
  personas que no existen, sin años de experiencia.
- `/gracias` con `noindex` y fuera del sitemap.
- 0 KB de JavaScript enviado al cliente. Sitio completo: 300 KB.
