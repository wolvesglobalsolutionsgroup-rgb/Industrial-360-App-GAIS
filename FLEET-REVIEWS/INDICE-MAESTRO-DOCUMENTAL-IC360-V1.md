# 🗂️ INDICE-MAESTRO-DOCUMENTAL-IC360-V1 — Registro Único de Documentos del Proyecto
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** CANÓNICO
**Regla suprema:** NINGÚN documento existe oficialmente si no está registrado aquí.
Este índice previene la creación de documentos "a diestra y siniestra": todo documento
nace aquí primero (como REGISTRADO) antes de escribirse.

---

## 1. CICLO DE VIDA DOCUMENTAL

```
REGISTRADO (en este índice) → BORRADOR → EN-REVISIÓN-FLOTA → DICTAMINADO (Orquestador)
→ APROBADO-FOUNDER → EN-REPO (commit por Antigravity, SHA verificado) → VIGENTE
```

**Revisión de flota obligatoria antes de EN-REPO:** cada documento es revisado/extendido
por el especialista correspondiente (Claude: rigor/seguridad · Qwen: estructura ·
Codex: factibilidad técnica · Antigravity: verdad del repo · NotebookLM: verdad de dominio).
Las extensiones llegan como PROPUESTAS, nunca como ediciones directas.

## 2. SERIE GOBERNANZA (`docs/governance/`)

| ID | Documento | Estado | Notas |
|---|---|---|---|
| 00 | CONCILIACION_MAESTRA_IC360_V1 | BORRADOR-ORQUESTADOR | Emitido 14-ago; pendiente revisión flota |
| 01 | ACK_ESTADO_ACTUAL_IC360_V1 | EN-REPO (con correcciones pendientes) | SHA fabricado corregir; baseline tests; path Doctrina |
| 02 | SPEC_DRIVEN_OPERATING_MODEL_V1 | BORRADOR-ORQUESTADOR | Scorecard 50D + modelo spec-driven |
| 03 | CATALOGO_FORMATOS_SOLDADURA_V1 | PENDIENTE-FLOTA (Antigravity) | Investigación existe en historial de chat |
| 04 | CATALOGO_FORMATOS_PTW_SHA_V2 | EN-REPO | V3 pendiente: columna ESTADO_VALIDACIÓN |
| 07 | SECUENCIA_LOGICA_PROCESO_PDVSA_V2 | EN-REPO | V3 pendiente: validaciones corpus |
| 08 | TIPOS_PROYECTOS_INTERVENCIONES_V1 | PENDIENTE-FLOTA (Qwen) | Insumo directo de Fase Cero |
| 09 | MARCO_LEGAL_CONTRATACION_V1 | PENDIENTE-FLOTA | Solo leyes verificables |
| 10 | DESPIECE_ATOMICO_PILOTOS_V1 | PENDIENTE | Tras Fase Cero |
| — | PLAN_DEFINITIVO_UNIFICADO (v1.2 en repo) | EN-REPO, DESACTUALIZADO | V3 pendiente (Tracks A/B/C) |
| — | SPRINT_LEDGER / SECURITY_DECISIONS / QA_CONFORMANCE_GATES / ORQUESTADOR-MEMORIA / AUDIT_PROTOCOL / TESTING_CI_POLICY / GOVERNANCE | EN-REPO | Verificados en listing 14-ago |
| — | DOCTRINA-PRUEBAS-EXCELENCIA-V1 | PATH DESCONOCIDO | Commit 12b5f25 la creó; NO está en docs/governance/; Antigravity localiza |
| — | LEGADO-NEXUS-MAPEO_V1 | PENDIENTE-ORQUESTADOR | Yo lo emito; Antigravity commitea |

## 3. SERIE SPEC-KIT PROPIO (`docs/spec-kit-ic360/`)

| Documento | Estado |
|---|---|
| CONSTITUCION-IC360-V1 (9 artículos + enforcement) | BORRADOR-ORQUESTADOR |
| PLANTILLA-SPEC-IC360-V1 | BORRADOR-ORQUESTADOR |
| PLANTILLA-PLAN-IC360-V1 | BORRADOR-ORQUESTADOR |
| PLANTILLA-TASKS-IC360-V1 | BORRADOR-ORQUESTADOR |
| PROTOCOLO-FLOTA-IC360-V1 | BORRADOR-ORQUESTADOR |

## 4. SERIE MANDO Y PROGRAMA (`docs/governance/`)

| Documento | Estado |
|---|---|
| MANDATO-CTO-ORQUESTADOR-IC360-V1 | BORRADOR-ORQUESTADOR |
| PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1 | BORRADOR-ORQUESTADOR |

## 5. SERIE OPERATIVA (nueva — esta ola)

| Documento | Estado | Propósito |
|---|---|---|
| INDICE-MAESTRO-DOCUMENTAL-V1 (este) | BORRADOR-ORQUESTADOR | Registro único anti-caos |
| FASE-CERO-DESCUBRIMIENTO-V1 | BORRADOR-ORQUESTADOR | 5 tipos → 2 pilotos → árbol de expertos → grafo de referencias |
| GUIA-EXPERTOS-NOTEBOOKLM-V1 | BORRADOR-ORQUESTADOR | Configuración de expertos + batería EXP-02 |
| PLAN-CIERRE-AUDITORIA-SPRINTS-V1 | BORRADOR-ORQUESTADOR | Pista A: sprints F-* con go/no-go |
| CELULA-INVESTIGACION-STACK-V1 | BORRADOR-ORQUESTADOR | Anti-defaults: investigación de librerías/stack |

## 6. SERIE INGENIERÍA (`docs/engineering/` — pendiente)

| Documento | Estado | Dueño |
|---|---|---|
| PRD_IC360_V1 | PENDIENTE | Qwen → Orquestador → Founder firma |
| TRD_IC360_V1 | PENDIENTE | Codex/Open Code → Orquestador |
| BACKEND_SCHEMA_ASBUILT_V1 | PENDIENTE | Antigravity (extracción mecánica) |
| UX_MAP_ASBUILT_V1 | PENDIENTE | Antigravity (incluye docs/design/ y docs/intake/) |
| REQUIREMENTS_PILOTOS_V1 | PENDIENTE | Orquestador + Antigravity (tras Fase Cero) |

## 7. SERIE EXPERTOS (`docs/expertos/` — pendiente)

| Documento | Estado | Dueño |
|---|---|---|
| REGISTRO-EXPERTOS.md | PENDIENTE | Antigravity (crear directorio) |
| Cartas EXP-01…EXP-XX | PENDIENTE | Según Fase Cero (no predefinir 12 a ciegas) |

## 8. DESCUBIERTOS SIN CATALOGAR (verificado 14-ago)

- `docs/design/` — directorio existente, contenido desconocido → Antigravity inventaria
- `docs/intake/` — directorio existente, contenido desconocido → Antigravity inventaria
- `docs/FICHA_TECNICA_FUNCIONALIDADES.md` — existente, no catalogado
- `docs/flujos/` — existente, no catalogado
- `docs/pilot/` — existente (PILOT_ACCEPTANCE citado por auditoría)

## 9. REGLAS DEL ÍNDICE

1. Todo documento nuevo se registra aquí ANTES de crearse (fila con estado REGISTRADO).
2. Numeración 00-10 reservada a dominio/formatos. Series con nombre para el resto.
3. Solo Antigravity (o quien el Founder designe) commitea a repo, con SHA verificado post-push.
4. Este índice se actualiza en el mismo commit que agrega/mueve/elimina un documento.
5. Re-emisión: el índice se re-publica con cada ACK mensual.
