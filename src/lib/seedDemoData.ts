import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth, loginAnonymously } from '../firebase';
import { DEMO_AUTH_ENABLED } from '../config';

export const FALLBACK_DEMO_TASKS = [
  {
    id: 'TASK-001',
    projectId: 'PROJ-JUSEPIN',
    wbsCode: 'WBS-1.1',
    title: 'Movilización de Equipos y Preparación de Terreno (Frente Jusepín)',
    description: 'Acondicionamiento de patio de acopio, movilización de grúas, plantas de soldar y equipos pesados.',
    specialty: 'Civil',
    unit: '%',
    plannedQuantity: 100,
    executedQuantity: 100,
    unitCost: 45000,
    status: 'terminada',
    priority: 'medium',
    crewName: 'Cuadrilla Movilización',
    frontName: 'Frente Jusepín',
    ptwRequired: false,
    startDate: '2026-01-15',
    dueDate: '2026-01-25',
    subtasks: [
      { id: 'st-1', text: 'Permisología ambiental aprobada', completed: true },
      { id: 'st-2', text: 'Inspección de equipos pesados', completed: true }
    ]
  },
  {
    id: 'TASK-002',
    projectId: 'PROJ-JUSEPIN',
    wbsCode: 'WBS-1.2',
    title: 'Tendido y Cimentación de Zanja Tubería API 5L 16"',
    description: 'Excavación de zanja 1.50m de profundidad, conformado de cama de arena y alineación de tubos.',
    specialty: 'Civil',
    unit: 'm',
    plannedQuantity: 12500,
    executedQuantity: 7200,
    unitCost: 42,
    status: 'en_campo',
    priority: 'high',
    crewName: 'Cuadrilla Movimiento de Tierra',
    frontName: 'Frente San Mateo',
    ptwRequired: true,
    startDate: '2026-01-26',
    dueDate: '2026-03-30',
    subtasks: [
      { id: 'st-3', text: 'Cama de arena tramo 0-5km', completed: true },
      { id: 'st-4', text: 'Zanjado tramo 5-10km', completed: false }
    ]
  },
  {
    id: 'TASK-003',
    projectId: 'PROJ-JUSEPIN',
    wbsCode: 'WBS-1.3',
    title: 'Soldadura Proceso SMAW/GMAW Juntas de Campo (ASME B31.4)',
    description: 'Ejecución de soldadura de pase de raíz, relleno y presentación en tubería API 5L X52.',
    specialty: 'Mecánica',
    unit: 'junta',
    plannedQuantity: 480,
    executedQuantity: 210,
    unitCost: 380,
    status: 'en_campo',
    priority: 'urgent',
    crewName: 'Cuadrilla Soldadura Alfa',
    frontName: 'Frente Canal de Riego',
    ptwRequired: true,
    startDate: '2026-02-01',
    dueDate: '2026-04-15',
    subtasks: [
      { id: 'st-5', text: 'Prueba de homologación de soldadores CIV', completed: true }
    ]
  },
  {
    id: 'TASK-004',
    projectId: 'PROJ-JUSEPIN',
    wbsCode: 'WBS-1.4',
    title: 'Ensayos No Destructivos NDT (UT/Gammagrafía) al 100%',
    description: 'Evaluación radiográfica y ultrasonido industrial según norma API 1104 / ASME B31.4.',
    specialty: 'QA/QC',
    unit: 'inspección',
    plannedQuantity: 480,
    executedQuantity: 205,
    unitCost: 110,
    status: 'en_campo',
    priority: 'high',
    crewName: 'Inspectores NDT Level II',
    frontName: 'Frente Canal de Riego',
    ptwRequired: true,
    startDate: '2026-02-05',
    dueDate: '2026-04-20'
  },
  {
    id: 'TASK-005',
    projectId: 'PROJ-JUSEPIN',
    wbsCode: 'WBS-1.5',
    title: 'Aplicación de Revestimiento Mantas Canusa y Protección Catódica',
    description: 'Chorreado de arena SSPC-SP10 y colocación de termocontraíbles anticorrosivos.',
    specialty: 'Mecánica',
    unit: 'junta',
    plannedQuantity: 480,
    executedQuantity: 180,
    unitCost: 140,
    status: 'planificada',
    priority: 'medium',
    crewName: 'Cuadrilla Revestimiento',
    frontName: 'Frente San Mateo',
    ptwRequired: false,
    startDate: '2026-03-01',
    dueDate: '2026-05-01'
  },
  {
    id: 'TASK-006',
    projectId: 'PROJ-002',
    wbsCode: 'WBS-2.1',
    title: 'Aislamiento, Parada y Despresurización Tren K-101',
    description: 'Bloqueo e etiquetado LOTO de líneas de gas de proceso de 24". Purga con Nitrógeno seco.',
    specialty: 'SIHO-A',
    unit: 'global',
    plannedQuantity: 1,
    executedQuantity: 1,
    unitCost: 35000,
    status: 'terminada',
    priority: 'urgent',
    crewName: 'Seguridad e Inspección',
    frontName: 'Planta San Joaquín',
    ptwRequired: true,
    startDate: '2026-03-01',
    dueDate: '2026-03-03'
  },
  {
    id: 'TASK-007',
    projectId: 'PROJ-002',
    wbsCode: 'WBS-2.2',
    title: 'Desmontaje y Revisión Interna Válvulas de Control 12" ANSI 600',
    description: 'Mantenimiento de actuadores neumáticos y reemplazo de empaquetaduras Teflon/Graphite.',
    specialty: 'Instrumentación',
    unit: 'valvula',
    plannedQuantity: 8,
    executedQuantity: 2,
    unitCost: 4500,
    status: 'en_campo',
    priority: 'high',
    crewName: 'Especialistas Instrumentación',
    frontName: 'Patio K-101',
    ptwRequired: true,
    startDate: '2026-03-04',
    dueDate: '2026-03-20'
  },
  {
    id: 'TASK-008',
    projectId: 'PROJ-002',
    wbsCode: 'WBS-2.3',
    title: 'Purga de Cabezales y Suministro de N2 Seco',
    description: 'Suministro de cisterna de Nitrógeno para barrido de gas amargo.',
    specialty: 'Mecánica',
    unit: 'evento',
    plannedQuantity: 1,
    executedQuantity: 0,
    unitCost: 12000,
    status: 'bloqueada',
    priority: 'urgent',
    crewName: 'Cuadrilla Mecánica',
    frontName: 'Patio K-101',
    restrictionNotes: 'Retraso en transporte de cisterna N2 por transportista externo. Pendiente aprobación ETT.'
  }
];

