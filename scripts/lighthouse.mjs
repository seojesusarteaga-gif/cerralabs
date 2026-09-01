/**
 * Lighthouse móvil sobre las páginas públicas.
 *
 *   node scripts/lighthouse.mjs [url-base] [ruta,ruta,...]
 *
 * Usa el Chrome instalado en el sistema.
 */
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const BASE = process.argv[2] || 'https://cerralabs.vercel.app';
const RUTAS = (process.argv[3] || '/,/servicio,/agencias,/contacto,/blog/calcular-ratio-de-cierre-real')
  .split(',')
  .map((r) => r.trim());

// chrome-launcher localiza el Chrome instalado y negocia el puerto de
// depuración. El Chromium de Playwright no arranca bien por esta vía en
// Windows, así que se usa el navegador del sistema.
const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const opciones = {
  logLevel: 'error',
  output: 'json',
  port: chrome.port,
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
  throttlingMethod: 'simulate',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

const CAT = ['performance', 'accessibility', 'best-practices', 'seo'];
const NOMBRE = { performance: 'Rendim.', accessibility: 'Accesib.', 'best-practices': 'Buenas pr.', seo: 'SEO' };

console.log(`\nLighthouse móvil — ${BASE}\n`);
console.log('RUTA'.padEnd(46) + CAT.map((c) => NOMBRE[c].padStart(11)).join(''));
console.log('─'.repeat(46 + 44));

const fallos = [];
const totales = Object.fromEntries(CAT.map((c) => [c, []]));

for (const ruta of RUTAS) {
  let res;
  try {
    res = await lighthouse(BASE + ruta, opciones);
  } catch (e) {
    console.log(ruta.padEnd(46) + '  ERROR: ' + e.message.slice(0, 60));
    fallos.push(`${ruta}: ${e.message.slice(0, 80)}`);
    continue;
  }
  const cats = res.lhr.categories;
  const fila = CAT.map((c) => {
    const n = Math.round((cats[c]?.score ?? 0) * 100);
    totales[c].push(n);
    if ((c === 'performance' || c === 'seo') && n < 95) fallos.push(`${ruta} · ${NOMBRE[c]}: ${n}`);
    return String(n).padStart(11);
  }).join('');
  console.log(ruta.padEnd(46) + fila);
}

console.log('─'.repeat(46 + 44));
const medias = CAT.map((c) => {
  const v = totales[c];
  return String(v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0).padStart(11);
}).join('');
console.log('media'.padEnd(46) + medias);

console.log('\n' + (fallos.length ? 'POR DEBAJO DEL OBJETIVO (95):\n  ' + fallos.join('\n  ') : 'Todas las rutas en 95 o más en Rendimiento y SEO'));

// En Windows el borrado del perfil temporal puede dar EPERM. Es cosa del
// cierre, no de la medición, así que no debe tumbar el informe.
try {
  await chrome.kill();
} catch {}

process.exit(fallos.length ? 1 : 0);
