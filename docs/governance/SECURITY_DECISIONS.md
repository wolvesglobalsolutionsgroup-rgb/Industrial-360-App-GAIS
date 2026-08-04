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

### D-SEC-05: Perímetro de Backend Proxy Obligatorio para IA y Correo (Sprint B1 & B1.1)
- **Decisión:** Toda invocación a modelos IA (Gemini) o servicios de envío de correo (Resend/SMTP) debe ejecutarse exclusivamente en el backend (Express/Cloud Functions).
- **Control de Acceso y Autorización:** Las peticiones exigen autenticación por Firebase ID Token (`verifyFirebaseToken` / `requireAuth`). La identidad (`uid`), organización (`orgId`) y rol (`role`) se obtienen **únicamente** del token verificado o documento de usuario en Firestore. Queda estrictamente prohibido usar campos del `body` o `query` como fuente de autoridad. Para el envío de correo se requiere rol `superadmin` o `gerente`.
- **Validación de Enlaces de Portal y Comportamiento Fail-Closed (B1.1):** En `/api/send-email`, los enlaces opcionales `portalLink` se evalúan mediante un validador estricto server-side. La URL debe usar protocolo `https:`, no contener credenciales (`username`/`password`) y coincidir de manera **exacta** en `hostname` con un conjunto de hosts autorizados leídos de la variable de entorno `PORTAL_ALLOWED_HOSTS` (CSV). Si `PORTAL_ALLOWED_HOSTS` está ausente, vacío o la URL no cumple con los criterios, la aplicación opera en modo *fail-closed* omitiendo totalmente el enlace del HTML y registrando únicamente la razón redactada (`missing_allowlist`, `invalid_url`, `disallowed_host`) sin exponer la URL original ni detalles de destinatarios.
- **Minimización de Respuestas:** Las respuestas simuladas y de envío exitoso reducen el payload de salida a una estructura mínima (`{ success: true, simulated: true, message: "..." }` o `{ success: true }`), sin devolver recipientes, asuntos, metadatos del proveedor ni fragmentos del cuerpo del mensaje.
- **Manejo de Respuestas y Errores:** Errores internos de proveedores o excepciones no controladas se traducen a mensajes de error genéricos para el cliente, evitando filtración de detalles técnicos. Se generan registros de auditoría redactados (audit logs) con `uid`, `orgId`, `role`, `status` y `timestamp`.
- **Limitaciones de Rate Limit:** El control de tasa se ejecuta en memoria por instancia (Rate Limiter Express/MemoryStore). *Limitación*: En entornos multi-instancia serverless (Cloud Run/Cloud Functions), cada instancia mantiene su contador. Queda como pendiente la integración de almacenamiento distribuido (ej. Redis/Memorystore) para tasa global unificada.
- **Pendientes de Observabilidad:** Integración de alertas automatizadas en Cloud Logging para monitorear picos de respuestas HTTP 403 y 429 por organización.

### D-SEC-06: Pruebas Zero-Trust Multi-Tenant en Firebase Emulator (Sprint C1)
- **Decisión:** La seguridad multi-tenant de Firestore y Storage se demuestra mediante ejecuciones reales en Firebase Emulator (`npm run test:rules` y `npm run test:storage-rules`).
- **Aislamiento Multi-Tenant (15 Tests Firestore):** Se verifican pruebas negativas donde un usuario de Org-A (`prointeca`) intenta leer, escribir, listar o consultar por `collectionGroup` en datos de Org-B (`semax_pino`). Todas las operaciones cruzadas son denegadas con HTTP 403 (`PERMISSION_DENIED`).
- **Aislamiento de Rutas Sensibles:** Las colecciones `/organizations/{orgId}/memberships`, `/counters`, `/document_verifications` y `/audit_logs` prohíben la escritura desde cliente SDK. `audit_logs` es inmutable y de solo lectura para `gerente`/`superadmin` de la misma org. `counters` prohíbe lectura y escritura desde cliente.
- **Restricción de Rol Readonly:** Los usuarios con Custom Claim `role == 'readonly'` pueden consultar documentos de su organización pero tienen denegada la creación (`create`), modificación (`update`) y eliminación (`delete`).

### D-SEC-07: Política de Firebase Storage Industrial Multi-tenant (Sprint C1)
- **Decisión:** Almacenamiento restringido por tipo MIME, tamaño y rol para prevenir cargas inseguras o denegaciones de servicio.
- **Tipos Permitidos en Producción Permanente:**
  - Imágenes (`image/*`) y documentos PDF (`application/pdf`): hasta 20 MB por archivo.
  - Documentos Word (`.docx`, `.doc`) y hojas Excel (`.xlsx`, `.xls`): hasta 10 MB por archivo.
