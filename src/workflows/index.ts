import { registerWorkflow, WorkflowRegistry } from '../lib/workflows/registry';
import { wf042Definition } from './wf-042-inspeccion-izaje/definition';
import { wf043Definition } from './wf-043-aprobacion-ptw/definition';
import { wf044Definition } from './wf-044-reporte-tabular/definition';

let initialized = false;

/**
 * Initializes and registers all kernel workflows.
 * Safe to call multiple times (idempotent initialization).
 */
export function ensureWorkflowsRegistered(): void {
  if (initialized) return;

  try {
    registerWorkflow(wf042Definition);
    registerWorkflow(wf043Definition);
    registerWorkflow(wf044Definition);
    initialized = true;
  } catch (err: any) {
    // If already registered, ignore duplicate error
    if (!err.message?.includes('ya está registrado')) {
      throw err;
    }
    initialized = true;
  }
}

// Auto-register on import
ensureWorkflowsRegistered();

export { wf042Definition, wf043Definition, wf044Definition };
