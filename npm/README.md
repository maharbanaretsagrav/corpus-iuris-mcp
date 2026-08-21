# @corpusiuris/mexican-law-mcp

Servidor MCP de **derecho mexicano**: 6,710 leyes federales y estatales, 311,701
tesis y 11,708 precedentes de la SCJN — con vigencia fechada y URL citable.

> **¿Tu cliente habla HTTP remoto?** No instales nada. Usa el servidor remoto,
> que tiene OAuth de un clic: `https://api.corpusiuris.mx/mcp`
> Este paquete es para los clientes que solo hablan *stdio*.

## Instalar

```json
{
  "mcpServers": {
    "corpus-iuris": {
      "command": "npx",
      "args": ["-y", "@corpusiuris/mexican-law-mcp"]
    }
  }
}
```

Sin API key. Con cuenta gratuita tu cuota deja de compartirse con tu oficina:

```json
"env": { "CORPUS_IURIS_TOKEN": "ci_agent_…" }
```

(Genera el tuyo en corpusiuris.mx → Mi cuenta → Conecta tu IA.)

## Herramientas

| Tool | Para qué |
|---|---|
| `buscar_derecho_mexicano(query, fuentes)` | Buscar en leyes, tesis y precedentes |
| `obtener_documento_integro(tipo, id)` | Texto completo. No gasta cuota de búsqueda |

## Lo que hace citable una respuesta

Cada ley trae `vigencia` (última reforma, fecha de verificación contra la fuente
oficial y enlace a ella). Cada tesis trae `fuerza`: si es **jurisprudencia
obligatoria** o una **tesis aislada** — la distinción que más se equivoca una IA
en derecho mexicano. Las leyes abrogadas salen con `ADVERTENCIA`.

**No caches las respuestas.** El corpus cambia todos los días.

Docs: https://corpusiuris.mx/agentes · MIT · AteraSoft (México)
