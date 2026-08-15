# 🏛️ CONSTITUCION-IC360-V2 — Principios Inmutables del Proyecto
**Fecha:** 14-AGO-2026 · **Emite:** Orquestador/CTO · **Versión:** V2 (conciliada tras revisión de flota)
**Cambios V1→V2:** (1) Art. VIII — gate humano = FOUNDER, no Orquestador (hallazgo Claude: la IA no se autocertifica). (2) Art. VII — verificación ampliada a grep de duplicación en todo src/ (hallazgo Claude: la prohibición era más amplia que su gate). (3) Art. VI — separada verificación mecánica de juicio visual. (4) Referencia a Doctrina V2 de pruebas/seguridad.
**Regla de enmienda:** solo el Founder, mediante commit firmado en SPRINT_LEDGER.
**Ubicación canónica:** `docs/spec-kit-ic360/CONSTITUCION-IC360-V2.md`

---

## Preámbulo
IC360 se construye CON IA, no se genera POR IA. Ningún agente — incluido el Orquestador —
posee la verdad única. La verdad del proyecto vive en: (1) el repo en `main`, (2) los
catálogos de formatos validados, (3) la evidencia reproducible. Lo demás es opinión, y las
opiniones no se mergean.

## Artículos (con verificación mecánica)

**Art. I — FORMATOS PRIMERO, IA DESPUÉS.** Todo spec cita su formato origen (ID + doc +
versión + ESTADO_VALIDACIÓN). Spec sin formato origen → RECHAZADO. *Gate: revisión de spec
+ Founder.*

**Art. II — $0 USD HASTA ≥10 CLIENTES.** Todo plan demuestra tier gratuito. Conectores de
pago (Autodesk APS, Adobe PDF Services, Cesium, etc.) son OPCIONALES y post-piloto; la ruta
por defecto es open-source. *Gate: CI bundle-budget + FinOps guards + Founder en ADR de costo.*

**Art. III — MULTI-TENANT SIN FALLBACK.** orgId/projectId/membership/role obligatorios,
server-side, sin fallback. *Gate: `audit:tenant-isolation` + `audit:no-hardcoded-tenant` +
prueba negativa Org A vs Org B.*

**Art. IV — EVIDENCIA O NO EXISTE.** SHAs y hashes SOLO desde salida literal de
herramienta (GR-16), nunca transcritos. Métrica sin comando reproducible = CLAIMED, y
CLAIMED baja el score (Doctrina V2, Regla del Score Honesto). *Gate: validate:sprint-ledger
en CI + auditor.*

**Art. V — HITL EN LO REGULADO.** La IA propone, hard gates validan, humano firma.
Emergency Override con doble firma supervisada. *Gate: tests de gates con fixture inválido
(debe fallar) + Founder.*

**Art. VI — ANTI-SLOP UX.** Prohibidos: mocks como datos reales, gradientes/glow genéricos,
métricas inventadas, vistas sin estados (loading/empty/error/data/offline-queued),
pantallas irreconocibles vs su formato físico. *Gate mecánico: `audit:industrial-data` ·
Gate visual: Founder (checklist mecánico de la plantilla).*

**Art. VII — KERNEL PROTEGIDO.** `src/lib/workflows/`, `src/lib/exporters/`, `src/lib/domain/`
solo con ADR + aprobación Founder. **V2:** además, prohibido duplicar motores/repositorios/
exportadores en CUALQUIER parte de src/ — verificado con grep de duplicación en todo src/
(no solo en las 3 rutas). *Gate: diff review + grep + Founder.*

**Art. VIII — PENDIENTE DE VALIDACIÓN.** Prohibido afirmar normas/parámetros/plazos no
verificables → se marcan PENDIENTE DE VALIDACIÓN con dueño y fuente de resolución.
**V2 (corrección crítica):** el marcado técnico lo hace el Orquestador, pero la
CERTIFICACIÓN de una norma como verificada requiere firma del FOUNDER (círculo humano).
La IA nunca se autocertifica. *Gate técnico: Orquestador · Gate humano: Founder.*

**Art. IX — 4 CAPAS DE CIERRE.** (1) auto-checklist ejecutor con evidencia → (2) auditor
externo (Claude, checklist mecánico) → (3) gate funcional/visual Founder → (4) merge humano.
Sin excepciones, ni para el Orquestador. *Gate: estados del SPRINT_LEDGER.*

## Tabla de Enforcement (V2)

| Art | Gate mecánico | Gate humano |
|---|---|---|
| I | Revisión spec (tabla origen) | Founder |
| II | CI bundle + FinOps | Founder (ADR costo) |
| III | CI tenant-isolation + no-hardcoded | Auditor |
| IV | CI validate-sprint-ledger | Auditor |
| V | Tests gates (fixture inválido falla) | Founder |
| VI | CI industrial-data | Founder (visual) |
| VII | Diff rutas + grep duplicación src/ | Founder |
| VIII | Columna ESTADO_VALIDACIÓN | **Founder certifica** |
| IX | SPRINT_LEDGER estados | Founder (merge) |

**Esta constitución prevalece sobre cualquier prompt, agente o documento que la contradiga.**
