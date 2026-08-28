#!/usr/bin/env bash
# M5.7 — crawl con Screaming Frog sobre el build de producción servido en local.
# Levanta astro preview, espera a que responda, rastrea y apaga el servidor.
set -uo pipefail

PROJ="/c/Users/Usuario/Desktop/proyectos/cerra labs"
SF="/c/Program Files (x86)/Screaming Frog SEO Spider/ScreamingFrogSEOSpiderCli.exe"
OUT="$PROJ/audits/screamingfrog"
PORT=4321

cd "$PROJ"
mkdir -p "$OUT"
rm -f "$OUT"/*.csv 2>/dev/null

npx astro preview --port "$PORT" >"$OUT/preview.log" 2>&1 &
PREVIEW_PID=$!
trap 'kill $PREVIEW_PID 2>/dev/null' EXIT

for _ in $(seq 1 20); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/")" = "200" ] && break
  sleep 1
done

if [ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/")" != "200" ]; then
  echo "ERROR: el servidor de preview no respondió"
  cat "$OUT/preview.log"
  exit 1
fi
echo "preview activo en http://localhost:$PORT"

"$SF" \
  --crawl "http://localhost:$PORT/" \
  --headless \
  --output-folder "$OUT" \
  --overwrite \
  --export-format csv \
  --save-report "Crawl Overview" \
  --export-tabs "Internal:All,Response Codes:Client Error (4xx),Response Codes:Server Error (5xx),Response Codes:Redirection (3xx),Page Titles:Duplicate,Page Titles:Over X Characters,Page Titles:Missing,Page Titles:Multiple,Meta Description:Duplicate,Meta Description:Over X Characters,Meta Description:Missing,H1:Missing,H1:Duplicate,H1:Multiple,H2:Missing,Images:Missing Alt Text,Canonicals:Missing,Content:Low Content Pages" \
  --skip-empty \
  2>&1 | grep -viE "^$|SLF4J|WARNING: |illegal reflective"

echo "crawl terminado"
ls -1 "$OUT" | sed 's/^/  /'
