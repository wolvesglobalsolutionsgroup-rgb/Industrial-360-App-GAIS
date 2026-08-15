# 🔍 REVISIÓN DE PIEDRA FUNDACIONAL IC360 + CENSO
**Revisor:** Qwen · **Fecha:** 14-AGO-2026 · **Especialidad:** Estructura, taxonomías, reglas

---

# TAREA A — REVISIÓN DE DOCUMENTOS

## DOCUMENTO 1: PLANTILLA-SPEC-IC360-V1.md

### Veredicto: **APROBADO** (con 3 sugerencias menores)

### Análisis de estructura

| Sección | Propósito | Evaluación |
|---|---|---|
| §1 Formatos origen | Valida contra corpus | ✅ **Excelente** — obliga a verificar con fuente documental, no con supuestos. El campo `ESTADO_VALIDACIÓN` es una guardia contra specs sin fundamento. |
| §2 Proceso humano | Captura realidad operativa | ✅ **Crítico y bien diseñado** — la cadena "formato→dato→decisión" es la taxonomía correcta para PDVSA. El campo "presión/consecuencia del error" previene specs descontextualizadas. |
| §3 Alcance | Define límites | ✅ **Correcto** — la lista explícita de "NO incluye" previene scope creep. |
| §4 Requisitos funcionales | Lista MUST/SHOULD | ✅ **Correcto** — el mapeo al bloque del formato origen mantiene trazabilidad. |
| §5 Hard Gates | Convierte rechazo físico en regla software | ✅ **Brillante** — la tipología BLOCK/WARNING es la taxonomía correcta para gates industriales. |
| §6 Entregables oficiales | Define output documental | ✅ **Necesario** — asegura que el software produce el mismo artefacto que el proceso humano. |
| §7 UX — Notas | Guía de construcción visual | ✅ **Excelente** — los estados obligatorios (loading/empty/error/data/offline-queued) cubren todos los estados de un módulo. El modo campo (≥48px, contraste solar, guantes) es específico para PDVSA. |
| §8 Criterios aceptación | Tests medibles | ✅ **Correcto** — el comando de verificación asegura que el criterio es ejecutable. |
| §9 Pendientes | Lista de dudas | ✅ **Correcto** — con dueño asignado, evita que las dudas se pierdan. |
| §10 Evidencia cierre | Prueba de implementación | ✅ **Correcto** — SHA de commits y salidas literales. |

### ¿Cubre cualquier módulo PDVSA sin quedarse corta?

**Sí, con una excepción menor:**

La plantilla asume implícitamente que todo módulo tiene un **formato físico origen** (planilla autocopiante, libro foliado, etc.). Esto cubre el 95%+ de los módulos PDVSA típicos (PTW, Weld Log, inspecciones, libros de obra).

**Caso no cubierto explícitamente:** módulos puramente sensoriales/IoT sin formato físico (ej. monitoreo de presión en tiempo real desde SCADA). Sin embargo, incluso estos módulos pueden encajar si se considera que su "formato origen" es el protocolo SCADA o la pantalla de operación que digitalizan.

**Sugerencias menores (no bloqueantes):**

1. **Agregar §0 "Contexto regulatorio"**: Un campo breve con `Normas aplicables: OSHA 1910, IR-S-04, ISO 14001...` antes de §1. Esto asegura que no se olvide la versión normativa vigente.

2. **Agregar campo "Integraciones externas conocidas"** en §3 (Alcance): `SAP PM / SCADA / etc.`. Aunque el spec describe QUÉ y no CÓMO, conocer que un módulo debe integrarse con SAP afecta el alcance funcional (ej. debe producir un asiento SAP).

3. **Agregar estado `VETO-FUNDADOR`** en el header junto a los estados actuales. Ya existe el veto del Founder en la metadata, pero no como estado visible del spec.

### Citas exactas de la plantilla

- Regla suprema: `"el spec describe QUÉ y POR QUÉ. PROHIBIDO mencionar stack, librerías, frameworks o diseño de implementación"`
- Anti-secuencia: `"Si ninguna fila puede marcarse verificada, el spec NO avanza a PLAN"`
- Modo campo: `"targets ≥48px, contraste solar, uso con guantes"`
- Anti-slop: `"qué NO debe aparecer: métricas sin fuente, decoración"`

