# ROADMAP MAESTRO IC360-NEXUS — V1
## Modelo de Cobertura por Oleadas del Marco de 52 Dimensiones

**Fecha:** 2026-08-12
**SHA base al emitir:** `ca770cee2f9d892a7f110f81ee70ff99ea240fbc`
**Ancla de auditoría:** Auditoría V3.4 ejecutada por Claude (52 dimensiones)
**Estado:** VIGENTE — rige todo despacho de trabajo a agentes desde esta fecha

---

## PRINCIPIO RECTOR

> No se cubren las 52 dimensiones. Se **gobiernan** las 52 y se **construyen** ~15.
> Toda dimensión tiene: oleada asignada, criterio de activación y score actual.
> Una dimensión sin oleada es deuda invisible; una dimensión con oleada es deuda gobernada.

---

## LAS TRES ENFERMEDADES Y SUS MECANISMOS

| Enfermedad | Mecanismo de control | Estado |
|---|---|---|
| Desbordamiento (scope creep) | Contrato de Trabajo Unitario: 1 orden = 1 cluster = 1 PR | Vigente desde hoy |
| Amnesia (agentes sin contexto) | SYNC_PACK obligatorio + SPRINT_LEDGER.md append-only + auditorías ancladas a docs dentro del repo | Parcial — formalizar en Oleada 0 |
| Borrados (workspace desactualizado) | Branch protection en main + PR-only + custodia post-push + CI hard gates | Pendiente — Oleada 0 |

---

## OLEADA 0 — ESTABILIZACIÓN (1-2 días, sin dimensiones)

Higiene del sistema antes de construir. Nada de esto toca las 52 dimensiones.

- [ ] Reparar `.semgrep/ic360-security-rules.yml` (YAML corrupto línea 6 — CI crónico en rojo)
- [ ] Commitear los 3 archivos pendientes de Google (`HotTapSchemes.tsx`, `WorkflowRunnerPage.tsx`, `vite.config.ts`)
- [ ] Revisar diff y revertir degradación de `docs/rag/DOCUMENT-CENSUS-V1.md` (−171 líneas) y `docs/security/CYBER-GAP-ANALYSIS-V1.md` (−106 líneas)
- [ ] Activar branch protection en `main`: require PR + status checks verdes antes de merge
- [ ] Commitear la auditoría como `docs/audit/AUDITORIA-TECNICA-EXHAUSTIVA-IC360-V2.md` (ancla del próximo delta)
- [ ] Crear `SPRINT_LEDGER.md` append-only en la raíz de docs

**Criterio de salida:** CI 5/5 verde en main, cero archivos pendientes en workspaces de agentes.

---

## OLEADA 1 — PILOTO FUNCIONAL (2-3 semanas)

Los 4 P1 de la auditoría + la pantalla piloto ya especificada.

| Sprint | Dimensiones | Score actual → objetivo | Contenido |
|---|---|---|---|
| F-OUTBOX | A4 + A5 | 68→90 / 20→85 | `idempotencyKey` en QueueParams + dedup server-side + `schemaVersion` + upgrader mínimo + doc de pérdida de dispositivo |
| F-PDF | A8B | 40→90 | Motor PDF server-side bajo demanda (Cloud Function + Chromium headless, invocación por firma, no persistente). Test: mismo input → mismo hash |
| F-E2E | E4 | 65→80 | Playwright sobre el flujo dorado: login → PTW → firma → QR. Corre en CI |
| F-PWA | A7 | 55→85 | `vite-plugin-pwa` — app shell offline real (complementa Dexie/Outbox) |
| F-SPLIT | E5 | 45→75 | Implementar PTW-SPLIT-VIEW-DESIGN-V1.1.md (spec ya aprobada) |
| F-TSA | C4 | 25→70 | Decisión documentada: TSA gratuita compatible RFC 3161, o limitación explícita firmada |

**Criterio de salida de oleada:** 3 permisos PTW completados en campo sin conectividad, con verificación QR exitosa y hash reproducible.

**Prompts listos:** F-OUTBOX y F-PDF ya están redactados en la sección 7 de la auditoría V2.

---

## OLEADA 2 — 10 CLIENTES $0 (post-piloto exitoso)

| Dimensiones | Score actual | Contenido |
|---|---|---|
| B3 Circuit breakers | 25→75 | Breaker en memoria para Gemini/Resend con fallback |
| B4 Clock skew / UTC | 50→80 | Canon UTC + display America/Caracas + corte de día operativo |
| 23B Notificaciones | ~25→70 | Email transaccional / FCM en cuota gratuita |
| F4 FinOps por tenant | 40→75 | Etiquetado por orgId + cortacircuito económico |
| E3 Disaster recovery | 30→70 | Scripts de backup versionados + PITR documentado |
| C5 Emergency override MOC | 55→80 | Protocolo de anulación con firma dual |
| C3 Prompt injection | 60→80 | Sanitización de contexto RAG (cuando RAG se active) |
| H2 RAG pipeline | 55→75 | Chunking + embeddings + citación normativa real |
| H3 Legados | 50→70 | Migración priorizada de los 41 módulos (criterio: migrar/reescribir/eliminar) |

