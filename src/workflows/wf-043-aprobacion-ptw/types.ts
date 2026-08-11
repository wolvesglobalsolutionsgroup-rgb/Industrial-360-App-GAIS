import { z } from 'zod';

export type PtwState =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'ISSUED'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'ARCHIVED';

export interface ContractorEligibility {
  contractorRif: string;
  contractorName: string;
  contractorStatus: 'APTA' | 'SUSPENDIDA' | 'PENDING_EVALUATION';
  sihoaPlanApproved: boolean;
  sihoaPlanCode: string;
}

export interface PreStartReadiness {
  artCode: string; // PDVSA IR-S-17
  artApproved: boolean;
  procedureCode: string; // PDVSA SI-S-20
  procedureApproved: boolean;
  emergencyPlanCode: string;
  specialCertificatesRequired: Array<
    | 'confinado'
    | 'izaje'
    | 'radiacion'
    | 'excavacion'
    | 'electrico'
    | 'subacuatico'
    | 'hot_tapping'
    | 'compartida'
    | 'altura'
    | 'fumigacion'
    | 'soldadura'
  >;
}

export interface GasTestRecord {
  testTime: string;
  evaluatorName: string;
  evaluatorId: string;
  evaluatorCertificate: string;
  equipmentUsed: string;
  equipoMultigasSerial: string;
  calibrationExpiryDate: string;
  lelPercentage: number;
  o2Percentage: number;
  h2sPpm: number;
  so2Ppm: number;
  coPpm: number;
  co2Ppm: number;
  benzenePpm: number;
  frequency: 'unica' | 'continua' | 'periodica';
  monitoringFrequencyHours: number;
}

export interface PreparationChecklist {
  washed: boolean;
  isolated: boolean;
  purged: boolean;
  vented: boolean;
  inerted: boolean;
  depressurized: boolean;
  drained: boolean;
  noApply: boolean;
}

export interface VerificationConditions {
  energySourcesIsolated: boolean;
  electricalClassifiedAreaChecked: boolean;
  certificatesDisseminated: boolean;
  pyrophoricChecked: boolean;
  artDisseminated: boolean;
  ppeAvailable: boolean;
  fireEquipmentOnSite: boolean;
  adjacentHazardsControlled: boolean;
  weatherConditionsSafe: boolean;
  areaDemarcated: boolean;
  workersNotified: boolean;
  emisorReceptorCertValid: boolean;
  instrumentBypassAuthorized: boolean;
  instrumentBypassTag: string;
  otherConditions: string;
}

export interface ManagementOfChange {
  mocNumber: string;
  mocType: 'NO_APLICA' | 'TEMPORAL' | 'PERMANENTE' | 'EMERGENCIA';
  mocApprovedBy: string;
}

export interface AnexoBConfinados {
  sapOrderNumber: string;
  certificateNumber: string;
  installationUnit: string;
  equipment: string;
  hazardFactors: Array<string>;
  isolationState: string;
  ppeRequired: Array<string>;
  emergencyEquipment: Array<string>;
  maxVoltage: number;
  observerName: string;
  observerId: string;
  rescuerName: string;
  rescuerId: string;
}

export interface AnexoCIzamiento {
  sapOrderNumber: string;
  certificateNumber: string;
  craneType: string;
  craneSerial: string;
  craneCertExpiry: string;
  craneCapacityTn: number;
  loadWeightTn: number;
  loadRatioPercentage: number;
  riggerPresent: boolean;
  operatorCertExpiry: string;
}

export interface AnexoDRadiaciones {
  certificateNumber: string;
  rnpfegriNumber: string;
  isotopeType: string;
  activityCi: number;
  doseRateSurfaceMsv: number;
  doseRate1mMsv: number;
  capraApprovedBy: string;
}