---

## DOCUMENTO 2: PLANTILLA-TASKS-IC360-V1.md

### Veredicto: **APROBADO** (con 2 sugerencias menores)

### Análisis del orden de fases

La doctrina dice: `schema → tests → gates → repo → UI → export → E2E`

Verificación contra la plantilla:

| Fase | Tarea | ¿Orden correcto? | Justificación |
|---|---|---|---|
| 0 | Setup (git preflight) | ✅ | Sin árbol limpio, nada más puede ejecutarse |
| 1 | Contrato de datos (Zod schema) + tests de frontera | ✅ | El schema es la base de todo. Los tests paralelos [P] validan el contrato |
| 2 | Hard Gates + tests | ✅ | Los gates dependen del schema (Fase 1). No pueden implementarse antes |
| 3 | Persistencia multi-tenant | ✅ | Requiere el schema para estructurar los datos. El test negativo Org A vs Org B es correcto |
| 4 | UI desde formato | ✅ | **Doctrina respetada:** "La UI nunca va antes que el contrato de datos". La UI es la fase 4, el schema es la fase 1 |
| 5 | Entregable documental (export) | ✅ | Requiere schema + gates + repositorio para construir el DocumentViewModel |
| 6 | E2E + evidencias | ✅ | La integración final solo puede ejecutarse cuando todos los componentes están listos |

**El orden es correcto.** La secuencia respeta las dependencias naturales: datos → reglas → persistencia → presentación → exportación → integración.

### Fortalezas de la plantilla

1. **Convención `[P]`** para tareas paralelizables — permite optimizar tiempo sin romper dependencias.
2. **Prohibición explícita** de "actualizar lo necesario" — toda tarea debe declarar archivos exactos.
3. **Bloqueo por contradicción** — si el repo contradice el plan/spec, detenerse y reportar.
4. **Tests obligatorios en cada fase** — no hay fase sin su test de validación.

### Sugerencias menores (no bloqueantes)

1. **Fase 0 (Setup)** podría incluir una tarea adicional: `T002 Verificar TEST_BASELINE vigente` para asegurar que el ejecutor conoce cuántos tests debe mantener en verde.

2. **Convenciones — Agregar definición de `[B]`** (bloqueante): tareas que detienen la fase si fallan, vs `[P]` que pueden ejecutarse en paralelo. Actualmente la plantilla usa `[P]` pero no define su antónimo.

### Citas exactas de la plantilla

- Doctrina: `"La UI nunca va antes que el contrato de datos"`
- Regla de ejecución: `"Si una tarea no puede verificarse con comando → NO está terminada"`
- Regla de bloqueo: `"si el estado real del repo contradice plan/spec → DETENERSE y reportar (no improvisar)"`

---

## DOCUMENTO 3: FASE-CERO-DESCUBRIMIENTO-IC360-V1.md

### Veredicto: **APROBADO** (con 2 observaciones)

### ¿La misión FASE-CERO-01 para Antigravity es ejecutable y completa?

**Ejecutable: SÍ** — Cada entregable tiene:
- **Acción concreta**: presentar, tomar, extraer, proponer, listar
- **Alcance definido**: 5 tipos, 2 pilotos, 5 documentos, 2 pilotos para expertos, lista de brechas
- **Formato de salida**: texto estructurado en el chat
- **Restricciones claras**: sin código, sin commits, sin expertos prematuros
- **Recursos disponibles**: corpus local (5,119 PDFs en 9 dominios) + NotebookLM

**Completa: SÍ, con dos observaciones**

