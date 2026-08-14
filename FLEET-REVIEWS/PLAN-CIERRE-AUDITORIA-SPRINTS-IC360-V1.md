# 🛠️ PLAN-CIERRE-AUDITORIA-SPRINTS-IC360-V1 — Pista A: Cierre de Brechas de la Auditoría 75/100
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** LISTO PARA EJECUCIÓN (tras Sprint 0)
**Regla de convivencia:** esta pista toca `src/` y CI. La Fase Cero toca conocimiento.
No se pisan. GAIS construye aquí mientras la flota descubre allá.

---

## 1. SPRINT 0 — EVIDENCIAS FRESCAS (precondición de todo)

**Dueño: Antigravity. Sin código de producto. Solo ejecución y salidas literales.**

| ID | Comando/acción | Decide |
|---|---|---|
| E1 | `git grep -n "PROJ-CARDON-AMUAY" -- src/` + `git grep -n "targetProjectId" -- src/` | Go/No-Go de F-MT-FIX |
| E2 | `head -20 .github/workflows/no-hardcoded-tenant.yml` | Trigger real (push vs solo PR) |
| E3 | `node scripts/validateSprintLedger.mjs` | SHAs del Ledger 1:1 |
| E4 | `npm run build && node scripts/analyzeBundle.mjs` | Bundle real (baseline 760.81 KB declarado) |
| E5 | `npx vitest run 2>&1 \| tail -5` | TEST_BASELINE canónico (417 vs 459 vs 505/508) |
| E6 | `git grep -c "createJsPdfInstance" -- src/pages/` | Deuda del puente legacy PDF |
| E7 | Promover `scratch/PDVSA_IR-S-04_FULL_CONVERTED.md` a `docs/references/` | Fuente del catálogo 04 a salvo |

**Acciones del Founder (paralelas, solo él puede):**
- F0-A: Rotación de secretos expuestos (GitHub PATs, OAuth Google, DBs, Telegram bots).
- F0-B: D-SEC-13 — restricción de API key Firebase en GCP Console + evidencia.
- F0-C: Decisión Preview por PR (construir S14.2B o derogarlo formalmente).

## 2. SPRINTS DE CIERRE (orden y dependencias)

```
Sprint 0 (evidencias)
   │
   ├─► F-DATA-AUDIT (GAIS) ──► mocks legacy → repos + EmptyState
   ├─► F-WF-LAZY (GAIS) ──► imports dinámicos workflows → bundle <700 KB
   ├─► F-MT-FIX (GAIS) ──► SOLO SI E1 confirma fallback
   └─► F-FINOPS-PERSIST ──► alertas FinOps a Firestore
            │
            ▼
     F-E2E (17 workflows: captura→Zod→gates→DVM→export 4 formatos)
            │
            ▼
     F-GOV-CLOSE (validate-sprint-ledger en CI + D-SEC-13 evidencia + push trigger)
```

| Sprint | Ejecutor | Criterio de aceptación (resumen) | Bloqueo |
|---|---|---|---|
| F-DATA-AUDIT | GAIS | 0 mocks residuales en páginas legacy; audit:industrial-data verde; sin regresión de tests | Ninguno (tras Sprint 0) |
| F-WF-LAZY | GAIS | 0 imports síncronos en workflows/index.ts; bundle <700 KB; typecheck 0 | Ninguno |
| F-MT-FIX | GAIS | 0 ocurrencias del fallback; audit:tenant-isolation verde | **BLOQUEADO hasta E1** |
| F-FINOPS-PERSIST | GAIS | Alertas persisten en /organizations/{orgId}/finopsAlerts/ | Ninguno |
| F-E2E | GAIS + fixtures Minimax | 17 tests E2E verdes; total > TEST_BASELINE + 17 | Tras DATA-AUDIT y WF-LAZY |
| F-GOV-CLOSE | Antigravity | validate:sprint-ledger en CI; no-hardcoded-tenant en push; D-SEC-13 con estado claro | Último |

**Prompts:** ya redactados en la auditoría §4 (válidos). Antigravity los empaqueta con
SYNC_PACK; Claude audita cada PR con el checklist §5 + GR-16; Founder hace gate.

## 3. REGLAS DE LA PISTA A

1. Ningún sprint inicia sin Sprint 0 completado y TEST_BASELINE fijado.
2. Un sprint = una rama = un PR = una revisión de Claude = un gate del Founder.
3. Si GAIS reporta algo que contradice el repo, Antigravity verifica contra GitHub API.
4. Los sprints F-* NO tocan `docs/governance/`, `docs/spec-kit-ic360/` ni workflows protegidos.
5. Cada cierre actualiza SPRINT_LEDGER con SHA literal (GR-16) y avanza estados:
   LOCAL_EVIDENCE_ONLY → EVIDENCE_READY → AUDITED → CLOSED (gate Founder).

## 4. CRONOGRAMA ORIENTATIVO (sujeto a evidencias)

- Día 1: Sprint 0 (E1-E7) + acciones Founder F0-A/B/C.
- Día 2-4: F-DATA-AUDIT + F-WF-LAZY (paralelos, archivos distintos).
- Día 4-5: F-MT-FIX (si aplica) + F-FINOPS-PERSIST.
- Semana 2: F-E2E por lotes (pilotos wf-042/043/044 primero).
- Cierre: F-GOV-CLOSE + re-emisión de ACK con scorecard actualizado.

## 5. INTERSECCIÓN CON FASE CERO

Cuando la Fase Cero entregue la matriz aprobada, la Ola 5 (QaQcWelding + IntegrityIli)
se construye con el kit spec-driven completo (spec desde formato → plan → tasks → GAIS).
Hasta entonces, la Pista A solo cierra deuda técnica — no inventa dominio.
