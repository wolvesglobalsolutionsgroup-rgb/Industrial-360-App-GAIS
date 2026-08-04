# Ledger de Trazabilidad y Auditoría — Industrial Control 360 (IC360)

## 1. Propósito y Regla de Fuente Única de Verdad

Este documento constituye la **fuente única de verdad** para el seguimiento, trazabilidad, evidencia de auditoría y decisiones de cierre de todos los sprints, remediaciones de hallazgos (F-01..F-08), cambios de infraestructura y decisiones de seguridad del repositorio **Industrial Control 360**.

### Reglas Fundamentales:
1. **Ninguna función o remediación se declara cerrada (`CLOSED`) sin evidencia remota verificable en GitHub.** Un chat, un informe parcial o una prueba local no constituyen entrega.
2. **Los estados son mutuamente excluyentes y siguen una progresión estricta.**
3. **Todo dato o antecedente histórico sin evidencia local o remota verificable de forma independiente se clasifica como `NO_VERIFICADO`.**
4. **Está estrictamente prohibido inventar SHAs, resultados de CI, firmas de auditoría o aprobaciones del fundador.**

---

## 2. Definición Estricta de Estados Permitidos

| Estado | Definición y Criterio de Entrada |
|---|---|
| `PLANNED` | Sprint planificado o definido en roadmap, sin inicio de desarrollo ni código modificado. |
| `IN_PROGRESS` | Desarrollo en curso o cambios locales en proceso sin commit ni push publicado en repositorio remoto. |
| `LOCAL_EVIDENCE_ONLY` | Pruebas o cambios verificados localmente pero aún no publicados en el repositorio remoto canonical (`origin/main`). |
| `EVIDENCE_READY` | Cambios con commit publicado en `origin/main` y evidencia reproducible (código, pruebas, logs) lista para auditoría independiente. |
| `AUDITED` | Commit publicado verificado por CI/auditoría independiente de código, con gate funcional humano o despliegue en producción pendiente. |
| `FOUNDER_GATE_PENDING` | Código e implementación técnica auditada y aprobada; a la espera del gate de validación funcional directa del fundador (Freddy). |
| `CLOSED` | Ciclo completo verificado: SHA publicado en `origin/main` + evidencia reproducible + auditoría independiente sin hallazgos abiertos + gate fundador aprobado. |
| `BLOCKED` | Desarrollo, auditoría o cierre pausado por impedimento técnico, vulnerabilidad abierta o falta de prerrequisitos. |
| `NO_VERIFICADO` | Estado histórico o heredado sin evidencia local ni remota verificable de forma independiente. |
| `SUPERSEDED` | Sprint, requisito o arquitectura reemplazada o dejada sin efecto por una decisión o sprint posterior. |

---

## 3. Tabla de Trazabilidad de Sprints y Hallazgos

