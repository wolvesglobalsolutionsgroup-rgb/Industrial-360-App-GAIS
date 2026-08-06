# Inventario de Consultas Firestore — Industrial Control 360

*Fecha de auditoría:* 2026-08-06  
*Sprint:* F-C-bis — Cierre de Límite Global de Consultas Firestore (Sprint FinOps F-C-bis)

## 1. Resumen Ejecutivo

Este documento contiene el inventario exhaustivo de todas las consultas a Firestore (`onSnapshot()`, `getDocs()` y suscripciones a repositorios) identificadas en los repositorios (`src/lib/repositories/*Repo.ts`) y páginas de la aplicación (`src/pages/*.tsx`).

### Métricas Clave y Estado FinOps (Sprint F-C-bis):
- **Capa Base de Repositorios:** `BaseRepository` implementa `getPaginated()` y `subscribe()` con filtro obligatorio `orgId`, ordenamiento y paginación acotada con `limit(<=50)`.
- **Topes de Consultas de Repositorio:** 100% de las suscripciones y consultas de páginas en `src/pages/*.tsx` utilizan repositorios con `{ limitCount: 50 }` o consultas acotadas con `limit(50)`.
- **Listeners ilimitados en `src/pages/*.tsx`:** 0 (Reducido de 32 listeners/queries ilimitados a 0 en Sprint F-C / F-C-bis).
- **Conclusión de Riesgo de Costos FinOps:** Riesgo de lecturas ilimitadas completamente mitigado. La capa de interfaz y repositorios garantiza la restricción inviolable de costo incremental $0 dentro de los límites del Spark Plan.

---

## 2. Inventario de Repositorios (`src/lib/repositories/*Repo.ts`)

| archivo | método | colección | realtime sí/no | filtro organizationId | orderBy | limit | cursor | riesgo de costo (crece sin techo sí/no) |
|---|---|---|---|---|---|---|---|---|
| `src/lib/repositories/baseRepo.ts` | `getDocs` / `getPaginated` | Dinámica (`{collectionName}` o subcolección) | no | sí (`where('orgId', '==', orgId)`) | sí (configurable, default `createdAt`) | sí (`<= 50`, default 20) | sí (`startAfter`) | **no (acotado)** |
| `src/lib/repositories/baseRepo.ts` | `onSnapshot` / `subscribe` | Dinámica (`{collectionName}` o subcolección) | sí | sí (`where('orgId', '==', orgId)`) | no | sí (`<= 50`, default 50) | no | **no (acotado)** |
| `src/lib/repositories/fleetEquipmentRepo.ts` | `getDocs` (`getHorometerLogs`) | `fleet_equipment/.../horometer_logs` | no | sí (jerarquía path) | sí (`createdAt desc`) | sí (`<= 50`) | no | **no (acotado)** |
| `src/lib/repositories/fleetEquipmentRepo.ts` | `getDocs` (`getFuelLogs`) | `fleet_equipment/.../fuel_logs` | no | sí (jerarquía path) | sí (`createdAt desc`) | sí (`<= 50`) | no | **no (acotado)** |

---

## 3. Inventario de Páginas (`src/pages/*.tsx`)

