# Arquitectura del Sistema — Industrial Control 360

## 1. Introducción y Visión General

Industrial Control 360 (IC360) es una plataforma SaaS de ingeniería y supervisión para la industria de Oil & Gas. Ofrece capacidades de gestión de obras, valuaciones, control SIHO-A, inspecciones CWI/NDT, trazabilidad de soldadura y compilación de dossiers de calidad.

El sistema está diseñado bajo una arquitectura estricta **Zero-Trust Multi-Tenant** y opera dentro de restricciones financieras de **costo $0/mes** hasta 10 clientes (aprovechando los niveles gratuitos Spark/Firestore, Firebase Functions y Vercel Free Tier).

---

## 2. Diagrama de Contexto de Runtimes y Despliegue

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                    CLIENT BROWSER                       │
                               │  Single Page Application (SPA) React + Tailwind CSS    │
                               └──────────────────────────┬──────────────────────────────┘
                                                          │
                                           ┌──────────────┴──────────────┐
                                           │                             │
                                  Static Assets (SPA)             API Requests (HTTPS & Callables)
                                           │                             │
                                           ▼                             ▼
                        ┌─────────────────────────────────────┐ ┌──────────────────────────────────────┐
                        │      VERCEL STATIC HOSTING          │ │       FIREBASE CLOUD FUNCTIONS       │
                        │                                     │ │                                      │
                        │  - Servidor estático CDN            │ │  - Single Runtime Backend            │
                        │  - Sirve dist/ (index.html, JS, CSS)│ │  - Node.js 18 / Firebase Admin SDK   │
                        │  - Costo: $0/mes (Free Tier)        │ │  - Endpoints HTTPS y Callables       │
                        │  - NO ejecuta Node.js server.ts     │ │  - Costo: $0/mes (Spark/Free Tier)   │
                        └─────────────────────────────────────┘ └──────────────────┬───────────────────┘
                                                                                   │
                                                                                   ▼
                                                                ┌──────────────────────────────────────┐
                                                                │       FIRESTORE MULTI-TENANT DB      │
                                                                │  /organizations/{orgId}/projects/... │
                                                                └──────────────────────────────────────┘
```

---

## 3. Runtime Decision Matrix

| Runtime Component | Entorno de Ejecución | Rol y Propósito | Comportamiento en Producción (Vercel) | Comportamiento en Desarrollo / Local |
|---|---|---|---|---|
| **Vercel CDN** | Producción (`industrial-360.vercel.app`) | Hosting estático de SPA React | Sirve archivos estáticos compilados desde `dist/` | N/A |
| **Firebase Cloud Functions** (`functions/src/index.ts`) | Producción (GCP Serverless) | Runtime Backend Único y Autoritativo | Ejecuta toda la lógica de negocio API (Gemini Proxy, Email, Portales, Verificación, Claim management) | Emulador de Firebase (`npm run emulator`) |
| **Express Dev Server** (`server.ts`) | Desarrollo Local / Preview Container | Servidor local de desarrollo e integración Vite | **Inactivo / No ejecutado en Vercel** (Vercel entrega assets estáticos) | Host middleware de Vite en `http://localhost:3000` con endpoint `/api/health` |

---

## 4. Matriz de Endpoints Backend

| Endpoint / Función | Método / Tipo | Runtime | Middleware de Seguridad Aplicado | Ubicación de Lógica de Negocio | ¿Es Duplicado? |
|---|---|---|---|---|---|
| `/api/health` | `GET` | Express (`server.ts`) | Ninguno | `server.ts` | No |
| `/api/callGeminiProxy` | `POST` (HTTPS) | Cloud Functions (`functions/src/index.ts`) | `requireAuth`, `rateLimit` (20/min) | `functions/src/index.ts` & `src/lib/geminiServer.ts` | Consolidado en Functions |
| `/api/send-email` | `POST` (HTTPS) | Cloud Functions (`functions/src/index.ts`) | `requireAuth`, `rateLimit` (5/min), Rol `superadmin`/`gerente` | `functions/src/index.ts` | Consolidado en Functions |
| `/api/get-client-portal` | `GET`/`POST` (HTTPS) | Cloud Functions (`functions/src/index.ts`) | `checkRateLimit` (30/min por IP+Portal), CORS | `functions/src/index.ts` | Consolidado en Functions |
| `/api/verify-document` | `GET`/`POST` (HTTPS) | Cloud Functions (`functions/src/index.ts`) | `checkRateLimit` (30/min por IP+Resource), CORS | `functions/src/index.ts` | Consolidado en Functions |
| `setUserCustomClaims` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` (roles `superadmin`, `gerente`) | `functions/src/index.ts` | No |
| `ensureOwnClaims` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `context.auth` & verificación autoritativa de membresía | `functions/src/index.ts` | No |
| `createClientPortal` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` (roles `superadmin`, `gerente`) | `functions/src/index.ts` | No |
| `rotateClientPortalToken` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` (roles `superadmin`, `gerente`) | `functions/src/index.ts` | No |
| `revokeClientPortalToken` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` (roles `superadmin`, `gerente`) | `functions/src/index.ts` | No |
| `sealDocument` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` | `functions/src/index.ts` | No |
| `provisionQaMembership` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `platformAdmin === true` claim check | `functions/src/index.ts` | No |
| `revokeQaMembership` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `platformAdmin === true` claim check | `functions/src/index.ts` | No |
| `syncOutboxMutation` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest`, Idempotencia transaccional | `functions/src/index.ts` | No |
| `issueRegulatoryCode` | `Callable` | Cloud Functions (`functions/src/index.ts`) | `authorizeServerSideRequest` | `functions/src/regulatoryIds.ts` | No |

