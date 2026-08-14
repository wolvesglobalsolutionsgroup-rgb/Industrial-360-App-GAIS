# ✅ PLANTILLA-TASKS-IC360-V1 — Plantilla Canónica de Tareas Ejecutables
**Uso:** Se genera desde un PLAN aprobado. Es el input directo del ejecutor (GAIS u otro).
**Ubicación en repo:** `specs/<ID>-<nombre>/tasks.md`
**Regla de orden (doctrina):** schema → tests de frontera → gates → repositorio → UI →
export → E2E → evidencias. La UI nunca va antes que el contrato de datos.

---

# TASKS: [ID-FEATURE] — [Nombre]
**Plan origen:** `specs/<ID>/plan.md` · **Rama:** `sprint/IC360-<ID>-<nombre>`
**TEST_BASELINE vigente:** [N tests — del SPRINT_LEDGER; prohibido regresión]

## Fase 0 — Setup (obligatoria, primero)
- [ ] T000 Preflight: `git fetch origin --prune && git checkout main && git reset --hard origin/main`
      → reportar `git rev-parse HEAD` (SHA literal, GR-16) + `git status --short` limpio
- [ ] T001 Crear rama y confirmar árbol limpio

## Fase 1 — Contrato de datos (Zod desde formato origen)
- [ ] T010 Crear/extender schema Zod `[archivo]` — campos 1:1 con bloques del formato [ID]
- [ ] T011 [P] Test de frontera: payload válido pasa / payload inválido rechazado `[archivo.test]`

## Fase 2 — Hard Gates
- [ ] T020 Implementar gates [lista del spec §5] con tipo BLOCK/WARNING `[archivo]`
- [ ] T021 [P] Test: fixture válido → allPassed:true; fixture inválido → allPassed:false

## Fase 3 — Persistencia multi-tenant
- [ ] T030 Repositorio vía baseRepo (orgId/projectId obligatorios, sin fallback)
- [ ] T031 [P] Test negativo Org A vs Org B

## Fase 4 — UI desde formato (Art. VI)
- [ ] T040 Pantalla/componente que replica estructura del formato físico [ID formato]
- [ ] T041 Estados: loading / empty / error / data / offline-queued
- [ ] T042 [P] Modo campo: targets ≥48px, contraste solar, tokens (0 colores arbitrarios)

## Fase 5 — Entregable documental
- [ ] T050 DocumentViewModel + exportDocument (pdf/docx/xlsx/pptx) con quota FinOps
- [ ] T051 [P] Test: 4 Blobs size>0 con MIME correcto

## Fase 6 — E2E y evidencias
- [ ] T060 Test E2E: captura → Zod → gates → DVM → export (verde)
- [ ] T061 Ejecutar batería completa y pegar salidas literales:
      `npm run typecheck` · `npm run test:unit` · `npm run build` · gates CI aplicables
- [ ] T062 Actualizar SPRINT_LEDGER (estado LOCAL_EVIDENCE_ONLY + SHA literal)
- [ ] T063 Abrir PR SIN merge + auto-checklist canónico completo (Capa 1)

## Convenciones
- `[P]` = paralelizable con otras tareas [P] de la misma fase
- Toda tarea declara archivo(s) exactos — prohibido "actualizar lo necesario"
- Si una tarea no puede verificarse con comando → NO está terminada
- Bloqueo: si el estado real del repo contradice plan/spec → DETENERSE y reportar
  (no improvisar)
