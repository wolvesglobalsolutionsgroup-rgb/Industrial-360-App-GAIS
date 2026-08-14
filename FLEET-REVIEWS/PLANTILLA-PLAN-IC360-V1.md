# 🗺️ PLANTILLA-PLAN-IC360-V1 — Plantilla Canónica de Plan Técnico
**Uso:** Se genera DESPUÉS de un spec APROBADO. Aquí sí vive el HOW.
**Ubicación en repo:** `specs/<ID>-<nombre>/plan.md`

---

# PLAN: [ID-FEATURE] — [Nombre]
**Spec origen:** `specs/<ID>/spec.md` (debe estar CLARIFICADO o APROBADO-FOUNDER)
**Fecha:** [YYYY-MM-DD] · **Autor:** [agente]

## 0. GATES CONSTITUCIONALES (todos deben pasar ANTES de escribir código)
| Artículo | Verificación de este plan | Pasa |
|---|---|---|
| I Formatos | Spec cita formato origen verificado | ☐ |
| II $0 | Sección §4 demuestra tier gratuito | ☐ |
| III Multi-tenant | §5 declara orgId/projectId server-side, sin fallback | ☐ |
| IV Evidencia | §8 define comandos y salidas esperadas | ☐ |
| V HITL | §6 declara gates y firmas humanas | ☐ |
| VI Anti-slop | §7 declara estados y tokens | ☐ |
| VII Kernel | §3 lista rutas protegidas tocadas (o declara 0) | ☐ |
| VIII Validación | 0 afirmaciones normativas sin marcar | ☐ |
| IX 4 Capas | §9 define evidencia por capa | ☐ |

## 1. CONTEXTO
[2-3 líneas: qué se construye y por qué ahora. Link al spec.]

## 2. ESTADO REAL PREVIO (as-built, extraído — no asumido)
[Qué existe hoy en el repo relacionado: archivos, contratos, tests. Salida de grep/listado.
Si contradice el spec → detenerse y reportar.]

## 3. ARCHIVOS QUE SE TOCAN
**Se crean:** [...] · **Se modifican:** [...] · **Rutas protegidas (Art. VII):** [ninguna / lista + ADR]
**NO existen y el spec asumía:** [lista — discrepancias]

## 4. RESTRICCIÓN $0 (Art. II)
[Costo de la solución: reads/writes Firestore estimados, minutos CI, cuota LLM.
Fallback gratuito si se agota cuota.]

## 5. MULTI-TENANCY Y SEGURIDAD (Art. III)
[Rutas de colección, validación server-side, prueba negativa Org A vs Org B planeada.]

## 6. DATA MODEL + HARD GATES
[Esquemas Zod derivados del formato origen (campos 1:1 con bloques del formato).
Gates: regla, tipo BLOCK/WARNING, test asociado.]

## 7. UX/UI
[Pantalla(s), estados, tokens, modo campo. Screenshot o mock textual del layout que
replica el formato físico.]

## 8. VERIFICACIÓN (comandos y salida esperada)
```bash
npm run typecheck   # 0 errores
npm run test:unit   # sin regresiones vs TEST_BASELINE
npm run audit:workflow-conformance  # verde
# + específicos del feature
```

## 9. EVIDENCIA POR CAPA DE CIERRE (Art. IX)
- Capa 1 (auto-checklist): [artefactos]
- Capa 2 (auditor): [qué debe verificar Claude]
- Capa 3 (Founder): [qué se valida visualmente/funcionalmente]
- Capa 4 (merge): [condición]

## 10. RIESGOS, MIGRACIÓN Y ROLLBACK
[Riesgo | probabilidad | mitigación | plan de rollback concreto]
