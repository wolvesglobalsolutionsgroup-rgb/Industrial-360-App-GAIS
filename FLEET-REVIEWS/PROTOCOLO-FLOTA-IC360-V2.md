# 🐺 PROTOCOLO-FLOTA-IC360-V2 — Orquestación Multi-Agente Heterogénea
**Versión:** V2 (conciliada). **Cambios V1→V2:** +Gemini Spark y Open Code en matriz con capacidades VERIFICADAS por censo (Spark) · +sub-bucle de rechazo/retrabajo en cadena de custodia (Spark) · +apertura física de PR = Antigravity o Founder (Spark) · +rebase obligatorio antes de auditoría (Spark) · +modelos reales autodeclarados.
**Ubicación canónica:** `docs/spec-kit-ic360/PROTOCOLO-FLOTA-IC360-V2.md`

---

## 1. PRINCIPIOS
1. Nadie tiene la verdad única (ni el Orquestador). La verdad vive en: repo main, catálogos validados, evidencia reproducible.
2. Cada agente opera desde SUS herramientas reales. El Orquestador se apoya en ellas, no las simula.
3. Construcción CON IA. Prohibido lo genérico. Todo cita fuente.
4. Cualquier agente propone (Problema→Evidencia→Opciones→Recomendación). Orquestador dictamina; Founder veta.
5. GAIS es el desarrollador de código hasta 90/100. Todo análisis termina en prompt GAIS-ready (§4).

## 2. MATRIZ DE CAPACIDADES (V2 — verificada por censo 14-ago)

| Miembro | Modelo real (autodeclarado) | Herramientas verificadas | Fortaleza #1 | No puede |
|---|---|---|---|---|
| **Antigravity** | Gemini 2.5 Pro | CLI total, Python 3.14, Node 24.15, uv, Git, **NotebookLM MCP v2.0.0**, Context7, corpus local | Ejecución determinista + custodia Git | Interacción visual (delega Playwright/CDP) |
| **Claude** | Sonnet 5 | Windows-MCP (control total PC), contenedor Linux, web search/fetch, GitHub read | Consistencia lógica de docs largos | Sin Drive/NotebookLM; sin memoria entre turnos |
| **Codex** | GPT 5.6 (Luna) | Ejecutó lint/build/tests en vivo en el repo | Prueba empírica directa del código | (censo §D de su informe) |
| **Qwen** | Qwen3-Max (qwen3-max-preview) | Filesystem, web search, Python sandbox, GitHub | Análisis estructural + contradicciones | Sin CLI, sin NotebookLM/Drive, sin memoria |
| **Minimax (Mavis)** | MiniMax-M3 | 5 CLIs, 5 MCPs (playwright, github...), 6 sub-agentes, web search | Paralelismo masivo + verificación web viva | Sin NotebookLM/Drive directo; 16K tokens salida |
| **Gemini Spark** | Gemini (Spark) | **GitHub MCP read+write (probado en remoto, commit e0da4d9)**, Drive/Docs/Sheets/Gmail, filesystem MCP, bash sandbox | Auditoría con evidencia API + commit directo | Disco acotado a perímetro MCP; sin merge a main |
| **Open Code** | z-ai/GLM-5.2 | PowerShell, Python 3.14.4, **stack PDF/OCR completo (PyMuPDF, pdfplumber, pytesseract, easyocr, ocrmypdf)**, networkx, pandas, GitHub MCP | Minería de PDF a escala (inventario <25 min) | Timeout 120s/corrida, sin GPU confirmada |
| **GAIS** | Gemini 3.7 Flash | ❌ terminal persistente no verificada | **Desarrollador principal de código** | Sin CLI; solo workspace local |
| **NotebookLM** | Gemini (2.0) | RAG cuadernos, Deep Research, Data Tables, ejecución código | Experto de dominio por cuaderno | Solo con sus fuentes |
| **Founder** | Humano | todo | Gate único, verdad de campo, veto constitucional | — |
| **Orquestador (Perplexity)** | Kimi K3 | web + GitHub metadata | Orquestación, normas internacionales, coherencia 50D, memoria versionada | No ejecuta código; no lee contenido vía GitHub (solo metadatos) |

## 3. CADENA DE CUSTODIA (V2 — con sub-bucle de rechazo)

