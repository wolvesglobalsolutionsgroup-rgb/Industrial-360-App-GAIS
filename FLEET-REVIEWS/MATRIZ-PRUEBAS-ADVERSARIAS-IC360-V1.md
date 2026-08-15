# ⚔️ MATRIZ-PRUEBAS-ADVERSARIAS-IC360-V1 — Catálogo Completo de Casos de Prueba Adversarios
**Fecha:** 14-AGO-2026 · **Emite:** Orquestador/CTO · **Instrumento:** #18
**Fuente:** conciliación del análisis de cobertura de seguridad (chat paralelo) con la
Doctrina V2 (12 niveles). **Regla:** cada caso mapea a su nivel, herramienta, gate CI y estado.
**Principio:** "cubierto" solo se dice cuando existe suite reproducible que prueba ataques,
abuso, estrés, concurrencia, RLS, idempotencia, integridad PDF/QR y recuperación offline
contra el SHA actual.

---

## SECCIÓN 1 — AUTENTICACIÓN Y AUTORIZACIÓN (11 casos) → Nivel 4/5 · Vitest+emulador · Gate: bloquea
| # | Caso | Estado |
|---|---|---|
| 1.1 | Token ausente | 🔴 pendiente |
| 1.2 | Token inválido | 🔴 |
| 1.3 | Token expirado | 🔴 |
| 1.4 | Token revocado | 🔴 |
| 1.5 | Usuario sin orgId | 🔴 |
| 1.6 | Usuario con orgId manipulado | 🔴 |
| 1.7 | Rol insuficiente | 🔴 |
| 1.8 | Acceso cruzado entre tenants | 🟡 (tenantIsolation.test.ts base) |
| 1.9 | Lectura permitida pero escritura prohibida | 🔴 |
| 1.10 | Aprobación sin rol de aprobador | 🔴 |
| 1.11 | Descarga de evidencia de otra organización | 🔴 |

## SECCIÓN 2 — FIRESTORE RLS (10 casos) → Nivel 4 · rules-unit-testing · Gate: bloquea en cambio de rules + semanal
**Regla mínima: deny-by-default** (sin regla explícita → falla).
| # | Caso |
|---|---|
| 2.1 | Leer proyecto propio (permitir) |
| 2.2 | Leer proyecto ajeno (denegar) |
| 2.3 | Escribir evidencia propia / ajena |
| 2.4 | Modificar aprobación sin permiso |
| 2.5 | Cambiar estado de entregable sin rol |
| 2.6 | Leer Databook de otro tenant |
| 2.7 | Enumerar colecciones sensibles |
| 2.8 | Usar limit() manipulado |
| 2.9 | Inyectar campos no permitidos |
| 2.10 | Escribir roles/claims/memberships/sellos/counters/audit/approvals desde cliente (denegar) |

## SECCIÓN 3 — ABUSO Y RATE LIMITING (10 casos) → Nivel 11 · autocannon/k6 · Gate: reporta→bloquea
| # | Caso |
|---|---|
| 3.1 | 100 requests seguidos al mismo endpoint |
| 3.2 | Repetición de firma/aprobación |
| 3.3 | Reintentos de sincronización offline |
| 3.4 | Múltiples usuarios del mismo tenant |
| 3.5 | Múltiples tenants simultáneos |
| 3.6 | Cambio de IP |
| 3.7 | Cambio de usuario con mismo dispositivo |
| 3.8 | Payloads grandes |
| 3.9 | Payloads malformados |
| 3.10 | Llamadas repetidas a IA/proxy + agotamiento de cuota diaria simulado (429) |

## SECCIÓN 4 — ESTRÉS DE WORKFLOWS (10 casos) → Nivel 11 · Vitest · Gate: bloquea
| # | Caso |
|---|---|
| 4.1 | Registro concurrente de workflows |
| 4.2 | IDs duplicados (debe rechazar) |
| 4.3 | Ejecución simultánea del mismo workflow |
| 4.4 | Workflows distintos por tenant |
| 4.5 | Dependencias cruzadas entre actividades |
| 4.6 | Cancelación durante ejecución |
| 4.7 | Reintento después de fallo |
| 4.8 | Recuperación después de refresh |
| 4.9 | Sincronización masiva del outbox |
| 4.10 | 100 workflows registrados sin degradación (F-REGRACE existe como base) |

