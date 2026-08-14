# 📋 PROTOCOLO-KANBAN-FLOTA-IC360-V1 — Transporte, Custodia y Tablero de Trabajo de la Flota
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** VINCULANTE (tras aprobación Founder)
**Resuelve:** límites de carga del chat, comunicación Orquestador↔Flota, respaldo de trabajo
de agentes, preparación de adjuntos para GAIS, y protección contra el borrado por GAIS.
**Complementa:** PROTOCOLO-FLOTA-IC360-V1 (roles) — este doc define el CÓMO se mueve el trabajo.

---

## 1. LAS TRES ZONAS (nada existe fuera de ellas)

| Zona | Qué es | Quién escribe | Quién lee |
|---|---|---|---|
| **Z1 — Staging Local** | Carpeta en el equipo del Founder (raíz existente: `IC360_INBOX_WF-SPECS\`) | Todos los agentes con acceso local (Antigravity gestiona) | Agentes locales |
| **Z2 — Rama `fleet/workspace` en GitHub** | Transporte + respaldo + tablero. Rama dedicada que GAIS NUNCA toca | Solo Antigravity (o quien el Founder designe) | Orquestador (integridad), Founder (contenido) |
| **Z3 — `main`** | Canónico. Solo entra lo aprobado por las 4 Capas | Merge humano (Founder) | Todos |

**REGLA DE ORO:** ningún trabajo valioso vive solo en un chat o solo en el workspace de
GAIS. Si no está en Z2 o Z3, no existe.

## 2. ESTRUCTURA DE LA ZONA LOCAL (Z1)

Antigravity crea/organiza dentro de la raíz existente y reporta las rutas exactas:

```
IC360_INBOX_WF-SPECS\
├── ORQUESTADOR-INBOX\        ← lo que los agentes me dirigen a mí
├── FLEET-REVIEWS\<agente>\   ← revisiones de cada miembro (línea por línea)
├── STAGED-FOR-GAIS\          ← paquetes listos para adjuntar a GAIS (SYNC_PACK + prompt)
├── TO-REPO\                  ← candidatos aprobados para subir a main
├── ARCHIVE\                  ← histórico con fecha
└── SYNC_PACK_GOOGLE\         ← (existente) paquete de sincronización GAIS
```

## 3. FLUJO DEL TABLERO (estados Kanban)

```
DRAFT-LOCAL → COMMITTED-FLEET (hash) → REVIEWED-ORQUESTADOR
→ APPROVED-FOUNDER → MAIN (4 capas) | GAIS (adjunto) | ARCHIVE
```

1. **DRAFT-LOCAL:** el agente produce en su entorno y guarda en la subcarpeta asignada.
2. **COMMITTED-FLEET:** Antigravity copia a Z1, commitea a `fleet/workspace` y reporta:
   ruta local + ruta en rama + **SHA del commit** + tamaño. Sin SHA = no entregado (GR-16).
3. **REVIEWED-ORQUESTADOR:** yo verifico contra GitHub API (existencia, SHA, tamaño) y
   pido extractos dirigidos. El agente responde citando su documento literal. Si hay
   observaciones, el agente corrige y re-commitea (nuevo SHA).
4. **APPROVED-FOUNDER:** el Founder ve lo crítico (pegado en chat o en su pantalla) y
   aprueba, corrige o veta.
5. **Destino final:** MAIN (si es canónico, vía 4 capas) · GAIS (si es insumo de
   construcción, vía STAGED-FOR-GAIS) · ARCHIVE (si ya cumplió su ciclo).

## 4. CUARENTENA GAIS (protección del tablero)

1. GAIS trabaja únicamente en ramas `main`/`sprint/*`. **Nunca** en `fleet/workspace`.
2. Todo prompt a GAIS lleva el PROTOCOLO GAIS-SAFE-PUSH (ya emitido): `git status` con 0
   borrados, `git diff --stat origin/main` sin eliminaciones ajenas, o ABORTA.
3. Antigravity verifica post-push de GAIS que el conteo de archivos de `docs/`,
   `.github/` y `scripts/` no disminuyó. Si disminuyó: restauración inmediata desde
   `fleet/workspace` o desde el historial, y alerta roja al Founder.
4. El SYNC_PACK se regenera tras cada cambio en docs canónicos para que el workspace de
   GAIS nunca quede desactualizado (esa es la causa raíz del borrado).

## 5. REVISIÓN DE DOCUMENTOS SIN ADJUNTAR (la mecánica que el Founder ordenó)

En vez de adjuntar documentos en cada prompt:

1. Antigravity coloca los documentos en la carpeta (Z1) y/o rama (Z2) y reporta la ruta.
2. El prompt al revisor dice: **"Lee línea por línea los documentos en [ruta exacta].
   Si tienes algo que agregar, mejorar o corregir: (a) repórtalo al Orquestador con cita
   de la sección exacta, o (b) commitea tu revisión en tu subcarpeta FLEET-REVIEWS\<tú>\ 
   y reporta el SHA."**
3. El Orquestador consolida las revisiones y emite dictamen. El Founder resuelve
   desacuerdos. Solo entonces el documento va a main.

## 6. APLICACIÓN INMEDIATA: LOS 14 INSTRUMENTOS FUNDACIONALES

Los 14 documentos emitidos hoy por el Orquestador entran al tablero así:

1. Founder descarga los 14 archivos del panel y se los entrega a Antigravity.
2. Antigravity los coloca en `FLEET-REVIEWS\` (Z1), commitea a `fleet/workspace` y
   reporta SHA + lista de rutas.
3. Cada revisor asignado (Claude, Qwen, Codex, Antigravity, Minimax, Gemini Spark)
   recibe el prompt de revisión con la RUTA, no con adjuntos.
4. Sus observaciones vuelven por el mismo tablero. Yo concilio. Founder aprueba.
5. Los aprobados pasan a `TO-REPO\` → Antigravity los sube a `main` (docs/governance/,
   docs/spec-kit-ic360/) con un solo commit firmado → SHA verificado → SYNC_PACK se
   regenera → GAIS queda inmunizado.

## 7. PROHIBICIONES DEL TABLERO

- Prohibido commitear a `fleet/workspace` secretos o el archivo de recursos legacy
  (INCIDENT-2026-08-14). gitleaks aplica también a esa rama.
- Prohibido que GAIS reciba adjuntos que no vengan de `STAGED-FOR-GAIS\` (fuente única).
- Prohibido reportar entregas sin SHA de commit (GR-16).
- Prohibido que dos agentes editen el mismo archivo en Z1 simultáneamente (Antigravity
  asigna subcarpetas por agente para evitar colisiones).

## 8. REGISTRO VIVO DEL TABLERO

Antigravity mantiene `fleet/workspace/TABLERO.md` con la tabla:
| Documento/Trabajo | Autor | Estado Kanban | SHA actual | Revisor | Dictamen | Destino final |

Ese archivo ES el tablero que el Founder puede abrir en GitHub en cualquier momento.
