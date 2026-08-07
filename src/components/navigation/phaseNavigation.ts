import { UserRole } from '../../ProjectContext';
import { getWorkflow, listWorkflows } from '../../lib/workflows/registry';
import { WorkflowPhase } from '../../lib/workflows/contracts';

export interface PhaseModule {
  id: string;
  title: string;
  path: string;
  iconName: string;
  workflowId?: string;
  allowedRoles?: UserRole[];
  badge?: string;
  description?: string;
  deliverableType?: string;
}

export interface ProjectPhase {
  id: string;
  phaseNumber: WorkflowPhase;
  code: string;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  modules: PhaseModule[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
  badge?: string;
  iconName?: string;
}

export interface NavigationSearchResult {
  phase: ProjectPhase;
  module: PhaseModule;
  matchType: 'title' | 'description' | 'phase' | 'workflowId';
}

export async function ensureWorkflowsRegisteredAsync(): Promise<void> {
  const { ensureWorkflowsRegistered } = await import('../../workflows');
  ensureWorkflowsRegistered();
}

/**
 * Canonical IC360 Industrial Project Phases (GPG / FEL Standard 1 through 7)
 */
export const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    code: 'FEL-1',
    title: 'Fase 1: FEL 1 / Estimación & Oportunidad',
    shortTitle: 'Fase 1: FEL 1 Estimación',
    description: 'Diagnóstico conceptual, factibilidad técnica, estimaciones de orden de magnitud y benchmarking.',
    iconName: 'LayoutDashboard',
    modules: [
      {
        id: 'mod-dashboard',
        title: 'Dashboard Ejecutivo',
        path: '/',
        iconName: 'LayoutDashboard',
        badge: 'General',
        description: 'Indicadores globales, EVM, avance físico y alertas ejecutivas del proyecto.',
      },
      {
        id: 'mod-projects',
        title: 'Gestión de Proyectos',
        path: '/projects',
        iconName: 'HardHat',
        badge: 'Portfolio',
        description: 'Administración de portafolio de obras, contratos y datos del operador.',
      },
      {
        id: 'mod-apu-estimation',
        title: 'Estimación APU & Cómputos',
        path: '/apu-estimation',
        iconName: 'Calculator',
        allowedRoles: ['superadmin', 'gerente', 'supervisor'],
        badge: 'Costos',
        description: 'Análisis de Precios Unitarios, cómputos métricos y rendimientos de cuadrilla.',
      },
      {
        id: 'mod-bi-ofertas',
        title: 'BI, Licitaciones & Ofertas',
        path: '/modulos/bi-ofertas',
        iconName: 'Briefcase',
        badge: 'Comercial',
        description: 'Inteligencia de negocios, pliegos licitatorios y modelos de oferta.',
      },
      {
        id: 'mod-benchmarking',
        title: 'Benchmarking de Proyectos',
        path: '/modulos/benchmarking',
        iconName: 'BrainCircuit',
        badge: 'Histórico',
        description: 'Comparativa histórica de costos y ratios de productividad por tipo de obra.',
      },
    ],
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    code: 'FEL-2',
    title: 'Fase 2: FEL 2 / Ingeniería Básica & Planificación',
    shortTitle: 'Fase 2: FEL 2 Planificación',
    description: 'Definición de alcance, WBS/P6, diagramas de alineamiento GIS y conectores ERP.',
    iconName: 'ClipboardList',
    modules: [
      {
        id: 'mod-tasks-wbs',
        title: 'Control de Partidas (WBS)',
        path: '/tasks',
        iconName: 'ClipboardList',
        allowedRoles: ['superadmin', 'gerente', 'supervisor'],
        badge: 'WBS',
        description: 'Desglose estructurado de trabajo, cronogramas e hitos contractuales.',
      },
      {
        id: 'mod-interoperabilidad',
        title: 'Motor Interoperabilidad P6 / BC3',
        path: '/modulos/interoperabilidad',
        iconName: 'ArrowLeftRight',
        allowedRoles: ['superadmin', 'gerente'],
        badge: 'ERP Sync',
        description: 'Sincronizador bi-direccional Primavera P6, archivos XER, BC3 y SAP.',
      },
      {
        id: 'mod-conectores-erp',
        title: 'Conectores ERP Enterprise',
        path: '/modulos/conectores',
        iconName: 'Plug',
        badge: 'Enterprise',
        description: 'Integraciones vía API REST con sistemas contables y corporativos.',
      },
      {
        id: 'wf-065',
        title: 'Alignment Sheets GIS KP (wf-065)',
        path: '/workflows/wf-065-gis-alignment-sheets-kp',
        iconName: 'MapPin',
        workflowId: 'wf-065-gis-alignment-sheets-kp',
        badge: 'Workflow Kernel',
        description: 'Generación y verificación de planos de alineamiento de tuberías por KP.',
      },
    ],
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    code: 'FEL-3',
    title: 'Fase 3: FEL 3 / Ingeniería de Detalle & Procura',
    shortTitle: 'Fase 3: FEL 3 Ing. Detalle',
    description: 'Cálculos normativos ASME/API, modelado BIM 3D, lazado P&ID y procura de insumos.',
    iconName: 'Calculator',
    modules: [
      {
        id: 'mod-engineering-tools',
        title: 'Herramientas Ing. ASME/API',
        path: '/tools',
        iconName: 'Calculator',
        badge: 'Cálculo',
        description: 'Memorias de cálculo mecánico según ASME B31.3, B31.4, B31.8 y API 1104.',
      },
      {
        id: 'mod-hot-tap',
        title: 'Esquemas Hot Tap & Stopple',
        path: '/hot-tap',
        iconName: 'Flame',
        badge: 'Intervención',
        description: 'Simulación técnica de perforación en caliente e hincado de tapones Stopple.',
      },
      {
        id: 'mod-bim-viewer',
        title: 'Visor BIM 3D & Isométricos',
        path: '/bim',
        iconName: 'Box',
        badge: 'BIM 3D',
        description: 'Visualizador de maquetas digitales IFC/REVIT e isométricos de tubería.',
      },
      {
        id: 'mod-instrumentation',
        title: 'Instrumentación & Lazos P&ID',
        path: '/instrumentation-control',
        iconName: 'Network',
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
        badge: 'Control',
        description: 'Lazos de control, válvulas ESDV e instrumentos de campo en P&ID.',
      },
      {
        id: 'mod-inventory',
        title: 'Procura e Inventario Base',
        path: '/inventory',
        iconName: 'Package',
        badge: 'Almacén',
        description: 'Kardex de materiales, recepción en almacén y salvamento.',
      },
      {
        id: 'wf-073',
        title: 'Medición Avance Ingeniería (wf-073)',
        path: '/workflows/wf-073-medicion-avance-ingenieria',
        iconName: 'Clock',
        workflowId: 'wf-073-medicion-avance-ingenieria',
        badge: 'Workflow Kernel',
        description: 'Verificación de entregables documentales de ingeniería por hito.',
      },
      {
        id: 'wf-077',
        title: 'Supervisión Ingeniería (wf-077)',
        path: '/workflows/wf-077-supervision-ingenieria',
        iconName: 'ShieldCheck',
        workflowId: 'wf-077-supervision-ingenieria',
        badge: 'Workflow Kernel',
        description: 'Aprobación técnica de memorias y planos por contraparte del operador.',
      },
      {
        id: 'wf-066',
        title: 'BIM 3D Integridad Soldadura (wf-066)',
        path: '/workflows/wf-066-bim3d-integridad-soldadura',
        iconName: 'Box',
        workflowId: 'wf-066-bim3d-integridad-soldadura',
        badge: 'Workflow Kernel',
        description: 'Vinculación de juntas de soldadura NDT sobre modelo BIM 3D.',
      },
    ],
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    code: 'EXEC',
    title: 'Fase 4: Ejecución / Construcción & Campo',
    shortTitle: 'Fase 4: Construcción & Campo',
    description: 'Operación diaria en sitio, permisos de trabajo PTW, izaje, logística y seguridad.',
    iconName: 'HardHat',
    modules: [
      {
        id: 'mod-field-reports',
        title: 'Reportes Diarios de Campo',
        path: '/field-reports',
        iconName: 'ClipboardList',
        badge: 'Reporte Diario',
        description: 'Bitácora técnica de avance, condiciones climáticas y novedades.',
      },
      {
        id: 'mod-siho-ptw',
        title: 'Módulo SIHO-A & PTW',
        path: '/siho-ptw',
        iconName: 'ShieldCheck',
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
        badge: 'HSE',
        description: 'Permisos de Trabajo Seguro (PTW frío/caliente) y análisis de riesgo ART.',
      },
      {
        id: 'mod-loto-isolation',
        title: 'Control Aislamiento LOTO',
        path: '/loto-isolation',
        iconName: 'ShieldAlert',
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
        badge: 'Seguridad',
        description: 'Bloqueo y etiquetado de fuentes de energía eléctricas e hidráulicas.',
      },
      {
        id: 'mod-logistics-map',
        title: 'Logística, Rutas & GPS',
        path: '/logistics',
        iconName: 'MapPin',
        badge: 'GPS',
        description: 'Rastreo satelital de flotas, movilización y despacho de materiales.',
      },
      {
        id: 'mod-fleet-equipment',
        title: 'Flota & Equipos Críticos',
        path: '/modulos/flota',
        iconName: 'Truck',
        badge: 'Maquinaria',
        description: 'Status operativo de grúas, tendidoras, generadores y retroexcavadoras.',
      },
      {
        id: 'mod-worker-qr',
        title: 'Fichas de Personal & QR',
        path: '/worker-qr-registry',
        iconName: 'UserCheck',
        badge: 'Personal',
        description: 'Registro de trabajadores con escaneo QR de certificados médicos y HSE.',
      },
      {
        id: 'mod-civil-engineering',
        title: 'Ensayos Civiles & Suelos',
        path: '/civil-engineering',
        iconName: 'HardHat',
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
        badge: 'Obras Civiles',
        description: 'Ensayos de proctor, resistencia de concreto en probetas y compactación.',
      },
      {
        id: 'mod-environmental',
        title: 'Gestión Ambiental SIHO',
        path: '/environmental-management',
        iconName: 'ShieldCheck',
        badge: 'Ambiente',
        description: 'Manejo de efluentes, recolección de desechos y reforestación de derecho de vía.',
      },
      {
        id: 'mod-standby-moc',
        title: 'Gestión Standby & MOC',
        path: '/modulos/standby-moc',
        iconName: 'Clock',
        badge: 'Standby / MOC',
        description: 'Control de tiempos muertos por lluvia/seguridad y Cambios de Manejo (MOC).',
      },
      {
        id: 'wf-042',
        title: 'Inspección Izaje ASME B30.5 (wf-042)',
        path: '/workflows/wf-042-inspeccion-izaje',
        iconName: 'ShieldAlert',
        workflowId: 'wf-042-inspeccion-izaje',
        badge: 'Workflow Kernel',
        description: 'Verificación de grúas y eslingas con Hard Gate obligatorio de seguridad.',
      },
      {
        id: 'wf-043',
        title: 'Aprobación PTW Digital (wf-043)',
        path: '/workflows/wf-043-aprobacion-ptw',
        iconName: 'ShieldCheck',
        workflowId: 'wf-043-aprobacion-ptw',
        badge: 'Workflow Kernel',
        description: 'Circuito multi-firma para liberación de permisos de trabajo en área crítica.',
      },
      {
        id: 'wf-075',
        title: 'Libro de Obra Digital (wf-075)',
        path: '/workflows/wf-075-libro-de-obra',
        iconName: 'BookOpen',
        workflowId: 'wf-075-libro-de-obra',
        badge: 'Workflow Kernel',
        description: 'Minuta diaria inmutable firmada por residencia de inspección.',
      },
    ],
  },
  {
    id: 'phase-5',
    phaseNumber: 5,
    code: 'QAQC',
    title: 'Fase 5: QA/QC, Precomisionado & Integridad',
    shortTitle: 'Fase 5: QA/QC & Integridad',
    description: 'Aseguramiento de calidad de soldaduras, ensayos NDT, corridas ILI y prueba hidrostática.',
    iconName: 'ShieldCheck',
    modules: [
      {
        id: 'mod-qaqc-welding',
        title: 'QA/QC Juntas & NDT',
        path: '/qa-qc-welding',
        iconName: 'Flame',
        allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector'],
        badge: 'Trazabilidad',
        description: 'Seguimiento individual de juntas soldadas, gammagrafía, ultrasonido y tintas.',
      },
      {
        id: 'mod-integrity-ili',
        title: 'Integridad ILI Pigging',
        path: '/modulos/ili-pigging',
        iconName: 'Database',
        badge: 'Inspección',
        description: 'Pase de herramientas instrumentadas ILI, pérdida de metal y abolladuras.',
      },
      {
        id: 'wf-044',
        title: 'Reporte Tabular QA/QC (wf-044)',
        path: '/workflows/wf-044-reporte-tabular',
        iconName: 'ClipboardList',
        workflowId: 'wf-044-reporte-tabular',
        badge: 'Workflow Kernel',
        description: 'Matriz consolidada de juntas ensayadas y dictamen NDT.',
      },
      {
        id: 'wf-074',
        title: 'Completación Mecánica (wf-074)',
        path: '/workflows/wf-074-completacion-mecanica',
        iconName: 'ShieldCheck',
        workflowId: 'wf-074-completacion-mecanica',
        badge: 'Workflow Kernel',
        description: 'Punch list y carpetas de completación de subsistemas.',
      },
      {
        id: 'wf-076',
        title: 'Terminación Construcción (wf-076)',
        path: '/workflows/wf-076-terminacion-construccion',
        iconName: 'CheckCircle2',
        workflowId: 'wf-076-terminacion-construccion',
        badge: 'Workflow Kernel',
        description: 'Acta de terminación física y entrega a comisionamiento.',
      },
    ],
  },
  {
    id: 'phase-6',
    phaseNumber: 6,
    code: 'FINOPS',
    title: 'Fase 6: Valuaciones, FinOps & Dossier As-Built',
    shortTitle: 'Fase 6: Valuaciones & Dossier',
    description: 'Facturación ROE, control de costos, cierre de obra, dossier de calidad y portal de clientes.',
    iconName: 'Receipt',
    modules: [
      {
        id: 'mod-valuations',
        title: 'Valuaciones ROE & Cierre',
        path: '/valuations',
        iconName: 'Receipt',
        allowedRoles: ['superadmin', 'gerente'],
        badge: 'Facturación',
        description: 'Cuadros de valuación acumulada ROE, amortización de anticipo y retenciones.',
      },
      {
        id: 'mod-expenses',
        title: 'Costos & Tesorería Opex/Capex',
        path: '/expenses',
        iconName: 'CircleDollarSign',
        allowedRoles: ['superadmin', 'gerente', 'supervisor'],
        badge: 'Finanzas',
        description: 'Rastreo de gastos reales, compras, nómina y flujo de caja.',
      },
      {
        id: 'mod-dossier-compiler',
        title: 'Dossier As-Built & Cierre',
        path: '/modulos/cierre',
        iconName: 'FileArchive',
        badge: 'Certificación',
        description: 'Compilador automatizado del libro de calidad As-Built final.',
      },
      {
        id: 'mod-blockchain-audit',
        title: 'Auditoría Blockchain',
        path: '/modulos/auditoria',
        iconName: 'Database',
        badge: 'Auditoría',
        description: 'Verificación cryptographic de firmas e inmutabilidad de entregables.',
      },
      {
        id: 'mod-client-portal',
        title: 'Portales Cliente B2B',
        path: '/client-portal-builder',
        iconName: 'Globe',
        allowedRoles: ['superadmin', 'gerente'],
        badge: 'B2B Portal',
        description: 'Generador de portales interactivos de auditoría para el cliente u operador.',
      },
      {
        id: 'mod-documents',
        title: 'Gestión Documental Base',
        path: '/documents',
        iconName: 'FileArchive',
        badge: 'Repositorio',
        description: 'Repositorio de planos, procedimientos y certificados firmados.',
      },
    ],
  },
  {
    id: 'phase-7',
    phaseNumber: 7,
    code: 'GOV',
    title: 'Fase 7: Inteligencia, MCP & Gobernanza Transversal',
    shortTitle: 'Fase 7: Inteligencia & Gobernanza',
    description: 'Asistente contextual RAG, chat de voz live, sincronización offline y administración.',
    iconName: 'BrainCircuit',
    modules: [
      {
        id: 'mod-project-brain',
        title: 'Cerebro del Proyecto (MCP)',
        path: '/project-brain',
        iconName: 'BrainCircuit',
        badge: 'MCP Brain',
        description: 'Panel de control inteligente con arquitectura MCP y contexto unificado.',
      },
      {
        id: 'mod-intelligence',
        title: 'Inteligencia & RAG Vectorial',
        path: '/intelligence',
        iconName: 'BrainCircuit',
        badge: 'IA Vector',
        description: 'Búsqueda semántica sobre normativas PDVSA, ASME y planos del proyecto.',
      },
      {
        id: 'mod-chat',
        title: 'Asistente IA Contextual',
        path: '/chat',
        iconName: 'MessageSquare',
        badge: 'RAG Copilot',
        description: 'Copiloto conversacional para normativas, cálculos y dudas técnicas.',
      },
      {
        id: 'mod-voice',
        title: 'Chat de Voz Live',
        path: '/voice',
        iconName: 'Mic',
        badge: 'Voice Assistant',
        description: 'Interacción por voz dictada con síntesis TTS para inspección en sitio.',
      },
      {
        id: 'mod-sync-center',
        title: 'Centro de Sincronización',
        path: '/sync-center',
        iconName: 'RefreshCw',
        badge: 'Offline Sync',
        description: 'Gestor de cola de operaciones offline y sincronización PWA.',
      },
      {
        id: 'mod-sla-escalation',
        title: 'Escalamiento SLA & Matriz',
        path: '/modulos/escalamiento',
        iconName: 'Network',
        badge: 'SLA',
        description: 'Alertas automáticas por cuellos de botella y demoras en firmas.',
      },
      {
        id: 'mod-saas-console',
        title: 'Consola SaaS Owner',
        path: '/saas-console',
        iconName: 'Crown',
        allowedRoles: ['superadmin'],
        badge: 'Master Console',
        description: 'Consola de administración global de organizaciones y licencias.',
      },
      {
        id: 'mod-settings',
        title: 'Configuración & Temas',
        path: '/settings',
        iconName: 'Settings',
        allowedRoles: ['superadmin', 'gerente'],
        badge: 'Ajustes',
        description: 'Ajustes de marca, miembros, permisos y temas visuales.',
      },
    ],
  },
];

