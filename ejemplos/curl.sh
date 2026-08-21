#!/usr/bin/env bash
# Corpus Iuris — sin API key, sin registro.
set -euo pipefail
API="https://corpusiuris.mx/api/agent/v1"

echo "── Buscar ──"
curl -s "$API/search?q=plazo+para+interponer+amparo+indirecto&fuentes=leyes,tesis" \
  | jq '.resultados[] | {tipo, referencia, vigencia: .vigencia.verificado_al,
                         obligatoria: .fuerza.es_jurisprudencia_obligatoria, url}'

echo "── Texto íntegro (no gasta cuota) ──"
curl -s "$API/documento?tipo=ley&id=codigo-fiscal-de-la-federacion/17" | jq '{referencia, vigencia}'

echo "── Cuántos documentos hay ──"
curl -s "$API/stats" | jq '.corpus'
