# 🔍 REVISIÓN-CLAUDE-PIEDRA-FUNDACIONAL-IC360-V1.md
**Auditor:** Claude (rol: auditor externo de PRs, per 00_CONCILIACION §7)
**Fecha:** 14-AGO-2026
**Documentos revisados:** CONSTITUCION-IC360-V1.md, 00_CONCILIACION_MAESTRA_IC360_V1.md, PLANTILLA-PLAN-IC360-V1.md
**Método:** lectura línea por línea, foco en verificabilidad mecánica, contradicciones internas y ejecutabilidad de gates.

---

## 1. CONSTITUCION-IC360-V1.md

### Hallazgo 1.1 — Contradicción real: Art. VIII asigna "gate humano" a un agente no-humano
La "Tabla de Enforcement Resumida" pone en la columna **Gate humano** del Art. VIII (Validación) al **Orquestador**. Pero 00_CONCILIACION_MAESTRA confirma en su encabezado: *"Autor: Orquestador IC360 (Perplexity)"* — es decir, el Orquestador es un agente de IA, no una persona.
Esto choca directamente con:
- El **Preámbulo**: *"Ningún agente — incluido el Orquestador — posee la verdad única."*
- El **Art. V (HITL)**: *"la IA propone, los hard gates validan, el humano firma... Prohibido auto-aprobar."*

Si el "gate humano" de Art. VIII lo satisface el Orquestador (una IA) marcando la columna ESTADO_VALIDACIÓN, entonces una IA se está auto-certificando sin firma del Founder — exactamente lo que Art. V prohíbe. **Esto no es un matiz de redacción: es un artículo que, tal como está escrito, permite violar otro artículo.**
**Corrección sugerida:** cambiar el gate humano de Art. VIII a "Founder (revisión periódica) / Auditor (Claude)" y dejar al Orquestador solo como responsable del gate mecánico (llenar la columna), nunca como el "humano" que la cierra.

### Hallazgo 1.2 — Art. VII: el mecanismo de verificación es más angosto que la prohibición
El artículo prohíbe *"crear motores, repositorios, exportadores o contextos paralelos sin verificar primero la implementación existente"* — en cualquier parte del repo. Pero su única verificación mecánica es *"auditor externo revisa diff contra rutas protegidas"* (`src/lib/workflows/`, `src/lib/exporters/`, `src/lib/domain/`).
Un exportador o motor paralelo creado **fuera** de esas tres rutas (p. ej. `src/features/x/localExporter.ts`) violaría la letra del artículo pero no dispararía ningún gate mecánico ni entraría al diff review. Gap real entre prohibición y enforcement.
**Corrección sugerida:** añadir un grep/lint que busque patrones de exportadores/motores duplicados (imports de `jsPDF`, clases `*Exporter`, `*Engine`) fuera de las rutas protegidas, no solo dentro de ellas.

### Hallazgo 1.3 — Art. VI: "verificación mecánica" mezcla lo automatizable con lo humano sin distinguirlo
La lista de prohibiciones incluye ítems verificables por script (`mocks como datos reales`, posiblemente `audit:industrial-data`) junto con ítems de juicio visual puro (*"gradientes/glow genéricos"*, *"pantallas que no se reconocen como su formato físico PDVSA"*). La fila dice "Verificación mecánica: `audit:industrial-data` verde + checklist visual mecánico en gate del Founder" — pero un checklist visual llenado por un humano no es "mecánico", es humano. La etiqueta es engañosa y puede llevar a un ejecutor a pensar que basta el script verde.
**Corrección sugerida:** dividir explícitamente en "Gate mecánico (CI)" y "Gate humano (Founder, Capa 3)" como sí se hace, por ejemplo, en Art. II y Art. V.

### Hallazgo 1.4 — Dependencia externa no resuelta en este lote
Art. IV cita "GR-16" sin definirlo en los 3 documentos revisados. Probablemente vive en PROTOCOLO-FLOTA o SISTEMA-MEMORIA-PERSISTENTE (no incluidos en esta tarea). No es un error del documento, pero el Art. IV mismo exige "evidencia reproducible" — una regla citada sin ruta canónica local no es reproducible para un auditor nuevo. Sugiero añadir la ruta del documento fuente de GR-16 directamente en el artículo.

**VEREDICTO: CON-CAMBIOS.** Los 9 artículos están bien intencionados y en su mayoría son verificables, pero el Art. VIII tal como está redactado permite exactamente la auto-aprobación de IA que el Art. V prohíbe (1.1). Esto debe corregirse antes de que el documento pueda llamarse "vinculante" sin ambigüedad — es una contradicción interna, no una preferencia de estilo.

---

## 2. 00_CONCILIACION_MAESTRA_IC360_V1.md

### Hallazgo 2.1 — Rango de IDs de workflow sin aclarar (§3.1)
*"17 definiciones registradas (wf-042…wf-077)"*. El rango wf-042 a wf-077 abarca 36 IDs posibles; solo 17 están registrados. Puede ser numeración dispersa intencional (IDs reservados/retirados), pero el documento no lo aclara, y Art. IV de la Constitución exige que todo claim de estado sea reproducible sin ambigüedad. Recomiendo una nota: "IDs no contiguos por [razón]" o listar los 17 IDs reales en vez de solo el rango.

