# Cerra Labs — pendientes

Estado: **desplegada en producción** — https://cerralabs.vercel.app

Completadas las fases RD1, M5.5, M5.6, M5.7 y M4. Auditorías en verde y crawl de
Screaming Frog contra producción sin errores. Falta lo que depende de decisiones
tuyas o de cuentas externas.

- Repositorio: https://github.com/seojesusarteaga-gif/cerralabs (público)
- Cada `git push` a `main` despliega solo. Verificado.
- **Fase RD3 cerrada.** El formulario de /contacto está operativo: cada envío
  avisa por Telegram (bot @cerralabs_bot) y por email. Verificado en producción
  con un envío real desde el navegador.
- `RESEND_FROM` sigue vacía a propósito: sin dominio verificado se usa el
  remitente compartido `onboarding@resend.dev`, que puede caer en spam.

Nota sobre M5.5: no había librerías de skills disponibles en el entorno, así que
la pasada de SEO, UX y copy se hizo con criterio propio. Los 14 H1 se verificaron
idénticos antes y después.

## Bloqueantes antes de publicar

| Qué | Dónde se toca | Nota |
|---|---|---|
| Activación de `cerralabs.es` | Banahosting | Comprado, en estado «Pendiente». El DNS de Banahosting solo se edita por ticket y propaga en 12-24 h. |
| Cambiar `SITE_URL` | `src/config/site.ts` y `astro.config.mjs` | Las dos líneas ya están escritas y comentadas: basta con intercambiarlas. También `public/robots.txt`. |
| Crear `hola@cerralabs.es` | Proveedor de correo | Luego `BRAND.emailActive = true`. Hoy el email es texto, no enlace. |

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
- **Rotar el token del bot.** El token de Telegram se compartió en el chat de
  trabajo. No es urgente, pero si quieres rotarlo: `/revoke` en BotFather y me
  pasas el nuevo.
- **Verificar dominio en Resend** tras el cutover de `cerralabs.es`, y cambiar
  `RESEND_FROM` a `Cerra Labs <avisos@cerralabs.es>`. Hasta entonces el aviso
  por email puede caer en spam.
- **Tarjeta social.** `public/og-cerra-labs.png` se regenera con `npm run og`
  editando `scripts/generate-og.mjs`. Es lo que ve quien recibe tu enlace en
  LinkedIn: si cambias el mensaje del hero, cámbialo también ahí.

## Fases siguientes del manual

1. **M6** — Search Console por prefijo de URL sobre `cerralabs.vercel.app`.
   Enviar sitemap e indexar la Home y las cuatro páginas de vertical.
   GA4 se puede crear ya, aunque sin dominio propio la propiedad quedará
   atada a un subdominio de Vercel y habrá que rehacerla en el cutover.
2. **M4.5** — cutover de `cerralabs.es`. Orden innegociable: `vercel domains
   add cerralabs.es` y `vercel domains inspect` **antes** de escribir el ticket
   DNS a Banahosting, porque Vercel emite valores propios de cada proyecto que
   pueden no coincidir con los genéricos de su documentación. Después: cambiar
   `SITE_URL`, `astro.config.mjs` y `robots.txt`, desplegar, y comprobar que el
   canonical resuelve antes de tocar Search Console.
3. **RD5** — dashboard.
4. **RD6** — LinkedIn Company Page, mínimo 2 posts por semana.

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
