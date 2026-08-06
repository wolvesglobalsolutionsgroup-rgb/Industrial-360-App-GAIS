import { wf042Definition } from '../../../src/workflows/wf-042-inspeccion-izaje/definition';
import { wf043Definition } from '../../../src/workflows/wf-043-aprobacion-ptw/definition';
import { wf044Definition } from '../../../src/workflows/wf-044-reporte-tabular/definition';
import { WorkflowRouteContext } from '../../../src/lib/workflows/contracts';
import { DocumentViewModel } from '../../../src/lib/documentViewModel';

export const mockRouteContext: WorkflowRouteContext = {
  orgId: 'org-prointeca-qa',
  projectId: 'proj-oilgas-2026',
  workflowId: 'wf-test',
  instanceId: 'inst-test-001',
  user: {
    uid: 'user-lead-eng',
    email: 'm.silva@prointeca.com',
    role: 'inspector',
    orgId: 'org-prointeca-qa',
  },
  contractorBrand: {
    companyName: 'PROINTECA C.A.',
    primaryColor: '#0B2239',
    secondaryColor: '#059669',
  },
  operatorBrand: {
    companyName: 'PDVSA PETRÓLEO S.A.',
    primaryColor: '#DC2626',
  },
};

export async function createWf042FixtureDoc(): Promise<DocumentViewModel> {
  return wf042Definition.deliverable!.factory(mockRouteContext, {
    craneCode: 'GRU-8820-A',
    capacityTons: 120,
    inspectionDate: '2026-08-06',
    slingCondition: 'operativa',
    hookLatchIntact: true,
    hydraulicLeakDetected: false,
    inspectorNotes: 'Prueba pre-operativa realizada según norma ASME B30.5. Equipo 100% apto.',
  });
}

export async function createWf043FixtureDoc(): Promise<DocumentViewModel> {
  return wf043Definition.deliverable!.factory(mockRouteContext, {
    ptwCode: 'PTW-2026-0806-01',
    workType: 'caliente',
    lelPercentage: 0,
    o2Percentage: 20.9,
    h2sPpm: 0,
    lotoVerified: true,
    supervisorName: 'Ing. Manuel Silva',
    safetyInspectorName: 'Ing. Roberto Gómez',
    status: 'safety_approved',
  });
}

export async function createWf044FixtureDoc(): Promise<DocumentViewModel> {
  return wf044Definition.deliverable!.factory(mockRouteContext, {
    reportCode: 'REP-NDT-2026-88',
    welderId: 'W-9912',
    pipeDiameterInches: 16,
    inspectorName: 'Ing. Carlos Mendoza',
    items: [
      { jointId: 'J-001', kpHour: 'KP 0+050', ndtResult: 'APPROVED', ultrasonicThicknessMm: 14.2 },
      { jointId: 'J-002', kpHour: 'KP 0+080', ndtResult: 'APPROVED', ultrasonicThicknessMm: 14.0 },
      { jointId: 'J-003', kpHour: 'KP 0+110', ndtResult: 'APPROVED', ultrasonicThicknessMm: 14.1 },
    ],
  });
}