export interface AnexoEExcavacion {
  certificateNumber: string;
  dimensionsLWA: { length: number; width: number; depth: number };
  purpose: string;
  soilType: 'ESTABLE' | 'MEDIANAMENTE_ESTABLE' | 'POCO_ESTABLE' | 'ROCA';
  subterraneanServicesSignatures: Array<{ service: string; supervisorName: string; ci: string; approved: boolean }>;
}

export interface AnexoFElectrico {
  certificateNumber: string;
  isDeenergized: boolean;
  isControlRisk: boolean;
  lotoMultilockApplied: boolean;
  unifilarDiagramAvailable: boolean;
  approvedByLoadDispatcher: string;
}

export interface AnexoGSubacuatico {
  certificateNumber: string;
  diverPairAssigned: boolean;
  diverCertExpiry: string;
  airSupplyType: 'AUTONOMO' | 'NO_AUTONOMO';
  communicationType: string;
}

export interface AnexoHHotTapping {
  certificateNumber: string;
  lineDiameter: string;
  operatingPressure: number;
  operatingTemp: number;
  centralWorkshopCertNumber: string;
  fullBoreValveCertNumber: string;
  requisitorApproval: string;
}

export interface AnexoICompartidas {
  certificateNumber: string;
  affectedGerencias: Array<{ gerenciaName: string; supervisorName: string; signedDate: string; approved: boolean }>;
  safetyCorridorWidthMeters: number;
}

export interface AnexoJAltura {
  certificateNumber: string;
  scaffoldCertified: boolean;
  scaffolderCertNumber: string;
  anchorPointsOk: boolean;
  doubleLanyardHarnessUsed: boolean;
  occupationalHealthMedicalOk: boolean;
}

export interface AnexoKFumigacion {
  certificateNumber: string;
  insaiPermitNumber: string;
  mppsaludCertNumber: string;
  chemicalProduct: string;
  activeIngredients: string;
  residualTimeHours: number;
  msdsDisseminated: boolean;
}

export interface AnexoLSoldadura {
  certificateNumber: string;
  wpsNumber: string;
  welderCertificates: Array<{ welderName: string; certNumber: string; certExpiry: string }>;
  weldingMachineSerials: Array<{ machineSerial: string; certExpiry: string; groundConnected: boolean }>;
}

export interface ExtensionControl {
  requested: boolean;
  extendedUntilTime: string;
  extensionHours: number;
  initialConditionsUnchanged: boolean;
  sameEmisorReceptorEjecutor: boolean;
  reason: string;
  gasTest: { lelPercentage: number; o2Percentage: number; h2sPpm: number };
  emisorSigned: boolean;
  receptorSigned: boolean;
  ejecutorSigned: boolean;
}

export interface CloseoutControl {
  closedAtTime: string;
  closedDate: string;
  areaCleanAndOrderly: boolean;
  locksRemovedAndReconnected: boolean;
  workCompletedAsSpecified: boolean;
  isCancelled: boolean;
  cancelReason: string;
  cancelTime: string;
  cancelledByRole: string;
  cancelledByName: string;
  cancelledById: string;
}

export interface PtwSigner {
  name: string;
  ci: string;
  certNumber: string;
  role: 'EMISOR' | 'RECEPTOR' | 'EJECUTOR';
  organization: string;
  status: 'PENDING' | 'SIGNED';
  signedAt?: string;
}

export interface PendingExternalParameter {
  parameterId: string;
  parameterName: string;
  expectedSource: string;
  warningMessage: string;
  status: 'PENDING_EXTERNAL_PARAMETER' | 'RESOLVED';
  value?: any;
}

export interface PtwApprovalData {
  contractorEligibility: ContractorEligibility;
  preStartReadiness: PreStartReadiness;
  ptwCode: string;
  sapOrderNumber: string;
  installationArea: string;
  equipmentDescription: string;
  workDescription: string;
  workType: 'frio' | 'caliente';
  isPlantShutdownOrMajorMaint: boolean;
  issueDate: string;
  startTime: string;
  validUntilTime: string;
  maxDurationHours: number;
  gasTest: GasTestRecord;
  preparationChecklist: PreparationChecklist;
  verificationConditions: VerificationConditions;
  managementOfChange: ManagementOfChange;
  
