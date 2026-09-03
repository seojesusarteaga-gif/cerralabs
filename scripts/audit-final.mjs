/**
 * Auditoría final antes de indexar (paso M5.6 del Manual Maestro v2.2,
 * adaptado a Modalidad D: sin NAP local ni páginas por municipio).
 *
 * Uso: node scripts/audit-final.mjs [directorio]  (por defecto dist)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'dist';
const SITE = 'https://cerralabs.es';
const BRAND = 'Cerra Labs';
const EMAIL = 'hola@cerralabs.es';

const fail = [];
const warn = [];
const ok = [];
const F = (p, m) => fail.push(`[${p}] ${m}`);
const W = (p, m) => warn.push(`[${p}] ${m}`);
const O = (p, m) => ok.push(`[${p}] ${m}`);

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : path.join(d, e.name)
  );
}

const all = walk(ROOT);
const pages = all.filter((f) => f.endsWith('.html')).sort();
const route = (f) =>
  ('/' + path.relative(ROOT, f).split(path.sep).join('/').replace(/index\.html$/, '')).replace(
    /(.)\/$/,
    '$1'
  );
const read = (f) => fs.readFileSync(f, 'utf8');
const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

const routes = new Set(pages.map(route));
const docs = pages.map((f) => ({ f, r: route(f), h: read(f) }));

// ─── 1. Consistencia de marca y contacto ─────────────────────────────────────
// En Modalidad D no hay NAP local (sin dirección ni teléfono). El equivalente
// es que marca y email sean idénticos en toda la web, el schema y agent.txt.
{
  const P = '1 MARCA';
  let brandMissing = [];
  for (const { r, h } of docs) {
    if (!h.includes(`"${BRAND}"`) && !h.includes(BRAND)) brandMissing.push(r);
  }
  if (brandMissing.length) F(P, `sin mención de marca: ${brandMissing.join(', ')}`);
  else O(P, `marca "${BRAND}" presente en las ${docs.length} páginas`);

  // Variantes erróneas del nombre
  for (const { r, h } of docs) {
    const bad = ['CerraLabs', 'Cerra labs', 'CERRA LABS', 'Cerralabs'].filter((v) =>
      strip(h.slice(h.indexOf('<body'))).includes(v)
    );
    if (bad.length) F(P, `${r}: variante inconsistente de marca -> ${bad.join(', ')}`);
  }

  // Email idéntico en todas las páginas que lo mencionan
  const withEmail = docs.filter((d) => d.h.includes('@cerralabs'));
  const wrongEmail = withEmail.filter((d) => !d.h.includes(EMAIL));
  if (wrongEmail.length) F(P, `email inconsistente en: ${wrongEmail.map((d) => d.r).join(', ')}`);
  else O(P, `email "${EMAIL}" consistente en ${withEmail.length} páginas`);

  // Presencia en agent.txt
  const agent = fs.existsSync(path.join(ROOT, 'agent.txt'))
    ? read(path.join(ROOT, 'agent.txt'))
    : '';
  if (!agent.includes(BRAND) || !agent.includes(EMAIL))
    F(P, 'agent.txt no repite marca y email de forma idéntica');
  else O(P, 'agent.txt coherente con marca y email');
}

// ─── 2. H1 ───────────────────────────────────────────────────────────────────
{
  const P = '2 H1';
  const cities = ['sevilla', 'madrid', 'barcelona', 'valencia', 'málaga', 'estepa', 'jerez'];
  for (const { r, h } of docs) {
    const m = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    if (m.length === 0) F(P, `${r}: sin H1`);
    else if (m.length > 1) F(P, `${r}: ${m.length} etiquetas H1`);
    else {
      const t = strip(m[0][1]);
      if (t.length < 15) W(P, `${r}: H1 muy corto (${t.length} car.)`);
      const city = cities.find((c) => t.toLowerCase().includes(c));
      if (city) F(P, `${r}: H1 contiene ciudad "${city}" — esto no es SEO local`);
    }
  }
  if (!fail.some((x) => x.startsWith('[2'))) O(P, `${docs.length} páginas con H1 único, sin ciudad`);
}

// ─── 3. Jerarquía de encabezados ─────────────────────────────────────────────
{
  const P = '3 HEADINGS';
  for (const { r, h } of docs) {
    const body = h.slice(h.indexOf('<body'));
    const levels = [...body.matchAll(/<(h[1-4])[^>]*>/g)].map((m) => +m[1][1]);
    for (let i = 1; i < levels.length; i++)
      if (levels[i] - levels[i - 1] > 1)
        W(P, `${r}: salto de H${levels[i - 1]} a H${levels[i]}`);
  }
  if (!warn.some((x) => x.startsWith('[3'))) O(P, 'jerarquía H1>H2>H3 sin saltos');
}

// ─── 4. Schema JSON-LD ───────────────────────────────────────────────────────
{
  const P = '4 SCHEMA';
  for (const { r, h } of docs) {
    const blocks = [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    if (!blocks.length) {
      F(P, `${r}: sin JSON-LD`);
      continue;
    }
    for (const [, raw] of blocks) {
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        F(P, `${r}: JSON-LD inválido — ${e.message}`);
        continue;
      }
      const g = data['@graph'];
      if (!Array.isArray(g) || !g.length) {
        F(P, `${r}: @graph ausente o vacío`);
        continue;
      }
      const types = g.map((n) => n['@type']);
      for (const need of ['Organization', 'ProfessionalService', 'WebSite'])
        if (!types.includes(need)) F(P, `${r}: falta ${need}`);
      if (types.includes('LocalBusiness'))
        F(P, `${r}: LocalBusiness presente — prohibido en Modalidad D`);
      // Todos los @id deben resolver dentro del grafo
      const ids = new Set(g.map((n) => n['@id']).filter(Boolean));
      const refs = [...raw.matchAll(/\{"@id":"([^"]+)"\}/g)].map((m) => m[1]);
      for (const ref of refs)
        if (!ids.has(ref) && !ref.startsWith(SITE + '/#'))
          W(P, `${r}: referencia @id sin nodo -> ${ref}`);
      for (const id of ids)
        if (!id.startsWith(SITE)) F(P, `${r}: @id fuera de dominio -> ${id}`);
    }
  }
  if (!fail.some((x) => x.startsWith('[4')))
    O(P, 'JSON-LD válido en todas las páginas, @graph enlazado por @id, sin LocalBusiness');
}

// ─── 5. Canonical ────────────────────────────────────────────────────────────
{
  const P = '5 CANONICAL';
  const seen = new Map();
  for (const { r, h } of docs) {
    const c = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (!c) {
      F(P, `${r}: sin canonical`);
      continue;
    }
    if (!c.startsWith(SITE)) F(P, `${r}: canonical fuera de dominio -> ${c}`);
    if (c.endsWith('/') && c !== SITE) W(P, `${r}: canonical con barra final -> ${c}`);
    if (seen.has(c)) F(P, `${r}: canonical duplicado con ${seen.get(c)}`);
    else seen.set(c, r);
  }
  if (!fail.some((x) => x.startsWith('[5'))) O(P, `${docs.length} canonical únicos y en dominio`);
}

// ─── 6. Enlaces rotos y huérfanas ────────────────────────────────────────────
{
  const P = '6 ENLACES';
  const incoming = new Map([...routes].map((r) => [r, 0]));
  let broken = 0;
  for (const { r, h } of docs) {
    for (const [, href] of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const clean = href.replace(/(.)\/$/, '$1');
      if (routes.has(clean)) {
        if (clean !== r) incoming.set(clean, incoming.get(clean) + 1);
      } else if (!fs.existsSync(path.join(ROOT, href.replace(/^\//, '')))) {
        F(P, `${r} -> ${href} (destino inexistente)`);
        broken++;
      }
    }
  }
  if (!broken) O(P, 'sin enlaces internos rotos');

  const orphans = [...incoming].filter(([r, n]) => n === 0 && r !== '/').map(([r]) => r);
  const allowed = ['/gracias'];
  for (const o of orphans)
    if (allowed.includes(o)) O(P, `${o}: huérfana intencional (confirmación post-booking)`);
    else F(P, `${o}: huérfana, sin enlaces entrantes`);

  // Salidas por página
  for (const { r, h } of docs) {
    const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
    const n = [...main.matchAll(/href="(\/[^"#?]*)"/g)].length;
    if (n === 0) W(P, `${r}: sin enlaces internos salientes en <main>`);
  }
}

// ─── 7. Imágenes ─────────────────────────────────────────────────────────────
{
  const P = '7 IMAGENES';
  for (const { r, h } of docs)
    for (const [tag] of h.matchAll(/<img[^>]*>/g)) {
      if (!/\balt=/.test(tag)) F(P, `${r}: <img> sin alt -> ${tag.slice(0, 70)}`);
      if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag))
        W(P, `${r}: <img> sin width/height (provoca CLS) -> ${tag.slice(0, 60)}`);
    }
  const media = all.filter((f) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f));
  for (const f of media) {
    const kb = fs.statSync(f).size / 1024;
    const rel = path.relative(ROOT, f);
    if (kb > 200) F(P, `${rel}: ${Math.round(kb)} KB (límite 200 KB)`);
    else O(P, `${rel}: ${Math.round(kb)} KB`);
  }
}

// ─── 8. robots.txt y sitemap ─────────────────────────────────────────────────
{
  const P = '8 ROBOTS/SITEMAP';
  const rp = path.join(ROOT, 'robots.txt');
  if (!fs.existsSync(rp)) F(P, 'falta robots.txt');
  else {
    const r = read(rp);
    if (!/Sitemap:/i.test(r)) F(P, 'robots.txt no enlaza el sitemap');
    else if (!r.includes(SITE)) F(P, 'robots.txt apunta a otro dominio');
    else O(P, 'robots.txt correcto y enlaza sitemap');
    if (/^Disallow: \/$/m.test(r)) F(P, 'robots.txt bloquea TODO el sitio');
  }

  const idx = path.join(ROOT, 'sitemap-index.xml');
  if (!fs.existsSync(idx)) F(P, 'falta sitemap-index.xml');
  else {
    const sm = all.filter((f) => /sitemap-\d+\.xml$/.test(f));
    const locs = sm.flatMap((f) => [...read(f).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    O(P, `sitemap con ${locs.length} URLs`);
    // toda URL del sitemap debe existir y no ser noindex
    for (const loc of locs) {
      const r = new URL(loc).pathname.replace(/(.)\/$/, '$1');
      if (!routes.has(r)) F(P, `sitemap incluye URL inexistente -> ${loc}`);
      else {
        const d = docs.find((x) => x.r === r);
        if (d && /name="robots"[^>]*noindex/.test(d.h))
          F(P, `sitemap incluye página noindex -> ${loc}`);
      }
    }
    // toda página indexable debe estar en el sitemap
    for (const { r, h } of docs) {
      const noindex = /name="robots"[^>]*noindex/.test(h);
      const inSitemap = locs.some((l) => new URL(l).pathname.replace(/(.)\/$/, '$1') === r);
      if (!noindex && !inSitemap) F(P, `${r}: indexable pero ausente del sitemap`);
      if (noindex && inSitemap) F(P, `${r}: noindex pero presente en sitemap`);
    }
  }
}

// ─── 9. agent.txt ────────────────────────────────────────────────────────────
{
  const P = '9 AGENT.TXT';
  const ap = path.join(ROOT, 'agent.txt');
  if (!fs.existsSync(ap)) F(P, 'falta agent.txt');
  else {
    const a = read(ap);
    const need = ['Nombre', 'Modelo económico', 'Verticales', 'Metodología', 'Contacto'];
    const miss = need.filter((n) => !a.includes(n));
    if (miss.length) W(P, `secciones ausentes: ${miss.join(', ')}`);
    else O(P, `completo (${a.split('\n').length} líneas)`);
  }
  if (fs.existsSync(path.join(ROOT, 'llms.txt')))
    F(P, 'llms.txt presente — descartado explícitamente en el manual');
  else O(P, 'sin llms.txt, correcto');
}

// ─── 10. Titles y descriptions ───────────────────────────────────────────────
{
  const P = '10 META';
  const t = new Map();
  const d = new Map();
  for (const { r, h } of docs) {
    const title = strip((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';

    if (!title) F(P, `${r}: sin title`);
    else {
      if (!title.endsWith(`| ${BRAND}`)) F(P, `${r}: title no acaba en "| ${BRAND}"`);
      if (title.length > 60) F(P, `${r}: title de ${title.length} car. (se trunca)`);
      if (title.length < 25) W(P, `${r}: title de ${title.length} car., muy corto`);
      if (t.has(title)) F(P, `${r}: title duplicado con ${t.get(title)}`);
      else t.set(title, r);
    }

    if (!desc) F(P, `${r}: sin meta description`);
    else {
      if (desc.length > 160) F(P, `${r}: description de ${desc.length} car.`);
      if (desc.length < 70) W(P, `${r}: description de ${desc.length} car., corta`);
      if (d.has(desc)) F(P, `${r}: description duplicada con ${d.get(desc)}`);
      else d.set(desc, r);
    }
  }
  if (!fail.some((x) => x.startsWith('[10'))) O(P, 'titles y descriptions únicos y dentro de rango');
}

// ─── Extra: Open Graph, idioma, viewport ─────────────────────────────────────
{
  const P = 'EXTRA';
  for (const { r, h } of docs) {
    if (!/<html lang="es"/.test(h)) F(P, `${r}: falta lang="es"`);
    if (!/name="viewport"/.test(h)) F(P, `${r}: falta viewport`);
    if (!/property="og:image"/.test(h)) F(P, `${r}: sin og:image`);
    if (!/property="og:title"/.test(h)) F(P, `${r}: sin og:title`);
  }
  const og = (docs[0].h.match(/property="og:image" content="([^"]*)"/) || [])[1];
  if (og) {
    const p = path.join(ROOT, new URL(og).pathname.replace(/^\//, ''));
    if (!fs.existsSync(p)) F(P, `og:image apunta a un archivo inexistente -> ${og}`);
    else O(P, `og:image existe (${Math.round(fs.statSync(p).size / 1024)} KB)`);
  }
  if (!fail.some((x) => x.startsWith('[EXTRA'))) O(P, 'lang, viewport y Open Graph correctos');
}

// ─── Informe ─────────────────────────────────────────────────────────────────
const line = '─'.repeat(78);
console.log(`\n${line}\nAUDITORÍA FINAL ANTES DE INDEXAR — ${BRAND} (M5.6)\n${line}`);
console.log(`Páginas analizadas: ${docs.length}\n`);

console.log(`CORRECTO (${ok.length})`);
ok.forEach((m) => console.log('  ✓ ' + m));

console.log(`\nAVISOS (${warn.length})`);
warn.length ? warn.forEach((m) => console.log('  ! ' + m)) : console.log('  ninguno');

console.log(`\nERRORES (${fail.length})`);
fail.length ? fail.forEach((m) => console.log('  ✗ ' + m)) : console.log('  ninguno');

console.log(`\n${line}`);
console.log(fail.length === 0 ? 'RESULTADO: APTA PARA INDEXAR' : `RESULTADO: ${fail.length} ERRORES BLOQUEANTES`);
console.log(line);
process.exit(fail.length ? 1 : 0);
