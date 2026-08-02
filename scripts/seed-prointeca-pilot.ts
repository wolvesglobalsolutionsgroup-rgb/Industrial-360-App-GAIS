import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth, loginAnonymously } from '../src/firebase';

/**
 * Script de Sembrado del Piloto Industrial PROINTECA (prointeca-demo)
 *
 * RESGUARDOS DE SEGURIDAD:
 * - Solo se permite ejecutar en entornos de no-producción o contra el emulador de Firestore,
 *   o cuando la variable de entorno ALLOW_PILOT_SEED === 'true' o DEMO_AUTH_ENABLED.
 * - Sigue la arquitectura Multi-Tenant de S1/S6/S8/S9/S10.
 * - Registra los 5 roles clave (gerente, supervisor, inspector, campo, cliente).
 */

export interface PilotSeedResult {
  success: boolean;
  message: string;
  seededDocsCount: number;
}

export async function seedProintecaPilot(force = true): Promise<PilotSeedResult> {
  const isEmulator = typeof process !== 'undefined' && Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const isDevEnv = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  const isExplicitlyAllowed = typeof process !== 'undefined' && process.env.ALLOW_PILOT_SEED === 'true';

  // Safeguard against running directly in production
  if (!isEmulator && !isDevEnv && !isExplicitlyAllowed) {
    return {
      success: false,
      message: '❌ PROHIBIDO ejecutar el sembrado del piloto en ambiente de producción sin emulador de Firestore o bandera de desarrollo.',
      seededDocsCount: 0
    };
  }

  console.log('🚀 Iniciando sembrado del piloto PROINTECA (tenant: prointeca-demo)...');

  // Asegurar autenticación mínima si no hay usuario
  if (!auth.currentUser) {
    try {
      await loginAnonymously();
    } catch (e) {
      console.warn('⚠️ Continuación de sembrado sin auth previa:', e);
    }
  }

  const orgId = 'prointeca-demo';
  const projectId = 'PROJ-PILOT-PROINTECA';
  let docsCount = 0;

  try {
    // 1. Organización Principal
    const orgData = {
      id: orgId,
      name: 'PROINTECA C.A. - Piloto Paraguaná',
      taxId: 'RIF J-30489210-4',
      description: 'Tenant Piloto de Inspección, Integridad y Mantenimiento de Propanoducto 6" Cardón-Amuay (PDVSA CRP)',
      brandKit: {
        primaryColor: '#0B2239',
        accentColor: '#F59E0B'
      },
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId), orgData, { merge: true });
    docsCount++;

    // 2. Miembros y Usuarios para los 5 Roles del Piloto
    const pilotUsers = [
      {
        uid: 'usr_gerente_prointeca',
        name: 'Ing. Carlos Mendoza',
        email: 'carlos.mendoza@prointeca-demo.com',
        role: 'gerente'
      },
      {
        uid: 'usr_supervisor_prointeca',
        name: 'Ing. Manuel Rivas',
        email: 'manuel.rivas@prointeca-demo.com',
        role: 'supervisor'
      },
      {
        uid: 'usr_inspector_prointeca',
        name: 'Tec. Roberto Gomez',
        email: 'roberto.gomez@prointeca-demo.com',
        role: 'inspector'
      },
      {
        uid: 'usr_campo_prointeca',
        name: 'José R. Colmenares',
        email: 'jose.colmenares@prointeca-demo.com',
        role: 'campo'
      },
      {
        uid: 'usr_cliente_prointeca',
        name: 'Ing. Gustavo Bolívar',
        email: 'gustavo.bolivar@pdvsa-demo.com',
        role: 'cliente'
      }
    ];

    for (const u of pilotUsers) {
      // Documento de membresía autoritativo (S1/S1.5 Security Model)
      const membershipData = {
        id: u.uid,
        uid: u.uid,
        orgId,
        email: u.email,
        name: u.name,
        role: u.role,
        status: 'approved',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'organizations', orgId, 'memberships', u.uid), membershipData, { merge: true });
      docsCount++;

      // Documento de perfil de usuario
      const userProfileData = {
        uid: u.uid,
        displayName: u.name,
        email: u.email,
        role: u.role,
        orgId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', u.uid), userProfileData, { merge: true });
      docsCount++;
    }

    // 3. Proyecto Piloto
    const projectData = {
      id: projectId,
      name: 'Reemplazo y Reparación Propanoducto 6" Cardón - Amuay',
      description: 'Piloto de Integridad y Reemplazo de Tramo en Propanoducto 6" SCH 40 (17.0 km) con MAOP 2126 PSI. Reparación de 3 defectos ILI, camisa Tipo B, NDT 100% y prueba hidrostática.',
      budget: 1850000,
      advancePercent: 68,
      startDate: '2026-07-01',
      status: 'en_campo',
      orgId,
      contractNo: 'CTR-2026-PDVSA-CRP-006',
      clientName: 'PDVSA Refinación Paraguaná',
      contractorName: 'PROINTECA C.A.',
      pipeSpecs: {
        diameter: '6"',
        schedule: 'SCH 40',
        lengthKm: 17.0,
        maopPsi: 2126,
        fluid: 'Propano / GLP',
        location: 'CRP Paraguaná, Estado Falcón'
      },
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId), projectData, { merge: true });
    await setDoc(doc(db, 'projects', projectId), projectData, { merge: true });
    docsCount += 2;

    // 4. Registro de Corrida ILI con 3 Defectos Exactos
    const iliRunData = {
      id: 'RUN-ILI-2026-PROINTECA',
      orgId,
      projectId,
      toolType: 'MFL + High-Res Ultrasonic Combo Pig',
      inspectionDate: '2026-06-15',
      pipelineLengthKm: 17.0,
      maopPsi: 2126,
      totalAnomalies: 3,
      anomalies: [
        {
          id: 'D001',
          kp: 2.4,
          locationName: 'KP 2+400 Frente Cardón',
          depthPercent: 48,
          wallLoss: '48%',
          lengthMm: 120,
          widthMm: 45,
          orientation: '12:00',
          type: 'Corrosión Externa',
          status: 'EVALUADO',
          action: 'MONITOREAR',
          repairRequired: false
        },
        {
          id: 'D002',
          kp: 8.7,
          locationName: 'KP 8+700 Tramo Medio',
          depthPercent: 22,
          wallLoss: '22%',
          lengthMm: 60,
          widthMm: 30,
          orientation: '03:00',
          type: 'Corrosión Interna Leve',
          status: 'EVALUADO',
          action: 'SIN_ACCION',
          repairRequired: false
        },
        {
          id: 'D003',
          kp: 12.1,
          locationName: 'KP 12+100 Frente Amuay',
          depthPercent: 68,
          wallLoss: '68%',
          lengthMm: 280,
          widthMm: 85,
          orientation: '06:00',
          type: 'Pérdida de Pared Crítica',
          status: 'CRITICO',
          action: 'CAMISA_TIPO_B',
          repairRequired: true,
          safeOperatingPressurePsi: 1650,
          maopPsi: 2126
        }
      ],
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'ili_runs', iliRunData.id), iliRunData, { merge: true });
    docsCount++;

    // 5. WBS y Tareas Operativas del Flujo
    const pilotTasks = [
      {
        id: 'TASK-PILOT-001',
        orgId,
        projectId,
        wbsCode: 'WBS-1.1',
        title: 'Aislamiento LOTO, Purga N2 y Permisología SIHO-A Propanoducto 6"',
        description: 'Despresurización de línea 6" GLP, bloqueo de válvulas en Patio Cardón y emisión de Permiso PTW-2026-PILOT-01.',
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
        assignee: 'Ing. Manuel Rivas'
      },
      {
        id: 'TASK-PILOT-002',
        orgId,
        projectId,
        wbsCode: 'WBS-1.2',
        title: 'Excavación Zanja & Descubrimiento Anomalía ILI D003 (KP 12.1)',
        description: 'Descubrimiento manual de tubería 6" en KP 12+100, excavación de zanja y limpieza SSPC-SP10 para inspección visual.',
        specialty: 'Civil',
        unit: 'm',
        plannedQuantity: 150,
        executedQuantity: 150,
        unitCost: 120,
        status: 'terminada',
        priority: 'high',
        crewName: 'Cuadrilla Movimiento Tierra',
        frontName: 'Frente KP 12+100',
        ptwRequired: true,
        startDate: '2026-07-06',
        dueDate: '2026-07-12',
        assignee: 'José R. Colmenares'
      },
      {
        id: 'TASK-PILOT-003',
        orgId,
        projectId,
        wbsCode: 'WBS-1.3',
        title: 'Instalación y Soldadura Camisa Tipo B (API 1104 Anexo B) en D003',
        description: 'Alineación y soldadura en caliente de camisa de refuerzo sobre tubería 6" SCH 40 a MAOP 2126 PSI.',
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
        dueDate: '2026-07-20',
        assignee: 'José R. Colmenares'
      },
      {
        id: 'TASK-PILOT-004',
        orgId,
        projectId,
        wbsCode: 'WBS-1.4',
        title: 'Inspección QA/QC NDT Gammagrafía (RT) y Ultrasonido (UT)',
        description: 'Evaluación radiográfica 100% de soldaduras de camisa Tipo B D003 e inspección ultrasónica de espesores.',
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
        dueDate: '2026-07-25',
        assignee: 'Tec. Roberto Gomez'
      },
      {
        id: 'TASK-PILOT-005',
        orgId,
        projectId,
        wbsCode: 'WBS-1.5',
        title: 'Prueba Hidrostática a 2126 PSI MAOP y Emisión de Valuación N° 1',
        description: 'Presurización con agua tratada durante 24 horas, gráfico de presión/temperatura y compilación de Dossier PIC-01-03-05.',
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
        dueDate: '2026-07-28',
        assignee: 'Ing. Carlos Mendoza'
      }
    ];

    for (const t of pilotTasks) {
      await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'tasks', t.id), t, { merge: true });
      docsCount += 1;
    }

    // 6. PTW / Permiso de Trabajo Seguro y ART (SIHO-A)
    const ptwData = {
      id: 'PTW-2026-PILOT-01',
      orgId,
      projectId,
      ptwCode: 'PTW-2026-PILOT-01',
      type: 'Trabajo en Caliente / Soldadura en Vivo Camisa B',
      location: 'Propanoducto 6" KP 12+100 (Frente Paraguaná)',
      applicant: 'Ing. Manuel Rivas',
      status: 'ACTIVO',
      startDate: '2026-07-20',
      endDate: '2026-07-28',
      gasTestResult: '0.0% LEL, 20.9% O2, 0 PPM H2S',
      verifiedBy: 'Tec. Roberto Gomez',
      hazards: [
        'Presencia de atmósfera inflamable en línea GLP',
        'Soldadura sobre tubería a presión',
        'Excavación profunda mayor a 1.20m'
      ],
      controls: [
        'Barrido con Nitrógeno seco hasta 0% LEL',
        'Uso de soldador homologado CIV-1845236 bajo API 1104 Anexo B',
        'Candado LOTO y medición continua de presión/gases'
      ],
      lotoStatus: {
        isolated: true,
        lockTag: 'LOCK-PROINTECA-PILOT-012',
        zeroEnergyVerified: true,
        verifiedAt: '2026-07-20T07:30:00Z'
      },
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'siho_ptw', ptwData.id), ptwData, { merge: true });
    docsCount++;

    // 7. Reporte de Campo Offline
    const fieldReportData = {
      id: 'REP-CAMPO-PILOT-001',
      orgId,
      projectId,
      reportNo: 'REP-CAMPO-PILOT-001',
      date: '2026-07-22',
      author: 'José R. Colmenares',
      notes: 'Inspección de zanja y alineación de camisa Tipo B en KP 12+100. Espesor medido 0.280" SCH 40. Condición de superficie SSPC-SP10 verificada.',
      location: 'KP 12+100 Paraguaná',
      coordinates: {
        lat: 11.74502,
        lng: -70.21045
      },
      imagePreview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"><rect width="300" height="150" fill="%230B2239"/><text x="30" y="80" fill="%23F59E0B" font-family="sans-serif" font-weight="bold" font-size="14">Foto Inspección KP 12+100</text></svg>',
      status: 'SINCRONIZADO',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'field_reports', fieldReportData.id), fieldReportData, { merge: true });
    docsCount++;

    // 8. Juntas de Soldadura QA/QC NDT
    const weldData = {
      id: 'W-PILOT-001',
      orgId,
      projectId,
      jointNo: 'J-PILOT-001',
      lineNo: '6"-PRO-CARDON-01',
      welderId: 'CIV-1845236',
      welderName: 'José R. Colmenares',
      diameter: '6"',
      thickness: '0.280" (SCH 40)',
      process: 'SMAW/GMAW (API 1104 Anexo B)',
      status: 'APROBADO',
      vtStatus: 'APROBADO',
      ndtType: 'Gammagrafía (RT) & Ultrasonido (UT)',
      ndtStatus: 'APROBADO',
      reportNo: 'REP-RT-2026-PILOT01',
      inspector: 'Tec. Roberto Gomez',
      date: '2026-07-23',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'weld_joints', weldData.id), weldData, { merge: true });
    docsCount++;

    // 9. Valuación de Avance Físico
    const valuationData = {
      id: 'VAL-PILOT-001',
      orgId,
      projectId,
      number: 1,
      valNumber: 'VAL-PILOT-001',
      period: 'Quincena 2 - Julio 2026',
      periodStart: '2026-07-15',
      periodEnd: '2026-07-31',
      description: 'Valuación N° 1 por trabajos de reparación de integridad en Propanoducto 6" Cardón-Amuay (Defecto ILI D003 KP 12.1), instalación de camisa Tipo B y prueba hidrostática.',
      grossAmount: 245000,
      retentionFielCumplimiento: 24500, // 10%
      retentionLaboral: 12250, // 5%
      amortizationAnticipo: 73500, // 30%
      netAmount: 134750,
      status: 'CERTIFICADA',
      date: '2026-07-28',
      signatures: {
        inspector: { signedBy: 'Tec. Roberto Gomez', role: 'inspector', date: '2026-07-28', comment: 'Verificado 100% NDT conforme API 1104' },
        supervisor: { signedBy: 'Ing. Manuel Rivas', role: 'supervisor', date: '2026-07-28', comment: 'Aprobado avance físico de campo' },
        gerente: { signedBy: 'Ing. Carlos Mendoza', role: 'gerente', date: '2026-07-29', comment: 'Certificado para cobro ante PDVSA' }
      },
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'valuations', valuationData.id), valuationData, { merge: true });
    docsCount++;

    // 10. Dossier de Calidad
    const dossierData = {
      id: 'DOS-PILOT-001',
      orgId,
      projectId,
      code: 'DOS-PILOT-001',
      title: 'Dossier de Calidad y Libro Final de Obra Propanoducto 6" Cardón - Amuay',
      codigoPDVSA: 'PDVSA-PIC-01-03-05-PROINTECA',
      statusDoc: 'Aprobado',
      fase: 'I',
      sections: [
        { title: 'Sección I - Datos Generales y Permisología SIHO-A (PTW-2026-PILOT-01)', status: 'COMPLETO', docsCount: 5 },
        { title: 'Sección II - Certificados NDT (RT/UT) y Calificación de Soldador CIV-1845236', status: 'COMPLETO', docsCount: 8 },
        { title: 'Sección III - Registros y Gráficos de Prueba Hidrostática 2126 PSI', status: 'COMPLETO', docsCount: 3 },
        { title: 'Sección IV - Planos As-Built y Matriz de Evaluación Defectos ILI', status: 'COMPLETO', docsCount: 4 }
      ],
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'dossier_compilations', dossierData.id), dossierData, { merge: true });
    docsCount++;

    const msg = `✅ Sembrado del piloto PROINTECA completado exitosamente (${docsCount} documentos creados/actualizados para tenant '${orgId}').`;
    console.log(msg);
    return {
      success: true,
      message: msg,
      seededDocsCount: docsCount
    };
  } catch (error: any) {
    const errObj = error?.message || error;
    console.error('❌ Error sembrando piloto PROINTECA:', errObj);
    return {
      success: false,
      message: `Error al sembrar piloto PROINTECA: ${errObj}`,
      seededDocsCount: docsCount
    };
  }
}

// Ejecución directa si se invoca desde CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed-prointeca-pilot')) {
  seedProintecaPilot(true)
    .then((res) => {
      console.log(res.message);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