## SECCIÓN 5 — CIBERSEGURIDAD DE APLICACIÓN (16 casos) → S1/S5/S7 · Semgrep+ZAP+tests · Gate: bloquea
| # | Caso |
|---|---|
| 5.1 | XSS en campos de texto |
| 5.2 | Inyección en búsquedas |
| 5.3 | HTML malicioso en observaciones |
| 5.4 | SVG malicioso en archivos |
| 5.5 | PDF con contenido manipulado |
| 5.6 | QR con URL alterada |
| 5.7 | Path traversal en nombres de archivo |
| 5.8 | Subida de archivo con extensión falsa |
| 5.9 | MIME spoofing |
| 5.10 | CSRF (si aplica) |
| 5.11 | CORS mal configurado |
| 5.12 | Headers de seguridad ausentes |
| 5.13 | Exposición de API keys |
| 5.14 | Secretos en logs |
| 5.15 | PII en logs |
| 5.16 | **Prompt injection directa e indirecta (RAG/corpus)** — P0 antes de conectar NotebookLM |

## SECCIÓN 6 — INTEGRIDAD DOCUMENTAL (10 casos) → Nivel 8 · Vitest+crypto · Gate: bloquea (F-PDF)
| # | Caso |
|---|---|
| 6.1 | Mismo input → mismo hash SHA-256 |
| 6.2 | Input alterado → hash distinto |
| 6.3 | QR apunta a verificación correcta |
| 6.4 | QR manipulado falla |
| 6.5 | PDF regenerado no cambia silenciosamente |
| 6.6 | Versión emitida no puede sobrescribirse |
| 6.7 | Aprobación deja evidencia |
| 6.8 | Rechazo deja trazabilidad |
| 6.9 | Databook no mezcla tenants |
| 6.10 | Documento archivado no vuelve a editable sin evento auditado |

## SECCIÓN 7 — STRESS PILOT SINTÉTICO (hito pre-piloto) → Nivel 11 · scripts · Gate: certificación
```yaml
stressPilot:
  tenants: 10
  usersPerTenant: 5
  workflowsPerTenant: 10
  sessionsPerUser: 3
  offlineMutationsPerSession: 20
  pdfGenerations: 50
  qrVerifications: 50
  expected:
    noTenantDataLeak: true
    noDuplicateOutboxWrites: true
    noUnauthorizedApproval: true
    noUnhandled429: true
    noQuotaExhaustion: true
    noUnhandledSyncConflict: true
```
**No requiere infraestructura paga; requiere scripts, datos sintéticos y disciplina de medición.**

## REGLAS DE RECHAZO EN PR (adoptadas textualmente del análisis — son mecánicas)
```
Rechazar PR si:
- agrega consulta Firestore sin limit()
- desactiva reglas RLS
- agrega endpoint sin autenticación
- agrega escritura sin validación Zod
- introduce secretos o tokens
- agrega dependencia con licencia incompatible (zero AGPL/GPL)
- modifica workflow registry sin test de concurrencia
- cambia outbox sin test de idempotencia
- cambia PDF/QR/hash sin test de determinismo
- aumenta bundle sin justificación
- introduce servicio pago
- commitea directo a main
```

## ORDEN CANÓNICO DE CIERRE (reconciliado: análisis + Doctrina V2)
```
1. CI/Semgrep verde en main (continuo — ya activo)
2. LLM security / prompt injection (P0 — ANTES de conectar NotebookLM/GraphRAG)
3. Auth negative matrix + RLS deny-by-default completa (P0/P1)
4. Trampas Semgrep (prueba de fuego S2)
5. Outbox: idempotencia + schemaVersion + backoff
6. PDF determinista + QR/hash + integridad documental (F-PDF)
7. Rate limiting / abuso de cuota
8. Fuzzing calculadoras y schemas (fast-check)
9. E2E flujo dorado + 17 workflows (F-E2E)
10. StressPilot multi-tenant sintético (hito pre-piloto)
11. DAST ZAP nocturno + Strix semanal (seguridad ofensiva)
12. Mutación (Stryker) + visual + a11y (Oleada 2)
```
