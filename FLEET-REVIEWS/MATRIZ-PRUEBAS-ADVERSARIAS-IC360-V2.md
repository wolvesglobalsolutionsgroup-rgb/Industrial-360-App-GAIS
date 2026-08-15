# ⚔️ MATRIZ-PRUEBAS-ADVERSARIAS-IC360-V2 — Catálogo de Casos de Prueba Adversarios
**Fecha:** 14-AGO-2026 · **Emite:** Orquestador/CTO · **Instrumento:** #18
**Versión:** V2 (corregida tras revisión completa de Claude, 14-ago)
**Cambios V1→V2:** (1) Conteo honesto corregido: **72 casos numerados + 6 invariantes StressPilot** (V1 citaba "78" en despachos — error del Orquestador, corregido por conteo línea por línea de Claude). (2) Añadida columna **Severidad** (Crítico/Alto/Medio/Bajo) en todas las secciones. (3) Añadidos 5 vectores ausentes (1.12, 3.11, 4.11, 5.17, 6.11). (4) Strix definido con trazabilidad (capa S11).
**Regla:** "cubierto" solo se dice cuando existe suite reproducible que prueba estos casos contra el SHA actual.

---

## SECCIÓN 1 — AUTENTICACIÓN Y AUTORIZACIÓN (12 casos) → Nivel 4/5 · Vitest+emulador · Gate: bloquea
| # | Caso | Severidad | Estado |
|---|---|---|---|
| 1.1 | Token ausente | Crítico | 🔴 |
| 1.2 | Token inválido | Crítico | 🔴 |
| 1.3 | Token expirado | Alto | 🔴 |
| 1.4 | Token revocado | Crítico | 🔴 |
| 1.5 | Usuario sin orgId | Crítico | 🔴 |
| 1.6 | Usuario con orgId manipulado | **Crítico** | 🔴 |
| 1.7 | Rol insuficiente | Alto | 🔴 |
| 1.8 | Acceso cruzado entre tenants | **Crítico** | 🟡 (tenantIsolation base) |
| 1.9 | Lectura permitida pero escritura prohibida | Alto | 🔴 |
| 1.10 | Aprobación sin rol de aprobador | **Crítico** | 🔴 |
| 1.11 | Descarga de evidencia de otra organización | **Crítico** | 🔴 |
| 1.12 | **(V2)** Lectura de caché offline (Dexie/IndexedDB) sin re-autenticación — acceso físico al dispositivo o segunda pestaña | Alto | 🔴 |

## SECCIÓN 2 — FIRESTORE RLS (10 casos) → Nivel 4 · rules-unit-testing · Gate: bloquea en cambio de rules + semanal
**Regla mínima: deny-by-default.**
| # | Caso | Severidad |
|---|---|---|
| 2.1 | Leer proyecto propio (permitir) | Alto |
| 2.2 | Leer proyecto ajeno (denegar) | **Crítico** |
| 2.3 | Escribir evidencia propia / ajena | **Crítico** |
| 2.4 | Modificar aprobación sin permiso | **Crítico** |
| 2.5 | Cambiar estado de entregable sin rol | **Crítico** |
| 2.6 | Leer Databook de otro tenant | **Crítico** |
| 2.7 | Enumerar colecciones sensibles | Alto |
| 2.8 | Usar limit() manipulado | Medio |
| 2.9 | Inyectar campos no permitidos | Alto |
| 2.10 | Escribir roles/claims/memberships/sellos/counters/audit/approvals desde cliente | **Crítico** |

## SECCIÓN 3 — ABUSO Y RATE LIMITING (11 casos) → Nivel 11 · autocannon/k6 · Gate: reporta→bloquea
| # | Caso | Severidad |
|---|---|---|
| 3.1 | 100 requests seguidos al mismo endpoint | Alto |
| 3.2 | Repetición de firma/aprobación | **Crítico** |
| 3.3 | Reintentos de sincronización offline | Alto |
| 3.4 | Múltiples usuarios del mismo tenant | Medio |
| 3.5 | Múltiples tenants simultáneos | Alto |
| 3.6 | Cambio de IP | Medio |
| 3.7 | Cambio de usuario con mismo dispositivo | Alto |
| 3.8 | Payloads grandes | Medio |
| 3.9 | Payloads malformados | Alto |
| 3.10 | Llamadas repetidas a IA/proxy + agotamiento de cuota diaria (429) | Alto |
| 3.11 | **(V2)** Agotamiento de cuota gratuita Firestore/Storage (lecturas/escrituras masivas, subida masiva de evidencia) — protege el Art. II ($0) | **Crítico** |

## SECCIÓN 4 — ESTRÉS DE WORKFLOWS (11 casos) → Nivel 11 · Vitest · Gate: bloquea
| # | Caso | Severidad |
|---|---|---|
| 4.1 | Registro concurrente de workflows | Alto |
| 4.2 | IDs duplicados (debe rechazar) | Alto |
| 4.3 | Ejecución simultánea del mismo workflow | Alto |
| 4.4 | Workflows distintos por tenant | **Crítico** |
| 4.5 | Dependencias cruzadas entre actividades | Medio |
| 4.6 | Cancelación durante ejecución | Medio |
| 4.7 | Reintento después de fallo | Alto |
| 4.8 | Recuperación después de refresh | Alto |
| 4.9 | Sincronización masiva del outbox | **Crítico** |
| 4.10 | 100 workflows registrados sin degradación | Medio |
| 4.11 | **(V2)** Abuso de máquina de estados: self-approval de PTW propio; salto de estado ilegal (borrador→emitido sin aprobaciones intermedias). Brecha directa del Art. V (HITL) | **Crítico** |

