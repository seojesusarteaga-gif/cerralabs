/**
 * Capturas de las 14 páginas en 3 breakpoints.
 *
 *   node scripts/screenshots.mjs [etiqueta] [url-base]
 *
 * Ejemplo: node scripts/screenshots.mjs antes http://localhost:4321
 * Guarda en screenshots/design-review/<etiqueta>/
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ETIQUETA = process.argv[2] || 'actual';
const BASE = process.argv[3] || 'http://localhost:4321';
const DEST = path.resolve('screenshots', 'design-review', ETIQUETA);

const RUTAS = [
  ['home', '/'],
  ['servicio', '/servicio'],
  ['agencias', '/agencias'],
  ['saas', '/saas'],
  ['infoproductores', '/infoproductores'],
  ['clinicas', '/clinicas'],
  ['unete-como-closer', '/unete-como-closer'],
  ['sobre-nosotros', '/sobre-nosotros'],
  ['contacto', '/contacto'],
  ['casos', '/casos'],
  ['gracias', '/gracias'],
  ['blog', '/blog'],
  ['blog-ratio-cierre', '/blog/calcular-ratio-de-cierre-real'],
  ['blog-closer-externo', '/blog/closer-externo-o-comercial-en-plantilla'],
];

const ANCHOS = [
  ['375', 375, 812],
  ['768', 768, 1024],
  ['1280', 1280, 900],
];

fs.mkdirSync(DEST, { recursive: true });

const navegador = await chromium.launch();
let hechas = 0;
const fallos = [];

for (const [ancho, w, h] of ANCHOS) {
  const contexto = await navegador.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const pagina = await contexto.newPage();

  for (const [nombre, ruta] of RUTAS) {
    const url = BASE + ruta;
    try {
      const res = await pagina.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (!res || res.status() >= 400) {
        fallos.push(`${ruta} @${ancho}: HTTP ${res ? res.status() : 'sin respuesta'}`);
        continue;
      }
      // Los <details> del FAQ se abren para que la captura muestre el contenido.
      await pagina.evaluate(() => {
        document.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));
      });
      await pagina.waitForTimeout(150);
      const archivo = path.join(DEST, `${nombre}--${ancho}.png`);
      await pagina.screenshot({ path: archivo, fullPage: true });
      hechas++;
    } catch (e) {
      fallos.push(`${ruta} @${ancho}: ${e.message.split('\n')[0]}`);
    }
  }
  await contexto.close();
}

await navegador.close();

console.log(`\nCapturas guardadas: ${hechas} de ${RUTAS.length * ANCHOS.length}`);
console.log(`Carpeta: ${DEST}`);
if (fallos.length) {
  console.log('\nFallos:');
  fallos.forEach((f) => console.log('  ' + f));
  process.exit(1);
}
