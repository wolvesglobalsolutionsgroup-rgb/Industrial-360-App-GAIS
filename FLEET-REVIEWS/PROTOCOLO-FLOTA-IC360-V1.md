# 🐺 PROTOCOLO-FLOTA-IC360-V1 — Orquestación Multi-Agente Heterogénea
**Fecha:** 14-AGO-2026 · **Emite:** Orquestador IC360 · **Estatus:** Vinculante
**Ubicación canónica:** `docs/spec-kit-ic360/PROTOCOLO-FLOTA-IC360-V1.md`
**Formaliza la dimensión 48 del marco 50D.**

---

## 1. PRINCIPIOS DE LA FLOTA

1. **Nadie tiene la verdad única.** Ni el Orquestador. La verdad vive en: repo `main`,
   catálogos validados, evidencia reproducible. Los agentes aportan; la evidencia decide.
2. **Cada agente opera desde SUS herramientas reales** (MCPs, skills, CLI, deep research,
   acceso a disco, cuadernos NotebookLM). El Orquestador se apoya en esas capacidades;
   no las simula ni las bloquea.
3. **Construcción CON IA, no generación POR IA.** Prohibido lo genérico. Todo entregable
   cita fuente (formato, corpus, repo o web verificable).
4. **Cualquier agente puede proponer.** Formato de propuesta: Problema → Evidencia →
   Opciones → Recomendación. El Orquestador dictamina coherencia; el Founder veta.
5. **GAIS es el desarrollador de código hasta 90/100.** Todo trabajo de análisis, diseño
   o investigación de la flota termina empaquetado como **prompt GAIS-ready** (ver §4).

---

## 2. MATRIZ DE CAPACIDADES REALES

| Agente | Modelo | Terminal/CLI | MCPs/Skills | Disco local | Rol canónico |
|---|---|---|---|---|---|
| **Antigravity** | Gemini 3.7 Flash | ✅ | ✅ | ✅ | Documental + repo + ejecución local + commits + custodia de evidencias |
| **Codex** | GPT 5.6 Luna | ✅ | ✅ | ✅ | Código pesado local, prototipos en rama, TRD |
| **Open Code** | GLM 5.2 + NVIDIA NIM | ✅ | ✅ | ✅ | Código económico, scripts de minería de corpus |
| **Qwen** | 3.8 Max | ✅ | ✅ | ✅ | Estructura, reglas, taxonomías, gobernanza |
| **Minimax** | M3 Max | ✅ | ✅ | ✅ | Datos de prueba, fixtures, soporte masivo |
| **Claude** | Sonnet 5 | ✅ | ✅ | ✅ | Auditor externo de PRs (checklist mecánico, inmutable) |
| **GAIS** | Gemini 3.7 Flash | ❌ | ❌ | ❌ | **Desarrollador principal de código** (vibe coding con prompts cerrados) |
| **Perplexity** | Orquestador | ❌ | web + GitHub metadata | ❌ | Orquestación, normas internacionales, coherencia 50D, memoria versionada, dictámenes |
| **NotebookLM** | Gemini | ❌ | RAG cuadernos | corpus | Experto de dominio por cuaderno (contrataciones activo, 142 fuentes) |
| **Founder** | Humano | ✅ | todo | ✅ | Gate único de cierre, verdad de campo, veto constitucional |

**Lo que NADIE hace:** inferir/modificar código de producción fuera de GAIS hasta 90/100
(excepción: scripts de tooling/auditoría local que no tocan `src/` de producto, y prototipos
en rama feature que GAIS re-implementa o que pasan por las 4 capas completas).

---

## 3. CADENA DE CUSTODIA DEL TRABAJO

```
PROPUESTA (cualquier agente, con evidencia)
   → DICTAMEN Orquestador (coherencia 50D, normas, prioridad)
   → VETO/APROBACIÓN Founder (si toca constitución, costo o kernel)
   → SPEC (plantilla V1: formato origen + proceso humano)
   → PLAN (gates constitucionales) → TASKS (orden doctrina)
   → PROMPT GAIS-READY (§4) → CÓDIGO en rama
   → CI verde (Antigravity ejecuta local + Actions)
   → AUDITORÍA Claude (checklist mecánico)
   → GATE Founder (funcional/visual)
   → MERGE HUMANO → SPRINT_LEDGER (SHA literal)
```