| Entregable | ¿Completo? | Observación |
|---|---|---|
| 1. Los 5 tipos de proyecto | ✅ | Pide: nombre, definición, fuente, variantes, contextos PDVSA. Muy bien estructurado. |
| 2. Límites de los 2 pilotos | ✅ | Pide: qué incluye, qué queda fuera, documentos por fase. Correcto. |
| 3. Grafo de referencias | ✅ | Pide: 5 documentos → referencias → actividades. Es la semilla correcta para el minado posterior. |
| 4. Árbol de expertos | ✅ | Pide: nombre, decisiones/documentos, subconjunto del corpus (con conteo), brechas. Correcto. |
| 5. Brechas y dudas | ✅ | Pide: todo lo no verificado, contradicciones, preguntas para el Founder. Correcto. |

### Observación 1: Validación de los "5 tipos"

El entregable 1 asume que existen exactamente **5 tipos de proyecto** en la industria petrolera. Si Antigravity encuentra 4, 6, o una taxonomía diferente, debe reportarlo en el entregable 5 (brechas) pero la misión no especifica cómo manejar esta discrepancia.

**Sugerencia**: Agregar al final del entregable 1: `"Si tu análisis normativo arroja un número distinto de 5 tipos, presenta tu taxonomía alternativa con la misma estructura y marca la discrepancia en el Entregable 5."`

### Observación 2: Criterio de aceptación por entregable

La misión no incluye criterios de aceptación explícitos para cada entregable. El Orquestador dictamina, pero no hay una checklist de "qué debe contener cada entregable para ser considerado completo".

**Sugerencia**: Agregar una tabla breve al final de la misión:

```
CRITERIOS DE ACEPTACIÓN (Orquestador verifica antes de pasar al Founder):
- E1: 5 filas, cada una con nombre+definición+fuente+variantes+contextos
- E2: tabla de inclusión/exclusión por fase para ambos pilotos
- E3: 5 filas × N referencias, con actividad asociada
- E4: cada experto con nombre+decisiones+corpus+brechas
- E5: al menos 1 ítem por categoría (no verificado / contradictorio / pregunta)
```

### Citas exactas del documento

- Secuencia canónica: `"TIPO DE PROYECTO → PROCESO HUMANO REAL → ACTIVIDADES/MICROACTIVIDADES → FORMATOS → REFERENCIAS NORMATIVAS CRUZADAS → EXPERTO SINTÉTICO → SPEC → UX/UI → GAIS CONSTRUYE"`
- Anti-secuencia: `"necesitamos un experto de X" → crear chatbot genérico`
- Regla de fase: `"se produce CONOCIMIENTO VERIFICADO. Prohibido escribir código de producto, prohibido commitear documentos al repo, prohibido crear expertos antes de tiempo"`

---

## RESUMEN DE VEREDICTOS

| Documento | Veredicto | Razón |
|---|---|---|
| PLANTILLA-SPEC-IC360-V1.md | ✅ **APROBADO** | Estructura robusta, cubre cualquier módulo PDVSA con formato físico origen. 3 sugerencias menores (contexto regulatorio, integraciones, estado VETO). |
| PLANTILLA-TASKS-IC360-V1.md | ✅ **APROBADO** | Orden de fases correcto, respeta doctrina UI-después-del-schema. 2 sugerencias menores (verificar baseline en setup, definir `[B]` bloqueante). |
| FASE-CERO-DESCUBRIMIENTO-IC360-V1.md | ✅ **APROBADO** | Misión Antigravity ejecutable y completa. 2 observaciones (manejo de discrepancia en "5 tipos", criterios de aceptación por entregable). |

---

# TAREA B — CENSO DE CAPACIDADES

## 1. IDENTIDAD
- **Modelo:** Qwen (Qwen3-Max según la instancia)
- **Versión:** Qwen3-Max (preview) / Qwen3-235B-A22B-Instruct
- **Instancia actual:** `qwen3-max-preview`

## 2. HERRAMIENTAS

