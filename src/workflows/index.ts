import { registerWorkflow, WorkflowRegistry } from '../lib/workflows/registry';
import { wf042Definition } from './wf-042-inspeccion-izaje/definition';
import { wf043Definition } from './wf-043-aprobacion-ptw/definition';
import { wf044Definition } from './wf-044-reporte-tabular/definition';
import { wf048Definition } from './wf-048-gestion-ambiental-siho/definition';
import { wf050Definition } from './wf-050-ensayos-civiles-suelos/definition';
import { wf051Definition } from './wf-051-control-aislamiento-loto/definition';
import { wf052Definition } from './wf-052-instrumentacion-lazos-pid/definition';
import { wf053Definition } from './wf-053-registro-personal-qr/definition';
import { wf054Definition } from './wf-054-flota-equipos-pesados/definition';
import { wf073Definition } from './wf-073-medicion-avance-ingenieria/definition';
import { wf075Definition } from './wf-075-libro-de-obra/definition';
import { wf065Definition } from './wf-065-gis-alignment-sheets-kp/definition';
import { wf066Definition } from './wf-066-bim3d-integridad-soldadura/definition';
import { wf074Definition } from './wf-074-completacion-mecanica/definition';
import { wf076Definition } from './wf-076-terminacion-construccion/definition';
import { wf077Definition } from './wf-077-supervision-ingenieria/definition';

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
    registerWorkflow(wf048Definition);
    registerWorkflow(wf050Definition);
    registerWorkflow(wf051Definition);
    registerWorkflow(wf052Definition);
    registerWorkflow(wf053Definition);
    registerWorkflow(wf054Definition);
    registerWorkflow(wf073Definition);
    registerWorkflow(wf075Definition);
    registerWorkflow(wf065Definition);
    registerWorkflow(wf066Definition);
    registerWorkflow(wf074Definition);
    registerWorkflow(wf076Definition);
    registerWorkflow(wf077Definition);
    initialized = true;
  } catch (err: any) {
    // If already registered, ignore duplicate error
    if (!err.message?.includes('ya está registrado')) {
      throw err;
    }
    initialized = true;
  }
}

// Registration must be invoked explicitly on demand via ensureWorkflowsRegistered()

export {
  wf042Definition,
  wf043Definition,
  wf044Definition,
  wf048Definition,
  wf050Definition,
  wf051Definition,
  wf052Definition,
  wf053Definition,
  wf054Definition,
  wf073Definition,
  wf075Definition,
  wf065Definition,
  wf066Definition,
  wf074Definition,
  wf076Definition,
  wf077Definition,
};


