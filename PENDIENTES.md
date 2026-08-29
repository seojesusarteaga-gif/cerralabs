# Cerra Labs — pendientes

Estado: **desplegada en producción** — https://cerralabs.vercel.app

Completadas las fases RD1, M5.5, M5.6, M5.7 y M4. Auditorías en verde y crawl de
Screaming Frog contra producción sin errores. Falta lo que depende de decisiones
tuyas o de cuentas externas.

- Repositorio: https://github.com/seojesusarteaga-gif/cerralabs (público)
- Cada `git push` a `main` despliega solo. Verificado.
- Variables de entorno creadas en Vercel con valor `PENDIENTE` en los tres
  entornos: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`,
  `LEAD_NOTIFICATION_EMAIL` y `RESEND_FROM`. Mientras estén en `PENDIENTE` el
  formulario valida los campos y avisa de que no está operativo, en vez de
  perder la solicitud.

Nota sobre M5.5: no había librerías de skills disponibles en el entorno, así que
la pasada de SEO, UX y copy se hizo con criterio propio. Los 14 H1 se verificaron
idénticos antes y después.

## Bloqueantes antes de publicar

| Qué | Dónde se toca | Nota |
|---|---|---|
| Comprar `cerralabs.com` | Don Dominio (DNS editable) | Preferir `.com`. Banahosting no vale si quieres el flujo con agente de navegador. |
| Cambiar `SITE_URL` | `src/config/site.ts` y `astro.config.mjs` | Dos líneas. También `public/robots.txt`. |
| Bot de Telegram y cuenta Resend | Variables en Vercel | Ver INSTRUCCIONES_RD3.md. |
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

1. **M6** — Search Console por prefijo de URL sobre `cerralabs.vercel.app`.
   Enviar sitemap e indexar la Home y las cuatro páginas de vertical.
   GA4 se puede crear ya, aunque sin dominio propio la propiedad quedará
   atada a un subdominio de Vercel y habrá que rehacerla en el cutover.
2. **RD3** — meter los tokens de Telegram y Resend para que el formulario avise.
3. **M4.5** — compra de dominio y cutover. `vercel domains add` y
   `vercel domains inspect` **antes** de escribir el ticket DNS al registrador.
   Al hacerlo hay que rehacer la propiedad de Search Console como tipo Dominio.
4. **RD5** — dashboard.
5. **RD6** — LinkedIn Company Page, mínimo 2 posts por semana.

## Reglas aplicadas en esta construcción

- Sin `LocalBusiness` en el schema: esto no es SEO local, no hay Maps que ganar.
- Ningún H1 contiene ciudad. Verificado en las 14 páginas.
- Conversión por formulario propio en /contacto con POST directo a Telegram y
  Resend. Sin Web3Forms ni intermediarios, según la regla del manual para las
  modalidades que no son la C.
- Cero emojis, cero burbuja de chat flotante, cero cronómetros de urgencia.
- Cero datos inventados: sin testimonios, sin cifras de resultados, sin fotos de
  personas que no existen, sin años de experiencia.
- `/gracias` con `noindex` y fuera del sitemap.
- 0 KB de JavaScript enviado al cliente.
- Cabeceras de seguridad en `vercel.json`: CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy y Permissions-Policy. Verificadas en
  producción.

## Hallazgo abierto que decides tú

El H1 del artículo `/blog/calcular-ratio-de-cierre-real` tiene 81 caracteres y
Screaming Frog lo marca por pasar de 70. No se ha tocado porque la regla del
manual es no modificar H1. Es un título de artículo, no un H1 de servicio con
keyword, así que el coste es bajo. Si quieres acortarlo, dilo.