  // Anexos
  anexoBConfinados?: AnexoBConfinados;
  anexoCIzamiento?: AnexoCIzamiento;
  anexoDRadiaciones?: AnexoDRadiaciones;
  anexoEExcavacion?: AnexoEExcavacion;
  anexoFElectrico?: AnexoFElectrico;
  anexoGSubacuatico?: AnexoGSubacuatico;
  anexoHHotTapping?: AnexoHHotTapping;
  anexoICompartidas?: AnexoICompartidas;
  anexoJAltura?: AnexoJAltura;
  anexoKFumigacion?: AnexoKFumigacion;
  anexoLSoldadura?: AnexoLSoldadura;

  extension: ExtensionControl;
  closeout: CloseoutControl;
  signers: {
    emisor: PtwSigner;
    receptor: PtwSigner;
    ejecutor: PtwSigner;
  };
  pendingExternalParameters: PendingExternalParameter[];
  status: PtwState;
}

export function createDefaultPtwData(): PtwApprovalData {
  return {
    contractorEligibility: {
      contractorRif: '',
      contractorName: '',
      contractorStatus: 'PENDING_EVALUATION',
      sihoaPlanApproved: false,
      sihoaPlanCode: '',
    },
    preStartReadiness: {
      artCode: '',
      artApproved: false,
      procedureCode: '',
      procedureApproved: false,
      emergencyPlanCode: '',
      specialCertificatesRequired: [],
    },
    ptwCode: '',
    sapOrderNumber: '',
    installationArea: '',
    equipmentDescription: '',
    workDescription: '',
    workType: 'frio',
    isPlantShutdownOrMajorMaint: false,
    issueDate: '',
    startTime: '',
    validUntilTime: '',
    maxDurationHours: 8,
    gasTest: {
      testTime: '',
      evaluatorName: '',
      evaluatorId: '',
      evaluatorCertificate: '',
      equipmentUsed: '',
      equipoMultigasSerial: '',
      calibrationExpiryDate: '',
      lelPercentage: 0,
      o2Percentage: 20.9,
      h2sPpm: 0,
      so2Ppm: 0,
      coPpm: 0,
      co2Ppm: 0,
      benzenePpm: 0,
      frequency: 'unica',
      monitoringFrequencyHours: 1,
    },
    preparationChecklist: {
      washed: false,
      isolated: false,
      purged: false,
      vented: false,
      inerted: false,
      depressurized: false,
      drained: false,
      noApply: true,
    },
    verificationConditions: {
      energySourcesIsolated: false,
      electricalClassifiedAreaChecked: false,
      certificatesDisseminated: false,
      pyrophoricChecked: false,
      artDisseminated: false,
      ppeAvailable: false,
      fireEquipmentOnSite: false,
      adjacentHazardsControlled: false,
      weatherConditionsSafe: false,
      areaDemarcated: false,
      workersNotified: false,
      emisorReceptorCertValid: false,
      instrumentBypassAuthorized: false,
      instrumentBypassTag: '',
      otherConditions: '',
    },
    managementOfChange: {
      mocNumber: '',
      mocType: 'NO_APLICA',
      mocApprovedBy: '',
    },
    extension: {
      requested: false,
      extendedUntilTime: '',
      extensionHours: 0,
      initialConditionsUnchanged: true,
      sameEmisorReceptorEjecutor: true,
      reason: '',
      gasTest: { lelPercentage: 0, o2Percentage: 20.9, h2sPpm: 0 },
      emisorSigned: false,
      receptorSigned: false,
      ejecutorSigned: false,
    },
    closeout: {
      closedAtTime: '',
      closedDate: '',
      areaCleanAndOrderly: false,
      locksRemovedAndReconnected: false,
      workCompletedAsSpecified: false,
      isCancelled: false,
      cancelReason: '',
      cancelTime: '',
      cancelledByRole: '',
      cancelledByName: '',
      cancelledById: '',
    },
    signers: {
      emisor: {
        name: '',
        ci: '',
        certNumber: '',
        role: 'EMISOR',
        organization: '',
        status: 'PENDING',
      },
      receptor: {
        name: '',
        ci: '',
        certNumber: '',
        role: 'RECEPTOR',
        organization: '',
        status: 'PENDING',
      },
      ejecutor: {
        name: '',
        ci: '',
        certNumber: '',
        role: 'EJECUTOR',
        organization: '',
        status: 'PENDING',
      },
    },
    pendingExternalParameters: [],
    status: 'DRAFT',
  };
}

