# 🧠 MEMORIA-ORQUESTADOR — IC360
**Última actualización:** 14-AGO-2026 ~15:45 -04 · **SHA de este archivo:** [Antigravity al commitear]
**Chat origen:** Perplexity — sesión 14-ago-2026 · **HEAD main al guardar:** `3d8792b894e5929795d7b1cc0f2100be8fc2a08f` (restore Doctrina)

## A. ESTADO DEL PROYECTO (fotografía)
- Auditoría 14-ago: 75/100 ponderado. Arquitectura 95/100; Workflows reales 48/100; Datos legacy 55/100.
- TEST_BASELINE canónico: **512 tests (509 verdes; 3 timed-out por emulador Firestore 5000ms: qaDataset, prointecaPilot)** — deuda: subir timeout o cuarentenar.
- Bundle real: entrypoint **301.85 KB raw / 95.61 KB gz**; chunk workflows-kernel 753.83 KB raw / 192.63 KB gz (se carga en arranque por imports síncronos).
- Fallback `PROJ-CARDON-AMUAY` **CONFIRMADO** en baseRepo.ts (líneas 135/175/206/225) + seedDemoData + ProcurementInventory → **F-MT-FIX: GO**.
- Deuda PDF (createJsPdfInstance): 9 páginas, 18 invocaciones.
- Ledger: validador falla en F-OPS-REORDER-01 (estado "RECONCILED") y F-FINOPS-MEASURE (SHA "En desarrollo") → corrige en F-GOV-CLOSE.
- Doctrina F-QA-EXCELLENCE restaurada en main (commit 3d8792b).
- IR-S-04 convertido promovido a docs/references/ (SHA-256: 82951748dd6a4cc67a07694698746e39b5ab896b10003a649e62ff8b0675a9b4) — pendiente push.
- docs/design/ y docs/intake/ contienen la piedra fundacional UX/specs (DESIGN-LANGUAGE V1/V2, COMPETITIVE-ANALYSIS, PTW-SPLIT-VIEW-DESIGN-V1.1, paquetes intake de WF-043/044/046/052/053/074/075).
- Flota operando bajo: método rector (FORMATOS PRIMERO) + 4 capas de cierre + GAIS como desarrollador hasta 90/100.

## B. DECISIONES DEL FOUNDER VIGENTES
1. (14-ago) GAIS es el desarrollador de código hasta 90/100; los demás construyen/analizan y todo termina en prompt GAIS-ready + adjuntos.
2. (14-ago) NO se instala spec-kit de GitHub como dependencia; se absorbe como patrón → kit propio.
3. (14-ago) Expertos sintéticos se derivan de tipos de proyecto/pilotos vía corpus + NotebookLM, NO lista genérica.
4. (14-ago) Pilotos confirmados: Emergencia Operacional + Tendido/Reemplazo de Tubería (EPC).
5. (14-ago) Antigravity = Router Central y Custodio; mano derecha del Orquestador.
6. (14-ago) Revisión por ruta (no adjuntos masivos); trabajo de agentes va a rama fleet/workspace (cuarentena; GAIS jamás la toca).
7. (14-ago) Memoria del Orquestador = artefacto versionado en GitHub + prompt de arranque + ritual "GUARDAR MEMORIA".
8. (13-ago, arranque) Método rector y regla "PENDIENTE DE VALIDACIÓN" para lo no verificable.

## C. ÓRDENES ACTIVAS Y SU ESTADO
| Orden | A quién | Qué | Estado |
|---|---|---|---|
| O-PERP-01 | Antigravity+flota | Evidencias E1-E7, correcciones coherencia, tareas por agente | ✅ Ejecutada (evidencias literales recibidas); push a main parcialmente pendiente |
| O-PERP-02 | Antigravity+Founder | Incidente secretos + rescate legado NEXUS | 🟡 Rotación Founder pendiente; rescate en cola |
| O-PERP-03 | Antigravity | Subir doc 00 + correcciones 01_ACK | 🟡 ACK corregido local; pendiente push |
| O-PERP-05 | Antigravity+flota | Subir kit spec-driven + distribución | ⏳ Reemplazada por flujo del tablero (O-PERP-08) |
| O-PERP-06 | Antigravity | docs/expertos/ + EXP-01 Contrataciones (carta + prueba de fuego) | ⏳ En cola tras tablero |
| O-PERP-07 | Antigravity | Crear tablero Kanban + estructura Z1 | ⏳ Fusionada en O-PERP-08 |
| O-PERP-08 | Antigravity | Recoger 15 docs de Downloads → FLEET-REVIEWS → fleet/workspace; despacho de revisión; pendientes operativos | 🔵 Emitida, esperando confirmación + SHA |

