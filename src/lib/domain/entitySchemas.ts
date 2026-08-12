import { z } from 'zod';

/*
 * =================================================================================
 * DOMAIN ENTITY ZOD SCHEMAS (SPRINT F-D1)
 * Enforces runtime validation on all database & storage write boundaries.
 * =================================================================================
 */

// 1. PTW (Permisos de Trabajo Seguro)
export const SihoPtwRecordSchema = z.object({
  code: z.string().min(1, 'El código de PTW es obligatorio').or(z.string().min(1)),
  ptwType: z.string().min(1, 'El tipo de PTW es obligatorio').optional(),
  workType: z.string().optional(),
  installationArea: z.string().optional(),
  equipmentDescription: z.string().optional(),
  status: z.string().min(1, 'El estatus es obligatorio'),
  gasTest: z.record(z.string(), z.any()).optional(),
  preStartReadiness: z.record(z.string(), z.any()).optional(),
  contractorEligibility: z.record(z.string(), z.any()).optional(),
  signatures: z.record(z.string(), z.any()).optional(),
}).passthrough();

// 2. LOTO Isolation
export const LotoIsolationRecordSchema = z.object({
  tagNumber: z.string().min(1, 'El número de etiqueta LOTO es obligatorio').or(z.string().min(1)),
  equipmentName: z.string().optional(),
  systemName: z.string().optional(),
  lockBoxCode: z.string().optional(),
  status: z.string().min(1, 'El estatus LOTO es obligatorio'),
  isolations: z.array(z.record(z.string(), z.any())).optional(),
}).passthrough();

// 3. ART (Análisis de Riesgo en el Trabajo)
export const ArtRecordSchema = z.object({
  artCode: z.string().min(1, 'El código de ART es obligatorio').or(z.string().min(1)),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  status: z.string().min(1, 'El estatus del ART es obligatorio'),
  hazardsCount: z.number().int().nonnegative().optional(),
  controlsCount: z.number().int().nonnegative().optional(),
}).passthrough();

// 4. Calibration
export const CalibrationRecordSchema = z.object({
  equipmentCode: z.string().min(1, 'El código de equipo es obligatorio'),
  certificateNumber: z.string().min(1, 'El número de certificado es obligatorio'),
  calibrationDate: z.string().min(1, 'La fecha de calibración es obligatoria'),
  expirationDate: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  status: z.string().min(1, 'El estatus es obligatorio'),
}).passthrough();

// 5. Valuations (Valuaciones de Obra)
export const ValuationRecordSchema = z.object({
  number: z.number().int({ message: 'El número de valuación debe ser entero' }).nonnegative({ message: 'El número de valuación debe ser positivo' }),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  description: z.string().min(1, 'La descripción de la valuación es obligatoria').or(z.string().min(1)),
  grossAmount: z.number().nonnegative({ message: 'El monto bruto debe ser mayor o igual a cero' }),
  netAmount: z.number().nonnegative({ message: 'El monto neto debe ser mayor o igual a cero' }),
  status: z.string().min(1, 'El estatus de la valuación es obligatorio'),
}).passthrough();

// 6. Field Reports
export const FieldReportRecordSchema = z.object({
  reportNo: z.string().optional(),
  date: z.string().optional(),
  author: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

// 7. Tasks & WBS Items
export const TaskRecordSchema = z.object({
  title: z.string().min(1, 'El título de la tarea es obligatorio'),
  status: z.string().optional(),
  priority: z.string().optional(),
  wbsCode: z.string().optional(),
  advancePercent: z.number().min(0, 'El porcentaje debe ser >= 0').max(100, 'El porcentaje debe ser <= 100').optional(),
}).passthrough();

// 8. Weld Joints
export const WeldJointRecordSchema = z.object({
  jointNo: z.string().min(1, 'El número de junta es obligatorio'),
  lineNo: z.string().optional(),
  status: z.string().min(1, 'El estatus de la junta es obligatorio'),
  vtStatus: z.string().optional(),
  ndtStatus: z.string().optional(),
}).passthrough();

// 9. Projects
export const ProjectRecordSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es obligatorio'),
  code: z.string().optional(),
  status: z.string().min(1, 'El estatus del proyecto es obligatorio'),
  budgetAmount: z.number().nonnegative('El presupuesto debe ser positivo o cero').optional(),
}).passthrough();

// 10. Workers
export const WorkerRecordSchema = z.object({
  fullName: z.string().min(1, 'El nombre del trabajador es obligatorio'),
  nationalId: z.string().min(1, 'La cédula o RIF es obligatoria'),
  role: z.string().optional(),
  status: z.string().min(1, 'El estatus del trabajador es obligatorio'),
}).passthrough();

// 11. Worker Attendance
export const WorkerAttendanceRecordSchema = z.object({
  workerId: z.string().min(1, 'El ID de trabajador es obligatorio'),
  timestamp: z.string().optional(),
  type: z.string().min(1, 'El tipo de registro es obligatorio'),
}).passthrough();

// 12. Fleet & Heavy Equipment
export const FleetEquipmentRecordSchema = z.object({
  equipmentCode: z.string().min(1, 'El código de equipo es obligatorio').or(z.string().min(1)),
  type: z.string().optional(),
  status: z.string().min(1, 'El estatus del equipo es obligatorio'),
}).passthrough();

