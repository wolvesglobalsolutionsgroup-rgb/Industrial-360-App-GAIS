# IC360 — CVE / Excepciones Técnicas y Parámetros Aceptados

## CVE-S17-001: standbyChpMultiplier
- **Sprint**: S17
- **Archivo**: `src/lib/engineering/equipmentRateEngine.ts`
- **Parámetro**: `standbyChpMultiplier`
- **Valor Canónico**: `0.70` (70% del Costo de Posesión y Depreciación CHP en modo stand-by / espera inactiva)
- **Justificación de Ingeniería**: Según la norma COVENIN 2002 y criterios de la práctica recomendada de costos de equipos pesados (ASME / AACE International), los equipos en espera inactiva en sitio sufren depreciación y costo de capital continuo, pero no consumen combustibles, lubricantes ni mantenimiento mayor. El factor 0.70 aplica exclusivamente a la porción CHP mientras el operador o chofer permanece asignado al salario base.
- **Estado**: ACEPTADO Y DOCUMENTADO.
- **Manejo Dinámico**: Para contratos que estipulen una tasa diferente (ej. 0.50 o 0.80), la función `calculateEquipmentRate` acepta `input.policy.standbyChpMultiplier` como parámetro dinámico de la política de alquiler sin alterar la constante canónica de respaldo.

## CVE-S21-001: Diff Viewer Merge JSON Schema Validation
- **Sprint**: S21
- **Archivo**: `src/pages/SyncCenter.tsx` / `src/lib/offline/syncEngine.ts`
- **Componente**: `DiffViewer` / JSON Merge Conflict Resolution
- **Justificación de Arquitectura**: Los payloads de mutación en cola offline (Outbox) contienen deltas JSON parciales para entidades multi-tenant (WBS, APUs, Partes Diarios, MTRs). Al resolver conflictos visuales mediante el visor de diffs, la fusión manual de parches de objetos JSON puede recibir campos con estructuras arbitrarias creadas por el usuario en modo desconectado. Para evitar excepciones de análisis en ejecuciones cliente/servidor, se requiere un validador de esquema de parches con fallback a copia profunda sanitizada e inmutable.
- **Estado**: ACEPTADO Y DOCUMENTADO.
- **Manejo Dinámico**: Toda fusión de objetos JSON en el SyncCenter valida la preservación obligatoria del identificador `id`, `orgId` y `projectId`, descartando mutaciones huérfanas o incompatibles con el esquema canónico del repositorio.

## CVE-FA-001: Runtime Middleware Security Mapping & Trust Proxy Enforcement
- **Sprint**: F-A
- **Archivos**: `server.ts`, `src/middleware/verifyFirebaseToken.ts`, `src/middleware/rateLimiter.ts`, `functions/src/index.ts`, `functions/src/middleware/requireAuth.ts`, `functions/src/middleware/authorizer.ts`, `functions/src/middleware/rateLimit.ts`
- **Mapeo de Middleware por Runtime y Grupo de Rutas**:
  - **Runtime Express Node.js (`server.ts`)**:
    - `app.set('trust proxy', 1)` habilitado explícitamente en `createApp()` antes de los rate limiters.
    - Endpoints de IA (`/api/gemini/proxy`, `/api/callGeminiProxy`) protegidos por middleware `verifyFirebaseToken` y `geminiLimiter`.
    - Endpoint de correo (`/api/send-email`) protegido por middleware `verifyFirebaseToken` y `emailLimiter`.
    - Endpoints públicos de portal y documentos (`/api/get-client-portal`, `/api/verify-document`) protegidos por `publicLimiter` y verificación criptográfica server-side.
  - **Runtime Firebase Cloud Functions (`functions/src/index.ts`)**:
    - Endpoints HTTPS Express-style (`callGeminiProxy`, `sendEmail`) protegidos por `requireAuth` y `rateLimit`.
    - Endpoints Callables (`setUserCustomClaims`, `createClientPortal`, `rotateClientPortalToken`, `revokeClientPortalToken`, `sealDocument`, `syncOutboxMutation`, `issueRegulatoryCode`) protegidos por `authorizeServerSideRequest`.
    - Endpoints de administración de QA (`provisionQaMembership`, `revokeQaMembership`) protegidos por verificación estricta de claim `platformAdmin === true`.
    - Endpoints públicos (`getClientPortal`, `verifyDocument`) protegidos por `checkRateLimit` persistente en Firestore.
- **Justificación de Arquitectura**: Garantiza la imposición de límites de tasa basados en la IP real del cliente (`req.ip`) tras el reverse proxy y elimina toda posibilidad de falsificación mediante cabeceras `X-Forwarded-For` arbitrarias.
- **Estado**: ACEPTADO Y DOCUMENTADO.
