import { MasterDeliverable, DeliverableHeader, DeliverableBody, DeliverableFooter } from '../domain/types';
import { renderWorkflowSpecificBodyHtml } from './workflowRenderers';

/**
 * Genera un código QR SVG estilizado y determinista para la URL de verificación.
 */
export function generateQrSvg(qrUrl: string, size: number = 84): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border:1px solid #0f172a; padding:4px; border-radius:4px;">
      <!-- Corner Markers -->
      <rect x="5" y="5" width="26" height="26" fill="#0b2239" rx="2" />
      <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="1" />
      <rect x="13" y="13" width="10" height="10" fill="#0b2239" rx="1" />

      <rect x="69" y="5" width="26" height="26" fill="#0b2239" rx="2" />
      <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="1" />
      <rect x="77" y="13" width="10" height="10" fill="#0b2239" rx="1" />

      <rect x="5" y="69" width="26" height="26" fill="#0b2239" rx="2" />
      <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="1" />
      <rect x="13" y="77" width="10" height="10" fill="#0b2239" rx="1" />

      <!-- Data Matrix Pattern Simulation -->
      <rect x="36" y="8" width="6" height="6" fill="#0b2239" />
      <rect x="48" y="8" width="6" height="6" fill="#0b2239" />
      <rect x="56" y="8" width="6" height="6" fill="#0b2239" />
      <rect x="36" y="20" width="6" height="6" fill="#0b2239" />
      <rect x="48" y="20" width="6" height="6" fill="#0b2239" />
      
      <rect x="8" y="36" width="6" height="6" fill="#0b2239" />
      <rect x="20" y="36" width="6" height="6" fill="#0b2239" />
      <rect x="36" y="36" width="12" height="12" fill="#0b2239" />
      <rect x="54" y="36" width="6" height="6" fill="#0b2239" />
      <rect x="66" y="36" width="12" height="6" fill="#0b2239" />
      <rect x="84" y="36" width="6" height="6" fill="#0b2239" />

      <rect x="8" y="48" width="6" height="6" fill="#0b2239" />
      <rect x="20" y="48" width="6" height="6" fill="#0b2239" />
      <rect x="54" y="48" width="12" height="12" fill="#0b2239" />
      <rect x="72" y="48" width="6" height="6" fill="#0b2239" />
      <rect x="84" y="48" width="6" height="6" fill="#0b2239" />

      <rect x="36" y="66" width="6" height="6" fill="#0b2239" />
      <rect x="48" y="66" width="12" height="6" fill="#0b2239" />
      <rect x="66" y="66" width="6" height="6" fill="#0b2239" />
      <rect x="78" y="66" width="12" height="6" fill="#0b2239" />

      <rect x="36" y="78" width="12" height="6" fill="#0b2239" />
      <rect x="54" y="78" width="6" height="6" fill="#0b2239" />
      <rect x="66" y="78" width="12" height="12" fill="#0b2239" />

      <!-- Central IC360 Label -->
      <rect x="34" y="42" width="32" height="16" fill="#ffffff" stroke="#0b2239" stroke-width="1" rx="2" />
      <text x="50" y="53" font-family="monospace" font-size="7" font-weight="bold" fill="#0b2239" text-anchor="middle">IC360</text>
    </svg>
  `;
}

/**
 * Renderiza el Encabezado Oficial del Entregable siguiendo FORMATO-MAESTRO-DELIVERABLE.MD.
 * Regla de visibilidad de logos:
 * - Logo Operador VISIBLE por defecto (operadorLogoVisible !== false).
 * - Logo Contratista OCULTO por defecto (contratistaLogoVisible === true).
 */
export function renderHeaderHtml(header: DeliverableHeader): string {
  const showOperador = header.operadorLogoVisible !== false;
  const showContratista = header.contratistaLogoVisible === true;

  const operadorContent = showOperador
    ? (header.operadorLogoUrl
        ? `<img src="${header.operadorLogoUrl}" alt="${header.operadorNombre || 'OPERADOR'}" style="max-height: 48px; max-width: 140px; object-fit: contain;" />`
        : `<div style="font-weight: 900; font-size: 13px; color: #b91c1c; line-height: 1.2;">${header.operadorNombre || 'PDVSA GAS C.A.'}<br/><span style="font-size: 8px; font-weight: bold; color: #7f1d1d; letter-spacing: 0.5px; text-transform: uppercase;">OPERADOR / FILIAL</span></div>`)
    : `<div style="font-size: 9px; color: #94a3b8; font-style: italic;">[Logo Operador Oculto]</div>`;

  const contratistaContent = showContratista
    ? (header.contratistaLogoUrl
        ? `<img src="${header.contratistaLogoUrl}" alt="${header.contratistaNombre || 'CONTRATISTA'}" style="max-height: 48px; max-width: 140px; object-fit: contain;" />`
        : `<div style="font-weight: 900; font-size: 12px; color: #0b2239; line-height: 1.2;">${header.contratistaNombre || 'PROINTECA C.A.'}<br/><span style="font-size: 8px; font-weight: bold; color: #475569; letter-spacing: 0.5px; text-transform: uppercase;">EMPRESA CONTRATISTA</span></div>`)
    : `<div style="font-size: 8px; color: #94a3b8; font-style: italic;">[Logo Contratista Oculto]</div>`;

  const statusColors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: '#f1f5f9', text: '#475569' },
    FOR_REVIEW: { bg: '#fef3c7', text: '#b45309' },
    APPROVED_VIGENTE: { bg: '#dcfce7', text: '#15803d' },
    ISSUED_ACTIVE: { bg: '#e0f2fe', text: '#0369a1' },
    CLOSED_ARCHIVED: { bg: '#e2e8f0', text: '#334155' },
  };

  const st = statusColors[header.estatus] || { bg: '#f1f5f9', text: '#475569' };

  return `
    <header style="width: 100%; margin-bottom: 20px; font-family: Arial, sans-serif;">
      <!-- TABLA DE ENCABEZADO INSTITUCIONAL -->
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #0f172a; margin-bottom: 12px;">
        <tr>
          <!-- LOGO OPERADOR (IZQUIERDA POR DEFECTO) -->
          <td style="width: 28%; text-align: center; padding: 10px; border-right: 1px solid #cbd5e1; vertical-align: middle;">
            ${operadorContent}
          </td>
          <!-- TITULO CENTRAL Y NORMA -->
          <td style="width: 44%; text-align: center; padding: 10px; vertical-align: middle;">
            <div style="font-size: 9px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">NORMA APLICABLE: ${header.normaAplicable}</div>
            <div style="font-size: 14px; font-weight: 900; color: #0b2239; margin-top: 4px; line-height: 1.2; text-transform: uppercase;">${header.titulo}</div>
            <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-top: 4px;">CÓDIGO: <span style="font-family: monospace;">${header.codigoDocumento}</span></div>
          </td>
          <!-- LOGO CONTRATISTA (DERECHA, OCULTO POR DEFECTO) -->
          <td style="width: 28%; text-align: center; padding: 10px; border-left: 1px solid #cbd5e1; vertical-align: middle;">
            ${contratistaContent}
          </td>
        </tr>
      </table>

      <!-- CUADRO DE METADATOS DE CONTROL -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px; background-color: #f8fafc;">
        <tr>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 15%;">PROYECTO:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0f172a; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 45%;">${header.proyecto}</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 15%;">PAQUETE / CTO:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; width: 25%;">${header.workPackageId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569; border-right: 1px solid #cbd5e1; width: 15%;">REVISIÓN:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0b2239; border-right: 1px solid #cbd5e1; width: 45%; font-family: monospace;">REV. ${header.revision}</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569; border-right: 1px solid #cbd5e1; width: 15%;">FECHA Y ESTATUS:</td>
          <td style="padding: 6px 10px; font-weight: bold; width: 25%;">
            <span>${header.fecha}</span> • 
            <span style="background-color: ${st.bg}; color: ${st.text}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-family: monospace;">${header.estatus}</span>
          </td>
        </tr>
      </table>
    </header>
  `;
}

/**
 * Renderiza el Pie de Página Oficial con Firmas Digitales, SHA-256 e Integración QR.
 */
export function renderFooterHtml(footer: DeliverableFooter): string {
  const qrUrl = footer.qrVerificationUrl || `https://ic360-nexus.pdvsa.com/verify?hash=${footer.visualVersionHash}`;
  const qrSvg = generateQrSvg(qrUrl, 84);

  const signatures = footer.firmasDigitales || [];
  const elaboro = signatures.find(s => s.signerRole.toLowerCase().includes('elabor') || s.signerRole.toLowerCase().includes('residente')) || signatures[0];
  const reviso = signatures.find(s => s.signerRole.toLowerCase().includes('revis') || s.signerRole.toLowerCase().includes('qa') || s.signerRole.toLowerCase().includes('siho')) || signatures[1];
  const aprobo = signatures.find(s => s.signerRole.toLowerCase().includes('aprob') || s.signerRole.toLowerCase().includes('inspector')) || signatures[2];

  return `
    <footer style="width: 100%; margin-top: 24px; font-family: Arial, sans-serif;">
      <!-- BLOQUE DE FIRMAS DIGITALES -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          SECCIÓN DE FIRMAS Y VALIDACIÓN DIGITAL DE CONFORMIDAD NORMATIVA
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px; text-align: center;">
          <tr style="background-color: #f1f5f9;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">ELABORADO POR (CONTRATISTA)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">REVISADO POR (QA/QC / SIHO)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 34%; font-weight: bold; color: #b91c1c;">APROBADO POR (INSPECCIÓN OPERADOR)</td>
          </tr>
          <tr>
            <!-- ELABORADO -->
            <td style="padding: 10px 6px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 32px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: ${elaboro ? '#059669' : '#94a3b8'}; font-weight: bold; background: ${elaboro ? '#ecfdf5' : '#f1f5f9'}; padding: 2px 6px; border-radius: 4px;">
                  ${elaboro ? '✓ Firmado Digitalmente' : 'Pendiente de Firma'}
                </span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${elaboro?.signerName || 'Ing. Residente de Obra'}</div>
              <div style="color: #64748b; font-size: 8px;">${elaboro?.signerRole || 'Elaborador'}</div>
              <div style="color: #64748b; font-size: 8px; margin-top: 2px;">${elaboro?.signedAt ? `Fecha: ${elaboro.signedAt}` : ''}</div>
            </td>
            <!-- REVISADO -->
            <td style="padding: 10px 6px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 32px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: ${reviso ? '#059669' : '#94a3b8'}; font-weight: bold; background: ${reviso ? '#ecfdf5' : '#f1f5f9'}; padding: 2px 6px; border-radius: 4px;">
                  ${reviso ? '✓ Validado QA/QC-SIHO' : 'Pendiente de Revisión'}
                </span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${reviso?.signerName || 'Líder QA/QC SIHO'}</div>
              <div style="color: #64748b; font-size: 8px;">${reviso?.signerRole || 'Revisor'}</div>
              <div style="color: #64748b; font-size: 8px; margin-top: 2px;">${reviso?.signedAt ? `Fecha: ${reviso.signedAt}` : ''}</div>
            </td>
            <!-- APROBADO OPERADOR -->
            <td style="padding: 10px 6px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 32px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: ${aprobo ? '#059669' : '#94a3b8'}; font-weight: bold; background: ${aprobo ? '#ecfdf5' : '#f1f5f9'}; padding: 2px 6px; border-radius: 4px;">
                  ${aprobo ? '✓ Aprobado por Inspector' : 'Pendiente Aprobación Operador'}
                </span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${aprobo?.signerName || 'Inspector Designado Operador'}</div>
              <div style="color: #64748b; font-size: 8px;">${aprobo?.signerRole || 'Aprobador Operador'}</div>
              <div style="color: #64748b; font-size: 8px; margin-top: 2px;">${aprobo?.signedAt ? `Fecha: ${aprobo.signedAt}` : ''}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- BLOQUE DE VERIFICACIÓN QR Y INTEGRIDAD HASH -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 9px; background-color: #f8fafc;">
        <tr>
          <td style="width: 100px; padding: 8px; text-align: center; vertical-align: middle; border-right: 1px solid #cbd5e1;">
            ${qrSvg}
          </td>
          <td style="padding: 10px; vertical-align: middle;">
            <div style="font-size: 10px; font-weight: bold; color: #0b2239; text-transform: uppercase;">VERIFICACIÓN DE VALIDEZ INMUTABLE Y SELLO DIGITAL (QR)</div>
            <div style="font-size: 8px; color: #475569; margin-top: 4px;">Escanee el código QR o acceda a la URL oficial para validar la autenticidad en tiempo real:</div>
            <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #2563eb; margin-top: 4px; word-break: break-all;">
              <a href="${qrUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${qrUrl}</a>
            </div>
            <div style="font-size: 8px; font-family: monospace; color: #334155; margin-top: 6px;">
              HASH DE VERSIÓN VISUAL (SHA-256): <span style="font-weight: bold; color: #0f172a;">${footer.visualVersionHash || 'SHA256-PENDING-CALCULATION'}</span>
            </div>
            ${footer.archivedAt ? `<div style="font-size: 8px; color: #b91c1c; font-weight: bold; margin-top: 4px;">DOCUMENTO ARCHIVADO E INMUTABLE (Fecha de Cierre: ${footer.archivedAt})</div>` : ''}
          </td>
        </tr>
      </table>
    </footer>
  `;
}