export const PtwApprovalSchema: z.ZodType<PtwApprovalData> = z.object({
  contractorEligibility: z.object({
    contractorRif: z.string(),
    contractorName: z.string().min(2, 'Nombre de contratista es obligatorio'),
    contractorStatus: z.enum(['APTA', 'SUSPENDIDA', 'PENDING_EVALUATION']),
    sihoaPlanApproved: z.boolean(),
    sihoaPlanCode: z.string(),
  }),
  preStartReadiness: z.object({
    artCode: z.string().min(2, 'Código ART (IR-S-17) es obligatorio'),
    artApproved: z.boolean(),
    procedureCode: z.string().min(2, 'Código del Procedimiento (SI-S-20) es obligatorio'),
    procedureApproved: z.boolean(),
    emergencyPlanCode: z.string(),
    specialCertificatesRequired: z.array(
      z.enum([
        'confinado',
        'izaje',
        'radiacion',
        'excavacion',
        'electrico',
        'subacuatico',
        'hot_tapping',
        'compartida',
        'altura',
        'fumigacion',
        'soldadura',
      ])
    ),
  }),
  ptwCode: z.string().min(3, 'El código PTW debe tener al menos 3 caracteres'),
  sapOrderNumber: z.string(),
  installationArea: z.string().min(2, 'La instalación/área es obligatoria'),
  equipmentDescription: z.string(),
  workDescription: z.string().min(5, 'La descripción del trabajo es obligatoria'),
  workType: z.enum(['frio', 'caliente']),
  isPlantShutdownOrMajorMaint: z.boolean(),
  issueDate: z.string(),
  startTime: z.string(),
  validUntilTime: z.string(),
  maxDurationHours: z.number().min(1).max(12),
  gasTest: z.object({
    testTime: z.string().min(1, 'La hora de la prueba de gas es obligatoria'),
    evaluatorName: z.string(),
    evaluatorId: z.string(),
    evaluatorCertificate: z.string(),
    equipmentUsed: z.string(),
    equipoMultigasSerial: z.string().min(1, 'Serial Multigas es obligatorio (PDVSA IR-S-04)'),
    calibrationExpiryDate: z.string(),
    lelPercentage: z.number().min(0).max(100),
    o2Percentage: z.number().min(0).max(100),
    h2sPpm: z.number().min(0),
    so2Ppm: z.number(),
    coPpm: z.number(),
    co2Ppm: z.number(),
    benzenePpm: z.number(),
    frequency: z.enum(['unica', 'continua', 'periodica']),
    monitoringFrequencyHours: z.number(),
  }),
  preparationChecklist: z.object({
    washed: z.boolean(),
    isolated: z.boolean(),
    purged: z.boolean(),
    vented: z.boolean(),
    inerted: z.boolean(),
    depressurized: z.boolean(),
    drained: z.boolean(),
    noApply: z.boolean(),
  }),
  verificationConditions: z.object({
    energySourcesIsolated: z.boolean(),
    electricalClassifiedAreaChecked: z.boolean(),
    certificatesDisseminated: z.boolean(),
    pyrophoricChecked: z.boolean(),
    artDisseminated: z.boolean(),
    ppeAvailable: z.boolean(),
    fireEquipmentOnSite: z.boolean(),
    adjacentHazardsControlled: z.boolean(),
    weatherConditionsSafe: z.boolean(),
    areaDemarcated: z.boolean(),
    workersNotified: z.boolean(),
    emisorReceptorCertValid: z.boolean(),
    instrumentBypassAuthorized: z.boolean(),
    instrumentBypassTag: z.string(),
    otherConditions: z.string(),
  }),
  managementOfChange: z.object({
    mocNumber: z.string(),
    mocType: z.enum(['NO_APLICA', 'TEMPORAL', 'PERMANENTE', 'EMERGENCIA']),
    mocApprovedBy: z.string(),
  }),
  anexoBConfinados: z.any().optional(),
  anexoCIzamiento: z.any().optional(),
  anexoDRadiaciones: z.any().optional(),
  anexoEExcavacion: z.any().optional(),
  anexoFElectrico: z.any().optional(),
  anexoGSubacuatico: z.any().optional(),
  anexoHHotTapping: z.any().optional(),
  anexoICompartidas: z.any().optional(),
  anexoJAltura: z.any().optional(),
  anexoKFumigacion: z.any().optional(),
  anexoLSoldadura: z.any().optional(),
  extension: z.object({
    requested: z.boolean(),
    extendedUntilTime: z.string(),
    extensionHours: z.number().max(2, 'La prórroga no puede exceder de 2 horas (PDVSA IR-S-04 8.6)'),
    initialConditionsUnchanged: z.boolean(),
    sameEmisorReceptorEjecutor: z.boolean(),
    reason: z.string(),
    gasTest: z.object({
      lelPercentage: z.number(),
      o2Percentage: z.number(),
      h2sPpm: z.number(),
    }),
    emisorSigned: z.boolean(),
    receptorSigned: z.boolean(),
    ejecutorSigned: z.boolean(),
  }),
  closeout: z.object({
    closedAtTime: z.string(),
    closedDate: z.string(),
    areaCleanAndOrderly: z.boolean(),
    locksRemovedAndReconnected: z.boolean(),
    workCompletedAsSpecified: z.boolean(),
    isCancelled: z.boolean(),
    cancelReason: z.string(),
    cancelTime: z.string(),
    cancelledByRole: z.string(),
    cancelledByName: z.string(),
    cancelledById: z.string(),
  }),
  signers: z.object({
    emisor: z.object({
      name: z.string().min(2, 'Nombre del Emisor es obligatorio'),
      ci: z.string(),
      certNumber: z.string().min(2, 'Certificación de Emisor es obligatoria'),
      role: z.literal('EMISOR'),
      organization: z.string(),
      status: z.enum(['PENDING', 'SIGNED']),
      signedAt: z.string().optional(),
    }),
    receptor: z.object({
      name: z.string().min(2, 'Nombre del Receptor es obligatorio'),
      ci: z.string(),
      certNumber: z.string().min(2, 'Certificación de Receptor es obligatoria'),
      role: z.literal('RECEPTOR'),
      organization: z.string(),
      status: z.enum(['PENDING', 'SIGNED']),
      signedAt: z.string().optional(),
    }),
    ejecutor: z.object({
      name: z.string().min(2, 'Nombre del Ejecutor es obligatorio'),
      ci: z.string(),
      certNumber: z.string(),
      role: z.literal('EJECUTOR'),
      organization: z.string(),
      status: z.enum(['PENDING', 'SIGNED']),
      signedAt: z.string().optional(),
    }),
  }),
  pendingExternalParameters: z.array(
    z.object({
      parameterId: z.string(),
      parameterName: z.string(),
      expectedSource: z.string(),
      warningMessage: z.string(),
      status: z.enum(['PENDING_EXTERNAL_PARAMETER', 'RESOLVED']),
      value: z.any().optional(),
    })
  ),
  status: z.enum([
    'DRAFT',
    'IN_PROGRESS',
    'SUBMITTED',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'ISSUED',
    'SUSPENDED',
    'CLOSED',
    'ARCHIVED',
  ]),
});
