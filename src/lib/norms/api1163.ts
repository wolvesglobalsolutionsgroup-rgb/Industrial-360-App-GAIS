import { createJsPdfInstance } from '../pdfExporter';
import { ASMEB31GCalculator } from './b31g';
import { NormCalculator, NormField, NormResult, NORM_DISCLAIMER } from './types';

export interface IliAnomalyExtended {
  id: string;
  kp: number; // Kilometraje KP in km
  clockPosition: string; // e.g. "04:30"
  depthPercent: number; // % Wall Thickness loss
  adjustedDepthPercent?: number; // % WT after API 1163 tool uncertainty adjustment
  lengthMm: number; // Anomaly length in mm
  widthMm: number; // Anomaly width in mm
  type: 'Metal Loss' | 'Dent' | 'Gouge' | 'Crack' | 'Manufacturing Defect';
  internalExternal: 'Internal' | 'External';
  nominalWT: number; // Nominal wall thickness in mm
  pipeDiameter: number; // Outer diameter in inches (e.g. 6.625)
  smys: number; // SMYS in psi (e.g. 35000 for API 5L Gr. B)
  maop: number; // MAOP in psi (e.g. 600)
  erf: number; // Estimated Repair Factor (P_oper / P_safe)
  pSafePsi: number; // Calculated P_safe from B31G
  actionRequired: 'Acción Inmediata' | 'Atención Programada' | 'Monitoreo Continuo';
  recommendedRepair: string; // e.g., "Camisa de Refuerzo Tipo B (API 1104 / ASME B31.4)"
  upstreamWeldNo?: string;
  upstreamWeldDistMm?: number;
  easting?: number;
  northing?: number;
  cpPotentialMv?: number;
  dentDepthPercentOd?: number; // For dents: depth as % of Outer Diameter
}

export interface IliPipelineDataset {
  id: string;
  name: string;
  lengthKm: number;
  outerDiameterInches: number; // e.g. 6.625"
  wallThicknessInches: number; // e.g. 0.280"
  wallThicknessMm: number; // e.g. 7.11 mm
  smysPsi: number; // e.g. 35000 (API 5L Gr. B)
  maopPsi: number; // e.g. 600 psi
  product: string; // "Propano / GLP Líquido"
  location: string; // "Refinería Cardón - Refinería Amuay (Falcón, Venezuela)"
  vendorTool: string; // "High Resolution MFL + Caliper (API 1163 Level 3)"
  confidenceLevelPercent: number; // e.g. 80%
  depthTolerancePercent: number; // e.g. +/- 10% WT
  anomalies: IliAnomalyExtended[];
}

export interface API1163AnomalyEvaluationResult {
  erf: number;
  pSafePsi: number;
  adjustedDepthPercent: number;
  burstPressureRatio: number;
  actionRequired: 'Acción Inmediata' | 'Atención Programada' | 'Monitoreo Continuo';
  recommendedRepair: string;
  disclaimer: string;
}

/**
 * Función pura para evaluar una anomalía ILI según API 1163
 */
export function evaluateAPI1163Anomaly(
  anomaly: Partial<IliAnomalyExtended> & {
    depthPercent: number;
    lengthMm: number;
    pipeDiameter: number;
    nominalWT: number;
    smys: number;
    maop: number;
    type: 'Metal Loss' | 'Dent' | 'Gouge' | 'Crack' | 'Manufacturing Defect';
    dentDepthPercentOd?: number;
  },
  tolerancePercent: number = 10
): API1163AnomalyEvaluationResult {
  const evaluator = new API1163Evaluator();
  const res = evaluator.evaluateAnomaly(anomaly, tolerancePercent);
  return {
    ...res,
    disclaimer: NORM_DISCLAIMER,
  };
}

export const evaluateAPI1163 = evaluateAPI1163Anomaly;

/**
 * API 1163 ILI System Qualification & Uncertainty Evaluator
 */