| ID | Título | Tipo | Estado | SHA base | SHA entrega | Evidencia | Auditoría | Gate fundador | Dependencias | Riesgos abiertos | Última actualización |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T1 | Ledger de Trazabilidad y Auditoría | governance | IN_PROGRESS | 79993ed77bba76fa456afffce1aaf4038841aa01 | NO_VERIFICADO | docs/governance/*, scripts/validateSprintLedger.mjs | Pendiente auditoría independiente | Pendiente gate fundador | Ninguna | Sincronización con CI y auditoría externa | 2026-08-04 |
| A1 | Integridad Dashboard e Indicadores Reales | feature | LOCAL_EVIDENCE_ONLY | 79993ed77bba76fa456afffce1aaf4038841aa01 | NO_VERIFICADO | src/pages/Dashboard.tsx, src/pages/__tests__/dashboardA1.test.ts | Pruebas unitarias A1 pasando | Pendiente gate fundador | Ninguna | Trazabilidad y eliminación de mocks | 2026-08-04 |
| B1 | Perímetro IA y Correo Backend Proxy | security | LOCAL_EVIDENCE_ONLY | eb8430ea61ab0ec89f255024963b8ec272b839dd | NO_VERIFICADO | server.ts, functions/src/index.ts, functions/src/middleware/requireAuth.ts, src/middleware/verifyFirebaseToken.ts, src/lib/__tests__/b1_perimeter.test.ts | Pruebas unitarias B1 de perímetro IA/correo pasando | Pendiente gate fundador | Ninguna | Rate limit en memoria por instancia | 2026-08-04 |
| B1.1 | Validación de Enlaces de Correo, Respuestas Mínimas y Pruebas Reales de Handler | security | LOCAL_EVIDENCE_ONLY | 612267a03907b019dbcc4bb22e8b03d0f71a799f | NO_VERIFICADO | server.ts, src/lib/__tests__/b1_perimeter.test.ts, docs/governance/* | Pruebas unitarias e integrales del handler Express (22 tests B1.1/B1.1.1) y linter/build verdes | Pendiente gate fundador | B1 | Allowlist se configura por entorno (PORTAL_ALLOWED_HOSTS) | 2026-08-04 |
| C1 | Zero-Trust Security Rules y Storage Multi-tenant | security | LOCAL_EVIDENCE_ONLY | 703b4739f7e8fe31b8377793adfcdb0c56157aee | NO_VERIFICADO | firestore.rules, storage.rules, tests/rules/securityRules.test.ts, tests/storage/storageRules.test.ts | Pruebas de emulador completadas localmente: 15 tests Firestore + 8 tests Storage en verde | Pendiente gate fundador | Ninguna | Pruebas C1 locales pendientes de revisión y commit independiente por Freddy | 2026-08-04 |
| D1 | Saneamiento de Placeholders y Rutas | refactor | LOCAL_EVIDENCE_ONLY | 2aa2fc2f214076d05efc3be44a9ea576cd092ba9 | NO_VERIFICADO | src/App.tsx, src/components/layout/ModulePanel.tsx, src/components/CommandPalette.tsx | Auditoría de 31 módulos completada: 31/31 IMPLEMENTED, 0 placeholders/404s | Pendiente gate fundador | Ninguna | Ninguno | 2026-08-04 |
| R1 | Catálogo Normativo y Documental | engineering | IN_PROGRESS | 79993ed77bba76fa456afffce1aaf4038841aa01 | NO_VERIFICADO | src/lib/norms/*, tests/unit | Pruebas unitarias normativas pasando | Pendiente | Ninguna | Verificación de fórmulas contra estándares ASME/API | 2026-08-04 |
| F-01 | Remediación de endpoints Express sin auth / proxy Gemini | security | EVIDENCE_READY | 79993ed77bba76fa456afffce1aaf4038841aa01 | 79993ed77bba76fa456afffce1aaf4038841aa01 | server.ts, functions/src/middleware/authorizer.ts | CI 4/4 verde | Pendiente | Ninguna | Auditoría independiente de código en servidor | 2026-08-04 |
| F-02 | Remediación de aseveración falsa de CVE en documentación | governance | EVIDENCE_READY | 79993ed77bba76fa456afffce1aaf4038841aa01 | 79993ed77bba76fa456afffce1aaf4038841aa01 | docs/security/CVE_EXCEPTIONS.md | CI 4/4 verde | Pendiente | Ninguna | Verificación de precisión documental | 2026-08-04 |
| B-BUILD-20260804 | Ajuste de memoria Node.js max-old-space-size a 2048MB | infrastructure | AUDITED | 6c63e5f29910dd4973516c905b7661b6bbd24771 | 79993ed77bba76fa456afffce1aaf4038841aa01 | package.json | CI remoto 4/4 verde (GitHub Actions) | Aprobado | Ninguna | Confirmar estabilidad en builds con consumo intensivo de memoria | 2026-08-04 |

---

## 4. Historial de Actualizaciones del Ledger

| Fecha | Actor | SHA Commit | Sprint / Finding | Cambios y Motivo |
|---|---|---|---|---|
| 2026-08-04 | GAIS | En desarrollo | B1.1 / B1.1.1 | Corrección de HTML escaping (B1.1.1) en portalLink, exportación de createApp y pruebas reales del handler Express /api/send-email (6 casos de prueba integrales). |
| 2026-08-04 | GAIS | En desarrollo | B1 | Endurecimiento del perímetro backend para Gemini y Correo: verificación estricta de token, autorización por rol (gerente/superadmin) para correo, sanitización de payloads y suite de pruebas b1_perimeter.test.ts (8 tests). |
| 2026-08-04 | GAIS | En desarrollo | D1 | Saneamiento de placeholders y rutas. Auditoría de 31 módulos + rutas alias realizada sin hallazgos de placeholders o 404s. |
| 2026-08-04 | GAIS / Auditoría IC360 | 79993ed77bba76fa456afffce1aaf4038841aa01 | B-BUILD-20260804 | Publicación de ajuste de memoria en package.json (2048MB) verificado con CI 4/4. |
| 2026-08-04 | GAIS | En desarrollo | T1 | Creación inicial de la gobernanza T1, ledger de trazabilidad y script de validación. |