---

## 5. ADR-001: Consolidación de Runtime Backend en Firebase Cloud Functions

### Estatus
**Aceptado** (Sprint F-B)

### Contexto
El análisis de la configuración de despliegue en `vercel.json` y los scripts de `package.json` confirmó que Vercel aloja la aplicación en modo **Single Page Application (SPA) estática**, sirviendo los archivos compilados del directorio `dist/`. Vercel no ejecuta el servidor Node.js Express de `server.ts` en producción.

Anteriormente existían dos runtimes backend con lógica de negocio duplicada:
1. Servidor Express en `server.ts` (con handlers para Gemini Proxy, Email, Portales y Documentos).
2. Firebase Cloud Functions en `functions/src/index.ts` (con funciones idénticas HTTPS y Callables).

Esta duplicación violaba el principio DRY, incrementaba la superficie de ataque y creaba confusión sobre qué middleware o rate limiter era el autoritativo.

### Decisión
Se adopta la **Opción A (Cloud Functions como Runtime Único de Producción)**:

1. **Firebase Cloud Functions (`functions/src/index.ts`)** es la **única fuente de verdad autoritativa** para todos los endpoints backend en producción.
2. **`server.ts`** se reserva exclusivamente como servidor de desarrollo local (desarrollo con Vite middleware via `npm run dev`) y host de contenedores de prueba, conservando únicamente el endpoint de verificación de salud `/api/health`.
3. Todas las rutas de negocio duplicadas en `server.ts` (`/api/callGeminiProxy`, `/api/gemini/proxy`, `/api/send-email`, `/api/get-client-portal`, `/api/verify-document`) son deprecadas y retiradas del ruteo activo de `server.ts`, dejando documentación explícita referenciando su consolidación en Cloud Functions.

### Justificación
1. **Garantía de Costo $0**: Mantiene el despliegue 100% dentro de la cuota gratuita (Vercel Free Tier para archivos estáticos y Firebase Spark Tier para Cloud Functions). No requiere instancias pagadas de Cloud Run ni servicios adicionales de servidor.
2. **Mantenibilidad y DRY**: Elimina la duplicación de código de handlers y reglas de negocio entre Express y Cloud Functions.
3. **Reducción de Superficie de Ataque**: Toda autenticación, autorización y rate limiting se centraliza en el pipeline estandarizado de middlewares de Firebase (`requireAuth`, `authorizer.ts`, `rateLimit.ts`).
4. **Claridad de Arquitectura**: Frontend estático en CDN (Vercel) + Backend Serverless en Cloud Functions (GCP/Firebase).

---

## 6. Jerarquía de Almacenamiento Multi-Tenant en Firestore

Toda la información operativa de proyectos se organiza de forma estricta bajo la siguiente jerarquía de colecciones:

```text
/organizations/{orgId}
  ├── /projects/{projectId}
  │     ├── /valuations/{valuationId}
  │     ├── /tasks/{taskId}
  │     ├── /weld_joints/{weldId}
  │     ├── /field_reports/{reportId}
  │     ├── /siho_ptw/{ptwId}
  │     └── /dossier_compilations/{dossierId}
  └── /client_portal_access_logs/{logId}
```

---

## 7. Reglas de Consultas Multi-Tenant

1. **Consultas Directas por Proyecto**:
   Se utiliza la ruta completa: `collection(db, 'organizations', orgId, 'projects', projectId, 'valuations')`.

2. **Consultas Agregadas por Organización (Collection Group Queries)**:
   Se utilizan consultas de grupo de colecciones filtradas estrictamente por `orgId`:
   `query(collectionGroup(db, 'valuations'), where('orgId', '==', orgId))`.

3. **Inmutabilidad y Auditoría**:
   El `orgId` y `projectId` son obligatorios en los payloads de creación de documentos para garantizar la integridad referencial y prevenir brechas de aislamiento de datos entre inquilinos.
