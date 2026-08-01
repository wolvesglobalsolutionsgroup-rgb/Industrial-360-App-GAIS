import { BrandKit } from '../ProjectContext';

export interface OperatorBrandPreset extends BrandKit {
  presetKey: 'PDVSA' | 'CHEVRON' | 'REPSOL' | 'ENI' | 'CUSTOM';
  operatorName: string;
  status: 'DRAFT' | 'APPROVED';
  disclaimer: string;
}

export const OPERATOR_BRAND_PRESETS: Record<'PDVSA' | 'CHEVRON' | 'REPSOL' | 'ENI', OperatorBrandPreset> = {
  PDVSA: {
    presetKey: 'PDVSA',
    operatorName: 'Petróleos de Venezuela, S.A. (PDVSA)',
    companyName: 'CONTRATISTA OPERATIVA / OPERACIÓN FPO - PDVSA',
    taxId: 'RIF J-00000000-0',
    address: 'Edificio Sede PDVSA La Campiña / Faja Petrolífera del Orinoco, Venezuela',
    phone: '+58 (212) 708-4111',
    email: 'calidad.fpo@pdvsa.com',
    website: 'www.pdvsa.com',
    logoUrl: '', // No unverified logo usage
    primaryColor: '#D32F2F', // Red PDVSA branding tone
    secondaryColor: '#FFB300',
    headerText: 'ENTREGABLE TÉCNICO BAJO NORMAS Y ESPECIFICACIONES PDVSA / COVENIN',
    footerText: 'DOCUMENTO TÉCNICO BORRADOR (DRAFT) - REQUIERE APROBACIÓN DE LA INSPECCIÓN DE OBRA PDVSA.',
    digitalSignatureUrl: '',
    authorizedSignerName: 'Ing. Inspector de Obra PDVSA',
    authorizedSignerTitle: 'Inspección General de Infraestructura FPO',
    status: 'DRAFT',
    disclaimer: 'Borrador configurable. No implica certificación de marca registrada ni aval oficial hasta su aprobación explícita.',
  },
  CHEVRON: {
    presetKey: 'CHEVRON',
    operatorName: 'Chevron Global Operations / Petropiar',
    companyName: 'CONTRATISTA OPERATIVA / CHEVRON VENEZUELA',
    taxId: 'RIF J-00000000-0',
    address: 'Av. Principal de Lechería, Edif. Chevron, Anzoátegui, Venezuela',
    phone: '+58 (281) 500-1000',
    email: 'operations.venezuela@chevron.com',
    website: 'www.chevron.com',
    logoUrl: '',
    primaryColor: '#00529B', // Chevron Blue
    secondaryColor: '#D1232A',
    headerText: 'TECHNICAL DELIVERABLE / OE & HES COMPLIANCE STANDARD',
    footerText: 'DRAFT DOCUMENT - SUBJECT TO FINAL CHEVRON HES & QA/QC SIGN-OFF.',
    digitalSignatureUrl: '',
    authorizedSignerName: 'HES Lead Inspector / Chevron Rep',
    authorizedSignerTitle: 'Operational Excellence & Reliability Dept.',
    status: 'DRAFT',
    disclaimer: 'Configurable draft preset. Does not constitute brand endorsement or certification without verification.',
  },
  REPSOL: {
    presetKey: 'REPSOL',
    operatorName: 'Repsol E&P Venezuela',
    companyName: 'CONTRATISTA OPERATIVA / REPSOL VENEZUELA',
    taxId: 'RIF J-00000000-0',
    address: 'Centro Empresarial Eurobuilding, Caracas, Venezuela',
    phone: '+58 (212) 902-7111',
    email: 'ep.venezuela@repsol.com',
    website: 'www.repsol.com',
    logoUrl: '',
    primaryColor: '#FF6600', // Repsol Orange
    secondaryColor: '#002B49',
    headerText: 'ENTREGABLE TÉCNICO DE CAMPO / NORMATIVA REPSOL E&P',
    footerText: 'DOCUMENTO BORRADOR (DRAFT) - SUJETO A REVISIÓN DE FISCALIZACIÓN REPSOL.',
    digitalSignatureUrl: '',
    authorizedSignerName: 'Ing. Supervisor de Calidad Repsol',
    authorizedSignerTitle: 'Fiscalización de Operaciones E&P',
    status: 'DRAFT',
    disclaimer: 'Borrador configurable. No afirma certificación oficial de la marca.',
  },
  ENI: {
    presetKey: 'ENI',
    operatorName: 'Eni Venezuela B.V.',
    companyName: 'CONTRATISTA OPERATIVA / ENI VENEZUELA',
    taxId: 'RIF J-00000000-0',
    address: 'Torre Digitel, Chacao, Caracas, Venezuela',
    phone: '+58 (212) 201-8111',
    email: 'info.venezuela@eni.com',
    website: 'www.eni.com',
    logoUrl: '',
    primaryColor: '#FFD100', // Eni Yellow
    secondaryColor: '#000000',
    headerText: 'TECHNICAL DELIVERABLE / ENI STANDARD QUALITY CONTROL',
    footerText: 'DRAFT DOCUMENT - PENDING FIELD QA/QC APPROVAL BY ENI REPRESENTATIVE.',
    digitalSignatureUrl: '',
    authorizedSignerName: 'Eni QA/QC Field Engineer',
    authorizedSignerTitle: 'Upstream Operations Management',
    status: 'DRAFT',
    disclaimer: 'Configurable draft preset for Eni operations. Non-certified draft format.',
  },
};

/**
 * Returns a tenant-scoped operator preset as a configurable DRAFT.
 */
export function getOperatorPreset(
  presetKey: 'PDVSA' | 'CHEVRON' | 'REPSOL' | 'ENI',
  orgId: string
): OperatorBrandPreset {
  const base = OPERATOR_BRAND_PRESETS[presetKey];
  return {
    ...base,
    // Tenant-scoped modification wrapper
    companyName: `${base.companyName} [Tenant: ${orgId}]`,
    status: 'DRAFT',
  };
}
