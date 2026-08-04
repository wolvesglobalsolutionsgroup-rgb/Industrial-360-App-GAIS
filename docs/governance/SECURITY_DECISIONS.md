# Decisiones de Seguridad y Registro de Hallazgos — IC360

## 1. Regla General de Cobertura de Seguridad

> **REGLA MANDATORIA:** Ningún documento de arquitectura, seguridad o gobernanza de Industrial Control 360 puede afirmar cobertura de seguridad absoluta, mitigación completa o ausencia de vulnerabilidades sin enlazar directamente al SHA del commit publicado en GitHub, la evidencia ejecutable de pruebas y el dictamen de una auditoría independiente.

---

## 2. Registro de Hallazgos de Seguridad (F-01 a F-08)

| ID | Descripción del Hallazgo | Estado Inicial | Evidencia Actual | Limitación / Alcance | Acción Siguiente | Referencia Ledger |
|---|---|---|---|---|---|---|
| **F-01** | Endpoints Express sin autenticación previa / Proxy Gemini expuesto | `EVIDENCE_READY` | `server.ts`, `functions/src/middleware/authorizer.ts` | Requiere auditoría independiente sobre SHA publicado en remoto | Auditoría sobre SHA `79993ed77bba76fa456afffce1aaf4038841aa01` | `F-01` en `SPRINT_LEDGER.md` |
| **F-02** | Aseveración de mitigación CVE imprecisa en documentación | `EVIDENCE_READY` | `docs/security/CVE_EXCEPTIONS.md` | Verificación de consistencia documental | Confirmación en auditoría independiente | `F-02` en `SPRINT_LEDGER.md` |
| **F-03** | Riesgo de exposición de API Keys en bundle cliente de React | `EVIDENCE_READY` | Proxy en `server.ts`, ausencia de `VITE_*` con secretos en `src/` | Escaneo estático en CI | Mantener validación continua con `npm run audit:no-hardcoded-tenant` | `B1` en `SPRINT_LEDGER.md` |
| **F-04** | Aislamiento multi-tenant en Firebase Storage | `EVIDENCE_READY` | `storage.rules`, `tests/storage/storageRules.test.ts` (5 tests) | Validación en emulador de Storage | Confirmar en auditoría remota de reglas | `C1` en `SPRINT_LEDGER.md` |
| **F-05** | Inmutabilidad de colecciones de sistema (`audit_logs`, `idempotencyKeys`) | `EVIDENCE_READY` | `firestore.rules`, `tests/rules/securityRules.test.ts` (Casos 4, 7, 9) | Pruebas C1.A locales pendientes de commit aislado | Publicación atómica de pruebas C1.A | `C1` en `SPRINT_LEDGER.md` |
| **F-06** | Prevención de auto-escalación de rol en `/users/{uid}` | `EVIDENCE_READY` | `firestore.rules`, `tests/rules/securityRules.test.ts` (Casos 6, 12) | Pruebas C1.A locales pendientes de commit aislado | Confirmar en auditoría remota | `C1` en `SPRINT_LEDGER.md` |
| **F-07** | Aislamiento multi-tenant en consultas `collectionGroup` | `EVIDENCE_READY` | `firestore.rules`, `tests/rules/securityRules.test.ts` (Caso 11) | Pruebas C1.A locales pendientes de commit aislado | Confirmar en auditoría remota | `C1` en `SPRINT_LEDGER.md` |
| **F-08** | Gestión de sesiones y revocación de tokens en modo offline | `NO_VERIFICADO` | `src/lib/offlineSync.ts`, `functions/src/middleware/middleware.ts` | Falta auditoría de revocación activa de tokens JWT | Planificar pruebas de expiración e invalidación de token | `C1` en `SPRINT_LEDGER.md` |

---

## 3. Matriz de Decisiones Técnicas de Seguridad

### D-SEC-01: Arquitectura de Proxy Obligatorio para Modelos IA
- **Decisión:** Ninguna llamada al SDK `@google/genai` o API de Gemini se realiza directamente desde el frontend React (`src/pages/` o `src/components/`).
- **Implementación:** Todas las solicitudes pasan por `/api/callGeminiProxy` o Cloud Functions protegidas con `requireAuth` y verificación de pertenencia a `orgId`.

### D-SEC-02: Zero-Trust Multi-Tenant en Firestore y Storage
- **Decisión:** El aislamiento multi-tenant se aplica mediante el Custom Claim `orgId` presente en el token JWT verificado por Firebase Authentication.
- **Regla por Defecto:** Toda ruta o colección no explícitamente permitida se deniega mediante la regla `match /{document=**} { allow read, write: if false; }`.

### D-SEC-03: Manejo de Secretos y Claves de API
- **Decisión:** Las claves secretas residen únicamente en variables de entorno del servidor. Está estrictamente prohibido pasar secretos mediante `vite.config.ts` `define` o prefijos `VITE_`.

### D-SEC-04: Integridad de Indicadores de Tablero y Eliminación de Mocks (A1)
- **Decisión:** El Dashboard sólo presenta métricas reales derivadas de consultas filtradas por `orgId`. Si no existen datos o el usuario carece de `orgId`, se muestra un estado honesto de no disponible/vacío ("Sin dato") sin simular ni interpolar números o series de tiempo.

### D-SEC-05: Perímetro de Backend Proxy Obligatorio para IA y Correo (Sprint B1)
- **Decisión:** Toda invocación a modelos IA (Gemini) o servicios de envío de correo (Resend/SMTP) debe ejecutarse exclusivamente en el backend (Express/Cloud Functions).
- **Control de Acceso y Autorización:** Las peticiones exigen autenticación por Firebase ID Token (`verifyFirebaseToken` / `requireAuth`). La identidad (`uid`), organización (`orgId`) y rol (`role`) se obtienen **únicamente** del token verificado o documento de usuario en Firestore. Queda estrictamente prohibido usar campos del `body` o `query` como fuente de autoridad. Para el envío de correo se requiere rol `superadmin` o `gerente`.
- **Manejo de Respuestas y Errores:** Errores internos de proveedores o excepciones no controladas se traducen a mensajes de error genéricos para el cliente, evitando filtración de detalles técnicos. Se generan registros de auditoría redactados (audit logs) con `uid`, `orgId`, `role`, `status` y `timestamp`.
- **Limitaciones de Rate Limit:** El control de tasa se ejecuta en memoria por instancia (Rate Limiter Express/MemoryStore). *Limitación*: En entornos multi-instancia serverless (Cloud Run/Cloud Functions), cada instancia mantiene su contador. Queda como pendiente la integración de almacenamiento distribuido (ej. Redis/Memorystore) para tasa global unificada.
- **Pendientes de Observabilidad:** Integración de alertas automatizadas en Cloud Logging para monitorear picos de respuestas HTTP 403 y 429 por organización.

