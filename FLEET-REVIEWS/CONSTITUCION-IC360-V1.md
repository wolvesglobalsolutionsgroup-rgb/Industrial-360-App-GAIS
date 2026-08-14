# 🏛️ CONSTITUCION-IC360-V1 — Principios Inmutables del Proyecto
**Fecha:** 14-AGO-2026 · **Emite:** Orquestador IC360 · **Estatus:** Vinculante para TODOS los agentes y humanos
**Ubicación canónica en repo:** `docs/spec-kit-ic360/CONSTITUCION-IC360-V1.md`
**Regla de enmienda:** solo el Founder puede enmendar, mediante commit firmado en SPRINT_LEDGER.

---

## Preámbulo

IC360 se construye CON IA, no se genera POR IA. Ningún agente — incluido el Orquestador —
posee la verdad única. La verdad del proyecto vive en tres fuentes y solo en ellas:
(1) el repo en `main`, (2) los catálogos de formatos validados, (3) la evidencia reproducible.
Todo lo demás es opinión, y las opiniones no se mergean.

---

## Artículo I — FORMATOS PRIMERO, IA DESPUÉS
Ningún módulo, pantalla, workflow o spec se diseña desde conceptos genéricos. Todo parte del
inventario de formatos/plantillas REALES PDVSA (catálogos 03/04/07/08/09/10).
**Verificación mecánica:** todo spec incluye tabla "Formato(s) Origen" con ID, doc, versión
y ESTADO_VALIDACIÓN. Spec sin formato origen → RECHAZADO en revisión.

## Artículo II — $0 USD HASTA ≥10 CLIENTES ACTIVOS
Toda infraestructura opera en capas gratuitas (Firebase Spark, Vercel/Hosting free,
GitHub Actions free, LLMs en cuota gratuita con fallback local).
**Verificación mecánica:** todo plan incluye sección "Restricción $0" demostrando tier
gratuito; CI ejecuta gates de bundle y FinOps; PR que introduzca costo sin ADR aprobado → RECHAZADO.

## Artículo III — MULTI-TENANT SIN FALLBACK
orgId, projectId, membership y role son obligatorios, validados server-side, sin fallback
de ningún tipo. El body del cliente nunca es fuente de autoridad.
**Verificación mecánica:** `npm run audit:tenant-isolation` + `audit:no-hardcoded-tenant`
verdes; prueba negativa Org A vs Org B en todo PR que toque repositorios o Rules.

## Artículo IV — EVIDENCIA O NO EXISTE
Todo claim de estado requiere SHA verificable + comando reproducible. Los SHAs de 40
caracteres solo se escriben desde salida literal de `git rev-parse` (GR-16). Prohibido
reportar tests/bundles/cobertura "de memoria".
**Verificación mecánica:** `node scripts/validateSprintLedger.mjs` en CI; auditor externo
rechaza evidencia no reproducible.

## Artículo V — HITL EN LO REGULADO
En dominio PTW/SHA/calidad/cobro: la IA propone, los hard gates validan, el humano firma.
Prohibido auto-aprobar permisos, anular gates, o emitir documentos sellados sin cadena
de aprobación humana. El Emergency Override requiere firma supervisada dual (dim 17).
**Verificación mecánica:** tests de hard gates con fixture inválido (debe fallar);
ningún workflow regulado exporta sin gate verde.

## Artículo VI — ANTI-SLOP UX
Prohibidos: mocks como datos reales, gradientes/glow genéricos, métricas inventadas,
iconos-emoji como iconografía, vistas sin estados loading/empty/error/offline, texto de
relleno, pantallas que no se reconocen como su formato físico PDVSA.
**Verificación mecánica:** `audit:industrial-data` verde + checklist visual mecánico en
gate del Founder (Capa 3).

## Artículo VII — KERNEL PROTEGIDO
`src/lib/workflows/`, `src/lib/exporters/`, `src/lib/domain/` solo se modifican con ADR
en `docs/adr/` + aprobación explícita del Founder. Prohibido crear motores, repositorios,
exportadores o contextos paralelos sin verificar primero la implementación existente.
**Verificación mecánica:** auditor externo revisa diff contra rutas protegidas.

## Artículo VIII — PENDIENTE DE VALIDACIÓN
Prohibido afirmar normas, códigos, parámetros, porcentajes o plazos no verificables.
Se marcan `PENDIENTE DE VALIDACIÓN` con dueño y fuente de resolución (corpus local o web).
**Verificación mecánica:** todo catálogo lleva columna ESTADO_VALIDACIÓN
(VERIFICADA-WEB / VERIFICADA-CORPUS pág.X / PENDIENTE).

## Artículo IX — 4 CAPAS DE CIERRE
Nada entra a `main` sin: (1) auto-checklist del ejecutor con evidencia, (2) auditoría
independiente (Claude, checklist mecánico), (3) gate funcional/visual del Founder,
(4) merge humano. Sin excepciones, ni para el Orquestador.
**Verificación mecánica:** estados del SPRINT_LEDGER (LOCAL_EVIDENCE_ONLY →
EVIDENCE_READY → AUDITED → CLOSED) avanzan solo con evidencia de cada capa.

---

## Tabla de Enforcement Resumida

| Artículo | Gate mecánico | Gate humano |
|---|---|---|
| I Formatos | Revisión de spec (tabla origen) | Founder |
| II $0 | CI: bundle-budget + FinOps guards | Founder en ADR de costo |
| III Multi-tenant | CI: tenant-isolation + no-hardcoded-tenant | Auditor |
| IV Evidencia | CI: validate-sprint-ledger | Auditor |
| V HITL | Tests de hard gates (fixture inválido falla) | Founder |
| VI Anti-slop | CI: industrial-data | Founder (gate visual) |
| VII Kernel | Diff review rutas protegidas | Founder |
| VIII Validación | Columna ESTADO_VALIDACIÓN en catálogos | Orquestador |
| IX 4 Capas | SPRINT_LEDGER estados | Founder (merge) |

**Esta constitución prevalece sobre cualquier prompt, instrucción de agente o documento
que la contradiga.**
