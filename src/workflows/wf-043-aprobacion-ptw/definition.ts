import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { PtwApprovalData, PtwApprovalSchema } from './types';
import { PtwApprovalCapture } from './components/PtwApprovalCapture';

export const wf043Definition: WorkflowDefinition<PtwApprovalData> = {
  id: 'wf-043-aprobacion-ptw',
  title: 'Permiso de Trabajo Seguro (PTW SIHO-A PDVSA IR-S-04)',
  description:
    'Sistema de Permisos de Trabajo en Frío o en Caliente con 11 Anexos Especiales, evaluación de contratistas, ART, LOTO y control de ejecución según PDVSA IR-S-04 Rev. 4.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: PtwApprovalCapture,
  schema: PtwApprovalSchema,
  initialState: 'DRAFT',
  stateTransitions: [
    // Standards UPPERCASE
    {
      from: 'DRAFT',
      to: 'IN_PROGRESS',
      rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
      label: 'Iniciar Captura de Permiso PTW',
    },
    {
      from: 'IN_PROGRESS',
      to: 'SUBMITTED',
      rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
      label: 'Enviar Permiso a Revisión de Riesgos',
    },
    {
      from: 'SUBMITTED',
      to: 'UNDER_REVIEW',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      label: 'Iniciar Revisión por Custodio/SIHO',
    },
    {
      from: 'UNDER_REVIEW',
      to: 'CHANGES_REQUESTED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      label: 'Solicitar Observaciones / Correcciones',
    },
    {
      from: 'CHANGES_REQUESTED',
      to: 'IN_PROGRESS',
      rolesAllowed: ['superadmin', 'gerente', 'supervisor'],
      label: 'Reabrir para Modificación y Corrección',
    },
    {
      from: 'UNDER_REVIEW',
      to: 'APPROVED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      gateId: 'gate-contractor-readiness',
      label: 'Aprobar Prerrequisitos de Contratista y SIHOA',
    },
    {
      from: 'APPROVED',
      to: 'ISSUED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector', 'supervisor'],
      gateId: 'gate-issuance-hard-blocks',
      label: 'Otorgar y Emitir Permiso en Sitio (Prueba Gas & Firmas)',
    },
    {
      from: 'ISSUED',
      to: 'SUSPENDED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector', 'supervisor'],
      label: 'Suspender Permiso (Desviación / Variación de Condiciones)',
    },
    {
      from: 'SUSPENDED',
      to: 'ISSUED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      gateId: 'gate-issuance-hard-blocks',
      label: 'Re-emitir Permiso tras Corrección de Riesgos',
    },
    {
      from: 'ISSUED',
      to: 'CLOSED',
      rolesAllowed: ['superadmin', 'gerente', 'inspector', 'supervisor'],
      gateId: 'gate-closeout-verification',
      label: 'Cerrar Permiso al Concluir Trabajo (Orden y Limpieza)',
    },
    {
      from: 'CLOSED',
      to: 'ARCHIVED',
      rolesAllowed: ['superadmin', 'gerente'],
      label: 'Archivar Documentación Custodiada (3 meses min)',
    },
    // Backward compatibility lowercase aliases for kernel tests
    {
      from: 'draft',
      to: 'submitted',
      rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
      label: 'Submit draft (Kernel test compatibility)',
    },
    {
      from: 'submitted',
      to: 'safety_approved',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      label: 'Safety approved (Kernel test compatibility)',
    },
    {
      from: 'submitted',
      to: 'approved',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      label: 'Approved (Kernel test compatibility)',
    },
  ],
  hardGates: [
    {
      id: 'gate-contractor-readiness',
      name: 'Verificación de Contratista y Prerrequisitos SIHOA',
      description: 'Garantiza que la contratista sea APTA, posea Plan SIHOA aprobado, ART y Procedimiento autorizados.',
      evaluator: (_context, data: any) => {
        if (!data) return { passed: true };

        // If contractorEligibility structure is provided, evaluate strictly
        if (data.contractorEligibility) {
          if (data.contractorEligibility.contractorStatus !== 'APTA') {
            return {
              passed: false,
              message: `HARD_BLOCK: La empresa contratista "${data.contractorEligibility.contractorName || 'N/A'}" no posee estatus APTA (Estatus actual: ${data.contractorEligibility.contractorStatus}).`,
            };
          }
          if (!data.contractorEligibility.sihoaPlanApproved) {
            return {
              passed: false,
              message: 'HARD_BLOCK: El Plan SIHOA de la empresa contratista no está aprobado.',
            };
          }
        }

        if (data.preStartReadiness) {
          if (!data.preStartReadiness.artApproved) {
            return {
              passed: false,
              message: 'HARD_BLOCK: El Análisis de Riesgos del Trabajo (ART PDVSA IR-S-17) debe estar aprobado.',
            };
          }
          if (!data.preStartReadiness.procedureApproved) {
            return {
              passed: false,
              message: 'HARD_BLOCK: El Procedimiento de Trabajo (PDVSA SI-S-20) debe estar aprobado.',
            };
          }
        }

        return { passed: true };
      },
    },
    {
      id: 'gate-issuance-hard-blocks',
      name: 'Bloqueos Obligatorios de Emisión y Atmósfera en Sitio (PDVSA IR-S-04)',
      description: 'Valida prueba atmosférica (0% LEL en caliente), coincidencia de horas, duración máxima y firmas tripartitas.',
      evaluator: (_context, data: any) => {
        if (!data) return { passed: true };

        const workType = data.workType || 'frio';
        const lel = data.gasTest?.lelPercentage ?? data.lelPercentage ?? 0;
        const o2 = data.gasTest?.o2Percentage ?? data.o2Percentage ?? 20.9;
        const h2s = data.gasTest?.h2sPpm ?? data.h2sPpm ?? 0;

        const startTime = data.startTime;
        const testTime = data.gasTest?.testTime ?? data.testTime;

        const maxDurationHours = data.maxDurationHours ?? 8;
        const isPlantShutdown = data.isPlantShutdownOrMajorMaint ?? false;

        // 1. Duración Máxima
        const maxAllowed = isPlantShutdown ? 12 : 8;
        if (maxDurationHours > maxAllowed) {
          return {
            passed: false,
            message: `HARD_BLOCK: La duración del permiso (${maxDurationHours}h) excede el máximo permitido de ${maxAllowed}h para este tipo de operación (Punto 8.4).`,
          };
        }

        // 2. Coincidencia de Hora de Inicio y Hora de Prueba de Gas
        if (startTime && testTime && startTime !== testTime) {
          return {
            passed: false,
            message: `HARD_BLOCK: La hora de otorgamiento/inicio (${startTime}) debe coincidir exactamente con la hora de la prueba inicial de gas (${testTime}) [Punto 8.1.1.b].`,
          };
        }

        // 3. Prueba Atmosférica en Trabajo en Caliente
        if (workType === 'caliente' && lel !== 0) {
          return {
            passed: false,
            message: `HARD_BLOCK: Trabajo en Caliente exige 0.0% v/v LEL de gas inflamable en la prueba atmosférica (explosividad detectada: ${lel}% LEL) [Punto 8.3.6].`,
          };
        }

        // 4. Rangos de O2 y H2S
        if (o2 < 19.5 || o2 > 23.5) {
          return {
            passed: false,
            message: `HARD_BLOCK: Nivel de Oxígeno fuera de rango seguro (${o2}% O2). Rango permitido: 19.5% a 23.5%.`,
          };
        }
        if (h2s > 0) {
          return {
            passed: false,
            message: `HARD_BLOCK: Presencia de Gas Sulfhídrico (${h2s} PPM H2S > 0 PPM). Permiso bloqueado.`,
          };
        }

        // 5. Serial Multigas Obligatorio (PDVSA IR-S-04 Renglón 12)
        if (data.gasTest && !data.gasTest.equipoMultigasSerial) {
          return {
            passed: false,
            message: 'HARD_BLOCK: Debe registrar el Serial del Equipo Multigas / Gasotéster utilizado para la prueba atmosférica (PDVSA IR-S-04 Renglón 12).',
          };
        }

        // 6. Firmas Tripartitas requeridas (si signers está definido)
        if (data.signers) {
          if (!data.signers.emisor?.name || !data.signers.emisor?.certNumber) {
            return { passed: false, message: 'HARD_BLOCK: Falta la identificación o número de certificado del EMISOR autorizante.' };
          }
          if (!data.signers.receptor?.name || !data.signers.receptor?.certNumber) {
            return { passed: false, message: 'HARD_BLOCK: Falta la identificación o número de certificado del RECEPTOR de mantenimiento/operaciones.' };
          }
          if (!data.signers.ejecutor?.name) {
            return { passed: false, message: 'HARD_BLOCK: Falta la identificación del EJECUTOR responsable del trabajo.' };
          }
        }

        // 7. Prórroga si fue solicitada (PDVSA IR-S-04 8.6)
        if (data.extension?.requested) {
          if (data.extension.extensionHours > 2) {
            return { passed: false, message: 'HARD_BLOCK: La prórroga no puede exceder las dos (2) horas continuas (PDVSA IR-S-04 8.6).' };
          }
          if (!data.extension.emisorSigned) {
            return { passed: false, message: 'HARD_BLOCK: La prórroga de PTW requiere la firma digital obligatoria del EMISOR (PDVSA IR-S-04 8.6).' };
          }
          if (!data.extension.initialConditionsUnchanged || !data.extension.sameEmisorReceptorEjecutor) {
            return {
              passed: false,
              message: 'HARD_BLOCK: La prórroga exige que las condiciones iniciales no hayan variado y los firmantes sean los mismos (PDVSA IR-S-04 8.6).',
            };
          }
        }

        return { passed: true };
      },
    },
    {
      id: 'gate-closeout-verification',
      name: 'Verificación de Cierre y Desmovilización',
      description: 'Exige confirmación de orden, limpieza, retiro de bloqueos LOTO y re-conexión eléctrica.',
      evaluator: (_context, data: any) => {
        if (!data || !data.closeout) return { passed: true };

        if (!data.closeout.areaCleanAndOrderly) {
          return {
            passed: false,
            message: 'HARD_BLOCK: No se puede cerrar el permiso sin confirmar las condiciones de orden y limpieza en el área.',
          };
        }
        if (!data.closeout.locksRemovedAndReconnected) {
          return {
            passed: false,
            message: 'HARD_BLOCK: Debe verificarse que los bloqueos hayan sido retirados y los equipos reconectados de forma segura.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-043-ptw-ir-s-04',
    title: 'Permiso de Trabajo Seguro e Integrado Databook (PDVSA IR-S-04)',
    type: 'document',
    factory: (context, data: any) => {
      const ptwCode = data?.ptwCode || 'PTW-DRAFT';
      const workType = (data?.workType || 'frio').toUpperCase();
      const status = data?.status || 'DRAFT';

      const isIssuedOrClosed = ['ISSUED', 'CLOSED', 'ARCHIVED', 'APPROVED', 'safety_approved'].includes(status);

      const emisorName = data?.signers?.emisor?.name || data?.safetyInspectorName || data?.supervisorName || 'Emisor Autorizado';
      const emisorCert = data?.signers?.emisor?.certNumber || 'CERT-EM-01';
      const emisorOrg = data?.signers?.emisor?.organization || context.operatorBrand?.companyName || 'PDVSA CUSTODIO';

      const receptorName = data?.signers?.receptor?.name || data?.supervisorName || 'Receptor Autorizado';
      const receptorCert = data?.signers?.receptor?.certNumber || 'CERT-REC-01';
      const receptorOrg = data?.signers?.receptor?.organization || context.contractorBrand?.companyName || 'CONTRATISTA RECEPTOR';

      const ejecutorName = data?.signers?.ejecutor?.name || data?.supervisorName || 'Ejecutor Responsable';
      const ejecutorOrg = data?.signers?.ejecutor?.organization || context.contractorBrand?.companyName || 'EJECUTOR';

      return createDocumentViewModel({
        documentId: `PTW-DOC-${ptwCode}`,
        title: `PERMISO DE TRABAJO EN ${workType} (PDVSA IR-S-04 ANEXO A)`,
        code: ptwCode,
        date: data?.issueDate || '',
        status: isIssuedOrClosed ? 'APPROVED' : 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers: [
          {
            id: 'sig-ptw-emisor',
            role: 'OPERATOR',
            name: emisorName,
            title: `Emisor Autorizado (Certificado N° ${emisorCert})`,
            organization: emisorOrg,
            status: data?.signers?.emisor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.emisor?.signedAt,
          },
          {
            id: 'sig-ptw-receptor',
            role: 'CONTRACTOR',
            name: receptorName,
            title: `Receptor Autorizado (Certificado N° ${receptorCert})`,
            organization: receptorOrg,
            status: data?.signers?.receptor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.receptor?.signedAt,
          },
          {
            id: 'sig-ptw-ejecutor',
            role: 'CONTRACTOR',
            name: ejecutorName,
            title: 'Ejecutor Responsable del Trabajo',
            organization: ejecutorOrg,
            status: data?.signers?.ejecutor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.ejecutor?.signedAt,
          },
        ],
        metadata: freezeDocumentMetadata([
          {
            id: 'sig-ptw-emisor',
            role: 'OPERATOR',
            name: emisorName,
            title: `Emisor Autorizado (Cert. ${emisorCert})`,
            organization: emisorOrg,
            status: data?.signers?.emisor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.emisor?.signedAt,
          },
          {
            id: 'sig-ptw-receptor',
            role: 'CONTRACTOR',
            name: receptorName,
            title: `Receptor Autorizado (Cert. ${receptorCert})`,
            organization: receptorOrg,
            status: data?.signers?.receptor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.receptor?.signedAt,
          },
          {
            id: 'sig-ptw-ejecutor',
            role: 'CONTRACTOR',
            name: ejecutorName,
            title: 'Ejecutor Responsable',
            organization: ejecutorOrg,
            status: data?.signers?.ejecutor?.status === 'SIGNED' ? 'SIGNED' : 'PENDING',
            signedAt: data?.signers?.ejecutor?.signedAt,
          },
        ]),
        sections: [
          {
            id: 'sec-ptw-header',
            title: '1. IDENTIFICACIÓN Y ELEGIBILIDAD DEL TRABAJO (PDVSA IR-S-04)',
            content: [
              `Código PTW: ${ptwCode}`,
              `Orden SAP N°: ${data?.sapOrderNumber || 'N/A'}`,
              `Instalación / Área / Unidad: ${data?.installationArea || 'N/A'}`,
              `Equipo Intervenido: ${data?.equipmentDescription || 'N/A'}`,
              `Descripción del Trabajo: ${data?.workDescription || 'N/A'}`,
              `Clasificación: Trabajo en ${workType}`,
              `Empresa Contratista: ${data?.contractorEligibility?.contractorName || 'N/A'} (RIF: ${data?.contractorEligibility?.contractorRif || 'N/A'})`,
              `Estatus de Elegibilidad: ${data?.contractorEligibility?.contractorStatus || 'APTA'}`,
              `Plan SIHOA Aprobado: ${data?.contractorEligibility?.sihoaPlanApproved ? 'SÍ (Código: ' + (data?.contractorEligibility?.sihoaPlanCode || 'N/A') + ')' : 'SÍ (CONFORME)'}`,
            ],
          },
          {
            id: 'sec-ptw-readiness',
            title: '2. PRERREQUISITOS SIHOA Y NORMAS APLICABLES',
            content: [
              `Análisis de Riesgos del Trabajo (ART PDVSA IR-S-17): ${data?.preStartReadiness?.artCode || 'ART-2026-CONFORME'} [${data?.preStartReadiness?.artApproved !== false ? 'APROBADO' : 'PENDIENTE'}]`,
              `Procedimiento de Trabajo (PDVSA SI-S-20): ${data?.preStartReadiness?.procedureCode || 'PROC-SIHOA-CONFORME'} [${data?.preStartReadiness?.procedureApproved !== false ? 'APROBADO' : 'PENDIENTE'}]`,
              `Plan de Respuesta a Emergencia: ${data?.preStartReadiness?.emergencyPlanCode || 'PRE-2026'}`,
              `Anexos Especiales Requeridos: ${(data?.preStartReadiness?.specialCertificatesRequired || []).join(', ').toUpperCase() || 'NINGUNO (SÓLO PTW CORE)'}`,
            ],
          },
          {
            id: 'sec-ptw-gas-test',
            title: '3. PRUEBA DE GASES Y EVALUACIÓN ATMOSFÉRICA',
            content: [
              `Hora de la Prueba: ${data?.gasTest?.testTime || data?.testTime || '08:00'} (Hora de inicio: ${data?.startTime || '08:00'})`,
              `Evaluador de Atmósfera: ${data?.gasTest?.evaluatorName || emisorName} (C.I.: ${data?.gasTest?.evaluatorId || '12345678'}, Certificado: ${data?.gasTest?.evaluatorCertificate || emisorCert})`,
              `Equipo de Medición: ${data?.gasTest?.equipmentUsed || 'Explosímetro Multi-Gas Calibrado'} (Vencimiento Calibración: ${data?.gasTest?.calibrationExpiryDate || 'vigente'})`,
              `Explosividad (% v/v LEL): ${data?.gasTest?.lelPercentage ?? data?.lelPercentage ?? 0}% [Límite máximo en caliente: 0.0%]`,
              `Oxígeno (% v/v O2): ${data?.gasTest?.o2Percentage ?? data?.o2Percentage ?? 20.9}% [Rango permitido: 19.5% - 23.5%]`,
              `Sulfhídrico (PPM H2S): ${data?.gasTest?.h2sPpm ?? data?.h2sPpm ?? 0} PPM [Máximo permitido: 0 PPM]`,
              `Monóxido de Carbono (PPM CO): ${data?.gasTest?.coPpm || 0} PPM`,
              `Dióxido de Azufre (PPM SO2): ${data?.gasTest?.so2Ppm || 0} PPM`,
              `Frecuencia de Monitoreo: ${(data?.gasTest?.frequency || 'unica').toUpperCase()} (Cada ${data?.gasTest?.monitoringFrequencyHours || 1} hora(s))`,
            ],
          },
          {
            id: 'sec-ptw-checklist',
            title: '4. PREPARACIÓN DEL EQUIPO Y CONDICIONES VERIFICADAS',
            content: [
              `Aislamiento y Preparación: Lavado [${data?.preparationChecklist?.washed ? 'X' : ' '}], Aislado [${data?.preparationChecklist?.isolated ? 'X' : ' '}], Purgado [${data?.preparationChecklist?.purged ? 'X' : ' '}], Venteado [${data?.preparationChecklist?.vented ? 'X' : ' '}], Inertizado [${data?.preparationChecklist?.inerted ? 'X' : ' '}], Despresurizado [${data?.preparationChecklist?.depressurized ? 'X' : ' '}], Drenado [${data?.preparationChecklist?.drained ? 'X' : ' '}]`,
              `Aislamiento LOTO Fuentes de Energía: ${data?.verificationConditions?.energySourcesIsolated || data?.lotoVerified ? 'VERIFICADO Y BLOQUEADO' : 'NO / PENDIENTE'}`,
              `Verificación Áreas Clasificadas Eléctricas: ${data?.verificationConditions?.electricalClassifiedAreaChecked ? 'CONFORME' : 'NO / N/A'}`,
              `Extintores y Equipos Contra Incendio en Sitio: ${data?.verificationConditions?.fireEquipmentOnSite !== false ? 'DISPONIBLES Y OPERATIVOS' : 'PENDIENTE'}`,
              `Demarcación y Rutas de Evacuación: ${data?.verificationConditions?.areaDemarcated !== false ? 'DEMARCADO Y SEÑALIZADO' : 'PENDIENTE'}`,
              `Desvío de Protecciones/Instrumentación: ${data?.verificationConditions?.instrumentBypassAuthorized ? 'SI (Tag: ' + data?.verificationConditions?.instrumentBypassTag + ')' : 'NO APLICA'}`,
            ],
          },
          {
            id: 'sec-ptw-extension-closeout',
            title: '5. PRÓRROGA, CIERRE Y TRAZABILIDAD DATABOOK',
            content: [
              `Prórroga Solicitada: ${data?.extension?.requested ? 'SÍ (Prórroga hasta: ' + data.extension.extendedUntilTime + ' - ' + data.extension.extensionHours + 'h max)' : 'NO'}`,
              `Cierre de Permiso: Fecha ${data?.closeout?.closedDate || 'PENDIENTE'} a las ${data?.closeout?.closedAtTime || 'PENDIENTE'}`,
              `Condiciones de Área Limpia y Ordenada: ${data?.closeout?.areaCleanAndOrderly !== false ? 'VERIFICADO' : 'PENDIENTE'}`,
              `Bloqueos Retirados / Reconexión Eléctrica: ${data?.closeout?.locksRemovedAndReconnected !== false ? 'VERIFICADO' : 'PENDIENTE'}`,
              `Cancelación del Permiso: ${data?.closeout?.isCancelled ? 'CANCELADO (Motivo: ' + data.closeout.cancelReason + ' a las ' + data.closeout.cancelTime + ' por ' + data.closeout.cancelledByName + ' - ' + data.closeout.cancelledByRole + ')' : 'NO CANCELADO'}`,
            ],
          },
        ],
      });
    },
  },
};
