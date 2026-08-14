# 🧭 00_CONCILIACION_MAESTRA_IC360_V1.md — DOCUMENTO DE CONCILIACIÓN Y ORDENAMIENTO TOTAL
**Fecha de Emisión:** 14 de Agosto, 2026
**Autor:** Orquestador IC360 (Perplexity) — rol: memoria versionada + coherencia 50 dimensiones + normas internacionales
**Estatus:** CANÓNICO. Puerta de entrada del proyecto (anterior a 01_ACK). Salvo veto del Founder.
**Repositorio Oficial:** `Industrial-360-App-GAIS` (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS.git`)

---

## 1. PROPÓSITO

Este documento ordena todo lo que no estaba ordenado. Concilia cinco fuentes de verdad que
hoy coexisten sin reconciliación formal:

1. **El legado NEXUS (2024-2025):** visión design-first (I-OS, 12 agentes, blueprints, workspace,
   toolkit, Academy, 120+ automatizaciones con pricing) que nunca se construyó.
2. **El repo IC360 (2026):** código code-first construido sin PRD/TRD/schema formal, hoy con
   arquitectura 95/100 pero 0 workflows con E2E certificado y ~30 páginas legacy sin migrar.
3. **Los documentos de gobernanza (13-14 ago 2026):** 01_ACK, 04_CATALOGO_PTW_SHA_V2,
   07_SECUENCIA_PDVSA_V2, Doctrina F-QA-EXCELLENCE, Plan Unificado v1.2 (desactualizado).
4. **La auditoría 75/100 (14-ago-2026):** matriz de brechas y 5 sprints F-* pendientes.
5. **El corpus normativo local:** 5,119 PDFs + cuadernos NotebookLM (contrataciones activo, 142 fuentes).

**Regla suprema (heredada del método rector):** FORMATOS PRIMERO, IA DESPUÉS. Nada en este
documento deriva de conceptos genéricos; todo parte del inventario de formatos reales PDVSA
y del estado verificable del repo. Lo no verificable se marca **PENDIENTE DE VALIDACIÓN**.

---

## 2. LAS DOS ERAS — LECCIÓN CANÓNICA

| Era | Método | Resultado | Lección |
|---|---|---|---|
| **NEXUS 2024** | Design-first: pantallas, I-OS, agentes, pricing — todo especificado, nada construido | Documentos brillantes, 0 software | El diseño sin ejecución es ficción |
| **IC360 2026** | Code-first: codificar y organizar en el camino, sin PRD/TRD/schema | Software real, pero "cascarón" (48/100 en workflows reales) y deuda de conciliación | La ejecución sin documentos de ingeniería acumula deuda de sentido |

**Síntesis canónica (la tercera vía):** el dominio se documenta ANTES (catálogos de formatos
03/04/07/08/09/10 — eso ya está en marcha) y la ingeniería se documenta DESPUÉS DE CONSTRUIR
pero ANTES DE ESCALAR (PRD/TRD/schema retroactivos — eso es lo que este plan crea).
Un sistema de 50 años no necesita profecía perfecta; necesita **conciliación continua
versionada**. Este documento es la primera conciliación; habrá una por trimestre.

---

## 3. ESTADO REAL CONCILIADO (fotografía única, sin contradicciones)

### 3.1. Software (fuente: repo, HEAD `0c60953`, verificado 14-ago-2026)
- Kernel de workflows operativo: 17 definiciones registradas (wf-042…wf-077), 0 con E2E certificado.
- ~45 páginas en `src/pages/`; ~30 legacy sin migrar al Kernel (Olas 5-10 pendientes).
- Motor de exportación multiformato consolidado (jsPDF único punto de import).
- Multi-tenancy forzado en `baseRepo.ts` (orgId/projectId obligatorios). Fallback
  `PROJ-CARDON-AMUAY` reportado por auditoría = **NO CONFIRMADO** (búsqueda GitHub: 0
  ocurrencias; pendiente grep local — orden O-PERP-01, E1).
- CI: 3 jobs, 5 gates mecánicos, gitleaks, SBOM. Tests: baseline contradictorio
  (417 vs 459 vs 505/508) → **TEST_BASELINE por fijar** (O-PERP-01, Bloque 1.2).
- FinOps: quotaPolicy + guards conectados a exportDocument y baseRepo; alertas cliente
  volátiles (pendiente persistencia).
- Acceso fundador QA: scripts de provisionamiento existen (`founder-qa-bootstrap.ts` et al.).
- Preview por PR (S14.2B): **NO evidenciado** (falta `docs/runbooks/PREVIEW_SETUP.md`).
  Decisión del Founder pendiente: construirlo o derogarlo.

### 3.2. Dominio / Formatos (fuente: docs governance + corpus local)
- 04_V2: 22 formatos PTW+SHA catalogados con estructura física, dependencias y 6 plantillas
  canónicas. Normas internacionales verificadas vía web; anexos PDVSA IR-S-04 **PENDIENTE
  DE VALIDACIÓN contra corpus local** (`PDVSA_IR-S-04_FULL_CONVERTED.md`, 71 págs).
- 07_V2: secuencia Fases 0-5 completa (adjudicación → cobro → 3 Carpetas ARCHE), con motor
  de parámetros configurables (nada hardcodeado) y lista maestra de puntos de rechazo.
- Pendientes: 03 (soldadura), 08 (tipos de proyecto), 09 (marco legal/contratación),
  10 (despiece atómico pilotos: Emergencia Operacional + Tendido de Tubería).

### 3.3. Legado NEXUS (fuente: Drive del Founder, acceso exclusivo del Orquestador)
- Rescatable: modelo de workspace por proyecto (00_ADMINISTRACION→10_ENTREGABLES),
  catálogo de 120+ automatizaciones con pricing por módulo, Toolkit de calculadoras de
  campo offline, Academy (aprender-haciendo con cita normativa), catálogo de errores/fallas.
- Descartado (inmutable): stack Supabase/Pinecone/Prisma/Next.js/Inngest; NEXUS Mini (n8n
  generator); monorepo factory/runtime; Learning Engine auto-evolutivo sin aprobación humana.
- El mapeo completo idea-2024 ↔ artefacto-2026 lo emite el Orquestador como
  `docs/governance/LEGADO-NEXUS-MAPEO-V1.md` (Antigravity solo commitea; los documentos
  crudos del legado NO entran al repo ni al SYNC_PACK).

### 3.4. Seguridad (incidente activo)
- Archivo legacy de recursos contiene secretos en texto plano (Drive únicamente; nunca en
  GitHub). Acción P0: rotación de llaves por el Founder + sanitización del archivo +
  gitleaks sobre disco completo. Ref: orden O-PERP-02, Tarea A (alcance corregido:
  sin purga de historial, no aplica).

---

## 4. TESIS AI-NATIVA — POR QUÉ IC360 NO MUERE POR LA IA

**Principio:** los modelos de IA commoditizan el razonamiento. No pueden commoditizar:

1. **Corpus normativo verificado** — 5,119 PDFs con hash, dominio y validación de anexos
   contra fuente. Cualquier LLM puede "hablar de" API 1104; solo IC360 sabe qué edición
   del IR-S-04 aplica, con página citada, en la filial específica.
2. **Evidencia con valor legal** — sellos SHA-256 sobre bytes finales, audit log
   append-only con cadena hash, dossier reproducible. La IA genera texto; IC360 genera
   *prueba*.
3. **El canon de formatos** — 22 formatos PTW+SHA (y los ~100 que vendrán) como contratos
   Zod + hard gates. La IA llena formularios; IC360 decide si el formulario es válido.
4. **Datos de campo multi-tenant con offline real** — el dato nace en campo sin señal y
   llega íntegro. Eso no lo hace un chatbot.

**Arquitectura AI-nativa (4 fases):**

| Fase | Qué | Estado |
|---|---|---|
| **AI-1** | Perímetro IA con quota (`geminiProxy` + `guardIaInvocation`) | ✅ Existe |
| **AI-2** | **Tool Registry interno:** cada hard gate, exportador, calculadora (Toolkit NEXUS rescatado) y repositorio se expone como función tipada y cuotificada, llamable por agentes (BOTs) | 📋 A diseñar en TRD |
| **AI-3** | **MCP Server `ic360-mcp` (read-only primero):** agentes externos (Claude, GPT, Gemini, n8n) consultan estado de PTW, dossier, catálogo de formatos, cómputos — con service account + quota + audit log | 📋 Roadmap Fase 2 |
| **AI-4** | **Conectores externos entrantes:** SAP (estatus HES), Primavera P6 (.xer), NotebookLM (export de cuadernos → corpus), Telegram/WhatsApp (ingesta de campo) | 📋 Roadmap Fase 2-3 |

**Regla inmutable AI-nativa:** ningún agente (interno o externo) escribe en IC360 sin pasar
por el autorizador server-side (S14.2) + hard gates del workflow + audit log + quota FinOps.
La IA propone; el sistema valida; el humano firma.

---

## 5. LOS ARTEFACTOS DE INGENIERÍA FALTANTES (construcción retroactiva)

IC360 se construyó sin PRD, TRD, backend schema, mapa UX ni documento de requerimientos.
No se reconstruye el pasado: se **extrae del presente**. Cada artefacto nace como
"as-built" (lo que el repo realmente es hoy) y crece como "to-be" (lo que los catálogos
de formatos exigen).

| # | Artefacto | Contenido | Autor | Insumo | Destino repo |
|---|---|---|---|---|---|
| E1 | **PRD_IC360_V1** | Qué es IC360, para quién (contratistas PDVSA), qué NO es; alcance piloto (Emergencia + Pipeline); criterios de éxito medibles | Qwen (borrador) → Orquestador (dictamen) → Founder (firma) | 07_V2, 04_V2, este doc | `docs/engineering/PRD_IC360_V1.md` |
| E2 | **BACKEND_SCHEMA_ASBUILT_V1** | Inventario REAL de colecciones Firestore, Functions, Rules, Storage paths — extraído del repo, 0 invención | Antigravity (extracción mecánica) | repo | `docs/engineering/BACKEND_SCHEMA_ASBUILT_V1.md` |
| E3 | **UX_MAP_ASBUILT_V1** | Inventario de las ~45 páginas: ruta, tamaño, estado (Kernel/legacy), ola asignada, destino | Antigravity | repo + MIGRATION_WAVES | `docs/engineering/UX_MAP_ASBUILT_V1.md` |
| E4 | **TRD_IC360_V1** | Arquitectura as-built (Kernel, exporters, offline, FinOps, CI) + ADRs existentes + diseño to-be del Tool Registry (AI-2) | Codex/Open Code (borrador) → Orquestador (coherencia) | repo + ADRs + este doc §4 | `docs/engineering/TRD_IC360_V1.md` |
| E5 | **REQUIREMENTS_PILOTOS_V1** | Requisitos funcionales de los 2 pilotos, derivados 1:1 de los formatos (03/04/07/10). Cada requisito cita su formato origen | Orquestador + Antigravity | 03, 04_V2, 07_V2, 10 | `docs/engineering/REQUIREMENTS_PILOTOS_V1.md` |

**Regla de vida de los artefactos:** todo PR que toque schema, rutas o arquitectura debe
actualizar el artefacto correspondiente en el mismo PR. El auditor externo (Claude)
rechaza PRs que dejen artefactos desactualizados. Los artefactos "as-built" se regeneran
por extracción mecánica (script), no por memoria de ningún agente.

---

## 6. REGISTRO DOCUMENTAL CANÓNICO (numeración única)

**Serie governance/dominio (`docs/governance/`):**

| ID | Documento | Estado |
|---|---|---|
| 00 | CONCILIACION_MAESTRA_IC360 (este doc) | ✅ V1 emitida |
| 01 | ACK_ESTADO_ACTUAL | ✅ V1 (correcciones pendientes: SHA, baseline, path Doctrina) |
| 03 | CATALOGO_FORMATOS_SOLDADURA | 🔴 Pendiente (investigación existe en historial) |
| 04 | CATALOGO_FORMATOS_PTW_SHA | ✅ V2 (V3 con columna ESTADO_VALIDACIÓN) |
| 07 | SECUENCIA_LOGICA_PROCESO_PDVSA | ✅ V2 (V3 con validaciones) |
| 08 | TIPOS_PROYECTOS_INTERVENCIONES_PDVSA | 🔴 Pendiente (Qwen) |
| 09 | MARCO_LEGAL_CONTRATACION_PDVSA | 🔴 Pendiente |
| 10 | DESPIECE_ATOMICO_PROYECTOS_PILOTO | 🔴 Pendiente (tras 03+08+validación anexos) |
| — | LEGADO-NEXUS-MAPEO_V1 | 🔴 Pendiente (Orquestador) |
| — | PLAN_DEFINITIVO_UNIFICADO_V3 | 🔴 Pendiente (fusión Tracks A/B/C, remoto corregido) |

**Serie ingeniería (`docs/engineering/`):** PRD, TRD, BACKEND_SCHEMA_ASBUILT, UX_MAP_ASBUILT,
REQUIREMENTS_PILOTOS (tabla §5).

**Prohibido:** crear documentos fuera de este registro sin actualizar esta tabla en el
mismo commit.

---

## 7. ASIGNACIÓN DE FLOTA (quién hace qué, sin ambigüedad)

| Agente | Rol | Tareas activas |
|---|---|---|
| **Founder** | Gate humano único | Rotación de secretos (HOY), D-SEC-13 (GCP Console), decisión Preview por PR, firma de PRD |
| **Orquestador (Perplexity)** | Memoria versionada, coherencia 50D, normas internacionales | Este doc; LEGADO-NEXUS-MAPEO; dictámenes normativos; matriz DIM↔módulo↔workflow; revisión de dominio de PRs |
| **Antigravity** | Documental + repo + ejecución local | O-PERP-01 Bloques 1-2 (evidencias E1-E7); BACKEND_SCHEMA_ASBUILT; UX_MAP_ASBUILT; formalizar 03_SOLDADURA; commits |
| **Qwen** | Estructura y reglas | 08_TIPOS_PROYECTOS; registro unificado de gates (10 Doctrina vs 5 CI); borrador PRD |
| **Codex** | Código pesado local | Prototipo F-WF-LAZY en rama feature; borrador TRD |
| **Open Code** | Código económico | Script minería de referencias (NORMGRAPH); INVENTARIO_CORPUS_NORMATIVO (5,119 PDFs con SHA-256) |
| **Minimax** | Soporte de datos | Fixtures válido/inválido para los 17 workflows (insumo F-E2E) |
| **Claude** | Auditor externo de PRs | Checklist de rechazo mecánico (auditoría §5) + GR-16 (SHAs solo verificables) + artefactos E1-E5 actualizados |
| **GAIS** | Generación de código | Prompts F-DATA-AUDIT y F-WF-LAZY (listos en auditoría §4); F-MT-FIX bloqueado hasta E1 |

---

## 8. SECUENCIA DE 30 DÍAS (orden de ejecución con dependencias)

```
SEMANA 1 — EVIDENCIA Y CIMIENTOS
  Día 1 (HOY): Founder rota secretos · Antigravity ejecuta O-PERP-01 Bloque 1-2 (E1-E7)
  Día 2-3:   Go/No-Go F-MT-FIX (según E1) · TEST_BASELINE fijado · 01_ACK_V2 corregido
  Día 3-5:   Antigravity: 03_SOLDADURA formalizado + BACKEND_SCHEMA_ASBUILT_V1
             Open Code: INVENTARIO_CORPUS_NORMATIVO_V1 (hashes de 5,119 PDFs)

SEMANA 2 — DOMINIO
  Qwen: 08_TIPOS_PROYECTOS_V1 + registro unificado de gates
  Antigravity: validación de anexos IR-S-04 contra corpus (Bloque 3 O-PERP-01)
  Orquestador: LEGADO-NEXUS-MAPEO_V1 + dictamen normativo de 08
  Qwen+Orquestador: PRD_IC360_V1 (alcance piloto) → firma Founder

SEMANA 3 — PILOTOS Y CÓDIGO
  Antigravity: 10_DESPIECE_ATOMICO_PILOTO_V1 (Emergencia + Pipeline)
  GAIS: F-DATA-AUDIT + F-WF-LAZY (PRs, auditoría Claude, CI Antigravity)
  Antigravity: UX_MAP_ASBUILT_V1
  Orquestador: REQUIREMENTS_PILOTOS_V1 (con 03/04/07/10 como fuente)

SEMANA 4 — PRIMER WORKFLOW REAL CERTIFICADO
  GAIS+Codex: Ola 5 = QaQcWelding + IntegrityIli migrados con spec derivado de 03
  Minimax: fixtures listos → GAIS: F-E2E sobre pilotos (wf-042/043/044 primero)
  Codex: TRD_IC360_V1 (incluye diseño Tool Registry AI-2)
  Orquestador: PLAN_V3 emitido (Tracks A/B/C) · Founder: gate de cierre del mes
```

**Hito de fin de mes (definición de éxito):** 2 workflows pilotos con E2E verde en CI,
0 mocks en las páginas que los sirven, catálogo 03 formalizado, despiece 10 emitido,
PRD firmado, y el repo con baseline de tests/bundle verificado. Eso es "construir algo
único pero real desde el punto donde estamos".

---

## 9. PENDIENTES DE VALIDACIÓN (registro vivo)

1. Fallback `PROJ-CARDON-AMUAY`: pendiente grep local (E1). Mi búsqueda GitHub: 0 ocurrencias.
2. Anexos A-L de IR-S-04 y títulos exactos SI-S/HO-H/IR-S: pendiente corpus local.
3. "15 días de consignación", "Compromiso Social 3-5%", RASDA (denominación exacta MINEC),
   NT-01-2008 INPSASEL: pendiente corpus local / fuente legal.
4. TEST_BASELINE canónico (417 vs 459 vs 505/508): pendiente `vitest run` (E5).
5. Bundle real: pendiente `npm run build` (E4).
6. Path real de DOCTRINA-PRUEBAS-EXCELENCIA (commit 12b5f25): pendiente Antigravity.
7. Commit `139facc` citado en 01_ACK: pendiente verificación `git log --all`.
8. Preview por PR (S14.2B): pendiente decisión Founder (construir o derogar).

---

**FIN DEL DOCUMENTO DE CONCILIACIÓN V1.**
Próxima conciliación programada: al cierre del hito de Semana 4 (V2).
