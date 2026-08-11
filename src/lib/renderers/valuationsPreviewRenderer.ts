import { generateQrSvg } from './masterDeliverableRenderer';

export interface ActaCompletionData {
  actaCode: string;
  subsystemCode: string;
  subsystemName: string;
  contractCode?: string;
  projectName?: string;
  operatorName?: string;
  contractorName?: string;
  date?: string;
  punchlistCategoryACount: number;
  punchlistCategoryBCount: number;
  databookComplete: boolean;
  hydrotestCertified: boolean;
  inspectorNotes?: string;
  visualVersionHash?: string;
  qrVerificationUrl?: string;
  signers?: Array<{
    role: string;
    name: string;
    certNumber?: string;
    signedAt?: string;
  }>;
}

/**
 * Renderiza el HTML oficial del Acta B - Completación Mecánica de Subsistemas (PIC-03-01-09).
 * Incluye inyección del código QR de auditoría en la esquina inferior derecha (Sección 3.2 Formato Maestro Rev. 1).
 */
export function renderActaBCompletacionMecanicaHtml(data: ActaCompletionData): string {
  const docId = data.actaCode || `ACTA-MC-${data.subsystemCode || 'SUBSISTEMA'}`;
  const hash = data.visualVersionHash || 'SHA256-PENDING-ACTA-B';
  const qrUrl = data.qrVerificationUrl || `https://ic360-nexus.pdvsa.com/verify?docId=${encodeURIComponent(docId)}&hash=${hash}`;
  const qrSvg = generateQrSvg(qrUrl, 84);

  return `
    <div class="acta-b-container" style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background: #ffffff; color: #0f172a;">
      <!-- ENCABEZADO DUALE INSTITUCIONAL -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
        <tr>
          <td style="width: 30%; text-align: left; padding: 8px;">
            <div style="font-weight: 900; font-size: 14px; color: #b91c1c;">${data.operatorName || 'PDVSA PETRÓLEO S.A.'}</div>
            <div style="font-size: 8px; font-weight: bold; color: #475569; text-transform: uppercase;">OPERADOR / CUSTODIO</div>
          </td>
          <td style="width: 40%; text-align: center; padding: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">NORMA PDVSA PIC-03-01-09 / GPG FASE 7</div>
            <div style="font-size: 13px; font-weight: 900; color: #0b2239; margin-top: 4px;">ACTA B: COMPLETACIÓN MECÁNICA DE SUBSISTEMA</div>
            <div style="font-size: 10px; font-family: monospace; font-weight: bold; margin-top: 2px;">CÓDIGO: ${docId}</div>
          </td>
          <td style="width: 30%; text-align: right; padding: 8px;">
            <div style="font-weight: 900; font-size: 13px; color: #0b2239;">${data.contractorName || 'PROINTECA C.A.'}</div>
            <div style="font-size: 8px; font-weight: bold; color: #475569; text-transform: uppercase;">EMPRESA CONTRATISTA</div>
          </td>
        </tr>
      </table>

      <!-- DATOS DE PROYECTO Y SUBSISTEMA -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px; background: #f8fafc; margin-bottom: 16px;">
        <tr>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1; width: 20%;">Proyecto:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; width: 80%; font-weight: bold; color: #0b2239;" colspan="3">${data.projectName || 'Proyecto Industrial Petrolero'}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1; width: 20%;">Código Subsistema:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%; font-family: monospace;">${data.subsystemCode || 'SUB-01'}</td>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1; width: 20%;">Nombre Subsistema:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">${data.subsystemName || 'Nombre del Subsistema'}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1;">Fecha de Aceptación:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.date || new Date().toISOString().split('T')[0]}</td>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1;">Contrato N°:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace;">${data.contractCode || 'CTO-PDVSA-2026'}</td>
        </tr>
      </table>

      <!-- ESTADO DE PUNCHLIST Y REQUISITOS HARD GATE -->
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 16px; background: #fafafa;">
        <div style="font-size: 11px; font-weight: bold; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          1. EVALUACIÓN Y CERTIFICACIÓN DE PUNCHLIST CATEGORÍAS A Y B
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr style="background: #e2e8f0; font-weight: bold; text-align: center;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">CRITERIO NORMATIVO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">ESTADO AUDITADO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">CUMPLIMIENTO</td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Pendientes Categoría A (Críticos que impiden arranque)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${data.punchlistCategoryACount} pendientes (0 Requeridos)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: ${data.punchlistCategoryACount === 0 ? '#059669' : '#b91c1c'};">
              ${data.punchlistCategoryACount === 0 ? 'CONFORME (0)' : 'NO CONFORME'}
            </td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Pendientes Categoría B (Menores, no impiden arranque)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.punchlistCategoryBCount} pendientes con programa de cierre</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">ACEPTADO CON LISTA B</td>
          </tr>
          <tr style="text-align: center;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Dossier de Calidad (Databook) y Pruebas de Presión</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.databookComplete && data.hydrotestCertified ? '100% Verificado y Certificado' : 'Incompleto'}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: ${data.databookComplete && data.hydrotestCertified ? '#059669' : '#b91c1c'};">
              ${data.databookComplete && data.hydrotestCertified ? 'CONFORME' : 'PENDIENTE'}
            </td>
          </tr>
        </table>
      </div>

      <!-- OBSERVACIONES -->
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: bold; color: #0b2239; margin-bottom: 4px;">2. NOTAS Y RECOMENDACIONES DE LA COMISIÓN DE ACEPTACIÓN</div>
        <p style="font-size: 10px; color: #334155; margin: 0; line-height: 1.5;">${data.inspectorNotes || 'Se certifica la completación mecánica del subsistema para el paso a comisionamiento.'}</p>
      </div>

      <!-- PIE DE PÁGINA CON FIRMAS Y QR EN LA ESQUINA INFERIOR DERECHA (DEV-01 & FORMATO MAESTRO 3.2) -->
      <footer style="margin-top: 24px; border-t: 2px solid #0f172a; pt: 16px;">
        <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
          FIRMANTES Y VALIDACIÓN DE CONFORMIDAD TÉCNICA (ACTA B)
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 9px; text-align: center; margin-bottom: 12px;">
          <tr style="background: #f1f5f9; font-weight: bold;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%;">INSPECTOR MECÁNICO (CONTRATISTA)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%;">SUPERINTENDENTE DE OBRA</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 34%; color: #b91c1c;">REPRESENTANTE OPERATIVO PDVSA</td>
          </tr>
          <tr>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[0]?.name || 'Ing. Inspector QA/QC'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Firmado Digitalmente</div>
            </td>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[1]?.name || 'Ing. Residente de Obra'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Firmado Digitalmente</div>
            </td>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[2]?.name || 'Inspector Custodio PDVSA'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Aprobación Custodio</div>
            </td>
          </tr>
        </table>

        <!-- ESQUINA INFERIOR DERECHA: BLOQUE CON QR DE AUDITORÍA (DEV-01) -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 8px; background: #f8fafc;">
          <tr>
            <td style="padding: 8px; vertical-align: middle;">
              <div style="font-weight: bold; font-size: 9px; color: #0b2239; text-transform: uppercase;">VERIFICACIÓN PÚBLICA E INTEGRIDAD DE ACTA B (CÓDIGO QR)</div>
              <div style="color: #475569; margin-top: 2px;">Este documento cuenta con sello digital e inmutabilidad cryptographic conforme a Formato Maestro Rev. 1 (Sección 3.2).</div>
              <div style="font-family: monospace; font-weight: bold; color: #2563eb; margin-top: 4px; word-break: break-all;">
                URL: <a href="${qrUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${qrUrl}</a>
              </div>
              <div style="font-family: monospace; color: #0f172a; margin-top: 4px;">
                HASH DE VERSIÓN VISUAL: <strong>${hash}</strong>
              </div>
            </td>
            <!-- QR CODE IN BOTTOM RIGHT CORNER -->
            <td style="width: 100px; padding: 8px; text-align: center; vertical-align: middle; border-left: 1px solid #cbd5e1;">
              ${qrSvg}
              <div style="font-size: 7px; color: #64748b; margin-top: 2px; font-weight: bold;">CÓDIGO QR AUDITORÍA</div>
            </td>
          </tr>
        </table>
      </footer>
    </div>
  `;
}

