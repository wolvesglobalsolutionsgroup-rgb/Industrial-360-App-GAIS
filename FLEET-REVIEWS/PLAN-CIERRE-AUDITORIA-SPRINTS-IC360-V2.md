# 🛠️ PLAN-CIERRE-AUDITORIA-SPRINTS-IC360-V2 — Pista A: Cierre de Brechas 75/100
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada)
**Cambios V1→V2:** (1) TEST_BASELINE canónico = 512 totales, piso aceptable 507 (flake emulador documentado). (2) E4 reencuadrado: entry 95.61 KB gz (bajo meta); el problema es el chunk workflows-kernel 753.83 KB que se carga en arranque. (3) E1 confirmó fallback → F-MT-FIX GO. (4) Ledger: 2 líneas a corregir en F-GOV-CLOSE. (5) Referencia a Doctrina V2 (12 niveles) y Matriz Adversaria (inst. 18).
**Regla de convivencia:** esta pista toca `src/` y CI. La Fase Cero toca conocimiento. No se pisan.

---

## 1. SPRINT 0 — EVIDENCIAS (✅ COMPLETADO 14-ago por Antigravity)

| ID | Resultado | Dictamen |
|---|---|---|
| E1 | Fallback `PROJ-CARDON-AMUAY` en baseRepo.ts (135/175/206/225) + seedDemoData + ProcurementInventory | ✅ CONFIRMADO → **F-MT-FIX GO** |
| E2 | no-hardcoded-tenant.yml corregido (push + PR) | ✅ Brecha Dim 1 cerrada |
| E3 | validateSprintLedger falla en F-OPS-REORDER-01 (estado "RECONCILED") y F-FINOPS-MEASURE (SHA "En desarrollo") | → corregir en F-GOV-CLOSE |
| E4 | Entry 301.85 KB raw / **95.61 KB gz** (bajo 800KB); chunk workflows-kernel 753.83 KB raw / 192.63 KB gz | Reencuadrado: el problema no es el entry, es el chunk kernel que se carga en arranque |
| E5 | **512 tests** (509 verdes, 3 timed-out emulador 5000ms) | **Baseline canónico 512** |
| E6 | createJsPdfInstance: 9 páginas, 18 invocaciones | Deuda PDF acotada |
| E7 | IR-S-04 promovido a docs/references/ (SHA-256 82951748...) | ✅ Fuente del catálogo 04 a salvo |

**Acciones Founder (paralelas):** F0-A rotación ✅ (hecho 14-ago, tokens 401) · F0-B D-SEC-13 (GCP Console, pendiente) · F0-C decisión Preview por PR (pendiente).

## 2. TEST_BASELINE Y FLAKE POLICY (V2)
- **Baseline canónico: 512 tests.** Verde exigido: 512. **Piso aceptable: 507** con los 3
  flakes del emulador Firestore registrados con ticket (qaDataset, prointecaPilot).
- **Regla:** un test inestable NUNCA se silencia — se cuarentena con ticket, fecha y dueño
  (precedente: commit 6056fdd subió timeout a 15000ms).
- Codex obtuvo 507/512 en su corrida (5 timeouts) — variación por latencia del emulador.
  Documentado como flake conocido.

## 3. SPRINTS DE CIERRE (orden y dependencias — sin cambios de fondo)
```
Sprint 0 ✅
   ├─► F-DATA-AUDIT (GAIS) — mocks legacy → repos + EmptyState
   ├─► F-WF-LAZY (GAIS) — imports dinámicos workflows → chunk kernel NO se carga en arranque
   ├─► F-MT-FIX (GAIS) — GO confirmado (E1)
   └─► F-FINOPS-PERSIST — alertas FinOps a Firestore
            ▼
     F-E2E (17 workflows: captura→Zod→gates→DVM→export 4 formatos)
            ▼
     F-GOV-CLOSE (validate:sprint-ledger en CI + D-SEC-13 evidencia + push trigger)
```

| Sprint | Ejecutor | Criterio de aceptación | Bloqueo |
|---|---|---|---|
| F-DATA-AUDIT | GAIS | 0 mocks residuales; audit:industrial-data verde; sin regresión vs baseline 512 | Ninguno |
| F-WF-LAZY | GAIS | 0 imports síncronos en workflows/index.ts; chunk kernel diferido; typecheck 0 | Ninguno |
| F-MT-FIX | GAIS | 0 ocurrencias del fallback; audit:tenant-isolation verde | ✅ DESBLOQUEADO (E1) |
| F-FINOPS-PERSIST | GAIS | Alertas persisten en /organizations/{orgId}/finopsAlerts/ | Ninguno |
| F-E2E | GAIS + fixtures Minimax | 17 tests E2E verdes; total > 512 + 17 | Tras DATA-AUDIT y WF-LAZY |
| F-GOV-CLOSE | Antigravity | validate:sprint-ledger en CI; D-SEC-13 con estado claro | Último |

**Prompts:** auditoría §4 (válidos). Antigravity empaqueta con SYNC_PACK; Claude audita cada
PR (checklist §5 + GR-16); Founder hace gate.

## 4. REGLAS DE LA PISTA A (sin cambios)
1. Ningún sprint inicia sin Sprint 0 ✅ (hecho) y TEST_BASELINE fijado (512).
2. Un sprint = una rama = un PR = una revisión de Claude = un gate del Founder.
3. Si GAIS reporta algo que contradice el repo, Antigravity verifica contra GitHub API.
4. Los sprints F-* NO tocan docs/governance/, docs/spec-kit-ic360/ ni workflows protegidos.
5. Cada cierre actualiza SPRINT_LEDGER con SHA literal (GR-16) y avanza estados:
   LOCAL_EVIDENCE_ONLY → EVIDENCE_READY → AUDITED → CLOSED (gate Founder).

## 5. INTERSECCIÓN CON FASE CERO Y AI-NATIVE (V2)
- Cuando Fase Cero entregue la matriz aprobada → Ola 5 (QaQcWelding + IntegrityIli) se
  construye con el kit spec-driven (spec desde formato → plan → tasks → GAIS).
- El aiBridge y connectorHub (lote AI-Native) entran DESPUÉS de Pista A, con la corrección
  de las banderas #1/#17 (server-side, nunca SDK en cliente). Specs se escriben ya; código
  espera a base limpia.