export async function seedDemoData(force = false): Promise<{ success: boolean; message: string }> {
  if (!DEMO_AUTH_ENABLED) {
    return {
      success: false,
      message: 'El sembrado de datos demo está desactivado en producción (DEMO_AUTH_ENABLED es false).'
    };
  }

  if (!auth.currentUser) {
    try {
      await loginAnonymously();
    } catch (e) {
      console.warn("No se pudo iniciar sesión anónima en seedDemoData:", e);
    }
  }

  const targetOrgs = ['prointeca', 'default_org'];

  try {
    // Check if projects already exist in prointeca or default_org unless forced
    if (!force) {
      try {
        const snapOrgProjects = await getDocs(collection(db, 'organizations', 'prointeca', 'projects'));
        if (!snapOrgProjects.empty) {
          return { success: true, message: 'La base de datos ya contiene proyectos de PROINTECA C.A.' };
        }
      } catch (err) {
        // Continue if checking fails
        console.warn('[seedDemoData] existing-data check failed, continuing', err);
      }
    }

    // 1. Projects
    const projects = [
      {
        id: 'PROJ-CARDON-AMUAY',
        name: 'IPC Reemplazo y Reparación Propanoducto 6" Cardón - Amuay',
        description: 'Obra integrada de reemplazo de tramos y reparación de anomalías ILI (D001, D002, D003) con camisas Tipo B y prueba hidrostática a 2126 PSI MAOP en Complejo Refinador Paraguaná (17.0 km).',
        budget: 1850000,
        advancePercent: 65,
        startDate: '2026-07-01',
        status: 'en_campo',
        ownerId: 'demo_admin',
        contractNo: 'CTR-2026-PDVSA-CRP-006',
        clientName: 'PDVSA / Petrocedeño',
        contractorName: 'PROINTECA C.A.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROJ-JUSEPIN',
        name: 'IPC Reemplazo Oleoducto 16" Jusepín - San Mateo',
        description: 'Reemplazo de 12.5 km de tubería API 5L Gr. X52 Sch 40, incluyendo cruces especiales, válvulas de seccionamiento y pruebas hidrostáticas a 1480 PSI.',
        budget: 1450000,
        advancePercent: 48,
        startDate: '2026-01-15',
        status: 'en_campo',
        ownerId: 'demo_admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROJ-002',
        name: 'Mantenimiento Mayor Tren K-101 Planta Compresora San Joaquín',
        description: 'Overhaul completo de turbocompresor K-101, sustitución de cabezales de succión, cambio de válvulas de recirculación e inspección NDT 100% de soldaduras.',
        budget: 820000,
        advancePercent: 22,
        startDate: '2026-03-01',
        status: 'en_campo',
        ownerId: 'demo_admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROJ-003',
        name: 'Adecuación Estación de Flujo Bare-1 Faja Petrolífera del Orinoco',
        description: 'Sustitución de colectores de producción de crudo pesado, instalación de separadores multifásicos y sistema automatizado F&G.',
        budget: 2100000,
        advancePercent: 85,
        startDate: '2025-09-10',
        status: 'en_campo',
        ownerId: 'demo_admin',
        createdAt: new Date().toISOString()
      }
    ];

    for (const orgId of targetOrgs) {
      for (const p of projects) {
        const docData = { ...p, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', p.id), docData, { merge: true });
        await setDoc(doc(db, 'projects', p.id), docData, { merge: true });
      }
    }

    // 2. Tasks / WBS
    const tasks = [
      {
        id: 'TASK-CA-001',
        projectId: 'PROJ-CARDON-AMUAY',
        wbsCode: 'WBS-1.1',
        title: 'Aislamiento LOTO, Purga N2 y Permisología SIHO-A Propanoducto 6"',
        description: 'Despresurización de línea 6" GLP, bloqueo de válvulas de seccionamiento en Patio Cardón y emisión de Permiso PTW.',
        specialty: 'SIHO-A',
        unit: 'global',
        plannedQuantity: 1,
        executedQuantity: 1,
        unitCost: 28000,
        status: 'terminada',
        priority: 'urgent',
        crewName: 'Cuadrilla SIHO-A Paraguaná',
        frontName: 'Frente CRP Cardón',
        ptwRequired: true,
        startDate: '2026-07-01',
        dueDate: '2026-07-05',
        subtasks: [
          { id: 'st-ca-1', text: 'Prueba de atmósfera (0.0% LEL, 20.9% O2, 0 PPM H2S)', completed: true },
          { id: 'st-ca-2', text: 'Firma de Permiso PTW-2026-CA01', completed: true }
        ]
      },
      {
        id: 'TASK-CA-002',
        projectId: 'PROJ-CARDON-AMUAY',
        wbsCode: 'WBS-1.2',
        title: 'Excavación y Zanjado de Exploración Anomalías ILI D001 (KP 2.4) y D003 (KP 12.1)',
        description: 'Descubrimiento manual de tubería 6" en KP 2+400 y KP 12+100, limpieza chorro de arena SSPC-SP10 para inspección visual.',
        specialty: 'Civil',
        unit: 'm',
        plannedQuantity: 150,
        executedQuantity: 150,
        unitCost: 120,
        status: 'terminada',
        priority: 'high',
        crewName: 'Cuadrilla Movimiento Tierra',
        frontName: 'Frente Paraguaná Tramo Medio',
        ptwRequired: true,
        startDate: '2026-07-06',
        dueDate: '2026-07-12'
      },
      {
        id: 'TASK-CA-003',
        projectId: 'PROJ-CARDON-AMUAY',
        wbsCode: 'WBS-1.3',
        title: 'Instalación de Camisa de Refuerzo Tipo B (API 1104 Anexo B) en Anomalía D003 (KP 12.1)',
        description: 'Alineación y soldadura circunferencial/longitudinal en caliente de camisa de acero sobre tubería API 5L Gr. B MAOP 2126 PSI.',
        specialty: 'Mecánica',
        unit: 'junta',
        plannedQuantity: 2,
        executedQuantity: 2,
        unitCost: 4200,
        status: 'en_campo',
        priority: 'urgent',
        crewName: 'Cuadrilla Soldadura Especializada PROINTECA',
        frontName: 'Frente KP 12+100',
        ptwRequired: true,
        startDate: '2026-07-13',
        dueDate: '2026-07-20'
      },
      {
        id: 'TASK-CA-004',
        projectId: 'PROJ-CARDON-AMUAY',
        wbsCode: 'WBS-1.4',
        title: 'Inspección QA/QC NDT Gammagrafía (RT) y Ultrasonido (UT) según API 1104 / ASME B31.4',
        description: 'Calificación radiográfica 100% de soldaduras de camisa Tipo B D003 y medición de espesores en D001.',
        specialty: 'QA/QC',
        unit: 'inspección',
        plannedQuantity: 4,
        executedQuantity: 4,
        unitCost: 350,
        status: 'en_campo',
        priority: 'high',
        crewName: 'Inspectores NDT Level II PROINTECA',
        frontName: 'Frente KP 12+100',
        ptwRequired: true,
        startDate: '2026-07-21',
        dueDate: '2026-07-25'
      },
      {
        id: 'TASK-CA-005',
        projectId: 'PROJ-CARDON-AMUAY',
        wbsCode: 'WBS-1.5',
        title: 'Prueba Hidrostática a 2126 PSI MAOP y Emisión de Valuación ROE N° 1',
        description: 'Presurización con agua tratada durante 24h, registro gráfico de presión/temperatura y cierre de expediente Dossier PIC-01-03-05.',
        specialty: 'Mecánica',
        unit: 'global',
        plannedQuantity: 1,
        executedQuantity: 1,
        unitCost: 65000,
        status: 'terminada',
        priority: 'urgent',
        crewName: 'Comisionado e Inspección PROINTECA',
        frontName: 'Complejo Refinador Paraguaná',
        ptwRequired: true,
        startDate: '2026-07-26',
        dueDate: '2026-07-28'
      },
      ...FALLBACK_DEMO_TASKS
    ];

    for (const orgId of targetOrgs) {
      for (const t of tasks) {
        const docData = { ...t, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', t.projectId, 'tasks', t.id), docData, { merge: true });
      }
    }

    // 3. Welds (Juntas NDT)
    const welds = [
      {
        id: 'W-CA-001',
        projectId: 'PROJ-CARDON-AMUAY',
        jointNumber: 'J-001-CA',
        lineCode: '6"-PRO-CARDON-01',
        welderId: 'CIV-1845236',
        welderName: 'José R. Colmenares',
        diameter: 6,
        schedule: 'Sch 80',
        process: 'SMAW/GMAW (API 1104)',
        ndtStatus: 'APROBADO',
        ndtType: 'Gammagrafía (RT)',
        reportNumber: 'REP-RT-2026-CA01',
        inspectedDate: '2026-07-22'
      },
      {
        id: 'W-CA-002',
        projectId: 'PROJ-CARDON-AMUAY',
        jointNumber: 'J-002-CA',
        lineCode: '6"-PRO-CARDON-01',
        welderId: 'CIV-2011498',
        welderName: 'Carlos M. Salazar',
        diameter: 6,
        schedule: 'Sch 80',
        process: 'SMAW/GMAW (API 1104)',
        ndtStatus: 'APROBADO',
        ndtType: 'Gammagrafía (RT)',
        reportNumber: 'REP-RT-2026-CA02',
        inspectedDate: '2026-07-24'
      },
      {
        id: 'W-001',
        projectId: 'PROJ-JUSEPIN',
        jointNumber: 'J-001',
        lineCode: '16"-OL-JUS-01',
        welderId: 'CIV-1845236',
        welderName: 'José R. Colmenares',
        diameter: 16,
        schedule: 'Sch 40',
        process: 'SMAW/GMAW',
        ndtStatus: 'APROBADO',
        ndtType: 'Gammagrafía (RT)',
        reportNumber: 'REP-NDT-2026-012',
        inspectedDate: '2026-02-10'
      }
    ];

    for (const orgId of targetOrgs) {
      for (const w of welds) {
        const docData = { ...w, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', w.projectId, 'weld_joints', w.id), docData, { merge: true });
        await setDoc(doc(db, 'organizations', orgId, 'projects', w.projectId, 'welds', w.id), docData, { merge: true });
      }
    }

    // 4. PTWs (Permisos de Trabajo Seguro)
    const ptws = [
      {
        id: 'PTW-CA-101',
        projectId: 'PROJ-CARDON-AMUAY',
        ptwNumber: 'PTW-2026-CA01',
        type: 'Trabajo en Caliente / Soldadura en Vivo Camisa B',
        location: 'Propanoducto 6" KP 12+100 (Paraguaná)',
        status: 'ACTIVO',
        applicant: 'Ing. Manuel Rivas (PROINTECA C.A.)',
        gasTestResult: '0.0% LEL, 20.9% O2, 0 PPM H2S',
        issueDate: '2026-07-20',
        expiryDate: '2026-07-28'
      },
      {
        id: 'PTW-101',
        projectId: 'PROJ-JUSEPIN',
        ptwNumber: 'PTW-2026-089',
        type: 'Trabajo en Caliente / Soldadura',
        location: 'Frente Canal de Riego Km 4+200',
        status: 'ACTIVO',
        applicant: 'Ing. Manuel Rivas',
        gasTestResult: '0.0% LEL, 20.9% O2, 0 PPM H2S',
        issueDate: '2026-07-26',
        expiryDate: '2026-07-26'
      }
    ];

    for (const orgId of targetOrgs) {
      for (const ptw of ptws) {
        const docData = { ...ptw, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', ptw.projectId, 'siho_ptw', ptw.id), docData, { merge: true });
      }
    }

    // 5. Valuations
    const valuations = [
      {
        id: 'VAL-CA-001',
        projectId: 'PROJ-CARDON-AMUAY',
        number: 1,
        valNumber: 'VAL-CA-001',
        period: 'Quincena 2 - Julio 2026',
        periodStart: '2026-07-15',
        periodEnd: '2026-07-31',
        grossAmount: 245000,
        retentionFielCumplimiento: 24500,
        retentionLaboral: 12250,
        amortizationAnticipo: 73500,
        netAmount: 134750,
        amount: 245000,
        certifiedAmount: 245000,
        status: 'CERTIFICADA',
        date: '2026-07-28',
        description: 'Ejecución de reparación de integridad en Propanoducto 6" Cardón-Amuay (Anomalías ILI D001, D002, D003) mediante instalación de camisas Tipo B y pruebas hidrostáticas.'
      },
      {
        id: 'VAL-001',
        projectId: 'PROJ-JUSEPIN',
        number: 1,
        valNumber: 'VAL-001',
        period: 'Quincena 1 - Enero 2026',
        amount: 185000,
        grossAmount: 185000,
        certifiedAmount: 185000,
        status: 'COBRADA',
        date: '2026-01-31'
      }
    ];

    for (const orgId of targetOrgs) {
      for (const v of valuations) {
        const docData = { ...v, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', v.projectId, 'valuations', v.id), docData, { merge: true });
      }
    }

    // 6. Dossiers
    const dossiers = [
      {
        id: 'DOS-CA-001',
        projectId: 'PROJ-CARDON-AMUAY',
        code: 'DOS-2026-CA01',
        title: 'Dossier de Calidad y Libro Final de Obra Propanoducto 6" Cardón - Amuay',
        statusDoc: 'Aprobado',
        codigoPDVSA: 'PDVSA-PIC-01-03-05-CA01',
        fase: 'I'
      }
    ];

    for (const orgId of targetOrgs) {
      for (const d of dossiers) {
        const docData = { ...d, orgId };
        await setDoc(doc(db, 'organizations', orgId, 'projects', d.projectId, 'dossier_compilations', d.id), docData, { merge: true });
      }
    }

    return {
      success: true,
      message: 'Base de datos demo poblada con éxito para PROINTECA C.A. (Propanoducto 6" Cardón-Amuay, WBS, NDT, PTW SIHO-A, Valuación ROE, Dossier PIC-01-03-05).'
    };
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return { success: false, message: `Error al sembrar datos: ${error?.message || error}` };
  }
}