**Criterio de salida de oleada:** cálculo FinOps demostrable — 10 tenants sintéticos activos sin exceder cuota Spark ni errores 429.

---

## OLEADA 3 — ENTERPRISE / EDGE (solo por evidencia de campo)

**Regla de activación:** ninguna dimensión de esta oleada se construye sin un ticket de campo real que la solicite. El auditor confirmó que su ausencia actual es la secuencia correcta, no una brecha.

- Bloque D completo (19-23): SSO/SCIM, audit trail cliente, webhooks, billing, custom domains — se activa con el primer cliente enterprise que lo exija contractualmente
- F2 OLTP/OLAP desacoplado — se activa cuando la analítica degrade el tráfico operacional (medido, no supuesto)
- Bloque G (34-47): hardware/OT, kiosk, thermal, anti-spoofing, kill-switch, delta-sync, wake lock — se activa con reportes de campo de usuarios reales en tablets
- F1 ADRs dedicados — se activa cuando DECISIONS.md supere las 30 decisiones

---

## CONTRATO DE TRABAJO UNITARIO (obligatorio desde hoy)

Toda orden de trabajo a cualquier agente lleva este encabezado:

```text
CONTRATO DE TRABAJO — [ID DE SPRINT]
SHA base declarado:     [sha completo]
Oleada:                 [0 / 1 / 2 / 3]
Dimensiones objetivo:   [IDs del marco — máximo 2 por orden]
Archivos autorizados:   [lista exacta de rutas]
Zona prohibida:         [lista exacta de rutas]
Criterio de aceptación: [cuantitativo y medible]
Entrega:                rama feature/* → PR → checks verdes → merge
Prohibido:              commit directo a main, archivos fuera de alcance,
                        servicios de pago, emojis como iconografía
```

---

## PROTOCOLO ANTI-AMNESIA

1. **SYNC_PACK antes de cada sesión:** el agente recibe los archivos vigentes que va a tocar, extraídos del HEAD remoto — nunca de su workspace local.
2. **SPRINT_LEDGER.md append-only:** cada merge registra: SHA, oleada, sprint, dimensiones tocadas, scores actualizados, archivos modificados. Los agentes lo leen al inicio de cada sesión.
3. **Auditorías ancladas al repo:** todo informe de auditoría se commitea a `docs/audit/` — el próximo delta siempre tiene ancla documental dentro del árbol.
4. **Re-auditoría por oleada:** el scorecard de 52 dimensiones se re-evalúa solo al cierre de oleada, nunca por commit.

---

## PROTOCOLO ANTI-BORRADO

1. Branch protection en `main`: require pull request + status checks antes de merge.
2. Todo trabajo de agente entra por rama `feature/*` — ningún agente commitea directo a `main`.
3. Custodia post-push: tras cada merge, verificación contra GitHub API (no contra reportes de agentes) de que el árbol contiene lo esperado.
4. Alerta roja: cualquier diff con deletions fuera del alcance declarado → revert inmediato + incidente registrado.

---

## SCORECARD RESUMIDO (Auditoría V2, SHA de sesión 62d3625)

| Bloque | Fortalezas (≥75) | Brechas P1 | Post-piloto |
|---|---|---|---|
| A — Core | A1 bundle 93, A2 88, A3 85, A8 82 | A4 68, A5 20, A8B 40 | A6 (desajuste de marco, no defecto) |
| B — Resiliencia | B1 registry 95 | — | B2 30, B3 25, B4 50 |
| C — Seguridad | C1 JWT 90, C2 RBAC 88, C6 82 | C4 firma 25 | C3 60, C5 55 |
| D — Enterprise | — | — | Todo 20-35 (correcto para etapa) |
| E — DevOps | E1 CI 85, E2 observab. 88, E6 78 | E4 testing 65 | E3 30, E5 45 |
| F — Meta | F3 SBOM 90, F1 75 | — | F2 15, F4 40 |
| G — Edge | — | — | Todo 5-15 (correcto para etapa) |
| H — Proceso | — | H1 65, H2 55, H3 50 | — |

**Salud global verificada:** 0 vulnerabilidades npm · 0 contaminación GPL/AGPL · bundle 120.41 KB gzip · 505/508 tests · tsc 0 errores · SBOM real en CI.
