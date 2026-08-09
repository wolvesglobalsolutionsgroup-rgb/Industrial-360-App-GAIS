import { z } from 'zod';
import { ParticipantRoleSchema, SharedRecordStatusSchema } from '../domain/schemas';
import { ParticipantRole, SharedRecordStatus } from '../domain/types';
import { DocumentViewModel } from '../documentViewModel';
import { BrandKit } from '../../ProjectContext';
import { OperatorBrandPreset } from '../brandKitPresets';

/**
 * Workflow Phase: numeric 1 through 7 corresponding to IC360 GPG / FEL phases
 */
export type WorkflowPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WorkflowPhaseSchema = z.number().int().min(1).max(7);

/**
 * Standard app roles unioned with domain participant roles
 */
export type SystemRole = 'superadmin' | 'gerente' | 'supervisor' | 'inspector' | 'campo' | 'cliente';

export type WorkflowRole = SystemRole | ParticipantRole;

export const SystemRoleSchema = z.enum([
  'superadmin',
  'gerente',
  'supervisor',
  'inspector',
  'campo',
  'cliente',
]);

export const WorkflowRoleSchema = z.union([SystemRoleSchema, ParticipantRoleSchema]);

/**
 * Workflow state type reuses SharedRecordStatus or custom string status
 */
export type WorkflowState = SharedRecordStatus | string;

export const WorkflowStateSchema = z.union([SharedRecordStatusSchema, z.string()]);

/**
 * Execution context provided to workflow components, gates, and deliverable factories
 */
export interface WorkflowRouteContext {
  orgId: string;
  projectId: string;
  workflowId: string;
  instanceId: string;
  user: {
    uid: string;
    email: string;
    role: WorkflowRole | string;
    orgId: string;
  };
  contractorBrand: BrandKit;
  operatorBrand: OperatorBrandPreset | BrandKit;
}

/**
 * Hard Gate evaluation result
 */
export interface HardGateResult {
  passed: boolean;
  message?: string;
  code?: string;
}

/**
 * Hard Gate contract for mandatory rules before advancing or approving
 */
export interface HardGate<T = any> {
  id: string;
  name: string;
  description: string;
  evaluator: (
    context: WorkflowRouteContext,
    data: T
  ) => HardGateResult | Promise<HardGateResult>;
}

/**
 * Workflow Deliverable contract for generating standardized DocumentViewModel
 */
export interface WorkflowDeliverable<T = any> {
  id: string;
  title: string;
  type: 'document' | 'report' | 'certificate';
  factory: (
    context: WorkflowRouteContext,
    data: T
  ) => DocumentViewModel | Promise<DocumentViewModel>;
}

/**
 * State Transition contract
 */
export interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  rolesAllowed: WorkflowRole[];
  gateId?: string;
  label?: string;
}

/**
 * Props provided to custom Workflow capture components
 */
export interface WorkflowComponentProps<T = any> {
  definition: WorkflowDefinition<T>;
  context: WorkflowRouteContext;
  data: T;
  onChange: (newData: Partial<T>) => void;
  onTransition?: (targetState: WorkflowState) => Promise<void>;
  currentState: WorkflowState;
  isReadOnly?: boolean;
  errors?: string[];
}

/**
 * Full Workflow Definition Contract
 */
export interface WorkflowDefinition<T = any> {
  id: string;
  title: string;
  description?: string;
  phase: WorkflowPhase;
  rolesAllowed: WorkflowRole[];
  captureComponent: React.ComponentType<WorkflowComponentProps<T>>;
  schema: z.ZodType<T>;
  hardGates: HardGate<T>[];
  deliverable?: WorkflowDeliverable<T>;
  permissions?: Record<string, WorkflowRole[]>;
  stateTransitions?: WorkflowTransition[];
  initialState?: WorkflowState;
}

/**
 * Serializable Metadata schema for validation
 */
export const WorkflowMetadataSchema = z.object({
  id: z.string().min(3, 'El ID de workflow debe tener al menos 3 caracteres'),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().optional(),
  phase: WorkflowPhaseSchema,
  rolesAllowed: z.array(WorkflowRoleSchema).min(1, 'Debe haber al menos un rol permitido'),
  initialState: WorkflowStateSchema.optional().default('draft'),
});
