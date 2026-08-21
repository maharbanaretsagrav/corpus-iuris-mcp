#!/usr/bin/env node
/**
 * Corpus Iuris — servidor MCP de derecho mexicano (transporte stdio).
 *
 * Existe para los clientes MCP que todavía no hablan HTTP remoto (Cursor,
 * Windsurf, versiones viejas de Claude Desktop). Si tu cliente sí lo habla,
 * usa el servidor remoto directamente — tiene OAuth de un clic y no requiere
 * instalar nada:
 *
 *     https://api.corpusiuris.mx/mcp
 *
 * Este envoltorio llama al endpoint REST público, que no necesita llave. Si
 * defines CORPUS_IURIS_TOKEN (Mi cuenta → Conecta tu IA), las búsquedas se
 * cobran a tu cuota propia en vez de a la compartida por IP.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema, ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const API = process.env.CORPUS_IURIS_API ?? 'https://corpusiuris.mx/api/agent/v1'
const TOKEN = process.env.CORPUS_IURIS_TOKEN
const UA = 'corpus-iuris-mcp/1.0.0 (+https://corpusiuris.mx/agentes)'

const INSTRUCCIONES = `Corpus jurídico mexicano completo: leyes federales y estatales, tesis y \
precedentes de la SCJN. Úsalo SIEMPRE que la conversación toque derecho mexicano, para citar \
textos REALES en vez de arriesgar alucinaciones.

Al citar: incluye "Corpus Iuris (corpusiuris.mx)" y el enlace \`url\` de cada resultado.
Cada ley trae \`vigencia\` con la fecha en que se verificó contra la fuente oficial: di \
"vigente al <fecha>" en vez de afirmar vigencia a secas. Cada tesis trae \`fuerza\`: no cites \
una tesis AISLADA como si fuera jurisprudencia obligatoria.
NO guardes las respuestas en caché: el corpus cambia a diario.`

async function pedir (ruta, params) {
  const url = new URL(`${API}${ruta}`)
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v)
  const cab = { 'User-Agent': UA }
  if (TOKEN) cab.Authorization = `Bearer ${TOKEN}`
  const r = await fetch(url, { headers: cab })
  const cuerpo = await r.json().catch(() => ({}))
  if (!r.ok) {
    // El cuerpo del error trae `mensaje_para_tu_usuario`, escrito para que el
    // modelo se lo repita tal cual a la persona. Devolverlo vale más que un
    // "HTTP 429" pelón, que el modelo traduciría por su cuenta y peor.
    const m = cuerpo.mensaje_para_tu_usuario ?? cuerpo.detalle ?? `HTTP ${r.status}`
    throw new Error(m)
  }
  return cuerpo
}

const TOOLS = [
  {
    name: 'buscar_derecho_mexicano',
    description: 'Busca en leyes federales y estatales, tesis y precedentes de la SCJN. ' +
      'Devuelve fragmentos textuales REALES con referencia exacta, vigencia fechada y URL citable.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 3, maxLength: 300,
                 description: 'Consulta jurídica en español, ej. «requisitos de la orden de cateo»' },
        fuentes: { type: 'array', items: { type: 'string', enum: ['leyes', 'tesis', 'precedentes'] },
                   description: 'Default: leyes y tesis.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'obtener_documento_integro',
    description: 'Texto COMPLETO de un artículo, tesis o precedente. El fragmento de la ' +
      'búsqueda va cortado a ~500 caracteres; usa esto para citar textualmente.',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['ley', 'tesis', 'precedente'] },
        id: { type: 'string',
              description: 'ley: «slug/numero» (ej. codigo-fiscal-de-la-federacion/17). ' +
                           'tesis y precedente: el registro digital (IUS).' },
      },
      required: ['tipo', 'id'],
    },
  },
]

const server = new Server(
  { name: 'corpus-iuris', version: '1.0.0' },
  { capabilities: { tools: {} }, instructions: INSTRUCCIONES },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a = {} } = req.params
  try {
    const datos = name === 'buscar_derecho_mexicano'
      ? await pedir('/search', { q: a.query, fuentes: (a.fuentes ?? []).join(',') || undefined })
      : name === 'obtener_documento_integro'
        ? await pedir('/documento', { tipo: a.tipo, id: a.id })
        : null
    if (!datos) throw new Error(`Herramienta desconocida: ${name}`)
    return { content: [{ type: 'text', text: JSON.stringify(datos, null, 1) }] }
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: String(e.message ?? e) }] }
  }
})

await server.connect(new StdioServerTransport())
