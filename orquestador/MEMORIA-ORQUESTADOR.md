# 🧠 MEMORIA-ORQUESTADOR — IC360
**Última actualización:** 14-AGO-2026 ~23:10 -04 · **SHA de este archivo:** [Antigravity al commitear]
**Chat origen:** Perplexity — sesión 14-ago-2026 · **HEAD main al guardar:** `20b33d990b9e27d71810938a47fc8ac46b89bd49` (PR #4: Ledger verde, 37 registros)

## A. ESTADO DEL PROYECTO (fotografía)
- Auditoría 14-ago: 75/100. Arquitectura 95/100; Workflows reales 48/100; Datos legacy 55/100.
- TEST_BASELINE canónico: **512 tests** (verde exigido 512; piso 507 por 3 flakes de emulador Firestore registrados con ticket: qaDataset, prointecaPilot).
- Bundle real: entrypoint 301.85 KB raw / **95.61 KB gz** (bajo meta). El problema es el chunk workflows-kernel (753.83 KB raw) que se carga en arranque por imports síncronos → F-WF-LAZY.
- Fallback `PROJ-CARDON-AMUAY` CONFIRMADO (baseRepo.ts 135/175/206/225 + seedDemoData + ProcurementInventory) → **F-MT-FIX: GO**.
- Deuda PDF (createJsPdfInstance): 9 páginas, 18 invocaciones.
- Ledger: validador VERDE (37 registros, PR #4 mergeado a main `20b33d9`). F-OPS-REORDER-01 y F-FINOPS-MEASURE corregidos.
- Doctrina F-QA-EXCELLENCE restaurada en main (3d8792b). IR-S-04 en docs/references/ (SHA-256 82951748...).
- **Piedra fundacional: 30 instrumentos emitidos por el Orquestador** (16 V1 en tablero + 13 V2 en tablero + 1 memoria viva). Ver sección F.
- **Doctrina de pruebas/seguridad V2** (12 niveles + programa ofensivo) emitida. **Matriz adversaria** (78 casos + stressPilot) emitida.
- **Lote AI-Native dictaminado:** Propuesta AI-Native ADOPTADA como norte; GraphRAG adoptado (grafo en Postgres/NetworkX, NO Supabase/Neo4j); WebGL procedural Fase 2; DOC-E (hub MCP) adoptado con corrección crítica (aiBridge/connectorHub SERVER-SIDE, nunca SDK en cliente — banderas #1/#17).
- **Stack REAL del repo (Codex en vivo):** React 19.2.8 · Vite 6.4.3 · TS 5.8.2 · Tailwind 4.3.3 · Zod 4.4.3 · Firebase 12. (El 01_ACK citaba versiones viejas — corregir en 01_ACK_V2.)
- **Corpus real (Open Code en vivo):** 5,117 PDFs (no 5,119 ni 4,138), PLANO (no 9 dominios en disco), 5 corruptos, 936 dupes `_NNN`, 7.2 GB. JULIO MAITA\JULIO MAITA\ anidado.
- **NotebookLM 2.0** (Gemini Notebook): Deep Research, Data Tables→CSV/JSON (puente a specs), ejecución de código, historial persistente. Pro=300 fuentes/cuaderno → Operaciones (3,416) se sub-divide en 8-12 sub-cuadernos.
- **Arsenal aprobado:** nlm CLI, book-to-skill, diagram-design, strix (pentest). Referencia: kage, ToolJet (AGPL=no entra). Rechazado: watermarks-remover (colisiona con Art. IV). Pendiente: pdf-to-markdown-skill (no verificable).

## B. DECISIONES DEL FOUNDER VIGENTES
1. (14-ago) GAIS es el desarrollador hasta 90/100; todo termina en prompt GAIS-ready + adjuntos.
2. (14-ago) No se instala spec-kit de GitHub; se absorbe como patrón → kit propio.
3. (14-ago) Expertos sintéticos se derivan de tipos de proyecto/pilotos vía corpus+NotebookLM, NO lista genérica.
4. (14-ago) Pilotos: Emergencia Operacional + Tendido/Reemplazo de Tubería (EPC).
5. (14-ago) Antigravity = Router Central y Custodio; mano derecha del Orquestador.
6. (14-ago) Revisión por ruta (no adjuntos masivos); trabajo de agentes a fleet/workspace (cuarentena; GAIS jamás la toca).
7. (14-ago) Memoria del Orquestador = artefacto versionado en GitHub + prompt de arranque + ritual "GUARDAR MEMORIA".
8. (14-ago) Método rector + "PENDIENTE DE VALIDACIÓN" para lo no verificable.
9. (14-ago) Claves rotadas por el Founder; los expuestos se eliminan/esconden (sanitización).
10. (14-ago) NotebookLM Pro (300 fuentes/cuaderno); investigar métodos eficientes de conexión (→ nlm CLI).
11. (14-ago) Open Code organiza los PDFs (minería + clasificación) — capacidades agénticas confirmadas.
12. (14-ago) Máximo rigor en pruebas: ninguna auditoría debe mostrar espejismo (Regla del Score Honesto).
13. (14-ago) Los repos que pasa son herramientas de DESARROLLO primero; lo que vaya a la app se evalúa aparte por Célula de Stack.

## C. ÓRDENES ACTIVAS Y SU ESTADO
| Orden | A quién | Qué | Estado |
|---|---|---|---|
| O-PERP-01 | Antigravity+flota | Evidencias E1-E7 + correcciones | ✅ Cerrada (evidencias literales recibidas) |
| O-PERP-02 | Antigravity+Founder | Incidente secretos + rescate legado NEXUS | ✅ Seguridad cerrada (PR #4); rescate en cola |
| O-PERP-03 | Antigravity | Doc 00 + correcciones 01_ACK | 🟡 ACK corregido local; pendiente push |
| O-PERP-05/06/07 | Antigravity | Kit spec-driven + expertos + tablero | ⏳ Fusionadas en O-PERP-08 |
| O-PERP-08 | Antigravity | 17 archivos → tablero + memoria | ✅ Cerrada (commits c25ce40, c25b28b) |
| O-PERP-09 | Antigravity | Su revisión + corrección hashes | ✅ Cerrada (commit 902d18b) |
| O-PERP-10 | Antigravity | Candados + sanitización + respaldo | ✅ Cerrada (branch protection + tokens 401 + commit 6877d33) |
| O-PERP-11 | Open Code | Minería corpus (inventario + grafo semilla + reporte estructura) | 🔵 DESPACHADA 14-ago ~23:00, en curso |
| O-PERP-12 | Antigravity | Armamento flota (nlm CLI + book-to-skill + diagram-design + strix + GitHub access) | 🔵 DESPACHADA 14-ago ~23:00, en curso |
| O-PERP-13 | Antigravity | Ola V2 (13 docs) → tablero | ✅ Cerrada (commit fc54baee) |
| Ledger sec | Antigravity | Entrada F-SEC-INCIDENT-20260814 al Ledger | ✅ Cerrada (PR #4, main 20b33d9) |

## D. PENDIENTES DEL FOUNDER
1. ~~Rotación de secretos~~ → ✅ HECHO (14-ago, tokens 401 verificados).
2. D-SEC-13: restricción API key Firebase en GCP Console + evidencia. **SIGUE VIVA.**
3. Decisión Preview por PR (construir S14.2B o derogar). **SIGUE VIVA.**
4. ~~Sub-cuadernos Operaciones~~ → registrada: sub-dividir (8-12). Confirmar a Antigravity al crear cuadernos.
5. Aprobar MANDATO-CTO (único instrumento que no revisan agentes).

## E. PENDIENTES DE VALIDACIÓN
1. Anexos A–L del IR-S-04 (letra↔tipo) vs corpus — Antigravity Bloque 3, con cita de página.
2. SHA-09 doble referencia ("Anexo A §19" vs "IR-S-04 §8.7").
3. Escaleras 7.50m (04_V2) vs OSHA 25 ft ≈ 7.62m.
4. Títulos exactos SI-S-06/08/19/20/28, HO-H-02, IR-S-00, IR-S-17 (corpus).
5. "15 días consignación", "Compromiso Social 3-5%", denominación RASDA, NT-01-2008 INPSASEL.
6. ~~Cifras corpus~~ → RESUELTA: 5,117 canónico. Módulos: 41 vs 30+ vs 67 vs 33 → UX_MAP_ASBUILT reconcilia.
7. Compatibilidad zod-to-json-schema con Zod 4.4.3 (ficha Célula, P0 para spec WF-043-AI).
8. Firestore Vector Search en tier gratis (para GraphRAG) — PENDIENTE verificar.

## F. MAPA DE ENTREGABLES DEL ORQUESTADOR (30 archivos)
**V1 en tablero (16):** 00_CONCILIACION · 02_SPEC_DRIVEN_V1 · CONSTITUCION_V1 · PLANTILLA-SPEC_V1 ·
PLANTILLA-PLAN_V1 · PLANTILLA-TASKS_V1 · PROTOCOLO-FLOTA_V1 · MANDATO-CTO · PROGRAMA-EXPERTOS_V1 ·
INDICE-MAESTRO_V1 · FASE-CERO_V1 · GUIA-EXPERTOS_V1 · PLAN-CIERRE_V1 · CELULA-STACK_V1 ·
PROTOCOLO-KANBAN_V1 · SISTEMA-MEMORIA_V1
**V2 en tablero (13, commit fc54baee):** CONSTITUCION-V2 · PLANTILLA-SPEC-V2 · PLANTILLA-TASKS-V2 ·
PROTOCOLO-FLOTA-V2 · PROTOCOLO-KANBAN-V2 · 02_SPEC_DRIVEN-V2 · GUIA-EXPERTOS-V2 ·
PROGRAMA-EXPERTOS-V2 · FASE-CERO-V2 · PLAN-CIERRE-V2 · CELULA-STACK-V2 · DOCTRINA-PRUEBAS-SEG-V2 ·
MATRIZ-PRUEBAS-ADVERSARIAS-V1
**Memoria viva (1):** orquestador/MEMORIA-ORQUESTADOR.md (este archivo)
**⚠️ PENDIENTE:** PLANTILLA-PLAN-V2 no se emitió (hallazgos de Claude sin aplicar: Gate V→§6 sin campo de firmas; Gate VIII sin sección fija). Emitir en próxima ola.
**V1 vigentes sin V2:** 00_CONCILIACION, MANDATO-CTO, INDICE-MAESTRO, SISTEMA-MEMORIA.

## G. CONTRADICCIONES ABIERTAS
1. Mapeo anexos IR-S-04: legado NEXUS vs catálogo 04_V2 → resuelve corpus (Bloque 3).
2. ~~Baselines tests (417/459/505-508)~~ → cerrada: 512 canónico.
3. ~~Mi búsqueda GitHub 0 ocurrencias PROJ-CARDON-AMUAY vs grep local 8~~ → cerrada: índice desactualizado; evidencia local ganó.
4. wf-044 doble mapeo (ART en M1 vs Valuación en M7 del DOC-D) + wf-044Art ausente → reconciliar en UX_MAP/MODULE_WORKFLOW_MAPPING.

## H. LOG DE SESIONES (append-only)
- 14-ago (este chat, parte 1): carga memoria; dictamen auditoría 75/100; análisis 01/04/07+Doctrina+Plan v1.2; rescate legado NEXUS + alerta P0 secretos; mandato CTO; kit spec-driven propio; programa expertos; corrección Founder (no docs sin definir) → Fase Cero aprobada; ola documental (16); dictamen E1-E7 (F-MT-FIX GO, baseline 512, bundle reencuadrado); oro en docs/design+docs/intake; protocolo Kanban + cuarentena GAIS; mapa de carpetas; sistema memoria.
- 14-ago (parte 2): O-PERP-08 ejecutada (tablero+memoria vivos); 7 revisiones de flota recibidas y conciliadas (hallazgos: Claude Art.VIII HITL, Codex stack real+48≠50, Minimax NotebookLM 300, Open Code corpus 5,117 plano+PTW anexos, Spark cuarentena/vía remota); censo de capacidades completo; incidente secretos cerrado (2 tokens 401); NotebookLM 2.0 investigado; lote AI-Native dictaminado (5 docs); Doctrina V2 (12 niveles) + Matriz Adversaria (78 casos) emitidas; ledger entry de seguridad mergeado (PR #4); ola V2 (13 docs) al tablero (fc54baee); O-PERP-11 y O-PERP-12 despachadas.
- PENDIENTE AL MIGRAR: outputs de O-PERP-11 (inventario corpus) y O-PERP-12 (checklist armamento); emitir PLANTILLA-PLAN-V2; señal F-MT-FIX a GAIS (paquete en STAGED-FOR-GAIS esperando mi revisión); dictamen de Fase Cero cuando llegue la matriz; 01_ACK_V2 con stack real.