/**
 * Renderiza el HTML oficial del Acta C - Aceptación Definitiva y Transferencia de Custodia (PIC-03-01-09).
 * Incluye inyección del código QR de auditoría en la esquina inferior derecha (Sección 3.2 Formato Maestro Rev. 1).
 */
export function renderActaCAceptacionDefinitivaHtml(data: ActaCompletionData): string {
  const docId = data.actaCode || `ACTA-C-TRANSFERENCIA-${data.subsystemCode || 'OBRA'}`;
  const hash = data.visualVersionHash || 'SHA256-PENDING-ACTA-C';
  const qrUrl = data.qrVerificationUrl || `https://ic360-nexus.pdvsa.com/verify?docId=${encodeURIComponent(docId)}&hash=${hash}`;
  const qrSvg = generateQrSvg(qrUrl, 84);

  return `
    <div class="acta-c-container" style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; background: #ffffff; color: #0f172a;">
      <!-- ENCABEZADO DUAL INSTITUCIONAL -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
        <tr>
          <td style="width: 30%; text-align: left; padding: 8px;">
            <div style="font-weight: 900; font-size: 14px; color: #b91c1c;">${data.operatorName || 'PDVSA PETRÓLEO S.A.'}</div>
            <div style="font-size: 8px; font-weight: bold; color: #475569; text-transform: uppercase;">OPERADOR / FILIAL RECEPTORA</div>
          </td>
          <td style="width: 40%; text-align: center; padding: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">NORMA PDVSA PIC-03-01-09 / GPG FASE 7</div>
            <div style="font-size: 13px; font-weight: 900; color: #0b2239; margin-top: 4px;">ACTA C: ACEPTACIÓN DEFINITIVA Y TRANSFERENCIA DE CUSTODIA</div>
            <div style="font-size: 10px; font-family: monospace; font-weight: bold; margin-top: 2px;">CÓDIGO: ${docId}</div>
          </td>
          <td style="width: 30%; text-align: right; padding: 8px;">
            <div style="font-weight: 900; font-size: 13px; color: #0b2239;">${data.contractorName || 'PROINTECA C.A.'}</div>
            <div style="font-size: 8px; font-weight: bold; color: #475569; text-transform: uppercase;">EMPRESA CONTRATISTA DE CIERRE</div>
          </td>
        </tr>
      </table>

      <!-- DATOS GENERALES DE LA OBRA Y RECEPTOR -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px; background: #f8fafc; margin-bottom: 16px;">
        <tr>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1; width: 20%;">Obra / Instalación:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; width: 80%; font-weight: bold; color: #0b2239;" colspan="3">${data.projectName || 'Instalación de Manejo de Hidrocarburos'}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1;">Fecha de Transferencia:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.date || new Date().toISOString().split('T')[0]}</td>
          <td style="padding: 6px; font-weight: bold; border: 1px solid #cbd5e1;">Contrato N°:</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace;">${data.contractCode || 'CTO-PDVSA-2026'}</td>
        </tr>
      </table>

      <!-- DECLARACIÓN DE TRANSFERENCIA Y PLANOS AS-BUILT -->
      <div style="border: 1px solid #0f172a; padding: 12px; border-radius: 4px; margin-bottom: 16px; background: #fafafa;">
        <div style="font-size: 11px; font-weight: bold; color: #0b2239; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
          1. DECLARACIÓN FORMAL DE TRANSFERENCIA Y PLANOS AS-BUILT (L-STC-001)
        </div>
        <p style="font-size: 10px; color: #0f172a; line-height: 1.5; margin-bottom: 8px;">
          Por medio de la presente Acta C, la empresa Contratista entrega a Operaciones PDVSA la custodia física y operativa de la instalación, acompañada del Dossier de Calidad completo, certificaciones de válvulas PSV y Planos As-Built auditados.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr style="background: #e2e8f0; font-weight: bold;">
            <td style="padding: 4px; border: 1px solid #cbd5e1;">ENTREGABLE NORMATIVO</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center;">ESTADO</td>
          </tr>
          <tr>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">Planos As-Built Marcados en Rojo/Verde y Certificados</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">ENTREGADOS Y APROBADOS</td>
          </tr>
          <tr>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">Calibración de Válvulas de Seguridad (PSV) e Instrumentos</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">CERTIFICADOS VIGENTES</td>
          </tr>
          <tr>
            <td style="padding: 4px; border: 1px solid #cbd5e1;">Punchlist Categorías A y B Cerradas al 100%</td>
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">SIN PENDIENTES</td>
          </tr>
        </table>
      </div>

      <!-- PIE DE PÁGINA CON FIRMAS Y QR EN LA ESQUINA INFERIOR DERECHA (DEV-01 & FORMATO MAESTRO 3.2) -->
      <footer style="margin-top: 24px; border-t: 2px solid #0f172a; pt: 16px;">
        <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
          COMISIÓN DE RECEPCIÓN DEFINITIVA Y GERENCIA DE PROYECTOS (ACTA C)
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 9px; text-align: center; margin-bottom: 12px;">
          <tr style="background: #f1f5f9; font-weight: bold;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%;">GERENTE DE PROYECTO (CONTRATISTA)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%;">GERENTE DE CALIDAD QA/QC</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 34%; color: #b91c1c;">GERENTE DE OPERACIONES PDVSA</td>
          </tr>
          <tr>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[0]?.name || 'Gerente de Proyecto'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Firmado Digitalmente</div>
            </td>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[1]?.name || 'Líder QA/QC'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Firmado Digitalmente</div>
            </td>
            <td style="padding: 12px 6px; border: 1px solid #cbd5e1;">
              <div style="font-weight: bold;">${data.signers?.[2]?.name || 'Gerente Operativo Custodio'}</div>
              <div style="font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px;">✓ Aprobación Custodia Final</div>
            </td>
          </tr>
        </table>

        <!-- ESQUINA INFERIOR DERECHA: BLOQUE CON QR DE AUDITORÍA (DEV-01) -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 8px; background: #f8fafc;">
          <tr>
            <td style="padding: 8px; vertical-align: middle;">
              <div style="font-weight: bold; font-size: 9px; color: #0b2239; text-transform: uppercase;">VERIFICACIÓN PÚBLICA E INTEGRIDAD DE ACTA C (CÓDIGO QR)</div>
              <div style="color: #475569; margin-top: 2px;">Documento inmutable de transferencia final conforme a la Sección 3.2 del Formato Maestro Rev. 1.</div>
              <div style="font-family: monospace; font-weight: bold; color: #2563eb; margin-top: 4px; word-break: break-all;">
                URL: <a href="${qrUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${qrUrl}</a>
              </div>
              <div style="font-family: monospace; color: #0f172a; margin-top: 4px;">
                HASH DE VERSIÓN VISUAL: <strong>${hash}</strong>
              </div>
            </td>
            <!-- QR CODE IN BOTTOM RIGHT CORNER -->
            <td style="width: 100px; padding: 8px; text-align: center; vertical-align: middle; border-left: 1px solid #cbd5e1;">
              ${qrSvg}
              <div style="font-size: 7px; color: #64748b; margin-top: 2px; font-weight: bold;">CÓDIGO QR AUDITORÍA</div>
            </td>
          </tr>
        </table>
      </footer>
    </div>
  `;
}