- **Flujo de Staging / Carga Temporal para Archivos Complejos:**
  - Los archivos de ingeniería complejos (XER Primavera P6, BC3 Fiebdc, KML/KMZ, IFC BIM, GLB/STEP) **NO** pueden cargarse directamente a la ubicación permanente de proyectos.
  - Se permite su carga únicamente en la ruta de staging `/organizations/{orgId}/temp_uploads/{userId}/...` con un límite de 50 MB.
  - Un servicio de backend autenticado valida la integridad, sintaxis y formato del archivo complejo en staging antes de moverlo o importar sus entidades a la ubicación final.
- **MIME Types Prohibidos:** Se bloquean extensiones ejecutable o inseguras (`text/html`, `.sh`, `.exe`, `.js`, etc.).
- **Control de Roles en Storage:** El rol `readonly` tiene prohibido subir o eliminar cualquier archivo.

### D-SEC-08: Inventario de Subcolecciones e Incremento Gradual de Whitelist (Sprint C1)
- **Inventario Completo (30 Subcolecciones):**
  Se identificaron 30 subcolecciones bajo la jerarquía `/organizations/{orgId}/projects/{projectId}/...`:
  1. `tasks`, 2. `expenses`, 3. `valuations`, 4. `siho_ptw`, 5. `weld_joints`, 6. `field_reports`, 7. `documents`, 8. `inventory`, 9. `routes`, 10. `engineering_calcs`, 11. `client_portals`, 12. `client_portal_access_logs`, 13. `hot_tap_interventions`, 14. `procurement`, 15. `apus`, 16. `quantity_takeoffs`, 17. `workers`, 18. `worker_attendance`, 19. `wbs_snapshots`, 20. `settings`, 21. `fleet_equipment` / `fleetEquipment`, 22. `environmental_aspects`, 23. `rasda_manifests`, 24. `environmental_inspections`, 25. `standby_claims`, 26. `standby_mocs`, 27. `instrumentation_loops`, 28. `civil_works`, 29. `loto_isolations`, 30. `alerts`.
- **Estrategia de Transición Gradual Whitelist (Sin Romper Módulos):**
  - *Fase 1 (Actual - Sprint C1):* Mantener la regla wildcard `match /{collectionName}/{docId}` validando pertenencia a `orgId` y `projectId`, verificando que `collectionName` no pertenezca a colecciones administrativas (`idempotencyKeys`).
  - *Fase 2 (Siguiente Sprint):* Definir bloques `match /{collectionName}/{docId}` explícitos para las 30 subcolecciones inventariadas junto con esquemas de validación de campos obligatorios por tipo de entidad.
  - *Fase 3 (Hardening Final):* Eliminar el wildcard catch-all en subcolecciones de proyectos para cerrar totalmente el perímetro a únicamente la lista explícita aprobada.

### D-SEC-09: Dataset QA Canónico, Sintético, Idempotente y Reseteable (Sprint A2)
- **Decisión:** El entorno QA opera sobre un tenant fijo dedicado (`orgId: 'ic360-qa-pilot'`, `environment: 'qa'`) con datos 100% sintéticos etiquetados (`datasetId: 'DS-IC360-QA-CANONICAL'`, `version: 'v1.0.0-QA'`). Queda strictly prohibida la interacción o toque de organizaciones o proyectos de producción (`prointeca`, `semax_pino`, etc.).
- **Motor de Sembrado (Dataset Engine):** Implementado en `scripts/qa/seedQaDataset.ts` con tres modos de ejecución:
  - `--dry-run`: Lee las plantillas/fixtures en `scripts/qa/fixtures/`, valida pertenencia de subcolecciones contra la lista D-SEC-08, genera el plan de ejecución y verifica la integridad del manifest sin realizar escrituras ni llamadas de red.
  - `--apply`: Escribe los 41 documentos sintéticos del dataset de forma idempotente (IDs deterministas) mediante Firebase Admin SDK o SDK cliente autenticado en el emulador. Registra un evento de auditoría inmutable en `/organizations/ic360-qa-pilot/audit_logs`. Re-ejecuciones sucesivas mantienen exactamente el mismo número y contenido de documentos (sin duplicación).
  - `--reset`: Elimina exclusivamente todos los documentos pertenecientes a `ic360-qa-pilot` en Firestore. Demostrado mediante prueba automatizada en emulador que otras organizaciones de producción permanecen 100% intactas e inalteradas.
- **Manifest e Integridad:** Todo dataset incluye un `manifest.json` que registra el hash SHA-256 acumulado de todos los datos de prueba, la versión, metadatos y el desglose exacto de conteos por colección.
- **Visualización Obligatoria de QA Banner:** Las vistas operativas detectan automáticamente si el usuario o proyecto está en entorno QA (`ic360-qa-pilot` o `environment: 'qa'`) desplegando en la parte superior el banner distintivo de advertencia `QaBanner` y la marca de agua correspondiente en exportaciones PDF, evitando que cualquier dato sintético sea confundido con datos de ingeniería reales.

