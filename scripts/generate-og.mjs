import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#14171C"/>
  <rect x="0" y="0" width="1200" height="6" fill="#1D4ED8"/>

  <rect x="80" y="72" width="60" height="60" rx="14" fill="#FFFFFF"/>
  <path d="M97 102 L108 112 L127 88" stroke="#14171C" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="160" y="115" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#FFFFFF">Cerra</text>
  <text x="257" y="115" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="500" fill="#9AA3B2">Labs</text>

  <text x="80" y="268" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="66" font-weight="600" fill="#FFFFFF" letter-spacing="-2">Cerramos las ventas</text>
  <text x="80" y="346" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="66" font-weight="600" fill="#FFFFFF" letter-spacing="-2">que tus leads ya te</text>
  <text x="80" y="424" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="66" font-weight="600" fill="#FFFFFF" letter-spacing="-2">están pidiendo</text>

  <rect x="80" y="486" width="1040" height="1" fill="#2E3540"/>

  <text x="80" y="546" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="27" font-weight="400" fill="#9AA3B2">Closing B2B a rev-share. Sin cuota de entrada.</text>
  <text x="80" y="586" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="23" font-weight="400" fill="#6B7280">Agencias · SaaS · Infoproductores · Clínicas</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og-cerra-labs.png');
const { size } = await import('node:fs').then((m) => m.promises.stat('public/og-cerra-labs.png'));
console.log('og-cerra-labs.png generado:', Math.round(size / 1024) + ' KB');