**Verificación post-push contra GitHub API, nunca contra el reporte del agente**
(Antigravity confirma SHA en remoto tras cada push).

---

## 4. REGLA DE ORO: TODO TERMINA EN PROMPT GAIS-READY

Todo análisis, diseño, investigación o spec producido por la flota se entrega en dos piezas:

1. **El prompt ejecutable para GAIS**, con esta estructura mínima:
   ```
   CONTEXTO: [rol + restricción $0 + SHA base]
   LECTURA OBLIGATORIA: [archivos exactos del repo]
   TAREA: [numerada, con archivos exactos a crear/modificar]
   PROHIBICIONES: [rutas protegidas, patrones vedados]
   CRITERIOS DE ACEPTACIÓN: [comandos + salida esperada + TEST_BASELINE]
   ENTREGA: [SHA inicial/final, evidencias, PR sin merge]
   ```
2. **Los adjuntos de contexto** (spec.md, plan.md, tasks.md, extractos de catálogo) en el
   formato SYNC_PACK vigente, para que GAIS nunca opere sin fuente.

Los prompts de la auditoría §4 (F-DATA-AUDIT, F-WF-LAZY, F-MT-FIX, F-E2E, F-GOV-CLOSE)
son el patrón de referencia ya aprobado.

---

## 5. MÉTODO DE INTERPRETACIÓN DE PROCESO HUMANO (para diseño de pantallas)

Las pantallas NO se diseñan desde supuestos ni desde escepticismo. Se derivan así:

1. **Fuente normativa:** el documento real del corpus local o cuaderno NotebookLM
   (ej. IR-S-04 completo, 71 págs). Antigravity/Qwen extraen; NotebookLM responde como
   experto del cuaderno; Orquestador valida normas internacionales vía web.
2. **Narrativa del proceso humano:** quién ejecuta, dónde (sol, guantes, sin señal),
   con qué herramienta hoy (planilla autocopiante, radio), qué presión sufre, y qué
   consecuencia tiene cada error (rechazo de valuación, riesgo de vida, bloqueo SAP).
3. **Cadena formato→dato→decisión:** qué captura el humano, dónde lo asienta, qué
   habilita o bloquea ese dato aguas abajo.
4. **Screen-spec:** la pantalla replica la estructura lógica de la planilla física
   (el usuario de campo debe reconocer su formato). Se documenta en spec §2 y §7.
5. **Validación de campo del Founder:** él ha estado en el frente; su gate visual
   confirma que la pantalla ES el proceso, no una fantasía de dashboard.

**Regla:** ninguna pantalla de módulo regulado entra a TASKS sin su narrativa de proceso
humano documentada con fuente marcada (corpus pág.X / cuaderno / Founder).

---

## 6. REGISTRO DE PROHIBICIONES POR AGENTE

- **GAIS:** no toca `docs/governance/` ni `docs/spec-kit-ic360/` (solo las lee); no hace
  merge; no declara terminado sin evidencia; no modifica workflows protegidos.
- **Antigravity/Codex/Open Code/Qwen/Minimax:** no modifican `src/` de producto en main;
  trabajan en rama o en tooling; no commitean sin SHA verificado post-push.
- **Claude:** no aprueba con juicio subjetivo; solo checklist mecánico; no edita código.
- **Orquestador (Perplexity):** no escribe código de producción; no afirma sin fuente;
  no bloquea propuestas sin dictamen fundamentado.
- **Todos:** prohibido secretos en texto plano en cualquier artefacto (lección
  INCIDENT-2026-08-14). Prohibido SHAs de memoria (GR-16).

---

## 7. RITUALES

- **SYNC_PACK:** paquete de contexto para GAIS, espejado en `docs/sync/` (manifiesto con
  conteo y SHA). Se actualiza cuando cambia un doc canónico.
- **ACK mensual:** 01_ACK se re-emite con HEAD real, TEST_BASELINE y scorecard 50D.
- **Conciliación trimestral:** doc 00 se revisa (V2, V3...).
- **Alerta roja de custodia:** si un agente detecta que otro borró/corrompió docs
  canónicos, lo reporta de inmediato y Antigravity auto-restaura desde Git.
