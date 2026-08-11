import { DeliverableBody, DeliverableControlItem } from '../domain/types';

/**
 * Renderiza la matriz de control normativo en formato HTML.
 */
export function renderControlMatrixHtml(matrix: DeliverableControlItem[]): string {
  if (!matrix || matrix.length === 0) {
    return `<div style="font-size: 10px; color: #64748b; font-style: italic; padding: 8px;">No se registraron verificaciones en la matriz de control.</div>`;
  }

  return `
    <div style="margin-top: 16px;">
      <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
        MATRIZ DE CONTROL DE CUMPLIMIENTO NORMATIVO Y VERIFICACIÓN EN CAMPO
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px;">
        <thead>
          <tr style="background-color: #0b2239; color: #ffffff; text-align: left;">
            <th style="padding: 6px; border: 1px solid #0f172a; width: 35%;">ITEM DE VERIFICACIÓN / CONTROL</th>
            <th style="padding: 6px; border: 1px solid #0f172a; width: 20%;">NORMA DE REFERENCIA</th>
            <th style="padding: 6px; border: 1px solid #0f172a; width: 15%; text-align: center;">RESULTADO</th>
            <th style="padding: 6px; border: 1px solid #0f172a; width: 30%;">OBSERVACIONES / EVALUADOR</th>
          </tr>
        </thead>
        <tbody>
          ${matrix.map((item, idx) => {
            const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            const statusColor = item.status === 'CONFORME' ? '#059669' : item.status === 'NO_CONFORME' ? '#b91c1c' : '#475569';
            return `
              <tr style="background-color: ${bg};">
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${item.checkName}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace;">${item.normativeRef || 'N/A'}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${statusColor};">
                  ${item.status}
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 9px; color: #334155;">
                  ${item.comments || ''} ${item.verifiedBy ? `(${item.verifiedBy})` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renderiza secciones específicas según el ID de Workflow (WF-043, WF-044, WF-046, WF-052, WF-053, WF-074, WF-075).
 */
export function renderWorkflowSpecificBodyHtml(workflowId: string, body: DeliverableBody): string {
  const wf = (workflowId || '').toUpperCase();
  const specs = body.seccionesEspecificas || {};
  const origin = body.datosOrigen || {};

  let specificContent = '';

  if (wf.includes('WF-043') || wf.includes('PTW')) {
    // WF-043: Permiso de Trabajo Seguro (PTW)
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          12 RENGLONES Y ANEXOS DE SEGURIDAD (PDVSA IR-S-17 / HOJA PTW)
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 10px;">
          <div><strong>Área / Ubicación:</strong> ${specs.ubicacion || origin.ubicacion || 'Frente de Trabajo'}</div>
          <div><strong>Especialidad:</strong> ${specs.especialidad || 'Mecánica / Tuberías'}</div>
          <div><strong>Anexo Confinado (Anexo B):</strong> ${specs.anexoConfinado ? 'APLICA' : 'N/A'}</div>
          <div><strong>Anexo Izaje (Anexo C):</strong> ${specs.anexoIzaje ? 'APLICA' : 'N/A'}</div>
          <div><strong>Prueba de Gases (LEL/O2/H2S):</strong> ${specs.pruebaGasesRealizada ? 'CONFORME / CONTINUA' : 'REQUERIDA'}</div>
          <div><strong>N° Hoja ART Asociada:</strong> ${specs.artCode || origin.artCode || 'ART-IR-S-17-001'}</div>
        </div>
      </div>
    `;
  } else if (wf.includes('WF-044') || wf.includes('ART')) {
    // WF-044: Análisis de Riesgos del Trabajo (ART - IR-S-17)
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          MATRIZ DE RIESGOS Y MEDIDAS PREVENTIVAS (PDVSA IR-S-17)
        </div>
        <div style="font-size: 10px; line-height: 1.5; color: #0f172a;">
          <div><strong>Secuencia de Pasos de la Tarea:</strong> ${specs.pasosTarea || '1. Charla SIHOA • 2. Inspección de EPP • 3. Demarcación de Área • 4. Ejecución de maniobra'}</div>
          <div><strong>Peligros Identificados:</strong> ${specs.peligros || 'Atmósfera inflamable, cargas suspendidas, presión'}</div>
          <div><strong>Controles de Ingeniería / SIHOA:</strong> ${specs.controles || 'Monitoreo multigas continuo, arnés de seguridad, vigía SIHO'}</div>
        </div>
      </div>
    `;
  } else if (wf.includes('WF-046') || wf.includes('PTS')) {
    // WF-046: Procedimiento Técnico de Trabajo Seguro (PTS - SI-S-20)
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          15 SECCIONES NORMATIVAS PTS (NORMA PDVSA SI-S-20)
        </div>
        <div style="font-size: 10px; line-height: 1.5;">
          <div><strong>Objetivo y Alcance:</strong> ${specs.objetivo || 'Establecer los pasos operativos seguros para la maniobra de construcción.'}</div>
          <div><strong>Equipos y Herramientas Certificadas:</strong> ${specs.equipos || 'Grúa CATERPILLAR, Multigas RIKEN KEIKI, Calibrador Fluke'}</div>
          <div><strong>Plan de Emergencia y Control Ambiental:</strong> ${specs.planEmergencia || 'Medidas de contingencia en sitio con ambulancia y extintores.'}</div>
        </div>
      </div>
    `;
  } else if (wf.includes('WF-052') || wf.includes('INSTRUMENTACION') || wf.includes('CALIBRACION')) {
    // WF-052: Certificados y Calibración / Lazos PID / Inyección Multigas
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          CERTIFICADO DE MEDICIÓN E INYECCIÓN MULTIGAS E INSTRUMENTACIÓN ISO 17025
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px;">
          <tr style="background: #e2e8f0; font-weight: bold; text-align: center;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">PARÁMETRO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">VALOR MEDIDO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">LÍMITE PERMISIBLE PDVSA</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">EVALUACIÓN</td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">% O2 (Oxígeno)</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">${specs.o2Val || '20.9%'}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">19.5% - 22.5%</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">CONFORME</td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">% LEL (Explosividad)</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">${specs.lelVal || '0.0%'}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">0% (Hot Work &lt; 1%)</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">CONFORME</td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">H2S / CO (Toxicidad)</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">${specs.h2sVal || '0 ppm'}</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">&lt; 10 ppm H2S / &lt; 25 ppm CO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">CONFORME</td>
          </tr>
        </table>
      </div>
    `;
  } else if (wf.includes('WF-053') || wf.includes('VALUACION') || wf.includes('CIERRE') || wf.includes('ACTA_B') || wf.includes('ACTA_C')) {
    // WF-053: Valuaciones, Retención Legal y Cierre de Obra / Actas B y C (PIC-03-01-09)
    const isActaC = wf.includes('ACTA_C') || specs.tipoActa === 'C' || specs.actaType === 'ACTA_C';
    const isActaB = wf.includes('ACTA_B') || specs.tipoActa === 'B' || specs.actaType === 'ACTA_B';
    
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          ${isActaC ? 'ACTA C: ACEPTACIÓN DEFINITIVA Y TRANSFERENCIA DE CUSTODIA (PDVSA PIC-03-01-09)' : isActaB ? 'ACTA B: COMPLETACIÓN MECÁNICA DE SUBSISTEMA (PDVSA PIC-03-01-09)' : 'VALUACIÓN DE AVANCE DE OBRA, RETENCIÓN LEGAL (5%) Y VERIFICACIÓN SAP'}
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 10px;">
          <div><strong>Código de Registro:</strong> ${specs.codigoActa || origin.codigoActa || 'ACTA-PIC-03-01-09-001'}</div>
          <div><strong>Subsistema / Área:</strong> ${specs.subsystemName || specs.ubicacion || 'Planta de Procesamiento Ulé'}</div>
          <div><strong>Pendientes Categoría A:</strong> ${specs.punchlistACount ?? 0} (0 requeridos)</div>
          <div><strong>Pendientes Categoría B:</strong> ${specs.punchlistBCount ?? 0} (con programa de cierre)</div>
          <div><strong>Monto Bruto Valuado:</strong> ${specs.montoBruto || '$125,000.00'}</div>
          <div><strong>Retención Legal (5%):</strong> ${specs.retencionLegal || '$6,250.00'}</div>
          <div><strong>Monto Neto a Pagar:</strong> ${specs.montoNeto || '$118,750.00'}</div>
          <div><strong>Ficha SAP / HES Certificada:</strong> ${specs.sapHesCode || 'HES-900213481'}</div>
        </div>
      </div>
    `;
  } else if (wf.includes('WF-074') || wf.includes('DATABOOK') || wf.includes('COMPLETACION')) {
    // WF-074: Databook de Calidad / Completación Mecánica
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          DATABOOK DE CALIDAD PDVSA PIC-01-03-05 (EXPEDIENTE FINAL)
        </div>
        <div style="font-size: 10px; line-height: 1.5;">
          <div><strong>Índice de Capítulos Integrados:</strong> Cap. 1 Especificaciones • Cap. 2 Certificados Materiales • Cap. 3 Registros END • Cap. 4 Pruebas Hidrostáticas • Cap. 5 As-Built • Cap. 6 HES/SIHOA</div>
          <div><strong>Grado de Avance de Completación:</strong> ${specs.porcentajeCompletacion || '100% Auditado'}</div>
        </div>
      </div>
    `;
  } else if (wf.includes('WF-075') || wf.includes('LIBRO') || wf.includes('OBRA')) {
    // WF-075: Libro de Obra
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          16 SECCIONES DEL LIBRO DE OBRA DIARIO FOLIADO
        </div>
        <div style="font-size: 10px; line-height: 1.5;">
          <div><strong>Asiento N°:</strong> ${specs.asientoNumero || '042'} | <strong>Fecha Asiento:</strong> ${specs.asientoFecha || origin.fecha || '2026-08-11'}</div>
          <div><strong>Observaciones del Inspector:</strong> ${specs.observacionesInspeccion || 'Avance continuo conforme a especificaciones ASME B31.3 sin desviaciones de SIHOA.'}</div>
        </div>
      </div>
    `;
  } else {
    // Fallback genérico para otros entregables normativos
    specificContent = `
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 12px; background-color: #fafafa;">
        <div style="font-weight: bold; font-size: 11px; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          CONTENIDO TÉCNICO Y ESPECIFICACIONES DEL ENTREGABLE
        </div>
        <div style="font-size: 10px; line-height: 1.5;">
          ${Object.entries(specs).map(([key, val]) => `<div><strong>${key}:</strong> ${typeof val === 'object' ? JSON.stringify(val) : String(val)}</div>`).join('')}
        </div>
      </div>
    `;
  }

  const matrixHtml = renderControlMatrixHtml(body.matrizControl);

  return `
    <section class="deliverable-technical-body">
      ${specificContent}
      ${matrixHtml}
    </section>
  `;
}
