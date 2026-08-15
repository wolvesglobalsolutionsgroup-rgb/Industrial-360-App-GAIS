# ✅ PLANTILLA-TASKS-IC360-V2 — Tareas Ejecutables
**Versión:** V2 (conciliada). **Cambios V1→V2:** +verificación de TEST_BASELINE en setup (Qwen) · +convención `[B]` bloqueante (Qwen) · +referencia a casos adversarios (instrumento 18) · +regla de integraciones server-side (banderas #1/#17).
**Regla de orden (doctrina):** schema → tests frontera → gates → repositorio → UI → export → E2E → evidencias. La UI nunca va antes que el contrato de datos.
**Ubicación:** `specs/<ID>-<nombre>/tasks.md`

---

# TASKS: [ID-FEATURE] — [Nombre]
**Plan origen:** `specs/<ID>/plan.md` · **Rama:** `sprint/IC360-<ID>-<nombre>`
**TEST_BASELINE vigente:** [N — del SPRINT_LEDGER; baseline canónico 512, piso documentado 507 por flake de emulador]

## Fase 0 — Setup (obligatoria, primero)
- [ ] T000 Preflight: `git fetch origin --prune && git checkout main && git reset --hard origin/main` → reportar `git rev-parse HEAD` (SHA literal, GR-16) + `git status --short` limpio
- [ ] T001 Crear rama; confirmar árbol limpio
- [ ] T002 **[B]** Verificar TEST_BASELINE: `npx vitest run` → confirmar conteo ≥ piso y anotar resultado real como referencia anti-regresión

## Fase 1 — Contrato de datos (Zod desde formato origen)
- [ ] T010 Crear/extender schema Zod `[archivo]` — campos 1:1 con bloques del formato [ID]
- [ ] T011 [P] Test de frontera: payload válido pasa / inválido rechazado

## Fase 2 — Hard Gates
- [ ] T020 Implementar gates del spec §5 (BLOCK/WARNING) `[archivo]`
- [ ] T021 [P] Test: fixture válido → allPassed:true · fixture inválido → allPassed:false

## Fase 3 — Persistencia multi-tenant
- [ ] T030 Repositorio vía baseRepo (orgId/projectId obligatorios, SIN fallback)
- [ ] T031 [P] Test negativo Org A vs Org B (debe FALLAR el cruce)
- [ ] T032 [B] Si toca auth/roles: correr la matriz adversaria de auth (instrumento 18, sección 1)

## Fase 4 — UI desde formato (Art. VI)
- [ ] T040 Pantalla que replica la estructura del formato físico [ID]
- [ ] T041 Estados: loading / empty / error / data / offline-queued
- [ ] T042 [P] Modo campo: targets ≥48px, contraste solar, tokens (0 colores arbitrarios)

## Fase 5 — Entregable documental
- [ ] T050 DocumentViewModel + exportDocument (pdf/docx/xlsx/pptx) con quota FinOps
- [ ] T051 [P] Test: 4 Blobs size>0 con MIME correcto

## Fase 6 — Integraciones externas (si aplica — V2)
- [ ] T060 **[B]** TODA llamada a API externa / IA va server-side en `functions/src/`. El cliente solo invoca `/api/...`. PROHIBIDO SDK de IA o `Authorization: Bearer` en el cliente (banderas #1/#17).
- [ ] T061 [P] Verificar quota FinOps envuelve la llamada (guardIaInvocation / guardHeavyWorkflow)

## Fase 7 — E2E y evidencias
- [ ] T070 Test E2E: captura → Zod → gates → DVM → export (verde)
- [ ] T071 Ejecutar batería y pegar salidas LITERALES: typecheck · test:unit · build · gates CI
- [ ] T072 Actualizar SPRINT_LEDGER (estado + SHA literal)
- [ ] T073 PR SIN merge + auto-checklist canónico (Capa 1)

## Convenciones (V2)
- `[P]` = paralelizable con otras `[P]` de la misma fase
- `[B]` = **bloqueante**: si falla, el sprint se DETIENE (no continúa a la siguiente fase)
- Toda tarea declara archivo(s) exactos — prohibido "actualizar lo necesario"
- Tarea sin verificación por comando → NO está terminada
- Si el estado real del repo contradice plan/spec → DETENERSE y reportar (no improvisar)
