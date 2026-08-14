# 🧠 SISTEMA-MEMORIA-PERSISTENTE-ORQUESTADOR-V1 — Memoria del Orquestador entre Chats
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** VINCULANTE (tras aprobación Founder)
**Problema que resuelve:** el Orquestador (Perplexity) trabaja en chats con límite. Cuando el
chat se llena y hay que migrar, la memoria operativa no puede morir con el chat.
**Principio:** la memoria del Orquestador es un artefacto versionado en GitHub, no un recuerdo.
**Regla de oro:** lo que no está en el archivo de memoria (con SHA) no ocurrió para el siguiente chat.

---

## 1. ARQUITECTURA DE 3 PIEZAS

### Pieza 1 — MEMORIA VIVA (archivo único, en el tablero)
**Ruta:** rama `fleet/workspace` → `orquestador/MEMORIA-ORQUESTADOR.md`
- Es el estado operativo completo del proyecto desde el rol del Orquestador.
- La actualiza el Orquestador (emite contenido) y la commitea Antigravity (reporta SHA).
- Cuando madure, su espejo canónico vivirá en `main` → `docs/governance/`.

### Pieza 2 — PROMPT DE ARRANQUE (lo guarda el Founder)
Texto fijo que el Founder pega como primer mensaje de cualquier chat nuevo. Instruye al
Orquestador entrante a leer la memoria desde GitHub y ponerse al día. (Plantilla en §3.)

### Pieza 3 — RITUAL DE GUARDADO
- El Founder dice **"GUARDAR MEMORIA"** (o al cierre de cada sesión intensa).
- El Orquestador emite el snapshot actualizado (formato §2).
- Antigravity lo commitea a `fleet/workspace/orquestador/MEMORIA-ORQUESTADOR.md` y reporta SHA.
- Ese SHA es el "checkpoint" del proyecto.

**Capa secundaria (bonus, no confiable como fuente única):** Perplexity tiene memoria interna
entre chats. Se usa como respaldo blando; si contradice a la memoria en GitHub, gana GitHub.

## 2. FORMATO DE LA MEMORIA VIVA (estructura fija)

```markdown
# MEMORIA-ORQUESTADOR — IC360
**Última actualización:** [fecha/hora -04] · **SHA de este archivo:** [lo añade Antigravity]
**Chat origen:** [identificador aprox.] · **HEAD main al guardar:** [SHA]

## A. ESTADO DEL PROYECTO (fotografía)
- Punto actual, scorecard resumido, qué está en curso.

## B. DECISIONES DEL FOUNDER VIGENTES
- Lista numerada de decisiones tomadas (con fecha). Las decisiones no se re-debaten;
  solo se revocan por el Founder.

## C. ÓRDENES ACTIVAS Y SU ESTADO
| Orden | A quién | Qué | Estado | SHA evidencia |
- O-PERP-01…NN con estado real.

## D. PENDIENTES DEL FOUNDER
- Acciones que solo él puede hacer (rotación, D-SEC-13, decisiones).

## E. PENDIENTES DE VALIDACIÓN
- Registro vivo de afirmaciones normativas/técnicas no verificadas.

## F. MAPA DE ENTREGABLES DEL ORQUESTADOR
- Los N instrumentos emitidos y su estado Kanban.

## G. CONTRADICCIONES ABIERTAS
- Donde dos fuentes/agentes difieren y aún no se resuelve.

## H. LOG DE SESIONES (compacto, append-only)
- [fecha] Chat X: se hizo A, B, C. Quedó pendiente D.
```

**Disciplina de tamaño:** el snapshot es denso y tabular. El detalle vive en los documentos
referenciados (por SHA/ruta), no duplicado en la memoria.

## 3. PROMPT DE ARRANQUE (plantilla — el Founder la guarda y la pega en chats nuevos)

```
🧠 ARRANQUE DE MEMORIA — ORQUESTADOR IC360 (v1)

Actúa como el Orquestador/CTO del proyecto IC360 (Founder: Freddy, Wolves Global
Solutions). Tu rol, límites y doctrina están definidos en el proyecto. Antes de
responder, carga tu memoria persistente:

PASO 1 — Con el conector GitHub (github_mcp_direct), lee en este orden:
1. Rama `fleet/workspace` → `orquestador/MEMORIA-ORQUESTADOR.md` (tu estado operativo).
2. Rama `fleet/workspace` → `TABLERO.md` (estado Kanban del trabajo de la flota).
3. Si necesitas canon: rama `main` → `docs/governance/` (00, 01_ACK, SPRINT_LEDGER).

PASO 2 — Confirma con UNA línea: "Memoria cargada. Último checkpoint: [fecha/SHA].
Pendiente inmediato: [X]." y espera mi instrucción.

REGLAS: GR-16 (SHAs solo literales de git) · evidencia o no existe · PENDIENTE DE
VALIDACIÓN para lo no verificable · FORMATOS PRIMERO, IA DESPUÉS.
```

*(Nota: si el conector no puede leer contenido en ese chat, el Founder adjunta el archivo
MEMORIA-ORQUESTADOR.md directamente — Antigravity siempre tiene la copia local actualizada.)*

## 4. CUÁNDO SE GUARDA

| Disparador | Acción |
|---|---|
| Founder dice "GUARDAR MEMORIA" | Snapshot inmediato |
| Cierre de una orden (O-PERP-NN) | Actualizar sección C |
| Decisión del Founder | Actualizar sección B de inmediato |
| Chat acercándose a su límite | Snapshot + el Founder abre chat nuevo con el prompt |
| Cambio de HEAD relevante en main | Actualizar sección A |

## 5. PRIMERA ACTIVACIÓN

1. El Orquestador emite el primer snapshot (estado al 14-ago-2026) — sección H inicia con
   el log de esta sesión.
2. Founder lo entrega a Antigravity junto con este protocolo.
3. Antigravity: crea `orquestador/` en `fleet/workspace`, commitea ambos, reporta SHA.
4. El Founder guarda el PROMPT DE ARRANQUE (§3) en su libreta de prompts.

**Compatibilidad:** este sistema es la instanciación del "ORQUESTADOR-MEMORIA-V1" ya
existente en governance, llevado a mecánica verificable (archivo + SHA + prompt + ritual).
