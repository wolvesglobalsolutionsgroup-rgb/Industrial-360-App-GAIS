# QA Conformance Gates — Industrial Control 360 (IC360)

## 1. Propósito y Alcance

Este documento especifica la arquitectura, las reglas mecánicas, las suites de prueba y la política de ejecución en CI/CD del Sprint **F-QA.1: Gates Mecánicos + Conformance Global**.

El objetivo principal es transformar los principios y restricciones críticas del proyecto en **gates mecánicos automatizados y reproducibles** que bloquean regresiones antes de iniciar la Ola 2+ de migración de módulos legados (F-D2).

---

## 2. Inventario de Gates Mecánicos (10 Fases)

| Fase | Gate / Herramienta | Comando de Ejecución | Criterio de Aprobación |
|---|---|---|---|
| **Fase 1** | Inventario de Gates | `npm run audit:gates` | Ejecución secuencial y exitosa de las 6 auditorías mecánicas. |
| **Fase 2** | Aislamiento Multi-Tenant | `npm run audit:tenant-isolation` | 0 fallbacks hardcodeados (`semax_pino`, `default_org`, etc.), 0 `orgId` sin verificar en Cloud Functions y 0 tokens/secretos en logs. |
| **Fase 3** | FinOps y Cuotas | `vitest run functions/src/__tests__/quotaService.test.ts` & `src/lib/__tests__/quotaPolicy.test.ts` | Operaciones de IA/Exportación atómicas en Firestore con `runTransaction` y degradación controlada al 95%+. |
| **Fase 4** | Guardarraíles de Firestore | `npm run audit:firestore-guardrails` & `npm run test:rules` | 0 consultas/listeners en `src/pages` sin `limitCount <= 50`, reglas de Firestore sin permisismo global y `quotaUsage` no modificable por cliente. |
| **Fase 5** | Presupuesto de Bundle | `npm run audit:bundle-budget` | Tamaño de entrypoint raw < 800 KB (`819,200 B`) y 0 `modulepreload` de chunks pesados (`pdf`, `excel`, `charts`, `3d`, `firebase-firestore`). |
| **Fase 6** | Conformidad de Workflows | `npm run audit:workflow-conformance` | 100% de los 13 workflows canónicos cumplen el contrato `WorkflowDefinition` con Zod, Hard Gates y `deliverable.factory`. Cero auto-registro sincrónico. |
| **Fase 7** | Entregables Multi-Formato | `vitest run src/lib/exporters/__tests__/multiFormatExporter.test.ts` | Generación síncrona/asíncrona de PDF, DOCX, XLSX y PPTX desde un único `DocumentViewModel`. DRAFTs no firmados e invariantes mantenidas. |
| **Fase 8** | Escaneo de Datos Ficticios y Secretos | `npm run audit:industrial-data` & `npm run audit:no-hardcoded-tenant` | 0 empresas/operadores simulados ("PetroFake", "ACME Oil"), 0 llaves privadas/tokens y 0 firmas ficticias en código productivo. |
| **Fase 9** | Integración en Pipeline de CI | `.github/workflows/ci.yml` | Ejecución en orden estricto de todas las etapas de auditoría, reglas, linter, typecheck, build y pruebas unitarias. |
| **Fase 10** | Gobernanza y Trazabilidad | `docs/governance/QA_CONFORMANCE_GATES.md` & `docs/governance/SPRINT_LEDGER.md` | Documentación exhaustiva y registro oficial del Sprint F-QA.1 en el Ledger. |

---

## 3. Matriz de Ejecución Local y CI

Para ejecutar todos los gates mecánicos localmente en un solo paso:

```bash
npm run audit:gates
```

Para validar el pipeline completo en el orden exacto de CI:

```bash
npm run typecheck
cd functions && npm run typecheck && cd ..
npm run audit:gates
npm run build
npm run test:unit
```

---

## 4. Política de Tolerancia Cero

1. **Sin Excepciones Temporales**: No se permiten marcadores `.skip`, `.todo`, ni mocks falsos para eludir fallos en los gates mecánicos.
2. **Sin Flexibilización de Umbrales**: El umbral del bundle se mantiene en **800 KB raw**. Ningún cambio de código debe sobrepasar este presupuesto.
3. **Costo $0 Incremental**: Todo procesamiento y persistencia utiliza los servicios optimizados de Cloud Functions y Firestore dentro del Spark Plan de GCP.