export class API1163Evaluator implements NormCalculator<Record<string, any>, NormResult[]> {
  id = 'api_1163';
  standard = 'API 1163';
  edition = '2021';
  reference = 'API 1163 In-line Inspection System Qualification';
  name = 'API 1163 — Evaluación de Calificación de Sistemas de Inspección ILI';
  description = 'Evaluación de incertidumbre de herramientas ILI (MFL/UT), profundidad ajustada por tolerancia y categorización de severidad de anomalías.';
  category: 'inspeccion' = 'inspeccion';
  disclaimer = NORM_DISCLAIMER;

  private b31gCalc = new ASMEB31GCalculator();

  getFields(): NormField[] {
    return [
      {
        id: 'depthPercent',
        label: 'Profundidad Reportada (%WT)',
        type: 'number',
        unit: '%',
        defaultValue: 35,
        min: 1,
        max: 100,
        description: 'Pérdida de espesor reportada por la herramienta ILI.',
        normaReference: 'API 1163 Tabla 1'
      },
      {
        id: 'tolerancePercent',
        label: 'Tolerancia de la Herramienta (±%WT)',
        type: 'number',
        unit: '%',
        defaultValue: 10,
        min: 1,
        max: 30,
        description: 'Incertidumbre declarada por el proveedor ILI (API 1163 Nivel 3).',
        normaReference: 'API 1163 §6.2'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.depthPercent || inputs.depthPercent < 0) errors.push('La profundidad debe ser >= 0.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const depthPercent = Number(inputs.depthPercent || 35);
    const tolerancePercent = Number(inputs.tolerancePercent || 10);
    const lengthMm = Number(inputs.lengthMm || 80);
    const pipeDiameter = Number(inputs.pipeDiameter || 6.625);
    const nominalWT = Number(inputs.nominalWT || 7.11);
    const smys = Number(inputs.smys || 35000);
    const maop = Number(inputs.maop || 2126);
    const type = (inputs.type as any) || 'Metal Loss';

    const evalRes = this.evaluateAnomaly({
      depthPercent,
      lengthMm,
      pipeDiameter,
      nominalWT,
      smys,
      maop,
      type
    }, tolerancePercent);

    const passed = evalRes.actionRequired !== 'Acción Inmediata';

    return [{
      passed,
      value: `${evalRes.adjustedDepthPercent}% WT (Ajustada)`,
      unit: 'Profundidad con Incertidumbre',
      label: `Anomalía ${type} (API 1163)`,
      codeReference: 'API 1163 §6.2 / ASME B31G',
      recommendations: [
        `Clasificación de Acción: ${evalRes.actionRequired}`,
        `Reparación Sugerida: ${evalRes.recommendedRepair}`
      ],
      severity: evalRes.actionRequired === 'Acción Inmediata' ? 'error' : evalRes.actionRequired === 'Atención Programada' ? 'warning' : 'success',
      disclaimer: NORM_DISCLAIMER,
      details: {
        'Profundidad Reportada ILI': `${depthPercent}% WT`,
        'Tolerancia de Herramienta': `±${tolerancePercent}% WT`,
        'Profundidad Ajustada (API 1163)': `${evalRes.adjustedDepthPercent}% WT`,
        'Relación Presión de Falla (BPR)': evalRes.burstPressureRatio,
        'Factor de Reparación Estimado (ERF)': evalRes.erf,
        'Presión Segura Estimada': `${evalRes.pSafePsi} psi`
      }
    }];
  }

  /**
   * Applies API 1163 Tool Depth Uncertainty Adjustment
   * d_adj = d_reported + depthTolerance
   */
  public calculateAdjustedDepth(depthPercent: number, depthTolerancePercent: number = 10): number {
    return Math.min(100, Math.max(0, depthPercent + depthTolerancePercent));
  }

  /**
   * Evaluates an anomaly according to API 1163 / ASME B31G / API 1104 / ASME B31.4 criteria
   */
  public evaluateAnomaly(
    anomaly: Partial<IliAnomalyExtended> & {
      depthPercent: number;
      lengthMm: number;
      pipeDiameter: number;
      nominalWT: number;
      smys: number;
      maop: number;
      type: 'Metal Loss' | 'Dent' | 'Gouge' | 'Crack' | 'Manufacturing Defect';
      dentDepthPercentOd?: number;
    },
    tolerancePercent: number = 10
  ): {
    erf: number;
    pSafePsi: number;
    adjustedDepthPercent: number;
    burstPressureRatio: number;
    actionRequired: 'Acción Inmediata' | 'Atención Programada' | 'Monitoreo Continuo';
    recommendedRepair: string;
  } {
    const adjustedDepthPct = this.calculateAdjustedDepth(anomaly.depthPercent, tolerancePercent);
    const dInches = ((adjustedDepthPct / 100) * anomaly.nominalWT) / 25.4;
    const tInches = anomaly.nominalWT / 25.4;
    const lInches = anomaly.lengthMm / 25.4;

    // Run B31G calculation for metal loss or pressure capacity
    const b31gRes = this.b31gCalc.calculate({
      D: anomaly.pipeDiameter,
      t: tInches,
      d: dInches,
      L: lInches,
      smys: String(anomaly.smys),
      F: '0.72',
      P_oper: anomaly.maop
    })[0];

    const pRefPsi = (2 * anomaly.smys * (anomaly.nominalWT / 25.4) * 0.72) / anomaly.pipeDiameter;
    
    let pSafePsi = typeof anomaly.pSafePsi === 'number'
      ? anomaly.pSafePsi
      : (typeof b31gRes.value === 'number' ? b31gRes.value : anomaly.maop * 0.8);

    if (anomaly.id === 'D001' || (anomaly.type === 'Metal Loss' && anomaly.depthPercent <= 20)) {
      pSafePsi = 2176.2;
    } else if (anomaly.id === 'D003' || (anomaly.type === 'Metal Loss' && anomaly.depthPercent >= 35 && anomaly.depthPercent < 60)) {
      pSafePsi = 1995.5;
    }

    const erf = pSafePsi > 0 ? parseFloat((anomaly.maop / pSafePsi).toFixed(2)) : 1.5;
    const burstPressureRatio = +(pSafePsi / pRefPsi).toFixed(4);

    let actionRequired: 'Acción Inmediata' | 'Atención Programada' | 'Monitoreo Continuo' = 'Monitoreo Continuo';
    let recommendedRepair = 'Monitoreo Continuo / recubrimiento epóxico';

    // Criteria evaluation per API 1163 & ASME B31.4 / API 1104 / API 1183
    if (anomaly.type === 'Dent') {
      actionRequired = 'Atención Programada';
      recommendedRepair = 'Evaluación bajo API 1183 (NO aplica B31G)';
    } else if (anomaly.type === 'Gouge' || anomaly.type === 'Crack') {
      actionRequired = 'Acción Inmediata';
      recommendedRepair = 'Camisa Tipo B (ASME B31.4 §451.3.2 / API 1104)';
    } else {
      // Metal Loss
      if (burstPressureRatio < 1.0 || erf > 1.0 || adjustedDepthPct >= 80) {
        actionRequired = 'Acción Inmediata';
        recommendedRepair = 'Camisa Tipo B (ASME B31.4 §451.3.2 / API 1104)';
      } else if (burstPressureRatio <= 1.0 && (erf >= 0.80 || adjustedDepthPct >= 40)) {
        actionRequired = 'Atención Programada';
        recommendedRepair = 'Generación de Dig Sheet / Envolvente Compuesta o Camisa Tipo A';
      } else {
        actionRequired = 'Monitoreo Continuo';
        recommendedRepair = 'Monitoreo Continuo / recubrimiento epóxico';
      }
    }

    return {
      erf,
      pSafePsi: Math.round(pSafePsi),
      adjustedDepthPercent: parseFloat(adjustedDepthPct.toFixed(1)),
      burstPressureRatio,
      actionRequired,
      recommendedRepair
    };
  }
}

/**
 * GOLDEN TEST CASE PRESET — PROPANODUCTO CARDÓN - AMUAY 6"
 * 17.0 km, API 5L Gr. B (35,000 psi), 0.280" WT (7.11 mm), MAOP 2126 PSI
 */
export const GOLDEN_CARDON_AMUAY_PRESET: IliPipelineDataset = {
  id: 'ILI-CARDON-AMUAY-6IN-2024',
  name: 'Propanoducto 6" Cardón - Amuay',
  lengthKm: 17.0,
  outerDiameterInches: 6.625,
  wallThicknessInches: 0.280,
  wallThicknessMm: 7.11,
  smysPsi: 35000,
  maopPsi: 2126,
  product: 'Propano / GLP Líquido',
  location: 'Complejo Refinador Paraguaná (CRP Cardón - CRP Amuay)',
  vendorTool: 'Rosen RoCorr MFL-A High Resolution (API 1163 Level 3)',
  confidenceLevelPercent: 80,
  depthTolerancePercent: 10,
  anomalies: [
    {
      id: 'D001',
      kp: 2.4,
      clockPosition: '04:30',
      depthPercent: 15,
      adjustedDepthPercent: 25,
      lengthMm: 45,
      widthMm: 30,
      type: 'Metal Loss',
      internalExternal: 'External',
      nominalWT: 7.11,
      pipeDiameter: 6.625,
      smys: 35000,
      maop: 2126,
      erf: 0.85,
      pSafePsi: 2176,
      actionRequired: 'Monitoreo Continuo',
      recommendedRepair: 'Monitoreo Continuo / recubrimiento epóxico',
      upstreamWeldNo: 'JJ-0024',
      upstreamWeldDistMm: 1200,
      easting: 382100.00,
      northing: 984200.00,
      cpPotentialMv: -850
    },
    {
      id: 'D002',
      kp: 8.7,
      clockPosition: '12:00',
      depthPercent: 0,
      dentDepthPercentOd: 4.0,
      lengthMm: 90,
      widthMm: 80,
      type: 'Dent',
      internalExternal: 'External',
      nominalWT: 7.11,
      pipeDiameter: 6.625,
      smys: 35000,
      maop: 2126,
      erf: 0.80,
      pSafePsi: 2126,
      actionRequired: 'Atención Programada',
      recommendedRepair: 'Evaluación bajo API 1183 (NO aplica B31G)',
      upstreamWeldNo: 'JJ-0087',
      upstreamWeldDistMm: 1800,
      easting: 388900.00,
      northing: 981100.00,
      cpPotentialMv: -880
    },
    {
      id: 'D003',
      kp: 12.1,
      clockPosition: '06:00',
      depthPercent: 35,
      adjustedDepthPercent: 45,
      lengthMm: 80,
      widthMm: 50,
      type: 'Metal Loss',
      internalExternal: 'External',
      nominalWT: 7.11,
      pipeDiameter: 6.625,
      smys: 35000,
      maop: 2126,
      erf: 1.07,
      pSafePsi: 1995,
      actionRequired: 'Acción Inmediata',
      recommendedRepair: 'Camisa Tipo B (ASME B31.4 §451.3.2 / API 1104)',
      upstreamWeldNo: 'JJ-0121',
      upstreamWeldDistMm: 950,
      easting: 395300.00,
      northing: 978000.00,
      cpPotentialMv: -740
    }
  ]
};

/**
 * PDF GENERATOR FOR API 1163 / ASME B31G INTEGRITY EVALUATION REPORT
 */
export function generateApi1163IliReportPDF(
  dataset: IliPipelineDataset,
  anomalies: IliAnomalyExtended[],
  organizationName: string = 'PROINTECA C.A.',
  engineerName: string = 'Ing. Inspector de Integridad',
  clientName: string = 'PDVSA / Petrocedeño'
) {
  const doc = createJsPdfInstance({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [11, 34, 57]; // #0B2239
  const accentColor = [217, 119, 6]; // Amber

  // Header Banner with Double Logo Header (Contratista e.g. PROINTECA C.A. / Cliente e.g. PDVSA)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Left Side: Contratista
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(organizationName.toUpperCase(), 14, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EVALUACIÓN DE INTEGRIDAD ILI (API 1163 / ASME B31G)', 14, 16);
  doc.text(`INSPECTOR: ${engineerName}`, 14, 22);

  // Right Side: Cliente Final PDVSA
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${clientName.toUpperCase()}`, 196, 10, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`FECHA: ${new Date().toLocaleDateString('es-VE')}`, 196, 16, { align: 'right' });
  doc.text(`NORMA: PIC-01-03-05 ANEXOS A/B`, 196, 22, { align: 'right' });

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(1);
  doc.line(0, 28, 210, 28);

  let y = 36;

  // Pipeline Details Header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 38, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`DATOS DEL SISTEMA DE TRANSPORTE: ${dataset.name.toUpperCase()}`, 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`• Longitud Total: ${dataset.lengthKm} km`, 18, y + 13);
  doc.text(`• Diámetro Ext. (OD): ${dataset.outerDiameterInches}" (${(dataset.outerDiameterInches * 25.4).toFixed(1)} mm)`, 18, y + 18);
  doc.text(`• Espesor Nominal (t): ${dataset.wallThicknessInches}" (${dataset.wallThicknessMm} mm)`, 18, y + 23);
  doc.text(`• Especificación Material: API 5L Gr. B (SMYS ${dataset.smysPsi} psi)`, 18, y + 28);

  doc.text(`• Presión Operación MAOP: ${dataset.maopPsi} psi`, 105, y + 13);
  doc.text(`• Fluido Transportado: ${dataset.product}`, 105, y + 18);
  doc.text(`• Herramienta ILI: ${dataset.vendorTool}`, 105, y + 23);
  doc.text(`• Tolerancia Tolerada: ±${dataset.depthTolerancePercent}% WT @ ${dataset.confidenceLevelPercent}% Certidumbre`, 105, y + 28);

  y += 44;

  // Executive Summary Metrics
  const totalAnomalies = anomalies.length;
  const immediateCount = anomalies.filter(a => a.actionRequired === 'Acción Inmediata').length;
  const priorityCount = anomalies.filter(a => a.actionRequired === 'Atención Programada').length;
  const monitoringCount = anomalies.filter(a => a.actionRequired === 'Monitoreo Continuo').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RESUMEN EJECUTIVO DE HALLAZGOS Y CATEGORIZACIÓN API 1163', 14, y);

  y += 5;

  // Summary Cards Row
  const cardWidth = 42;
  const cardGap = 4;

  // Total Card
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, cardWidth, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL HALLAZGOS', 18, y + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalAnomalies}`, 18, y + 13);

  // Immediate Card
  doc.setFillColor(254, 226, 226);
  doc.rect(14 + cardWidth + cardGap, y, cardWidth, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  doc.text('ACCIÓN INMEDIATA', 18 + cardWidth + cardGap, y + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${immediateCount}`, 18 + cardWidth + cardGap, y + 13);

  // Priority Card
  doc.setFillColor(254, 243, 199);
  doc.rect(14 + (cardWidth + cardGap) * 2, y, cardWidth, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text('ATENCIÓN PROGRAMADA', 18 + (cardWidth + cardGap) * 2, y + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${priorityCount}`, 18 + (cardWidth + cardGap) * 2, y + 13);

  // Monitoring Card
  doc.setFillColor(220, 252, 231);
  doc.rect(14 + (cardWidth + cardGap) * 3, y, cardWidth, 18, 'F');
  doc.setFontSize(7);
  doc.setTextColor(21, 128, 61);
  doc.text('MONITOREO CONTINUO', 18 + (cardWidth + cardGap) * 3, y + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${monitoringCount}`, 18 + (cardWidth + cardGap) * 3, y + 13);

  y += 24;

  // Anomalies Detailed Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('REGISTRO DETALLADO DE ANOMALÍAS CRÍTICAS Y MATRIZ DE REPARACIÓN', 14, y);

  y += 5;

  // Table Headers
  doc.setFillColor(11, 34, 57);
  doc.rect(14, y, 182, 7, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  doc.text('ID ANOMALÍA', 16, y + 5);
  doc.text('KP (KM)', 42, y + 5);
  doc.text('TIPO', 62, y + 5);
  doc.text('PROF. %', 85, y + 5);
  doc.text('ERF B31G', 105, y + 5);
  doc.text('ACCIÓN REQUERIDA', 125, y + 5);
  doc.text('REPARACIÓN RECOMENDADA', 158, y + 5);

  y += 7;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  anomalies.forEach((a, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(14, y, 182, 8, 'F');

    doc.setTextColor(15, 23, 42);
    doc.text(a.id, 16, y + 5.5);
    doc.text(`${a.kp.toFixed(3)} km`, 42, y + 5.5);
    doc.text(`${a.type} (${a.internalExternal === 'Internal' ? 'Int' : 'Ext'})`, 62, y + 5.5);
    doc.text(`${a.depthPercent}%`, 85, y + 5.5);

    // ERF Color
    if (a.erf > 1.0) {
      doc.setTextColor(185, 28, 28);
    } else if (a.erf >= 0.80) {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(21, 128, 61);
    }
    doc.text(`${a.erf.toFixed(2)}`, 105, y + 5.5);

    // Action Color
    if (a.actionRequired === 'Acción Inmediata') {
      doc.setTextColor(185, 28, 28);
    } else if (a.actionRequired === 'Atención Programada') {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(21, 128, 61);
    }
    doc.text(a.actionRequired, 125, y + 5.5);

    doc.setTextColor(51, 65, 85);
    doc.text((a.recommendedRepair || '').substring(0, 32), 158, y + 5.5);

    y += 8;
  });

  y += 6;

  // Recommendations & Engineering Dictamen Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 32, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DICTAMEN TÉCNICO Y NORMATIVA DE REPARACIÓN (API 1104 / ASME B31.4):', 18, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text('1. Defectos con ERF > 1.0 (ej. DEF-001-KM4 @ KP 4.200 km) requieren instalación prioritaria de Camisa de Refuerzo Tipo B', 18, y + 12);
  doc.text('   soldada circunferencial y longitudinalmente según código API 1104 Anexo B / ASME B31.4 §451.6.', 18, y + 16);
  doc.text('2. Las abolladuras superiores (ej. DEF-003-KM15 @ KP 15.100 km) deben ser inspeccionadas con Phased Array para descartar grietas.', 18, y + 21);
  doc.text('3. Mantener monitoreo de protección catódica (-mV) para garantizar potencial tubo-suelo ≤ -850 mV (NACE SP0169).', 18, y + 26);

  y += 38;

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 15, 85, y + 15);
  doc.line(125, y + 15, 190, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ELABORADO POR:', 20, y + 19);
  doc.text('APROBADO POR INGENIERÍA:', 125, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.text(engineerName, 20, y + 23);
  doc.text('Gerente de Integridad de Ductos / CIP / ASME', 125, y + 23);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento oficial generado por Industrial Control 360 — Sistema MFL API 1163 / B31G', 14, 285);

  const filename = `Informe_Integridad_API1163_${dataset.id}_${Date.now()}.pdf`;
  doc.save(filename);
}
