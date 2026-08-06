import { useLocation, useParams } from 'react-router-dom';
import { useProject } from '../../ProjectContext';
import { useAppAuthState } from '../../firebase';
import { getWorkflow } from '../../lib/workflows/registry';
import { AssistantContextData, RouteCategory, AssistantMode } from './contracts';

export function deriveRouteCategory(pathname: string): RouteCategory {
  if (pathname.includes('/workflows')) return 'workflow';
  if (pathname.includes('/siho-ptw') || pathname.includes('/loto-isolation') || pathname.includes('/environmental')) {
    return 'siho_safety';
  }
  if (
    pathname.includes('/qa-qc-welding') ||
    pathname.includes('/field-reports') ||
    pathname.includes('/civil-engineering') ||
    pathname.includes('/ili-pigging')
  ) {
    return 'field_inspector';
  }
  if (
    pathname.includes('/valuations') ||
    pathname.includes('/expenses') ||
    pathname.includes('/budget-details') ||
    pathname.includes('/apu-estimation')
  ) {
    return 'cost_financial';
  }
  if (
    pathname.includes('/tools') ||
    pathname.includes('/bim') ||
    pathname.includes('/instrumentation') ||
    pathname.includes('/hot-tap') ||
    pathname.includes('/modulos/')
  ) {
    return 'engineering';
  }
  return 'general';
}

export function deriveRecommendedMode(pathname: string): AssistantMode {
  if (pathname.includes('/voice')) return 'voice';
  if (pathname.includes('/project-brain') || pathname.includes('/intelligence') || pathname.includes('/workflows')) {
    return 'brain';
  }
  return 'chat';
}

export function buildSystemInstruction(params: {
  pathname: string;
  category: RouteCategory;
  userRole: string;
  orgId: string;
  projectId: string;
  projectName: string;
  workflowId?: string;
  workflowTitle?: string;
  workflowPhase?: number;
}): string {
  const { pathname, category, userRole, orgId, projectId, projectName, workflowId, workflowTitle, workflowPhase } = params;

  let baseInstruction = `Eres el Asistente Contextual Unificado de Industrial Control 360 (IC360), plataforma SaaS de ingeniería y supervisión para la industria de Oil & Gas.
CONTESTA SIEMPRE CON AUTORIDAD TÉCNICA Y RIGOR INDUSTRIAL EN ESPAÑOL.

CONTEXTO REAL DE SESIÓN:
- Ruta Activa: ${pathname}
- Categoría Operativa: ${category}
- Rol del Usuario: ${userRole}
- Organización (Tenant): ${orgId}
- Proyecto Activo: [${projectId}] ${projectName}`;

  if (workflowId) {
    baseInstruction += `\n\nWORKFLOW EN EJECUCIÓN (Kernel):
- ID Workflow: ${workflowId}
- Título: ${workflowTitle || workflowId}
- Fase FEL/GPG: Fase ${workflowPhase || '1'}`;
  }

  switch (category) {
    case 'workflow':
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo Workflow: Asiste en la verificación de Hard Gates y reglas de aprobación de este workflow.
- Guía al usuario según su rol (${userRole}) en el diligenciamiento de los datos de entrada.
- Referencia normas aplicables (ASME B31.3, ASME B31G, API 1163, PDVSA L-STC-001).`;
      break;

    case 'field_inspector':
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo Inspección de Campo: Asiste en labores de campo, inspecciones de soldadura CWI/NDT, reporte de anomalías e informes diarios de obra.
- Aporta criterios de aceptación según normas PDVSA (A-211, HES) y equipos NDT (Dakota Ultrasonics DFX series).`;
      break;

    case 'siho_safety':
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo SIHO-A & PTW: Asiste en gestión SIHO-A, Permisos de Trabajo (PTW), análisis de riesgos ART y aislamiento LOTO.
- Enfatiza rigor de seguridad laboral, LOPCYMAT y procedimientos de parada segura.`;
      break;

    case 'cost_financial':
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo FinOps & Valuaciones: Asiste en control presupuestario, estimación APU, valuaciones, amortización de anticipos y retenciones legales (10% Fiel Cumplimiento, 5% Laboral).
- Mantén precisión contable e indicadores de valor ganado (EVM: SPI, CPI).`;
      break;

    case 'engineering':
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo Ingeniería & Herramientas: Asiste en cálculos de ingeniería mecánica/civil/instrumentación, Hot Tap, cálculo de espesores de tubería y modelado BIM.`;
      break;

    default:
      baseInstruction += `\n\nENFOQUE ASISTENCIAL:
- Modo General: Ofrece orientación general sobre la plataforma, navegación, gestión documental y respuestas técnicas de Oil & Gas.`;
      break;
  }

  return baseInstruction;
}

export function buildAssistantContext(params: {
  pathname: string;
  userRole?: string;
  orgId?: string;
  projectId?: string;
  projectName?: string;
  workflowIdParam?: string;
}): AssistantContextData {
  const { pathname, userRole = 'inspector', orgId = 'org-ic360', projectId = 'proj-default', projectName = 'Proyecto General', workflowIdParam } = params;

  // Extract workflowId from route if present
  let workflowId = workflowIdParam;
  if (!workflowId && pathname.includes('/workflows/')) {
    const parts = pathname.split('/workflows/');
    if (parts[1]) {
      workflowId = parts[1].split('/')[0];
    }
  }

  const category = deriveRouteCategory(pathname);
  const recommendedMode = deriveRecommendedMode(pathname);

  let workflowTitle: string | undefined;
  let workflowPhase: number | undefined;
  let workflowDef = undefined;

  if (workflowId) {
    workflowDef = getWorkflow(workflowId);
    if (workflowDef) {
      workflowTitle = workflowDef.title;
      workflowPhase = workflowDef.phase;
    } else {
      workflowTitle = workflowId;
    }
  }

  const systemInstruction = buildSystemInstruction({
    pathname,
    category,
    userRole,
    orgId,
    projectId,
    projectName,
    workflowId,
    workflowTitle,
    workflowPhase,
  });

  return {
    activeRoute: pathname,
    routeCategory: category,
    workflowId,
    workflowTitle,
    workflowPhase,
    workflowDefinition: workflowDef,
    userRole,
    orgId,
    projectId,
    projectName,
    recommendedMode,
    systemInstruction,
  };
}

export function useDerivedAssistantContext(): AssistantContextData {
  const location = useLocation();
  const params = useParams<{ workflowId?: string }>();
  const { currentProject } = useProject();
  const [user] = useAppAuthState();

  const userRole = (user as any)?.role || 'inspector';
  const orgId = currentProject?.orgId || (user as any)?.orgId || 'org-ic360';
  const projectId = currentProject?.id || 'proj-default';
  const projectName = currentProject?.name || 'Proyecto Industrial General';

  return buildAssistantContext({
    pathname: location.pathname,
    userRole,
    orgId,
    projectId,
    projectName,
    workflowIdParam: params.workflowId,
  });
}