```
PROPUESTA (cualquier agente, con evidencia)
 → DICTAMEN Orquestador → VETO/APROBACIÓN Founder (si toca constitución/costo/kernel)
 → SPEC → PLAN → TASKS → PROMPT GAIS-READY → CÓDIGO en rama sprint/*
 → [REBASE a origin/main obligatorio] → CI verde (Antigravity)
 → AUDITORÍA Claude (checklist mecánico)
 → GATE Founder (funcional/visual)
 → MERGE HUMANO → SPRINT_LEDGER (SHA literal)

SUB-BUCLE DE RECHAZO (V2 — Spark):
Si Claude (Capa 2) o Founder (Capa 3) RECHAZAN:
 → se emite ticket de ajuste con la regla exacta violada (tabla+fila)
 → se re-empaqueta prompt correctivo a GAIS
 → re-CI + re-auditoría
 → TODO queda trazado en SPRINT_LEDGER (el rechazo NO borra el rastro; lo documenta)
```

**Apertura física de PRs (V2):** GAIS no tiene CLI/GitHub autónomo. La creación de la rama,
aplicación del parche y apertura del PR la hace **Antigravity o el Founder**. GAIS produce
código en su workspace; Antigravity lo materializa en rama.

**Verificación post-push contra GitHub API, nunca contra el reporte del agente.**

## 4. REGLA DE ORO: TODO TERMINA EN PROMPT GAIS-READY
Todo análisis/diseño/spec de la flota se entrega en dos piezas:
1. **Prompt ejecutable para GAIS** con: CONTEXTO (rol + $0 + SHA base) · LECTURA OBLIGATORIA ·
   TAREA (numerada, archivos exactos) · PROHIBICIONES · CRITERIOS DE ACEPTACIÓN (comandos +
   salida esperada + TEST_BASELINE) · ENTREGA (SHA inicial/final, evidencias, PR sin merge).
2. **Adjuntos de contexto** (spec/plan/tasks/extractos) vía SYNC_PACK vigente.

**PROTOCOLO GAIS-SAFE-PUSH (obligatorio en todo prompt):** git status con 0 borrados ·
git diff --stat origin/main sin eliminaciones ajenas · si hay borrados en docs//.github//scripts/
que no son de tu tarea → ABORTA y reporta · todo commit GAIS contiene SOLO los archivos de
su tarea · Antigravity verifica post-push que el conteo de archivos no disminuyó.

## 5. MÉTODO DE INTERPRETACIÓN DE PROCESO HUMANO (para pantallas)
1. Fuente normativa (corpus/cuaderno NotebookLM) → 2. Narrativa del proceso humano (actor,
lugar, herramienta, presión, consecuencia del error) → 3. Cadena formato→dato→decisión →
4. Screen-spec (la pantalla replica la planilla física) → 5. Validación de campo del Founder.
**Regla:** ninguna pantalla de módulo regulado entra a TASKS sin su narrativa con fuente marcada.

## 6. PROHIBICIONES POR AGENTE
- **GAIS:** no toca docs/governance/ ni docs/spec-kit-ic360/ · no mergea · no declara terminado sin evidencia · no modifica workflows protegidos · NUNCA toca la rama fleet/workspace · opera SOLO en sprint/*.
- **Antigravity/Codex/Open Code/Qwen/Minimax:** no modifican src/ de producto en main · trabajan en rama o tooling · no commitean sin SHA verificado post-push.
- **Claude:** no aprueba con juicio subjetivo (solo checklist mecánico) · no edita código.
- **Orquestador:** no escribe código de producción · no afirma sin fuente · no bloquea propuestas sin dictamen fundamentado.
- **Todos:** prohibido secretos en texto plano (lección INCIDENT-2026-08-14) · prohibido SHAs/hashes de memoria (GR-16).

## 7. RITUALES
- **SYNC_PACK:** espejo en docs/sync/; se regenera tras cada cambio en docs canónicos.
- **ACK mensual:** 01_ACK con HEAD real, TEST_BASELINE, scorecard 50D.
- **Conciliación trimestral:** doc 00 se revisa.
- **Alerta roja de custodia:** si un agente detecta que otro borró/corrompió docs canónicos → reporta de inmediato y Antigravity auto-restaura desde Git.
- **GUARDAR MEMORIA:** ritual del sistema de memoria persistente del Orquestador.
