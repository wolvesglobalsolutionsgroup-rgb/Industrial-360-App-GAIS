# 🔬 CELULA-INVESTIGACION-STACK-IC360-V2 — Protocolo Anti-Defaults para Stack y Librerías
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada)
**Cambios V1→V2:** (1) Stack base corregido al REAL del repo (Codex en vivo): React 19.2.8 · Vite 6.4.3 · TS 5.8.2 · Tailwind 4.3.3 · Zod 4.4.3 · Firebase 12. (2) Fichas concretas del lote AI-Native. (3) Registro maestro del arsenal (12 herramientas evaluadas). (4) Regla zero AGPL/GPL explícita.
**Problema que resuelve:** los LLMs usan las librerías de su entrenamiento, no las mejores/actuales. En IC360 ninguna decisión de stack sale del "default del modelo".

---

## 1. CUÁNDO SE ACTIVA (sin cambios)
Nueva dependencia · reemplazo de patrón · capacidad no presente · revisión del stack base en cada ACK mensual.

## 2. STACK BASE REAL (V2 — verificado por Codex ejecutando el repo, 14-ago)
**React 19.2.8 · Vite 6.4.3 · TypeScript 5.8.2 · Tailwind CSS 4.3.3 · Zod 4.4.3 ·
Firebase 12 · Express · Zustand · Dexie.js · jsPDF · docx · pptxgenjs · exceljs ·
DOMPurify · Vitest · Playwright · Semgrep · three / @react-three/fiber · leaflet ·
@turf/turf · tokml · recharts · Radix UI · cmdk · Lucide**
> ⚠️ NOTA V2: el 01_ACK citaba versiones viejas (React 18.3.1/Firebase 10.12.2/Zod 3.23.8).
> La evidencia en vivo gana. Toda investigación parte del stack REAL.

## 3. PROTOCOLO (sin cambios)
Codex+Antigravity investigan → Qwen robustez → Claude seguridad/licencias → Orquestador
dictamen web → Founder decide (ADR si hay costo).

## 4. FORMATO DE SALIDA: FICHA DE DECISIÓN (sin cambios — ver V1 §4)

## 5. FICHAS CONCRETAS DEL LOTE AI-NATIVE (V2 — pendientes de evaluación)

| Librería | Para qué | Evaluación pendiente |
|---|---|---|
| `zod-to-json-schema` | aiBridge: Zod→JSON Schema para Gemini | **¿Compatible con Zod 4.4.3?** (nació para Zod 3). Alternativas si no. P0 para el spec WF-043-AI |
| `@google/genai` | SDK Gemini | ✅ Aprobado SOLO server-side (functions/) — banderas #1/#17 |
| `recordrtc` vs MediaRecorder nativo | Captura de voz en campo | Verificar mantenimiento de recordrtc vs API nativa |
| `delaunator` | Triangulación TIN topografía | Bundle size, licencia, mantenimiento |
| `proj4js` | UTM↔cartesiano | Ídem |
| `cornerstone.js` / `dicom-parser` | Visor placas radiográficas DICONDE | **Pesados** — justificar >100KB (Art. II/ADR) |
| `html5-qrcode` | Escaneo QR de candados/MTR | Licencia, mantenimiento |
| `bignumber.js` | Aritmética exacta valuaciones | vs decimal.js / big.js — elegir uno |
| `pdf-lib` | Ensamblaje/foliado Data Book | vs jsPDF (ya instalado) — ¿duplicación? |
| `dagre` | Layout CPM/DAG | vs motor propio en TS |
| Open-Meteo API | Lluvia inhábil (auditoría meteo) | Tier gratis, límites, ficha formal |

## 6. REGISTRO MAESTRO DEL ARSENAL (V2 — 12 herramientas evaluadas 14-ago)

| # | Herramienta | Tipo | Veredicto | Instala / Uso |
|---|---|---|---|---|
| 1 | `notebooklm-mcp-cli` (nlm) | CLI+MCP | ✅ APROBADO | Antigravity/Codex/OpenCode — alimentación cuadernos |
| 2 | `book-to-skill` (virgiliojr94) | Skill gen | ✅ APROBADO | Antigravity — normas núcleo → skills (piloto IR-S-04) |
| 3 | `diagram-design` (cathrynlavery) | Skill | ✅ APROBADO | Claude/Codex — diagramas editoriales de docs (NO al producto) |
| 4 | `strix` (usestrix) | Pentest AI | ✅ APROBADO | Antigravity (CI semanal) — cierra S9 de Doctrina V2. ~$3-5/scan tokens |
| 5 | `fast-check` | Lib (fuzzing) | ✅ APROBADO | GAIS (sprint F-FUZZ) — Nivel 3 Doctrina V2 |
| 6 | `Stryker` | Lib (mutación) | ✅ APROBADO | GAIS (Oleada 2) — Nivel 12 Doctrina V2 |
| 7 | `OWASP ZAP` | DAST | ✅ APROBADO | Antigravity (CI nocturno) — S5 Doctrina V2 |
| 8 | `kage` (MengTo) | Referencia | 🟡 ESTUDIAR | Gemini Spark — estética landing pública. NO al codebase |
| 9 | `ToolJet` | Referencia | 🟡 ESTUDIAR | Codex — patrón connectorHub. **AGPL → NO entra al stack** |
| 10 | `spec-kit` (GitHub) | Patrón | 🟡 ABSORBIDO | — | Ya absorbido como kit propio (doc 02) |
| 11 | `watermarks-remover` (guillaumemeyer) | — | 🔴 RECHAZADO | — | Colisiona con Art. IV + doctrina de sellos/procedencia. La amenaza (Unicode invisible) se cubre con regla Semgrep de DETECCIÓN, no con un removedor |
| 12 | `jay-seol-labor/pdf-to-markdown-skill` | — | ⚠️ PENDIENTE | — | Repo inaccesible al verificar. Open Code cubre PDF→MD con su stack |

## 7. REGLAS DURAS (V2)
1. Dependencia >100 KB gz → ADR + justificación de bundle.
2. Prohibido duplicar capacidad existente (`npm ls` + grep primero — precedente jsPDF).
3. Toda ficha cita documentación oficial con fecha de consulta.
4. Investigación no concluyente → PENDIENTE DE VALIDACIÓN + usar stack base.
5. Fichas aprobadas → `docs/adr/` (cuando Antigravity lo cree).
6. **(V2) ZERO AGPL/GPL contaminante** en el stack de producto (lección ToolJet). Gate de licencias en CI (license-checker).
7. **(V2) Herramientas de desarrollo ≠ stack de producto.** Los repos de herramientas (nlm, strix, diagram-design) son para el equipo, no para la app; lo que vaya a la app se evalúa aparte por esta célula.
