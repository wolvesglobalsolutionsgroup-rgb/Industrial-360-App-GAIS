import { ApuItem as CanonicalApuItem } from '../engineering/apuCalculator';

export interface BaseEntity {
  id: string;
  orgId: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
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
  qrCode?: string;
  medicalExpiry?: string;
  safetyTrainingExpiry?: string;
  [key: string]: any;
}
