import { ApuItem as CanonicalApuItem } from '../engineering/apuCalculator';
export * from '../engineering/workerQrEngine';
export * from '../engineering/equipmentRateEngine';

export interface BaseEntity {
  id: string;
  orgId: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface TaskItem extends BaseEntity {
  title: string;
  description?: string;
  status: string;
  priority?: string;
  wbsCode?: string;
  assignee?: string;
  dueDate?: string;
  advancePercent?: number;
  [key: string]: any;
}

export interface SignatureInfo {
  signedBy: string;
  role: string;
  date: string;
  comment?: string;
}

export interface ValuationItem extends BaseEntity {
  number: number;
  periodStart: string;
  periodEnd: string;
  description: string;
  grossAmount: number;
  retentionFCPercent?: number;
  retentionFielCumplimiento?: number;
  retentionLaboralPercent?: number;
  retentionLaboral?: number;
  advancePercent?: number;
  amortizationAnticipo?: number;
  otherDeductions?: number;
  netAmount: number;
  status: 'Borrador' | 'En Revisión' | 'Aprobada' | 'Pagada' | string;
  photos?: string[];
  ownerId?: string;
  signatures?: {
    inspector?: SignatureInfo;
    supervisor?: SignatureInfo;
    gerente?: SignatureInfo;
  };
  [key: string]: any;
}

export interface WeldJoint extends BaseEntity {
  jointNo: string;
  lineNo?: string;
  welderId?: string;
  welderName?: string;
  diameter?: string;
  thickness?: string;
  material?: string;
  process?: string;
  status: string;
  vtStatus?: string;
  ndtType?: string;
  ndtStatus?: string;
  inspector?: string;
  date?: string;
  [key: string]: any;
}

export interface FieldReport extends BaseEntity {
  reportNo: string;
  date: string;
  author?: string;
  notes?: string;
  imagePreview?: string;
  location?: string;
  status?: string;
  tags?: string[];
  [key: string]: any;
}

export interface DocumentItem extends BaseEntity {
  title: string;
  code?: string;
  category?: string;
  fileUrl?: string;
  status?: string;
  version?: string;
  uploadedBy?: string;
  [key: string]: any;
}

export interface InventoryItem extends BaseEntity {
  itemCode: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  minStock?: number;
  location?: string;
  status?: string;
  supplier?: string;
  price?: number;
  [key: string]: any;
}

export interface RouteItem extends BaseEntity {
  name: string;
  startPoint?: string;
  endPoint?: string;
  distanceKm?: number;
  kmlUrl?: string;
  checkpoints?: any[];
  status?: string;
  [key: string]: any;
}

export interface SihoPtwRecord extends BaseEntity {
  ptwCode: string;
  type: string;
  location?: string;
  applicant?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  hazards?: string[];
  controls?: string[];
  [key: string]: any;
}

export interface ApuItem extends BaseEntity, Omit<Partial<CanonicalApuItem>, 'id'> {
  code: string;
  description?: string;
  unit: string;
  unitPrice?: number;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
  status?: string;
  [key: string]: any;
}

export interface WorkerItem extends BaseEntity {
  idCard: string;
  name: string;
  position?: string;
  company?: string;
  status?: string;
  credentialId?: string;
  qrCode?: string;
  medicalExpiry?: string;
  safetyTrainingExpiry?: string;
  wpqCertExpiry?: string;
  fitStatus?: 'Apto' | 'Apto con Restricciones' | 'No Apto' | 'Vencido';
  welderStamp?: string;
  bloodType?: string;
  allergies?: string;
  totalHhtAccumulated?: number;
  [key: string]: any;
}

export interface AttendanceRecordItem extends BaseEntity {
  idempotencyKey: string;
  workerId: string;
  workerName: string;
  nationalId: string;
  role?: string;
  contractor?: string;
  checkInTime: string;
  checkOutTime?: string;
  hoursWorked?: number;
  gateLocation: string;
  accessStatus: 'Verde - Autorizado' | 'Rojo - Denegado';
  denialReason?: string;
  date: string;
  syncState?: 'PENDING_OFFLINE' | 'SYNCED' | 'CORRECTED';
  [key: string]: any;
}

export interface FleetEquipmentItem extends BaseEntity {
  tag: string;
  name: string;
  type: 'Grúa Telescópica' | 'Camión Vacuum' | 'Planta Eléctrica' | 'Compresor de Aire' | 'Motobomba' | 'Retroexcavadora' | string;
  brandModel: string;
  currentHorometer: number;
  lastServiceHorometer: number;
  nextServiceHorometer: number;
  maintenanceIntervalHours: number;
  fuelType: 'Diésel' | 'Gasolina' | 'DIESEL' | 'GASOLINE' | string;
  dailyConsumptionLiters: number;
  expectedLitersPerHr: number;
  status: 'Operativo en Sitio' | 'En Mantenimiento' | 'Fuera de Servicio' | 'Stand-by' | string;
  certExpiryDate: string;
  operatorName: string;
  operatorHourlyRateUsd?: number;
  acquisitionCostUsd?: number;
  residualValuePercent?: number;
  usefulLifeHours?: number;
  operatingHourlyRateUsd?: number;
  standbyHourlyRateUsd?: number;
  idleHourlyRateUsd?: number;
  [key: string]: any;
}

export interface HorometerLogEntry extends BaseEntity {
  equipmentId: string;
  equipmentTag: string;
  date: string;
  previousHorometer: number;
  newHorometer: number;
  deltaHours: number;
  ocrEvidenceUrl?: string;
  registeredBy: string;
  source: 'MANUAL' | 'OCR_VISION' | 'IOT';
  [key: string]: any;
}

export interface FuelLogEntry extends BaseEntity {
  equipmentId: string;
  equipmentTag: string;
  date: string;
  horometerAtRefuel: number;
  litersRefueled: number;
  fuelUnitPriceUsd: number;
  operatingHoursSinceLastRefuel: number;
  actualLitersPerHr: number;
  expectedLitersPerHr: number;
  variancePercent: number;
  alert: boolean;
  alertLevel: 'NONE' | 'WARNING' | 'CRITICAL';
  evidenceUrl?: string;
  registeredBy: string;
  source: 'MANUAL' | 'DISPENSER_LOG' | 'IOT';
  [key: string]: any;
}

export interface EquipmentMaintenanceSchedule extends BaseEntity {
  equipmentId: string;
  equipmentTag: string;
  serviceName: string;
  maintenanceIntervalHours: number;
  lastServiceHorometer: number;
  nextServiceHorometer: number;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  assignedTechnician?: string;
  notes?: string;
  [key: string]: any;
}