/**
 * Fast lookup helper for phase by numeric ID (1 through 7)
 */
export function getPhaseByNumber(phaseNum: number): ProjectPhase | undefined {
  return PROJECT_PHASES.find((p) => p.phaseNumber === phaseNum);
}

/**
 * Returns phase, module, and workflow details for any URL path
 */
export function getPhaseForPath(pathname: string): {
  phase: ProjectPhase;
  module?: PhaseModule;
  workflowId?: string;
  workflowTitle?: string;
} {
  // 1. Check dynamic workflow routes (/workflows/:workflowId/...)
  if (pathname.startsWith('/workflows')) {
    const parts = pathname.split('/').filter(Boolean);
    const wfIdFromUrl = parts[1];

    if (wfIdFromUrl) {
      const registeredWf = getWorkflow(wfIdFromUrl);
      if (registeredWf) {
        const matchingPhase = getPhaseByNumber(registeredWf.phase) || PROJECT_PHASES[3];
        const matchingModule = matchingPhase.modules.find((m) => m.workflowId === wfIdFromUrl);

        return {
          phase: matchingPhase,
          module: matchingModule,
          workflowId: registeredWf.id,
          workflowTitle: registeredWf.title,
        };
      }

      // If registeredWf is deferred, search in PROJECT_PHASES by module.workflowId or path
      for (const phase of PROJECT_PHASES) {
        for (const mod of phase.modules) {
          if (mod.workflowId === wfIdFromUrl || mod.path.endsWith(wfIdFromUrl) || mod.id === wfIdFromUrl) {
            return {
              phase,
              module: mod,
              workflowId: mod.workflowId || wfIdFromUrl,
              workflowTitle: mod.title,
            };
          }
        }
      }
    }
  }

  // 2. Exact or prefix match in phase modules
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  for (const phase of PROJECT_PHASES) {
    for (const mod of phase.modules) {
      if (mod.path === normalizedPath || (mod.path !== '/' && normalizedPath.startsWith(mod.path))) {
        return {
          phase,
          module: mod,
          workflowId: mod.workflowId,
        };
      }
    }
  }

  // Fallback to Phase 1 (Dashboard)
  return {
    phase: PROJECT_PHASES[0],
    module: PROJECT_PHASES[0].modules[0],
  };
}