### Hallazgo 2.2 — Conteo de gates de CI inconsistente con la propia Constitución (§3.1 vs Constitución)
§3.1 dice *"CI: 3 jobs, 5 gates mecánicos, gitleaks, SBOM"*. Pero la Tabla de Enforcement de la Constitución implica al menos 7 checks mecánicos distintos: `bundle-budget`, `FinOps guards`, `audit:tenant-isolation`, `audit:no-hardcoded-tenant`, `validateSprintLedger.mjs`, tests de hard gates (fixture inválido), `audit:industrial-data`. Si "5 gates mecánicos" es un subconjunto o una agrupación distinta, el documento no lo explicita — y esto es justo el tipo de afirmación que Art. IV (Evidencia o no existe) obliga a respaldar con comando reproducible, no con una cifra suelta.
**Corrección sugerida:** listar los 5 gates por nombre en §3.1, o corregir la cifra a 7 si corresponde.

### Hallazgo 2.3 — Inconsistencia de autoría entre §5 y §7 para el TRD (E4)
§5 (tabla de artefactos) asigna el borrador de **TRD_IC360_V1** a *"Codex/Open Code"*. §7 (Asignación de Flota) solo asigna borrador de TRD a **Codex**, y a **Open Code** le asigna una tarea distinta (script NORMGRAPH + INVENTARIO_CORPUS_NORMATIVO). Ninguna fila de §7 bajo Open Code menciona el TRD. Es una inconsistencia menor pero real de "quién entrega qué" — el mismo tipo de ambigüedad que §7 dice resolver ("sin ambigüedad").
**Corrección sugerida:** quitar "Open Code" de la columna Autor de E4 en §5, o añadir la tarea TRD explícitamente a la fila de Open Code en §7.

### Nota positiva
§9 (Pendientes de Validación) es un buen ejemplo de cumplimiento del Art. VIII: el propio documento se autolimita y marca sus afirmaciones no verificadas en vez de darlas por ciertas (baseline de tests, fallback PROJ-CARDON-AMUAY, anexos IR-S-04, etc.). Esto es coherente con la Constitución y no requiere cambios.

**VEREDICTO: CON-CAMBIOS.** El documento es honesto y bien estructurado (cumple el espíritu del Art. VIII), pero tiene un desajuste numérico verificable (2.2) y una inconsistencia de asignación de responsable (2.3) que deben corregirse para que "ordena todo lo que no estaba ordenado" (su propio propósito declarado) sea cierto también en sus propias tablas.

---

## 3. PLANTILLA-PLAN-IC360-V1.md

### Hallazgo 3.1 — Gate V (HITL) no tiene dónde vivir en la plantilla
La tabla de gates dice: *"V HITL | §6 declara gates y firmas humanas"*. Pero el contenido real de §6 ("DATA MODEL + HARD GATES") solo pide: *"Esquemas Zod... Gates: regla, tipo BLOCK/WARNING, test asociado"*. No hay ningún campo para "firmas humanas". Un ejecutor puede marcar ☐→☑ el gate V sin que exista ningún texto en el documento sobre quién firma humanamente. Esto vuelve el gate V **no ejecutable tal como está estructurado**.
**Corrección sugerida:** o se agrega un campo "Firma humana requerida: [rol/persona]" dentro de §6, o el gate V debería apuntar a §9 (Capa 3 — Founder), que sí es donde vive la validación humana.

### Hallazgo 3.2 — Gate VIII (Validación) no tiene sección dedicada
Los otros 8 gates apuntan cada uno a una sección numerada específica (§3, §4, §5, §6, §7, §8, §9). El gate VIII dice solo: *"0 afirmaciones normativas sin marcar"* — sin apuntar a ninguna sección. El auditor tendría que releer todo el plan buscando afirmaciones normativas sueltas, en vez de revisar un solo lugar. Rompe el patrón consistente que sí siguen los otros 8 gates.
**Corrección sugerida:** añadir un subcampo dentro de §6 (o una nueva §6.1 "Afirmaciones Normativas y ESTADO_VALIDACIÓN") donde se listen explícitamente las normas/porcentajes/plazos citados y su estado, replicando la columna ESTADO_VALIDACIÓN del Art. VIII.

### Hallazgo 3.3 — Dependencia externa no verificable en este lote
El encabezado dice *"Spec origen: ... (debe estar CLARIFICADO o APROBADO-FOUNDER)"*. Estos dos estados de spec no se definen en los 3 documentos de esta revisión (probablemente en PLANTILLA-SPEC-IC360-V1.md, no incluida). No es un defecto de este archivo, pero no puedo certificar consistencia de esos términos sin leer esa plantilla — lo marco como pendiente, no como error.

**VEREDICTO: CON-CAMBIOS.** La estructura de gates 0-10 es una buena idea y 7 de 9 filas mapean limpiamente a una sección del plan. Pero las filas V y VIII tienen huecos estructurales (3.1, 3.2) que permiten marcar el checkbox sin que el contenido exigido exista en ningún lugar del documento — esto es precisamente el tipo de gate "no ejecutable" que la tarea me pidió detectar.

---

## RESUMEN DE VEREDICTOS

| Documento | Veredicto |
|---|---|
| CONSTITUCION-IC360-V1.md | **CON-CAMBIOS** — Art. VIII permite auto-aprobación de IA (contradice Art. V) |
| 00_CONCILIACION_MAESTRA_IC360_V1.md | **CON-CAMBIOS** — desajuste numérico (§3.1 gates CI) + inconsistencia de autoría TRD (§5 vs §7) |
| PLANTILLA-PLAN-IC360-V1.md | **CON-CAMBIOS** — gates V y VIII no tienen sección donde ejecutarse |

Ninguno de los tres es RECHAZADO: los tres son sólidos en su diseño general y ninguno de los hallazgos es estructuralmente irreparable — todos se corrigen con un ajuste de tabla o un campo nuevo, no con un rediseño. Pero ninguno llega a APROBADO porque cada uno tiene al menos un punto donde el propio documento permitiría, tal como está redactado hoy, que algo pase la revisión sin cumplir su propio espíritu (auto-aprobación de IA, cifra no verificable, o gate marcable sin contenido real).