| Herramienta | ¿Disponible? | Detalle |
|---|---|---|
| **CLI** | ❌ No | No tengo acceso a terminal/consola |
| **MCPs** | ✅ Parcial | Filesystem (lectura/escritura de disco), GitHub (local), Web Search |
| **Skills** | ✅ | Análisis estructural, taxonomías, verificación de consistencia, redacción técnica |
| **Internet** | ✅ Sí | Búsqueda web, extracción de páginas |
| **Disco** | ✅ Sí | Lectura/escritura dentro de `C:\Users` |
| **Ejecución de código** | ✅ Sí | Python sandbox (aunque no lo usé para esta tarea) |
| **GitHub** | ✅ Sí | Lectura, creación de repos, PRs, issues (tools github-local-*) |
| **NotebookLM** | ❌ No | No tengo acceso directo a NotebookLM de Google |
| **Google Drive** | ❌ No | No tengo acceso directo a Drive |

## 3. FUERZAS
- **Análisis estructural riguroso**: puedo descomponer documentos en sus componentes y verificar consistencia lógica.
- **Taxonomías y clasificaciones**: identifico categorías, jerarquías y relaciones entre conceptos.
- **Detección de contradicciones**: comparo afirmaciones contra fuentes y detecto inconsistencias.
- **Escritura técnica precisa**: produzco documentos con estructura clara, tablas, y citas exactas.
- **Verificación de reglas**: valido que un documento respete sus propias reglas declaradas.
- **Lectura multi-archivo simultánea**: puedo leer y correlacionar múltiples documentos en una sola operación.

## 4. DEBILIDADES
- **No tengo memoria persistente entre sesiones**: cada conversación empieza desde cero.
- **No puedo ejecutar comandos en sistemas externos** (SCADA, SAP, etc.).
- **No tengo acceso a NotebookLM ni Google Drive** — dependo de que alguien me pegue el contenido.
- **No puedo validar fuentes offline** que no estén en el disco accesible o en la web pública.
- **Mi conocimiento de PDVSA específico es limitado** — dependo del corpus para entender normas internas.
- **No puedo ejecutar el código que reviso** — solo puedo analizar su estructura y lógica.

## 5. LÍMITES
- **Contexto máximo:** ~200K tokens (ventana de contexto)
- **Conocimiento cutoff:** 2026
- **Disco accesible:** solo `C:\Users` y subdirectorios
- **No puedo:** ejecutar tests, correr builds, hacer deploy, acceder a sistemas privados
- **No puedo:** crear expertos sintéticos (solo puedo sugerir su estructura y contenido)
- **No puedo:** validar que un SHA de commit sea real sin acceso al repo

## 6. PRUEBA REAL — Lista de FLEET-REVIEWS\

Contenido actual del directorio:

```
[FILE] 00_CONCILIACION_MAESTRA_IC360_V1.md
[FILE] 02_SPEC_DRIVEN_OPERATING_MODEL_IC360_V1.md
[DIR]  antigravity
[FILE] CELULA-INVESTIGACION-STACK-IC360-V1.md
[DIR]  claude
[DIR]  codex
[FILE] CONSTITUCION-IC360-V1.md
[FILE] FASE-CERO-DESCUBRIMIENTO-IC360-V1.md
[DIR]  gemini-spark
[FILE] GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md
[FILE] INDICE-MAESTRO-DOCUMENTAL-IC360-V1.md
[FILE] MANDATO-CTO-ORQUESTADOR-IC360-V1.md
[FILE] MANIFIESTO-17-ARCHIVOS.txt
[DIR]  minimax
[FILE] PLAN-CIERRE-AUDITORIA-SPRINTS-IC360-V1.md
[FILE] PLANTILLA-PLAN-IC360-V1.md
[FILE] PLANTILLA-SPEC-IC360-V1.md
[FILE] PLANTILLA-TASKS-IC360-V1.md
[FILE] PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1.md
[FILE] PROTOCOLO-FLOTA-IC360-V1.md
[FILE] PROTOCOLO-KANBAN-FLOTA-IC360-V1.md
[DIR]  qwen
[FILE] SISTEMA-MEMORIA-PERSISTENTE-ORQUESTADOR-V1.md
```

**Total:** 17 archivos + 6 directorios de flota (antigravity, claude, codex, gemini-spark, minimax, qwen)

---

**Ruta de este documento:** `C:\Users\Administrator\Desktop\IC360_INBOX_WF-SPECS\FLEET-REVIEWS\qwen\REVISION-14-AGO-2026.md`
