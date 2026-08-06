import { z } from 'zod';
import {
  WorkflowDefinition,
  WorkflowRole,
  WorkflowRouteContext,
  WorkflowState,
  HardGateResult,
} from './contracts';
import { DocumentViewModel } from '../documentViewModel';

export interface GateEvaluationReport {
  allPassed: boolean;
  failedGates: {
    id: string;
    name: string;
    description: string;
    message: string;
  }[];
  passedGates: {
    id: string;
    name: string;
  }[];
}

export interface TransitionCheckResult {
  allowed: boolean;
  reason?: string;
  gateId?: string;
}

/**
 * WorkflowRunner: Decoupled business engine for executing workflow rules,
 * permissions, hard gates, data validation, state machine transitions, and deliverable creation.
 * Does NOT contain React/JSX code.
 */
export class WorkflowRunnerEngine {
  /**
   * Verifies if a user role is authorized for the workflow definition
   */
  public checkUserPermissions(
    def: WorkflowDefinition,
    userRole: WorkflowRole | string
  ): boolean {
    if (!def || !userRole) return false;
    if (userRole === 'superadmin') return true;
    return def.rolesAllowed.includes(userRole as WorkflowRole);
  }

  /**
   * Validates input data against the workflow's Zod schema
   */
  public validateWorkflowData<T = any>(
    def: WorkflowDefinition<T>,
    data: unknown
  ): { success: boolean; data?: T; errors?: z.ZodIssue[]; errorMessage?: string } {
    if (!def || !def.schema) {
      return { success: false, errorMessage: 'Esquema de validación no encontrado en el workflow.' };
    }

    const result = def.schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues;
      const formatted = issues.map((i) => `${i.path.join('.') || 'campo'}: ${i.message}`).join('; ');
      return {
        success: false,
        errors: issues,
        errorMessage: `Error de validación: ${formatted}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Evaluates all hard gates defined for the workflow
   */
  public async evaluateHardGates<T = any>(
    def: WorkflowDefinition<T>,
    context: WorkflowRouteContext,
    data: T
  ): Promise<GateEvaluationReport> {
    const failedGates: { id: string; name: string; description: string; message: string }[] = [];
    const passedGates: { id: string; name: string }[] = [];

    if (!def || !Array.isArray(def.hardGates) || def.hardGates.length === 0) {
      return {
        allPassed: true,
        failedGates: [],
        passedGates: [],
      };
    }

    for (const gate of def.hardGates) {
      try {
        const evalResult: HardGateResult = await gate.evaluator(context, data);
        if (evalResult.passed) {
          passedGates.push({ id: gate.id, name: gate.name });
        } else {
          failedGates.push({
            id: gate.id,
            name: gate.name,
            description: gate.description,
            message: evalResult.message || `Gate "${gate.name}" no superado.`,
          });
        }
      } catch (err: any) {
        failedGates.push({
          id: gate.id,
          name: gate.name,
          description: gate.description,
          message: `Excepción al evaluar gate "${gate.name}": ${err?.message || 'Error desconocido'}`,
        });
      }
    }

    return {
      allPassed: failedGates.length === 0,
      failedGates,
      passedGates,
    };
  }

  /**
   * Evaluates if a state transition is allowed for the user role and gate rules
   */
  public canTransition<T = any>(
    def: WorkflowDefinition<T>,
    currentState: WorkflowState,
    targetState: WorkflowState,
    userRole: WorkflowRole | string
  ): TransitionCheckResult {
    if (!def) {
      return { allowed: false, reason: 'Definición de workflow no proporcionada.' };
    }

    // Default permission check
    if (!this.checkUserPermissions(def, userRole)) {
      return { allowed: false, reason: `Rol "${userRole}" no autorizado en este workflow.` };
    }

    if (!def.stateTransitions || def.stateTransitions.length === 0) {
      // If no explicit state machine configured, allow transition if user is authorized
      return { allowed: true };
    }

    const matchingTransition = def.stateTransitions.find(
      (st) => st.from === currentState && st.to === targetState
    );

    if (!matchingTransition) {
      return {
        allowed: false,
        reason: `Transición de "${currentState}" a "${targetState}" no está definida en la máquina de estados.`,
      };
    }

    if (userRole !== 'superadmin' && !matchingTransition.rolesAllowed.includes(userRole as WorkflowRole)) {
      return {
        allowed: false,
        reason: `El rol "${userRole}" no tiene permiso para ejecutar la transición de "${currentState}" a "${targetState}".`,
      };
    }

    return {
      allowed: true,
      gateId: matchingTransition.gateId,
    };
  }

  /**
   * Generates a normalized DocumentViewModel deliverable if configured on the workflow
   */
  public async generateDeliverable<T = any>(
    def: WorkflowDefinition<T>,
    context: WorkflowRouteContext,
    data: T
  ): Promise<DocumentViewModel | null> {
    if (!def || !def.deliverable || typeof def.deliverable.factory !== 'function') {
      return null;
    }

    // Ensure data passes schema validation before generating deliverable
    const validation = this.validateWorkflowData(def, data);
    if (!validation.success) {
      throw new Error(`No se puede generar entregable debido a errores de validación de datos: ${validation.errorMessage}`);
    }

    return await def.deliverable.factory(context, validation.data || data);
  }
}

export const WorkflowRunner = new WorkflowRunnerEngine();