/**
 * Generates canonical breadcrumb list for any active path
 */
export function getBreadcrumbsForPath(
  pathname: string,
  projectName: string = 'Proyecto Activo',
  workflowState?: string
): BreadcrumbItem[] {
  const { phase, module, workflowId, workflowTitle } = getPhaseForPath(pathname);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: projectName,
      path: '/',
      iconName: 'Building',
    },
    {
      label: phase.shortTitle,
      path: phase.modules[0]?.path || '/',
      iconName: phase.iconName,
    },
  ];

  if (workflowId && workflowTitle) {
    breadcrumbs.push({
      label: workflowTitle || (module ? module.title : 'Workflow Kernel'),
      isCurrent: true,
      badge: workflowState || (module?.badge ?? 'Workflow Active'),
      iconName: module?.iconName || 'ShieldCheck',
    });
  } else if (module) {
    breadcrumbs.push({
      label: module.title,
      isCurrent: true,
      badge: workflowState || module.badge,
      iconName: module.iconName,
    });
  }

  return breadcrumbs;
}

/**
 * Searches modules, phases, and workflows grouped by Industrial Phase
 */
export function searchNavigation(
  query: string,
  userRole?: string
): NavigationSearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: NavigationSearchResult[] = [];

  for (const phase of PROJECT_PHASES) {
    const phaseMatches =
      phase.title.toLowerCase().includes(cleanQuery) ||
      phase.code.toLowerCase().includes(cleanQuery) ||
      phase.description.toLowerCase().includes(cleanQuery);

    for (const mod of phase.modules) {
      // Respect user role restrictions if defined
      if (
        mod.allowedRoles &&
        userRole &&
        !mod.allowedRoles.includes(userRole as UserRole)
      ) {
        continue;
      }

      let matchType: 'title' | 'description' | 'phase' | 'workflowId' | null = null;

      if (mod.title.toLowerCase().includes(cleanQuery)) {
        matchType = 'title';
      } else if (mod.workflowId && mod.workflowId.toLowerCase().includes(cleanQuery)) {
        matchType = 'workflowId';
      } else if (mod.description && mod.description.toLowerCase().includes(cleanQuery)) {
        matchType = 'description';
      } else if (phaseMatches) {
        matchType = 'phase';
      }

      if (matchType) {
        results.push({
          phase,
          module: mod,
          matchType,
        });
      }
    }
  }

  const matchPriority: Record<'title' | 'workflowId' | 'description' | 'phase', number> = {
    title: 1,
    workflowId: 1,
    description: 2,
    phase: 3,
  };

  results.sort((a, b) => matchPriority[a.matchType] - matchPriority[b.matchType]);

  return results;
}
