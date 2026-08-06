import { WorkflowDefinition, WorkflowPhase } from './contracts';

class WorkflowRegistryManager {
  private registry: Map<string, WorkflowDefinition> = new Map();
  private isLocked = false;

  /**
   * Registers a new WorkflowDefinition into the kernel registry.
   * Enforces unique ID validation and immutability lock.
   */
  public registerWorkflow(def: WorkflowDefinition): void {
    if (this.isLocked) {
      throw new Error('WorkflowRegistry está bloqueado e inmutable. No se pueden registrar más workflows.');
    }

    if (!def || !def.id || typeof def.id !== 'string' || def.id.trim() === '') {
      throw new Error('Definición de workflow inválida: El campo "id" es obligatorio y debe ser una cadena no vacía.');
    }

    const trimmedId = def.id.trim();

    if (this.registry.has(trimmedId)) {
      throw new Error(`El workflow con ID "${trimmedId}" ya está registrado. No se permiten registros duplicados.`);
    }

    if (!def.title || typeof def.title !== 'string') {
      throw new Error(`El workflow "${trimmedId}" debe tener un título válido.`);
    }

    if (!def.schema) {
      throw new Error(`El workflow "${trimmedId}" debe definir un esquema Zod de validación.`);
    }

    if (!Array.isArray(def.rolesAllowed) || def.rolesAllowed.length === 0) {
      throw new Error(`El workflow "${trimmedId}" debe especificar al menos un rol en rolesAllowed.`);
    }

    this.registry.set(trimmedId, def);
  }

  /**
   * Retrieves a WorkflowDefinition by ID
   */
  public getWorkflow(id: string): WorkflowDefinition | undefined {
    if (!id) return undefined;
    return this.registry.get(id.trim());
  }

  /**
   * Returns all registered workflows, optionally filtered by Phase (1-7)
   */
  public listWorkflowsByPhase(phase?: WorkflowPhase): WorkflowDefinition[] {
    const all = Array.from(this.registry.values());
    if (phase === undefined) {
      return all;
    }
    return all.filter((wf) => wf.phase === phase);
  }

  /**
   * Returns all registered workflows
   */
  public listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.registry.values());
  }

  /**
   * Locks the registry to prevent runtime tampering
   */
  public lockRegistry(): void {
    this.isLocked = true;
  }

  /**
   * Reset registry state (for testing purposes only)
   */
  public clearRegistryForTesting(): void {
    this.registry.clear();
    this.isLocked = false;
  }
}

export const WorkflowRegistry = new WorkflowRegistryManager();

export const registerWorkflow = (def: WorkflowDefinition) => WorkflowRegistry.registerWorkflow(def);
export const getWorkflow = (id: string) => WorkflowRegistry.getWorkflow(id);
export const listWorkflowsByPhase = (phase?: WorkflowPhase) => WorkflowRegistry.listWorkflowsByPhase(phase);
export const listWorkflows = () => WorkflowRegistry.listWorkflows();
