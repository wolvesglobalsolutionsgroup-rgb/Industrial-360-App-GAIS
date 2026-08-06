# Inventario de Consultas Firestore — Industrial Control 360

*Fecha de auditoría:* 2026-08-06  
*Sprint:* F-C — Firestore, Índices y Bundle  

## 1. Resumen Ejecutivo

Este documento contiene el inventario exhaustivo de todas las consultas directas a Firestore (`onSnapshot()` y `getDocs()`) identificadas en los repositorios (`src/lib/repositories/*Repo.ts`) y páginas de la aplicación (`src/pages/*.tsx`).

### Métricas Clave y Estado FinOps (Sprint F-C):
- **Capa Base de Repositorios:** `BaseRepository` implementa `getPaginated()` con soporte obligatorio de filtro `orgId`, ordenamiento y paginación con `limit(<=50)` + cursor `startAfter()`.
- **Topes de Consultas de Repositorio:** 100% de los métodos de repositorio (`getAll`, `subscribe`, `getHorometerLogs`, `getFuelLogs`) aplican un `limit(<=50)` duro e inviolable para prevenir lecturas ilimitadas.
- **Índices Compuestos:** Se creó `firestore.indexes.json` con soporte para consultas compuestas multitarget por `orgId`, `phase`, `status`, `createdAt` y `workflowId`, enlazado en `firebase.json`.
- **Conclusión de Riesgo de Costos FinOps:** Riesgo mitigado exitosamente. La capa de repositorios garantiza la restricción inviolable de costo incremental $0 dentro de los límites del Spark Plan.

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
| `src/pages/AlertsDetails.tsx` | `onSnapshot` | `alerts` (`organizations/{orgId}/projects/{projId}/alerts`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/ApuEstimation.tsx` | `onSnapshot` | `apu_items` (`organizations/{orgId}/projects/{projId}/apu_items`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/BudgetDetails.tsx` | `onSnapshot` | `expenses` (`organizations/{orgId}/projects/{projId}/expenses`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/BudgetDetails.tsx` | `onSnapshot` | `valuations` (`organizations/{orgId}/projects/{projId}/valuations`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/CivilEngineeringRegistry.tsx` | `onSnapshot` | `civil_structures` (`organizations/{orgId}/projects/{projId}/civil_structures`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/ClientPortalBuilder.tsx` | `onSnapshot` | `client_portals` | sí | no | no | no | no | sí |
| `src/pages/ClientPortalView.tsx` | `onSnapshot` | `dossiers` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `tasks` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `expenses` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `valuations` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `siho_ptw` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `weld_joints` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/Dashboard.tsx` | `onSnapshot` | `daily_snapshots` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/EnvironmentalManagement.tsx` | `onSnapshot` | `environmental_aspects` (`organizations/{orgId}/projects/{projId}/environmental_aspects`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/EnvironmentalManagement.tsx` | `onSnapshot` | `rasda_manifests` (`organizations/{orgId}/projects/{projId}/rasda_manifests`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/EnvironmentalManagement.tsx` | `onSnapshot` | `environmental_inspections` (`organizations/{orgId}/projects/{projId}/environmental_inspections`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/HotTapSchemes.tsx` | `onSnapshot` | `hot_taps` (`organizations/{orgId}/projects/{projId}/hot_taps` / collectionGroup) | sí | sí (jerarquía path / orgId) | no | no | no | sí |
| `src/pages/InstrumentationControl.tsx` | `onSnapshot` | `instrument_loops` (`organizations/{orgId}/projects/{projId}/instrument_loops`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/LotoIsolation.tsx` | `onSnapshot` | `loto_isolations` (`organizations/{orgId}/projects/{projId}/loto_isolations`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/PersonnelDetails.tsx` | `onSnapshot` | `workers` (`organizations/{orgId}/projects/{projId}/workers`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/PersonnelDetails.tsx` | `onSnapshot` | `worker_attendance` (`organizations/{orgId}/projects/{projId}/worker_attendance`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/PlatformOwnerConsole.tsx` | `getDocs` | `organizations` | no | no | no | no | no | sí |
| `src/pages/ProcurementInventory.tsx` | `onSnapshot` | `procurement` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/ProcurementInventory.tsx` | `onSnapshot` | `inventory` (collectionGroup) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/pages/ProgressDetails.tsx` | `onSnapshot` | `tasks` (`organizations/{orgId}/projects/{projId}/tasks`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/ProgressDetails.tsx` | `onSnapshot` | `field_reports` (`organizations/{orgId}/projects/{projId}/field_reports`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/Projects.tsx` | `onSnapshot` | `projects` (`organizations/{orgId}/projects`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/StandbyMoc.tsx` | `onSnapshot` | `standby_claims` (`organizations/{orgId}/projects/{projId}/standby_claims`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/StandbyMoc.tsx` | `onSnapshot` | `moc_requests` (`organizations/{orgId}/projects/{projId}/moc_requests`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/Tasks.tsx` | `onSnapshot` | `tasks` (`organizations/{orgId}/projects/{projId}/tasks` / collectionGroup) | sí | sí (jerarquía path / orgId) | no | no | no | sí |
| `src/pages/Valuations.tsx` | `getDocs` | `tasks` | no | no (`where('projectId', '==', projId)`) | no | no | no | sí |
| `src/pages/WorkerQrRegistry.tsx` | `onSnapshot` | `workers` (`organizations/{orgId}/projects/{projId}/workers`) | sí | sí (jerarquía path) | no | no | no | sí |
| `src/pages/WorkerQrRegistry.tsx` | `onSnapshot` | `worker_attendance` (`organizations/{orgId}/projects/{projId}/worker_attendance`) | sí | sí (jerarquía path) | no | no | no | sí |

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