## D. PENDIENTES DEL FOUNDER
1. Rotación de secretos expuestos (GitHub PATs, OAuth Google, DBs Supabase/Postgres/Redis, bots Telegram) — INCIDENT-2026-08-14.
2. D-SEC-13: restricción API key Firebase en GCP Console + evidencia.
3. Decisión Preview por PR (construir S14.2B o derogar).
4. Decisión: sub-cuadernos de Operaciones (3,416 PDFs) vs curación agresiva.
5. Reenviar cuestionario CENSO DE CAPACIDADES a cada miembro (respuestas → ORQUESTADOR-INBOX\).

## E. PENDIENTES DE VALIDACIÓN
1. Anexos A–L del IR-S-04 (mapeo letra↔tipo) vs corpus — Antigravity Bloque 3, con cita de página.
2. SHA-09 doble referencia ("Anexo A §19" vs "IR-S-04 §8.7") — una está mal.
3. Escaleras de escape: 7.50m (04_V2) vs OSHA 25 ft ≈ 7.62m.
4. Títulos exactos SI-S-06/08/19/20/28, HO-H-02, IR-S-00, IR-S-17 (corpus local).
5. "15 días consignación", "Compromiso Social 3-5%", denominación RASDA, NT-01-2008 INPSASEL.
6. Cifras corpus: 4,138 (censo) vs 5,119 (clasificación). Módulos: 41 vs ~30+ vs 67.
7. E4 nota: chunk workflows-kernel se sigue cargando en arranque — F-WF-LAZY debe medir antes/después.

## F. MAPA DE ENTREGABLES DEL ORQUESTADOR (16 instrumentos, estado: → tablero vía O-PERP-08)
00_CONCILIACION_MAESTRA · 02_SPEC_DRIVEN_OPERATING_MODEL · CONSTITUCION · PLANTILLA-SPEC ·
PLANTILLA-PLAN · PLANTILLA-TASKS · PROTOCOLO-FLOTA · MANDATO-CTO-ORQUESTADOR ·
PROGRAMA-EXPERTOS-SINTETICOS · INDICE-MAESTRO-DOCUMENTAL · FASE-CERO-DESCUBRIMIENTO ·
GUIA-EXPERTOS-NOTEBOOKLM · PLAN-CIERRE-AUDITORIA-SPRINTS · CELULA-INVESTIGACION-STACK ·
PROTOCOLO-KANBAN-FLOTA · SISTEMA-MEMORIA-PERSISTENTE-ORQUESTADOR (este sistema)

## G. CONTRADICCIONES ABIERTAS
1. Mapeo anexos IR-S-04: legado NEXUS (SI-S-04=permisos; IR-S-17=ART) vs catálogo 04_V2 (IR-S-04=permisos; HO-H-02=ART) → resuelve corpus local.
2. Baselines históricos de tests (417/459/505-508) → cerrada: 512 canónico.
3. Mi búsqueda GitHub dijo 0 ocurrencias de PROJ-CARDON-AMUAY vs grep local 8 → cerrada: índice GitHub desactualizado; evidencia local gana.

## H. LOG DE SESIONES (append-only)
- 14-ago (este chat): carga de memoria desde repo; dictamen de auditoría Antigravity (75/100) con 2 correcciones; análisis docs 01/04/07 + Doctrina + Plan v1.2; rescate legado NEXUS (5 docs) + alerta P0 secretos; mandato CTO asumido; kit spec-driven propio (5 instrumentos); programa de expertos sintéticos; corrección Founder: no docs a diestra y siniestra → Fase Cero aprobada; ola documental (14→16 instrumentos); dictamen de evidencias E1-E7 de Antigravity (F-MT-FIX GO, TEST_BASELINE 512, bundle reencuadrado); descubrimiento oro en docs/design + docs/intake; protocolo Kanban + cuarentena GAIS; mapa de carpetas Antigravity aceptado (PROINTECA = fuente campo Piloto 2; zonas Hermes no confiables); sistema de memoria persistente creado.
- PENDIENTE AL MIGRAR DE CHAT: confirmación O-PERP-08 + SHA tablero; respuestas censo; Bloque 3 normativo; señal para F-MT-FIX; revisión flota de los 16 instrumentos.