## SECCIÓN 5 — CIBERSEGURIDAD DE APLICACIÓN (17 casos) → S1/S5/S7/S11 · Semgrep+ZAP+tests+Strix · Gate: bloquea
| # | Caso | Severidad |
|---|---|---|
| 5.1 | XSS en campos de texto | Alto |
| 5.2 | Inyección en búsquedas | Alto |
| 5.3 | HTML malicioso en observaciones | Alto |
| 5.4 | SVG malicioso en archivos | Medio |
| 5.5 | PDF con contenido manipulado | **Crítico** |
| 5.6 | QR con URL alterada | **Crítico** |
| 5.7 | Path traversal en nombres de archivo | Alto |
| 5.8 | Subida de archivo con extensión falsa | Alto |
| 5.9 | MIME spoofing | Alto |
| 5.10 | CSRF (si aplica) | Medio |
| 5.11 | CORS mal configurado | Alto |
| 5.12 | Headers de seguridad ausentes | Medio |
| 5.13 | Exposición de API keys | **Crítico** |
| 5.14 | Secretos en logs | **Crítico** |
| 5.15 | PII en logs | Alto |
| 5.16 | **Prompt injection directa e indirecta (RAG/corpus)** — P0 antes de conectar NotebookLM | **Crítico** |
| 5.17 | **(V2)** Conector externo (futuro: Autodesk/SAP/P6) responde payload malicioso que la app procesa sin sanitizar | Alto |

## SECCIÓN 6 — INTEGRIDAD DOCUMENTAL (11 casos) → Nivel 8 · Vitest+crypto · Gate: bloquea (F-PDF)
| # | Caso | Severidad |
|---|---|---|
| 6.1 | Mismo input → mismo hash SHA-256 | **Crítico** |
| 6.2 | Input alterado → hash distinto | **Crítico** |
| 6.3 | QR apunta a verificación correcta | **Crítico** |
| 6.4 | QR manipulado falla | **Crítico** |
| 6.5 | PDF regenerado no cambia silenciosamente | **Crítico** |
| 6.6 | Versión emitida no puede sobrescribirse | **Crítico** |
| 6.7 | Aprobación deja evidencia | Alto |
| 6.8 | Rechazo deja trazabilidad | Alto |
| 6.9 | Databook no mezcla tenants | **Crítico** |
| 6.10 | Documento archivado no vuelve a editable sin evento auditado | Alto |
| 6.11 | **(V2)** Manipulación del DocumentViewModel post-aprobación / pre-render (alterar cifras o fechas antes de sellar sin invalidar el hash de forma detectable) | **Crítico** |

## SECCIÓN 7 — STRESS PILOT SINTÉTICO (hito pre-piloto) → Nivel 11 · scripts · Gate: certificación
Bloque de 6 invariantes (no numerados como casos): noTenantDataLeak · noDuplicateOutboxWrites ·
noUnauthorizedApproval · noUnhandled429 · noQuotaExhaustion · noUnhandledSyncConflict.
Parámetros: 10 tenants × 5 usuarios × 10 workflows × 3 sesiones × 20 mutaciones offline ×
50 PDFs × 50 verificaciones QR. $0 (scripts + datos sintéticos + disciplina de medición).

## CONTEO CANÓNICO (V2 — honesto)
**72 casos numerados** (11+10+11+11+17+11... ver nota) **+ 6 invariantes StressPilot.**
> Nota de conteo (Art. IV): Secciones = 12+10+11+11+17+11 = **72**. La cifra "78" citada en
> despachos previos fue un error del Orquestador — corregida por conteo línea por línea
> (hallazgo Claude B.2.1). Esta tabla manda; cualquier cifra en otro documento se corrige a esta.

## Trazabilidad de herramientas (V2)
- **Strix** (usestrix/strix, Apache-2.0, verificado 14-ago): capa **S11** del programa de
  seguridad — pentest agéntico semanal contra preview. Definido en DOCTRINA-PRUEBAS-SEGURIDAD
  y registrado en el arsenal (CELULA-STACK-V2 §6, fila 4).
- ZAP = S5 (DAST nocturno) · Semgrep = S1 · gitleaks = S3 · fast-check = Nivel 3 · Stryker = Nivel 12.

## REGLAS DE RECHAZO EN PR (sin cambios — mecánicas)
[Ver V1: 12 reglas — sin limit(), RLS desactivada, endpoint sin auth, escritura sin Zod,
secretos, licencia incompatible, registry sin test de concurrencia, outbox sin idempotencia,
PDF/QR/hash sin determinismo, bundle sin justificación, servicio pago, commit directo a main.]

## ORDEN CANÓNICO DE CIERRE (sin cambios — ver V1 / Doctrina V2 Parte 5)