### D-SEC-10: Dominio de Expediente Compartido Contratista-Operador y Acceso Exterminado Acotado (Sprint E1)
- **Corrección de Arquitectura de Competencia:** Resuelve definitivamente la falla de conceder membership global de tenant a contratistas o inspectores externos. La colaboración se rige exclusivamente por expedientes compartidos acotados (`SharedServiceRecord`) que vinculan `Contract`, `Service` y `WorkOrder` entre la organización Operadora (`ownerOrgId`) y la Contratista (`contractorOrgId`).
- **Control de Acceso Acotado (`ExternalParticipant`):**
  - Todo usuario externo recibe acceso estrictamente acotado a un `contractId`, `serviceId` o `workOrderId` específico.
  - **Prohibición de Membership:** No se otorga membership global en la organización operadora (`targetOrgId`).
  - **Verificación Multicapa:** Intentos de acceso a contratos no asignados retornan `SCOPE_MISMATCH`. Intentos de acceso a organizaciones distintas retornan `TENANT_MISMATCH`. Accesos vencidos (`now >= expiresAt`) retornan `EXPIRED`. Accesos suspendidos (`revoked === true`) retornan `REVOKED`.
- **Máquina de Estados y Segregación de Funciones:**
  - Ciclo de vida: `draft` → `planned` → `active` → `under_review` → `accepted` → `closed` (o `cancelled`).
  - **Prohibición de Auto-Aprobación:** La empresa contratista o sus supervisores de campo tienen **estrictamente prohibido** mover un expediente a `accepted`. La transición de `under_review` a `accepted` es competencia exclusiva de roles autorizados de la empresa Operadora (`operador_gerente`, `operador_inspector`, `operador_cwi`).
- **Verificación Server-Side Anti-Spoofing:**
  - `ownerOrgId` y `contractorOrgId` se derivan e imponen server-side a partir de metadatos legítimos del contrato y claims verificados. Cualquier intento del cliente de falsificar u sobrescribir los campos `ownerOrgId` o `contractorOrgId` en el payload es detectado y rechazado inmediatamente (`spoofAttemptDetected: true`).
- **Evidencia Mínima Obligatoria y Trazabilidad:**
  - La activación requiere Permiso de Trabajo (PTW) o Aval SIHO. La revisión requiere Dossier de Calidad o Valuación. La aceptación requiere Dictamen CWI/NDT y motivo ≥ 10 caracteres. Toda mutación genera un `AuditEvent` inmutable.
- **Alineación Normativa PDVSA:** Totalmente trazable contra el Manual Corporativo de Contratación PDVSA (Marzo 2024) y la Norma PDVSA SI-S-04 en `docs/domain/NORMATIVE_MATRIX.md`.

### D-SEC-11: Sistema Unificado de Estados UI y Navegación Honesta (Sprint G1)
- **Decisión:** Toda pantalla y control en la interfaz de usuario debe comunicar con honestidad el estado real del sistema (datos verificados con origen, sin datos, acceso denegado o error), eliminando estados engañosos o placeholders vacíos.
- **Componentes Canónicos de Estado (`src/components/states/`):**
  - `EmptyState`: Mensaje claro de ausencia de datos con llamada a la acción opcional, sin generar listas vacías ni simular elementos.
  - `ErrorState`: Captura y presenta fallas técnicas de forma segura, ocultando stack traces o llaves internas y proporcionando opción de reintento.
  - `PermissionDenied`: Informa restricciones de acceso o roles faltantes sin exponer esquemas o estructuras de datos internas.
  - `SourceBadge`: Etiqueta explícitamente el origen de cada dato mostrado en pantalla (`firestore`, `qa_seed`, `calculation`, `norm`, `external_api`).
  - `QaBanner`: Mantiene la visibilidad persistente del entorno QA (`orgId: ic360-qa-pilot` / `environment: qa`) incluyendo el ID del dataset canónico (`DS-IC360-QA-CANONICAL`) y versión (`v1.0.0-QA`), así como marcas de agua en exportaciones de informes.
  - `LastUpdated`: Muestra la marca temporal ISO/relativa del último refresco de datos.
  - `DataStatus`: Envoltorio unificado para la gestión centralizada de estados (`loading`, `error`, `empty`, `ready`, `forbidden`).
- **Navegación Honesta:** Las 31 rutas del catálogo de módulos (`ModulePanel.tsx`) están conectadas al 100% con páginas reales implementadas en `src/App.tsx`. Ninguna opción de menú dirige a componentes 404 o marcadores vacíos no funcionales.




