# Inventario de Consultas Firestore — Industrial Control 360

*Fecha de auditoría:* 2026-08-05  
*Sprint:* F-0 — Baseline verificable  

## 1. Resumen Ejecutivo

Este documento contiene el inventario exhaustivo de todas las consultas directas a Firestore (`onSnapshot()` y `getDocs()`) identificadas en los repositorios (`src/lib/repositories/*Repo.ts`) y páginas de la aplicación (`src/pages/*.tsx`).

### Métricas Clave de Consultas:
- **Total `onSnapshot` en Repositorios y Páginas:** 33
- **Total `getDocs` en Repositorios y Páginas:** 4
- **Total `onSnapshot` sin `limit()`:** 33 (100% de las consultas en tiempo real carecen de cláusula `limit()`).
- **Conclusión de Riesgo de Costos FinOps:** Alto riesgo de crecimiento sin techo en consumo de lecturas Firestore cuando el volumen de documentos por proyecto u organización aumente. Se recomienda planificar paginación/limitación en futuros sprints.

---

## 2. Inventario de Repositorios (`src/lib/repositories/*Repo.ts`)

| archivo | método | colección | realtime sí/no | filtro organizationId | orderBy | limit | cursor | riesgo de costo (crece sin techo sí/no) |
|---|---|---|---|---|---|---|---|---|
| `src/lib/repositories/baseRepo.ts` | `getDocs` | Dinámica (`{collectionName}` o subcolección) | no | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/lib/repositories/baseRepo.ts` | `onSnapshot` | Dinámica (`{collectionName}` o subcolección) | sí | sí (`where('orgId', '==', orgId)`) | no | no | no | sí |
| `src/lib/repositories/fleetEquipmentRepo.ts` | `getDocs` | `fleet` (`organizations/{orgId}/projects/{projectId}/fleet`) | no | sí (jerarquía path) | sí (`createdAt desc`) | no | no | sí |
| `src/lib/repositories/fleetEquipmentRepo.ts` | `getDocs` | `fleet_logs` (`organizations/{orgId}/projects/{projectId}/fleet_logs`) | no | sí (jerarquía path) | sí (`createdAt desc`) | no | no | sí |

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