// 13. Procurement
export const ProcurementRecordSchema = z.object({
  itemCode: z.string().min(1, 'El código de ítem de procura es obligatorio').or(z.string().min(1)),
  description: z.string().optional(),
  quantity: z.number().nonnegative('La cantidad debe ser mayor o igual a cero').optional(),
  status: z.string().optional(),
}).passthrough();

// 14. Inventory
export const InventoryRecordSchema = z.object({
  itemCode: z.string().min(1, 'El código de inventario es obligatorio').or(z.string().min(1)),
  description: z.string().optional(),
  quantity: z.number().nonnegative('La cantidad debe ser mayor o igual a cero').optional(),
}).passthrough();

// 15. Routes
export const RouteRecordSchema = z.object({
  code: z.string().min(1, 'El código de ruta es obligatorio').or(z.string().min(1)),
  name: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

// 16. Alerts
export const AlertRecordSchema = z.object({
  message: z.string().min(1, 'El mensaje de alerta es obligatorio'),
  severity: z.string().min(1, 'La gravedad de la alerta es obligatoria'),
  status: z.string().optional(),
}).passthrough();

// 17. Client Portals
export const ClientPortalRecordSchema = z.object({
  name: z.string().min(1, 'El nombre del portal es obligatorio'),
  tokenHash: z.string().min(1, 'El hash del token es obligatorio'),
  expiresAt: z.string().nullable().optional(),
  isRevoked: z.boolean().optional(),
}).passthrough();

// 18. APU (Análisis de Precios Unitarios)
export const ApuRecordSchema = z.object({
  code: z.string().min(1, 'El código de APU es obligatorio'),
  description: z.string().optional(),
  unitCost: z.number().nonnegative('El costo unitario debe ser >= 0').optional(),
}).passthrough();

// 19. Civil Structures
export const CivilStructureRecordSchema = z.object({
  structureCode: z.string().min(1, 'El código de estructura es obligatorio').or(z.string().min(1)),
  description: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

// 20. Dossiers
export const DossierRecordSchema = z.object({
  code: z.string().min(1, 'El código de dossier es obligatorio').or(z.string().min(1)),
  title: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

// 21. Expenses
export const ExpenseRecordSchema = z.object({
  description: z.string().min(1, 'La descripción del gasto es obligatoria').or(z.string().min(1)),
  amount: z.number().nonnegative('El monto del gasto debe ser mayor o igual a cero'),
  status: z.string().optional(),
}).passthrough();

// 22. Hot Taps
export const HotTapRecordSchema = z.object({
  schemeCode: z.string().min(1, 'El código del esquema Hot Tap es obligatorio').or(z.string().min(1)),
  status: z.string().optional(),
}).passthrough();

// 23. Instrument Loops
export const InstrumentLoopRecordSchema = z.object({
  tagNo: z.string().min(1, 'El Tag del lazo de instrumentación es obligatorio').or(z.string().min(1)),
  status: z.string().optional(),
}).passthrough();

// 24. Environmental
export const EnvironmentalRecordSchema = z.object({
  logNumber: z.string().min(1, 'El número de registro ambiental es obligatorio').or(z.string().min(1)),
  status: z.string().optional(),
}).passthrough();

// 25. Standby & MOC
export const StandbyMocRecordSchema = z.object({
  code: z.string().min(1, 'El código de MOC/Reclamo es obligatorio').or(z.string().min(1)),
  status: z.string().optional(),
}).passthrough();

// 26. WBS Snapshots
export const WbsSnapshotRecordSchema = z.object({
  snapshotName: z.string().min(1, 'El nombre de la instantánea es obligatorio').or(z.string().min(1)),
}).passthrough();

// 27. Documents
export const DocumentRecordSchema = z.object({
  title: z.string().min(1, 'El título del documento es obligatorio'),
  status: z.string().optional(),
}).passthrough();


/*
 * Central Collection-to-Schema Map for Repositories and Offline Engine
 */
export const repositorySchemasMap: Record<string, z.ZodSchema<any>> = {
  siho_ptw: SihoPtwRecordSchema,
  loto_isolations: LotoIsolationRecordSchema,
  art: ArtRecordSchema,
  calibrations: CalibrationRecordSchema,
  valuations: ValuationRecordSchema,
  field_reports: FieldReportRecordSchema,
  tasks: TaskRecordSchema,
  weld_joints: WeldJointRecordSchema,
  projects: ProjectRecordSchema,
  workers: WorkerRecordSchema,
  worker_attendance: WorkerAttendanceRecordSchema,
  fleet_equipment: FleetEquipmentRecordSchema,
  procurement: ProcurementRecordSchema,
  inventory: InventoryRecordSchema,
  routes: RouteRecordSchema,
  alerts: AlertRecordSchema,
  client_portals: ClientPortalRecordSchema,
  apus: ApuRecordSchema,
  civil_structures: CivilStructureRecordSchema,
  dossiers: DossierRecordSchema,
  expenses: ExpenseRecordSchema,
  hot_taps: HotTapRecordSchema,
  instrument_loops: InstrumentLoopRecordSchema,
  environmental: EnvironmentalRecordSchema,
  standby_moc: StandbyMocRecordSchema,
  wbs_snapshots: WbsSnapshotRecordSchema,
  documents: DocumentRecordSchema,
};