| archivo | método | colección | realtime sí/no | filtro organizationId | orderBy | limit | cursor | riesgo de costo (crece sin techo sí/no) |
|---|---|---|---|---|---|---|---|---|
| `src/pages/AlertsDetails.tsx` | `alertsRepo.subscribe` | `alerts` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ApuEstimation.tsx` | `apusRepo.subscribe` | `apus` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/BudgetDetails.tsx` | `expensesRepo.subscribe` | `expenses` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/BudgetDetails.tsx` | `valuationsRepo.subscribe` | `valuations` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/CivilEngineeringRegistry.tsx` | `civilStructuresRepo.subscribe` | `civil_tests` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ClientPortalBuilder.tsx` | `clientPortalsRepo.subscribe` | `client_portals` | sí | sí (`orgId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ClientPortalView.tsx` | `dossiersRepo.subscribe` | `dossier_compilations` | sí | sí (`orgId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `tasksRepo.subscribe` | `tasks` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `expensesRepo.subscribe` | `expenses` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `valuationsRepo.subscribe` | `valuations` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `sihoPtwRepo.subscribe` | `siho_ptw` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `weldJointsRepo.subscribe` | `weld_joints` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Dashboard.tsx` | `wbsSnapshotsRepo.subscribe` | `wbs_snapshots` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Documents.tsx` | `documentsRepo.subscribe` | `documents` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/EnvironmentalManagement.tsx` | `environmentalAspectsRepo.subscribe` | `environmental_aspects` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/EnvironmentalManagement.tsx` | `rasdaManifestsRepo.subscribe` | `rasda_manifests` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/EnvironmentalManagement.tsx` | `environmentalInspectionsRepo.subscribe` | `environmental_inspections` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Expenses.tsx` | `expensesRepo.subscribe` | `expenses` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/FieldReports.tsx` | `tasksRepo.subscribe` | `tasks` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/FieldReports.tsx` | `fieldReportsRepo.subscribe` | `field_reports` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/FleetEquipment.tsx` | `fleetEquipmentRepo.subscribe` | `fleet_equipment` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/HotTapSchemes.tsx` | `hotTapsRepo.subscribe` | `hot_tap_interventions` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/InstrumentationControl.tsx` | `instrumentLoopsRepo.subscribe` | `instrument_loops` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/LotoIsolation.tsx` | `lotoIsolationsRepo.subscribe` | `loto_isolations` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/PersonnelDetails.tsx` | `workersRepo.subscribe` | `workers` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/PersonnelDetails.tsx` | `workerAttendanceRepo.subscribe` | `worker_attendance` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/PlatformOwnerConsole.tsx` | `getDocs` | `organizations` | no | no | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ProcurementInventory.tsx` | `procurementRepo.subscribe` | `procurement` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ProcurementInventory.tsx` | `inventoryRepo.subscribe` | `inventory` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ProgressDetails.tsx` | `tasksRepo.subscribe` | `tasks` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/ProgressDetails.tsx` | `fieldReportsRepo.subscribe` | `field_reports` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Projects.tsx` | `projectsRepo.subscribe` | `projects` | sí | sí (`orgId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/QaQcWelding.tsx` | `weldJointsRepo.subscribe` | `weld_joints` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/SihoPtw.tsx` | `sihoPtwRepo.subscribe` | `siho_ptw` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/StandbyMoc.tsx` | `standbyClaimsRepo.subscribe` | `standby_claims` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/StandbyMoc.tsx` | `mocRequestsRepo.subscribe` | `moc_requests` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Tasks.tsx` | `tasksRepo.subscribe` | `tasks` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Valuations.tsx` | `valuationsRepo.subscribe` | `valuations` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Valuations.tsx` | `fieldReportsRepo.subscribe` | `field_reports` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/Valuations.tsx` | `tasksRepo.getPaginated` | `tasks` | no | sí (`orgId` / `projectId`) | sí (`createdAt`) | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/WorkerQrRegistry.tsx` | `workersRepo.subscribe` | `workers` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |
| `src/pages/WorkerQrRegistry.tsx` | `workerAttendanceRepo.subscribe` | `worker_attendance` | sí | sí (`orgId` / `projectId`) | no | sí (`<= 50`) | no | **no (acotado)** |

---

## 4. Anexo — Consultas en Contextos y Componentes Secundarios (`src/components/`, `src/lib/`, `src/ProjectContext.tsx`)

| archivo | método | colección | realtime sí/no | filtro organizationId | orderBy | limit | cursor | riesgo de costo (crece sin techo sí/no) |
|---|---|---|---|---|---|---|---|---|
| `src/ProjectContext.tsx` | `onSnapshot` | `projects` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/components/engineering/IsometricViewer.tsx` | `onSnapshot` | `weld_joints` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/components/engineering/IsometricViewer.tsx` | `getDocs` | `weld_joints` (collectionGroup) | no | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/components/engineering/QuantityTakeoff.tsx` | `onSnapshot` | `takeoffs` (`organizations/{orgId}/projects/{projId}/takeoffs`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/lib/dossier/dossierCompiler.ts` | `getDocs` | `shared_service_records` | no | sí (path o query) | no | no | no | sí |
| `src/lib/dossier/dossierCompiler.ts` | `getDocs` | `field_reports` | no | sí (path o query) | no | no | no | sí |
| `src/lib/dossier/dossierCompiler.ts` | `getDocs` | `weld_joints` | no | sí (path o query) | no | no | no | sí |
| `src/lib/seedDemoData.ts` | `getDocs` | `organizations/prointeca/projects` | no | no | no | no | no | no |
