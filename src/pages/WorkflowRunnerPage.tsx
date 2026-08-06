import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ensureWorkflowsRegistered } from '../workflows';
import { getWorkflow, listWorkflows } from '../lib/workflows/registry';
import { WorkflowRunner } from '../lib/workflows/runner';
import { WorkflowRouteContext, WorkflowState } from '../lib/workflows/contracts';
import { useProject } from '../ProjectContext';
import { useAppAuthState } from '../firebase';
import { DocumentViewModel } from '../lib/documentViewModel';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  Layers,
  ChevronRight,
  Download,
  Eye,
  X,
  Lock,
} from 'lucide-react';

export default function WorkflowRunnerPage() {
  ensureWorkflowsRegistered();

  const { workflowId = 'wf-042-inspeccion-izaje', instanceId = 'inst-001' } = useParams<{
    workflowId: string;
    instanceId: string;
  }>();

  const navigate = useNavigate();
  const { currentProject, brandKit } = useProject();
  const [user] = useAppAuthState();

  const definition = getWorkflow(workflowId);
  const allWorkflows = listWorkflows();

  // Derive active user role (defaulting to supervisor if missing for dev fallback)
  const userRole = (user as any)?.role || 'supervisor';

  const routeContext: WorkflowRouteContext = {
    orgId: currentProject?.orgId || 'org_prointeca',
    projectId: currentProject?.id || 'PROJ-PILOT-PROINTECA',
    workflowId,
    instanceId,
    user: {
      uid: user?.uid || 'usr_dev_01',
      email: user?.email || 'operador@ic360.com',
      role: userRole,
      orgId: currentProject?.orgId || 'org_prointeca',
    },
    contractorBrand: brandKit,
    operatorBrand: {
      companyName: 'PDVSA / Consorcio Operador',
      taxId: 'RIF J-00000000-0',
      address: 'Faja Petrolífera del Orinoco',
      phone: '+58 (212) 000-0000',
      email: 'operaciones@pdvsa.com',
      website: 'www.pdvsa.com',
      logoUrl: '',
      primaryColor: '#003366',
      secondaryColor: '#cc0000',
      headerText: 'PDVSA OPERACIONES',
      footerText: 'DRAFT',
      digitalSignatureUrl: '',
      authorizedSignerName: 'Inspector PDVSA',
      authorizedSignerTitle: 'Inspección General',
    },
  };

  // Default initial form state per pilot
  const getInitialData = (wfId: string) => {
    if (wfId === 'wf-042-inspeccion-izaje') {
      return {
        craneCode: 'GRU-TEREX-004',
        capacityTons: 120,
        inspectionDate: new Date().toISOString().split('T')[0],
        slingCondition: 'operativa',
        hookLatchIntact: true,
        hydraulicLeakDetected: false,
        inspectorNotes: 'Prueba de freno de elevación realizada a 110% de carga nominal. Sin deformación en pluma.',
      };
    }
    if (wfId === 'wf-043-aprobacion-ptw') {
      return {
        ptwCode: 'PTW-2026-CRP-089',
        workType: 'caliente',
        lelPercentage: 0.0,
        o2Percentage: 20.9,
        h2sPpm: 0,
        lotoVerified: true,
        supervisorName: 'Ing. Manuel Rivas',
        safetyInspectorName: 'Ing. Carlos Mendoza',
        status: 'draft',
      };
    }
    if (wfId === 'wf-044-reporte-tabular') {
      return {
        reportCode: 'REP-NDT-2026-001',
        welderId: 'W-CIV-1845236',
        pipeDiameterInches: 6,
        inspectorName: 'Tec. Roberto Gómez',
        items: [
          { jointId: 'J-2026-001', kpHour: 'KP 12+100 (12:00)', ndtResult: 'APPROVED', ultrasonicThicknessMm: 7.1 },
          { jointId: 'J-2026-002', kpHour: 'KP 12+100 (03:00)', ndtResult: 'APPROVED', ultrasonicThicknessMm: 7.0 },
          { jointId: 'J-2026-003', kpHour: 'KP 12+100 (06:00)', ndtResult: 'REPAIR', ultrasonicThicknessMm: 5.8 },
        ],
      };
    }
    return {};
  };

  const [formData, setFormData] = useState<any>(() => getInitialData(workflowId));
  const [currentState, setCurrentState] = useState<WorkflowState>(
    definition?.initialState || 'draft'
  );

  const [gateResults, setGateResults] = useState<any | null>(null);
  const [deliverableDoc, setDeliverableDoc] = useState<DocumentViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Re-sync data when workflowId route changes
  useEffect(() => {
    setFormData(getInitialData(workflowId));
    const def = getWorkflow(workflowId);
    setCurrentState(def?.initialState || 'draft');
    setGateResults(null);
    setDeliverableDoc(null);
    setErrorMessage(null);
  }, [workflowId]);

  if (!definition) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            Workflow No Encontrado
          </h2>
          <p className="mt-2 text-sm">
            El ID de workflow "<span className="font-mono">{workflowId}</span>" no existe en el registro del Kernel.
          </p>
        </div>
        <div className="p-6 bg-surface border border-border rounded-xl">
          <h3 className="font-bold text-ink mb-3">Workflows Kernel Disponibles:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {allWorkflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => navigate(`/workflows/${wf.id}/demo`)}
                className="p-3 border border-border rounded-lg text-left hover:border-brand-500 transition-colors"
              >
                <div className="text-xs font-bold text-brand-500 font-mono">{wf.id}</div>
                <div className="text-sm font-semibold text-ink mt-1">{wf.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isAuthorized = WorkflowRunner.checkUserPermissions(definition, userRole);

  const handleFieldChange = (newData: Partial<any>) => {
    setFormData((prev: any) => ({ ...prev, ...newData }));
    setErrorMessage(null);
  };

  const handleEvaluateGates = async () => {
    const report = await WorkflowRunner.evaluateHardGates(definition, routeContext, formData);
    setGateResults(report);
  };

  const handleGenerateDeliverable = async () => {
    try {
      setErrorMessage(null);
      const doc = await WorkflowRunner.generateDeliverable(definition, routeContext, formData);
      setDeliverableDoc(doc);
      setShowDocModal(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al generar entregable.');
    }
  };

  const handleStateTransition = async (targetState: WorkflowState) => {
    const check = WorkflowRunner.canTransition(definition, currentState, targetState, userRole);
    if (!check.allowed) {
      setErrorMessage(check.reason || 'Transición denegada.');
      return;
    }

    // Evaluate gates prior to transition
    const report = await WorkflowRunner.evaluateHardGates(definition, routeContext, formData);
    setGateResults(report);

    if (!report.allPassed) {
      setErrorMessage(`Bloqueado por Hard Gate: ${report.failedGates[0]?.message}`);
      return;
    }

    setCurrentState(targetState);
    if (formData.status !== undefined) {
      setFormData((prev: any) => ({ ...prev, status: targetState }));
    }
  };

  const CaptureComp = definition.captureComponent;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Plugin-Kernel / WorkflowRegistry</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-mono text-brand-500 font-semibold">{definition.id}</span>
          </div>
          <h1 className="text-2xl font-black text-ink">{definition.title}</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{definition.description}</p>
        </div>

        {/* Quick Switcher */}
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border self-start md:self-auto">
          {allWorkflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => navigate(`/workflows/${wf.id}/demo`)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                wf.id === workflowId
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-ink hover:bg-surface'
              }`}
            >
              {wf.id.split('-')[1]?.toUpperCase() || wf.id}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Check Banner */}
      {!isAuthorized && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-600">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-semibold">
            Acceso Restringido: Su rol actual (<span className="font-mono font-bold">{userRole}</span>) no está incluido en los roles permitidos ({definition.rolesAllowed.join(', ')}).
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-600">
          <div className="flex items-center gap-2 text-xs font-bold">
            <XCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-500/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workflow Form Component */}
      <CaptureComp
        definition={definition}
        context={routeContext}
        data={formData}
        onChange={handleFieldChange}
        onTransition={handleStateTransition}
        currentState={currentState}
        isReadOnly={!isAuthorized}
      />

      {/* Kernel Toolbar Actions */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Contrato de Calidad: Schema Zod + Hard Gates + DocumentViewModel</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEvaluateGates}
            className="px-4 py-2 border border-border hover:bg-muted/50 rounded-lg text-xs font-bold text-ink flex items-center gap-2 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Evaluar Hard Gates ({definition.hardGates.length})
          </button>

          <button
            type="button"
            onClick={handleGenerateDeliverable}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all"
          >
            <FileCheck className="w-4 h-4" />
            Generar Entregable ViewModel
          </button>
        </div>
      </div>

      {/* Hard Gate Results Box */}
      {gateResults && (
        <div className="p-5 bg-surface border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              {gateResults.allPassed ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              Reporte de Evaluación de Hard Gates Kernel
            </h4>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                gateResults.allPassed
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-600'
              }`}
            >
              {gateResults.allPassed ? 'TODOS PASADOS' : 'BLOQUEADO'}
            </span>
          </div>

          {gateResults.failedGates.length > 0 && (
            <div className="space-y-2">
              {gateResults.failedGates.map((fg: any) => (
                <div key={fg.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600">
                  <span className="font-bold block">{fg.name}:</span>
                  <span>{fg.message}</span>
                </div>
              ))}
            </div>
          )}

          {gateResults.passedGates.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {gateResults.passedGates.map((pg: any) => (
                <span
                  key={pg.id}
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded text-[11px] font-semibold border border-emerald-500/20"
                >
                  ✓ {pg.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DocumentViewModel Preview Modal */}
      {showDocModal && deliverableDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-ink text-sm">{deliverableDoc.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{deliverableDoc.code} | {deliverableDoc.date}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-muted-foreground hover:text-ink hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink">
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-brand-600 text-[11px]">
                {deliverableDoc.disclaimer}
              </div>

              {deliverableDoc.sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h4 className="font-bold text-ink uppercase tracking-wider text-xs border-b border-border pb-1">
                    {sec.title}
                  </h4>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    {sec.content.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Render Tables if present */}
              {deliverableDoc.tables.map((tbl) => (
                <div key={tbl.id} className="space-y-2">
                  <h4 className="font-bold text-ink uppercase tracking-wider text-xs">{tbl.title}</h4>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
                        <tr>
                          {tbl.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tbl.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.cells.map((cell, cIdx) => (
                              <td key={cIdx} className={`px-3 py-2 ${cell.bold ? 'font-bold' : ''}`}>
                                {cell.value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      {tbl.summaryRow && (
                        <tfoot className="bg-muted/50 border-t border-border font-bold">
                          <tr>
                            {tbl.summaryRow.cells.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2">{cell.value}</td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Signers: {deliverableDoc.signers.map((s) => `${s.name} (${s.role})`).join(', ')}
              </span>
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg font-bold text-xs hover:bg-brand-600"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
