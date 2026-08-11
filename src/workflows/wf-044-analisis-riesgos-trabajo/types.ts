import { z } from 'zod';

export type HazardCategory =
  | 'FISICO'
  | 'QUIMICO'
  | 'BIOLOGICO'
  | 'DISERGONOMICO'
  | 'MECANICO'
  | 'ELECTRICO'
  | 'LOCATIVO'
  | 'AMBIENTAL'
  | 'INTERFERENCIAS'
  | 'OTROS';

export type ProbabilidadRiesgo = 'ALTA' | 'MEDIA' | 'BAJA';
export type SeveridadRiesgo = 'CATASTROFICA' | 'CRITICA' | 'MENOR';
export type NivelRiesgo = 'ALTO' | 'MEDIO' | 'BAJO';

export type CompanyType = 'PDVSA' | 'CONTRATISTA';

export type ArtWorkflowState =
  | 'DRAFT'
  | 'SITE_VERIFIED'
  | 'SIHOA_REVIEW'
  | 'SIGNED_TRIPARTITE'
  | 'ACTIVE_IN_FIELD'
  | 'REVISION_REQUIRED'
  | 'CLOSED_ARCHIVED'
  | 'SUSPENDED_CANCELLED';

export interface HazardItem {
  categoria: HazardCategory;
  descripcion: string;
}

export interface ArtPasoItem {
  pasoNumero: number;
  pasoDescripcion: string;
  peligrosIdentificados: HazardItem[];
  evaluacionProbabilidad?: ProbabilidadRiesgo;
  evaluacionSeveridad?: SeveridadRiesgo;
  nivelRiesgoCalculado?: NivelRiesgo;
  medidasPreventivas: string;
  responsableEjecucionControl: string;
}

export interface SignerApproval {
  nombre: string;
  ci: string;
  cargo: string;
  firma: string;
  fecha?: string;
}

export interface WorkerDisclosure {
  nombre: string;
  ci: string;
  cargo: string;
  firma: string;
  fecha: string;
}

export interface ArtApprovalData {
  numeroArt: string; // e.g. ART-2026-001
  tituloTrabajo: string;
  instalacionArea: string;
  empresa: CompanyType;
  contratoNumero?: string;
  ordenSapNumero?: string;
  fechaElaboracion: string;
  hojaNumero: string; // e.g. "1 de 2"
  procedimientoRelacionado?: string; // ID WF-046
  
  // HARD_BLOCK 1: Site Verification
  siteVerified: boolean;
  siteVerificationLocation?: string;

  // Pasos y Peligros
  pasos: ArtPasoItem[];

  // Aprobaciones Tripartitas (HARD_BLOCK 3)
  elaboradores?: SignerApproval[];
  aprobadorEmisor: SignerApproval;
  aprobadorReceptor: SignerApproval;
  aprobadorEjecutor: SignerApproval;

  // Divulgación a Trabajadores (HARD_BLOCK 2)
  workersAssignedCount: number;
  divulgacionTrabajadores: WorkerDisclosure[];

  // Re-evaluación por cambio de condiciones (HARD_BLOCK 4)
  conditionsChanged: boolean;
  changeReason?: string;

  // Vinculación PTW (WF-043)
  linkedPtwNumber?: string;

  // Estado del Workflow
  currentState?: ArtWorkflowState;
}

export const HazardCategoryCatalog: { id: HazardCategory; code: string; title: string; examples: string[] }[] = [
  { id: 'FISICO', code: 'CAT-B.1', title: 'Peligros Físicos', examples: ['Ruido continuo / impacto', 'Temperaturas extremas (calor/frío)', 'Vibraciones en herramientas', 'Radiación ionizante / no ionizante'] },
  { id: 'QUIMICO', code: 'CAT-B.2', title: 'Peligros Químicos', examples: ['Presencia de H2S / gases tóxicos', 'Vapores inflamables / LEL > 0%', 'Polvo / humos de soldadura', 'Contacto con hidrocarburos o químicos corrosivos'] },
  { id: 'BIOLOGICO', code: 'CAT-B.3', title: 'Peligros Biológicos', examples: ['Picaduras de insectos / animales ponzoñosos', 'Aguas estancadas / servidas', 'Flora nociva / maleza densa'] },
  { id: 'DISERGONOMICO', code: 'CAT-B.4', title: 'Peligros Disergonómicos', examples: ['Levantamiento manual de cargas > 25 kg', 'Posturas forzadas / prolongadas', 'Movimientos repetitivos'] },
  { id: 'INTERFERENCIAS', code: 'CAT-B.5', title: 'Trabajos en Paralelo / Interferencias', examples: ['Simultaneidad con izaje de cargas', 'Trabajos en niveles superiores', 'Tránsito de maquinaria pesada cercano'] },
  { id: 'MECANICO', code: 'CAT-B.6', title: 'Seguridad en el Equipo a Intervenir', examples: ['Partes móviles sin protección', 'Líneas bajo presión sin purgar/despresurizar', 'Riesgo de atrapamiento / proyección de partículas'] },
  { id: 'ELECTRICO', code: 'CAT-B.7', title: 'Peligros Eléctricos / Fuentes de Energía', examples: ['Contacto con líneas energizadas', 'Electricidad estática en atmósfera inflamable', 'Falta de puesta a tierra / LOTO pendiente'] },
  { id: 'LOCATIVO', code: 'CAT-B.8', title: 'Peligros Locativos (Altura, Espacios Confinados, Zanjas)', examples: ['Trabajo en altura > 1.50 m sin arnés', 'Entrada a espacio confinado con deficiencia de O2', 'Excavaciones > 1.20 m sin entibado'] },
  { id: 'AMBIENTAL', code: 'CAT-B.9', title: 'Condiciones Meteorológicas', examples: ['Lluvia / tormenta eléctrica', 'Vientos fuertes > 30 km/h para izaje', 'Alta radiación solar / deshidratación'] },
  { id: 'OTROS', code: 'CAT-B.10', title: 'Orden y Limpieza', examples: ['Superficies resbaladizas / con grasa', 'Desechos obstruyendo vías de escape', 'Iluminación deficiente en turno nocturno'] },
];

/**
 * Calculates 3x3 risk matrix level according to PDVSA IR-S-17
 */
export function calculateRiskLevel(prob: ProbabilidadRiesgo, sev: SeveridadRiesgo): NivelRiesgo {
  if (sev === 'CATASTROFICA') {
    return 'ALTO';
  }
  if (sev === 'CRITICA') {
    return prob === 'BAJA' ? 'MEDIO' : 'ALTO';
  }
  // SEVERIDAD MENOR
  return prob === 'ALTA' ? 'MEDIO' : 'BAJO';
}