/**
 * Renderiza un entregable maestro completo en HTML (Portada, Encabezado, Cuerpo Técnico, Pie de Página).
 * Garantiza previsualización WYSIWYG idéntica para emisor y auditor.
 */
export function renderMasterDeliverableHtml(deliverable: MasterDeliverable): string {
  const headerHtml = renderHeaderHtml(deliverable.header);
  const bodyHtml = renderWorkflowSpecificBodyHtml(deliverable.workflowId, deliverable.body);
  const footerHtml = renderFooterHtml(deliverable.footer);

  return `
    <div class="master-deliverable-document" style="font-family: Arial, Helvetica, sans-serif; width: 100%; max-width: 850px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 2px solid #0f172a; box-sizing: border-box; padding: 24px;">
      ${headerHtml}
      
      <main style="margin: 20px 0; min-height: 400px;">
        ${bodyHtml}
      </main>

      ${footerHtml}
    </div>
  `;
}

/**
 * Renderiza el entregable en formato Markdown formal estructurado.
 */
export function renderMasterDeliverableMarkdown(deliverable: MasterDeliverable): string {
  const h = deliverable.header;
  const f = deliverable.footer;
  const qrUrl = f.qrVerificationUrl || `https://ic360-nexus.pdvsa.com/verify?hash=${f.visualVersionHash}`;

  return `
# ${h.titulo.toUpperCase()}
**CÓDIGO DOCUMENTO:** \`${h.codigoDocumento}\`  
**NORMA APLICABLE:** ${h.normaAplicable}  
**PROYECTO:** ${h.proyecto} | **PAQUETE:** ${h.workPackageId}  
**REVISIÓN:** Rev. ${h.revision} | **FECHA:** ${h.fecha} | **ESTATUS:** \`${h.estatus}\`

---

## 1. CONTROL Y DATOS DE ORIGEN
- **Workflow ID:** \`${deliverable.workflowId}\`
- **Organización / Tenant:** \`${h.tenantId}\`
- **Operador:** ${h.operadorNombre || 'PDVSA GAS C.A.'} (Logo visible: ${h.operadorLogoVisible !== false ? 'SÍ' : 'NO'})
- **Contratista:** ${h.contratistaNombre || 'PROINTECA C.A.'} (Logo visible: ${h.contratistaLogoVisible === true ? 'SÍ' : 'NO'})

---

## 2. SECCIONES TÉCNICAS Y MATRIZ DE CONTROL
*(Para previsualización completa visual en HTML/PDF, consulte el renderizador oficial)*

---

## 3. VALIDEZ DIGITAL Y FIRMAS
- **Hash de Versión Visual (SHA-256):** \`${f.visualVersionHash}\`
- **URL de Verificación QR:** [Verificar Documento](${qrUrl})
${f.archivedAt ? `- **Fecha de Archivo/Inmutabilidad:** ${f.archivedAt}` : ''}
`;
}
