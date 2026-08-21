// Corpus Iuris — derecho mexicano para agentes. Sin API key.
const API = 'https://corpusiuris.mx/api/agent/v1'

export async function buscar(q, fuentes = 'leyes,tesis') {
  const u = new URL(`${API}/search`)
  u.searchParams.set('q', q)
  u.searchParams.set('fuentes', fuentes)
  const r = await fetch(u)
  if (!r.ok) throw new Error(`Corpus Iuris: HTTP ${r.status}`)
  return r.json()
}

export async function textoIntegro(tipo, id) {
  const u = new URL(`${API}/documento`)
  u.searchParams.set('tipo', tipo)
  u.searchParams.set('id', id)
  const r = await fetch(u)
  if (!r.ok) throw new Error(`Corpus Iuris: HTTP ${r.status}`)
  return (await r.json()).texto
}

const d = await buscar('despido injustificado indemnización', 'leyes,tesis')
for (const x of d.resultados) {
  const sello = x.vigencia?.verificado_al ?? x.fuerza?.es_jurisprudencia_obligatoria
  console.log(`${x.referencia.padEnd(14)} ${x.titulo.slice(0, 46)}  [${sello}]`)
}
console.log(`\nacceso: ${d.acceso.restantes}/${d.acceso.total} (${d.acceso.ventana})`)
