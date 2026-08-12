# Inventory of Database Write Boundaries (Sprint F-D1)

## Overview
This document registers all database and storage write boundaries across the **IC360-NEXUS** platform (React/Vite client, Offline Outbox engine, Cloud Functions backend, and Firestore database).

To elevate platform reliability to **≥85/100**, every write boundary enforces **runtime Zod schema validation** at the boundary (rejecting invalid payloads before any mutation is executed on Firestore or IndexedDB).

---

## 1. Domain Repositories Layer (`src/lib/repositories/`)
All domain repositories extend `BaseRepository<T>`, which invokes `this.validate(data)` on `.create()` and `this.validatePartial(updates)` on `.update()` using registered Zod schemas.

| Repository | Collection Name | Entity / Module | Zod Schema |
|---|---|---|---|
| `sihoPtwRepo` | `siho_ptw` | Permisos de Trabajo Seguro (PTW IR-S-04) | `SihoPtwRecordSchema` |
| `lotoIsolationsRepo` | `loto_isolations` | Aislamiento LOTO | `LotoIsolationRecordSchema` |
| `valuationsRepo` | `valuations` | Valuaciones y Avance de Contrato | `ValuationRecordSchema` |
| `fieldReportsRepo` | `field_reports` | Reportes de Campo e Inspección | `FieldReportRecordSchema` |
| `projectsRepo` | `projects` | Proyectos e Infraestructuras | `ProjectRecordSchema` |
| `tasksRepo` | `tasks` | Tareas y Paquetes WBS | `TaskRecordSchema` |
| `workersRepo` | `workers` | Personal y Trabajadores | `WorkerRecordSchema` |
| `workerAttendanceRepo` | `worker_attendance` | Control de Asistencia y Accesos QR | `WorkerAttendanceRecordSchema` |
| `fleetEquipmentRepo` | `fleet_equipment` | Equipos Pesados y Maquinaria | `FleetEquipmentRecordSchema` |
| `procurementRepo` | `procurement` | Procura y Suministros | `ProcurementRecordSchema` |
| `inventoryRepo` | `inventory` | Inventario y Almacenes | `InventoryRecordSchema` |
| `routesRepo` | `routes` | Rutas Logísticas | `RouteRecordSchema` |
| `weldJointsRepo` | `weld_joints` | Soldaduras e Inspección END | `WeldJointRecordSchema` |
| `civilStructuresRepo` | `civil_structures` | Obras Civiles y Concreto | `CivilStructureRecordSchema` |
| `dossiersRepo` | `dossiers` | Compilación de Dossiers | `DossierRecordSchema` |
| `deliverablesRepo` | `master_deliverables` | Entregables Maestros | `MasterDeliverableSchema` |
| `expensesRepo` | `expenses` | Control de Gastos y Viáticos | `ExpenseRecordSchema` |
| `documentsRepo` | `documents` | Gestión Documental | `DocumentRecordSchema` |
| `wbsSnapshotsRepo` | `wbs_snapshots` | Instantáneas de WBS | `WbsSnapshotRecordSchema` |
| `standbyMocRepo` | `standby_moc` | MOC y Reclamos por Paradas | `StandbyMocRecordSchema` |
| `hotTapsRepo` | `hot_taps` | Intervenciones Hot Tap | `HotTapRecordSchema` |
| `instrumentLoopsRepo` | `instrument_loops` | Lazos de Instrumentación y Calibración | `InstrumentLoopRecordSchema` |
| `environmentalRepo` | `environmental` | Gestión Ambiental SIHO | `EnvironmentalRecordSchema` |
| `clientPortalsRepo` | `client_portals` | Portales de Cliente | `ClientPortalRecordSchema` |
| `alertsRepo` | `alerts` | Alertas del Sistema | `AlertRecordSchema` |
| `apusRepo` | `apus` | Análisis de Precios Unitarios | `ApuRecordSchema` |

---

## 2. Offline & Outbox Sync Engine (`src/lib/offline/`)
Offline operations captured in low-connectivity conditions are validated before being queued into IndexedDB Dexie Outbox.

- **`queueOutboxOperation`** (`src/lib/offline/outbox.ts`):
  Runs `safeParse` against the registered collection Zod schema before queueing operation in Dexie `outbox`.
- **`saveReportOffline`** (`src/lib/offline/syncEngine.ts`):
  Validates report payload against `FieldReportRecordSchema` before saving to `pendingReports`.
- **`saveValuationOffline`** (`src/lib/offline/syncEngine.ts`):
  Validates valuation payload against `ValuationRecordSchema` before saving to `pendingValuations`.
- **`saveRouteOffline`** (`src/lib/offline/syncEngine.ts`):
  Validates route payload against `RouteRecordSchema` before saving to `pendingRoutes`.

---

## 3. Server-Side Cloud Functions (`functions/src/index.ts`)
Server-side endpoints validate mutation payloads in transactions before updating Firestore documents.

- **`syncOutboxMutation`**:
  Validates incoming `payload` against entity Zod schemas server-side before executing Firestore transactions.
- **`createClientPortal`**:
  Validates client portal metadata (`name`, `orgId`, `linkedProjectIds`, `branding`, `visibilityMatrix`) before setDoc.
- **`callGeminiProxy`**:
  Validates AI request payload structure before proxying to Gemini API.

---

## 4. Workflows Kernel (`src/lib/workflows/runner.ts`)
All 17 canonical workflows (`wf-042` through `wf-077`) define a mandatory Zod schema in `definition.ts`.
- `WorkflowRunner.validateWorkflowData()` is executed before state transitions, hard gate evaluation, and deliverable generation.

---

## 5. Seed Data & QA Generators
- `src/lib/seedDemoData.ts`: Validates generated demo data against domain Zod schemas before populating repositories.
- `scripts/qa/seedQaDataset.ts`: Validates QA seed records against entity schemas prior to Firestore emulator ingestion.
