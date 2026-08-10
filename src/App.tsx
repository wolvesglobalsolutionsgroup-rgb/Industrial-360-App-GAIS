/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppAuthState } from './firebase';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { ProjectProvider } from './ProjectContext';
import { ThemeProvider } from './theme/ThemeContext';
import { DisplayEnvironmentProvider } from './theme/DisplayEnvironmentContext';
import ErrorBoundary from './components/ErrorBoundary';

// Resilient lazy loader for Vite dynamic imports
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('Dynamic import failed, retrying...', error);
      try {
        return await factory();
      } catch (retryErr) {
        const hasReloaded = sessionStorage.getItem('vite_import_retry');
        if (!hasReloaded) {
          sessionStorage.setItem('vite_import_retry', 'true');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem('vite_import_retry');
        throw retryErr;
      }
    }
  });
}

// Lazy loaded page components
const Landing = lazyWithRetry(() => import('./pages/Landing'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Projects = lazyWithRetry(() => import('./pages/Projects'));
const Tasks = lazyWithRetry(() => import('./pages/Tasks'));
const ProcurementInventory = lazyWithRetry(() => import('./pages/ProcurementInventory'));
const Expenses = lazyWithRetry(() => import('./pages/Expenses'));
const Chatbot = lazyWithRetry(() => import('./pages/Chatbot'));
const VoiceChat = lazyWithRetry(() => import('./pages/VoiceChat'));
const BIMViewer = lazyWithRetry(() => import('./pages/BIMViewer'));
const EngineeringTools = lazyWithRetry(() => import('./pages/EngineeringTools'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const ProgressDetails = lazyWithRetry(() => import('./pages/ProgressDetails'));
const BudgetDetails = lazyWithRetry(() => import('./pages/BudgetDetails'));
const PersonnelDetails = lazyWithRetry(() => import('./pages/PersonnelDetails'));
const AlertsDetails = lazyWithRetry(() => import('./pages/AlertsDetails'));
const FieldReports = lazyWithRetry(() => import('./pages/FieldReports'));
const SyncCenter = lazyWithRetry(() => import('./pages/SyncCenter'));
const ProjectBrain = lazyWithRetry(() => import('./pages/ProjectBrain'));
const Intelligence = lazyWithRetry(() => import('./pages/Intelligence'));
const Documents = lazyWithRetry(() => import('./pages/Documents'));
const Valuations = lazyWithRetry(() => import('./pages/Valuations'));
const LogisticsMap = lazyWithRetry(() => import('./pages/LogisticsMap'));
const SihoPtw = lazyWithRetry(() => import('./pages/SihoPtw'));
const QaQcWelding = lazyWithRetry(() => import('./pages/QaQcWelding'));
const IntegrityIli = lazyWithRetry(() => import('./pages/IntegrityIli'));
const StandbyMoc = lazyWithRetry(() => import('./pages/StandbyMoc'));
const FleetEquipment = lazyWithRetry(() => import('./pages/FleetEquipment'));
const InteroperabilityEngine = lazyWithRetry(() => import('./pages/InteroperabilityEngine'));
const DossierCompiler = lazyWithRetry(() => import('./pages/DossierCompiler'));
const ClientPortalBuilder = lazyWithRetry(() => import('./pages/ClientPortalBuilder'));
const ClientPortalView = lazyWithRetry(() => import('./pages/ClientPortalView'));
const HotTapSchemes = lazyWithRetry(() => import('./pages/HotTapSchemes'));
const ApuEstimation = lazyWithRetry(() => import('./pages/ApuEstimation'));
const WorkerQrRegistry = lazyWithRetry(() => import('./pages/WorkerQrRegistry'));
const EnvironmentalManagement = lazyWithRetry(() => import('./pages/EnvironmentalManagement'));
const LotoIsolation = lazyWithRetry(() => import('./pages/LotoIsolation'));
const PlatformOwnerConsole = lazyWithRetry(() => import('./pages/PlatformOwnerConsole'));
const InstrumentationControl = lazyWithRetry(() => import('./pages/InstrumentationControl'));
const CivilEngineeringRegistry = lazyWithRetry(() => import('./pages/CivilEngineeringRegistry'));
const WorkflowRunnerPage = lazyWithRetry(() => import('./pages/WorkflowRunnerPage'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const CommandPalette = lazyWithRetry(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);

function AppContent() {
  const [user, loading] = useAppAuthState();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/portal/:portalId" element={<ClientPortalView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ProjectProvider>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/portal/:portalId" element={<ClientPortalView />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            
            {/* Rutas con Protección de Rol */}
            <Route path="tasks" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor']} moduleName="WBS / Planificación">
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="valuations" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Valuaciones y Facturación">
                <Valuations />
              </ProtectedRoute>
            } />
            <Route path="expenses" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor']} moduleName="Gestión de Costos y Gastos">
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="budget-details" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Detalles Presupuestarios">
                <BudgetDetails />
              </ProtectedRoute>
            } />
            <Route path="siho-ptw" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Módulo SIHO-A y Permisos PTW">
                <WorkflowRunnerPage overrideWorkflowId="wf-043-aprobacion-ptw" />
              </ProtectedRoute>
            } />
            <Route path="qa-qc-welding" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector']} moduleName="Control de Calidad y Juntas de Soldadura">
                <QaQcWelding />
              </ProtectedRoute>
            } />

            {/* Rutas adicionales de operación */}
            <Route path="sync-center" element={<SyncCenter />} />
            <Route path="field-reports" element={<FieldReports />} />
            <Route path="documents" element={<Documents />} />
            <Route path="logistics" element={<LogisticsMap />} />
            <Route path="inventory" element={<ProcurementInventory />} />
            <Route path="procurement" element={<Navigate to="/inventory" replace />} />

            <Route path="modulos/ili-pigging" element={<IntegrityIli />} />
            <Route path="modulos/standby-moc" element={<StandbyMoc />} />
            <Route path="modulos/flota" element={<FleetEquipment />} />
            <Route path="modulos/interoperabilidad" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Interoperabilidad Primavera/SAP">
                <InteroperabilityEngine />
              </ProtectedRoute>
            } />
            <Route path="modulos/cierre" element={<DossierCompiler />} />
            
            <Route path="client-portal-builder" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Generador de Portal de Clientes">
                <ClientPortalBuilder />
              </ProtectedRoute>
            } />
            <Route path="portal-builder" element={<Navigate to="/client-portal-builder" replace />} />

            <Route path="hot-tap" element={<HotTapSchemes />} />
            <Route path="apu-estimation" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor']} moduleName="Estimación APU y Cómputos Métricos">
                <ApuEstimation />
              </ProtectedRoute>
            } />
            <Route path="apu" element={<Navigate to="/apu-estimation" replace />} />

            <Route path="tools" element={<EngineeringTools />} />
            <Route path="project-brain" element={<ProjectBrain />} />
            <Route path="intelligence" element={<Intelligence />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="voice" element={<VoiceChat />} />
            <Route path="bim" element={<BIMViewer />} />
            
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Ajustes del Sistema">
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="progress-details" element={<ProgressDetails />} />
            <Route path="personnel-details" element={<PersonnelDetails />} />
            <Route path="worker-qr-registry" element={<WorkerQrRegistry />} />
            <Route path="personnel-qr" element={<Navigate to="/worker-qr-registry" replace />} />

            <Route path="environmental-management" element={<WorkflowRunnerPage overrideWorkflowId="wf-048-gestion-ambiental-siho" />} />
            <Route path="environmental" element={<Navigate to="/environmental-management" replace />} />

            <Route path="loto-isolation" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Control de Fuentes de Energía y LOTO">
                <WorkflowRunnerPage overrideWorkflowId="wf-051-control-aislamiento-loto" />
              </ProtectedRoute>
            } />
            <Route path="loto" element={<Navigate to="/loto-isolation" replace />} />

            {/* Consola SaaS Exclusiva SuperAdmin */}
            <Route path="saas-console" element={
              <ProtectedRoute allowedRoles={['superadmin']} moduleName="Consola SaaS Platform Owner">
                <PlatformOwnerConsole />
              </ProtectedRoute>
            } />
            <Route path="platform-owner-console" element={
              <ProtectedRoute allowedRoles={['superadmin']} moduleName="Consola SaaS Platform Owner">
                <PlatformOwnerConsole />
              </ProtectedRoute>
            } />
            <Route path="master-console" element={<Navigate to="/saas-console" replace />} />

            <Route path="instrumentation-control" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Instrumentación & Lazos P&ID">
                <InstrumentationControl />
              </ProtectedRoute>
            } />
            <Route path="instrumentation" element={<Navigate to="/instrumentation-control" replace />} />

            <Route path="civil-engineering" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Ensayos Civiles & Suelos">
                <WorkflowRunnerPage overrideWorkflowId="wf-050-ensayos-civiles-suelos" />
              </ProtectedRoute>
            } />
            <Route path="civil" element={<Navigate to="/civil-engineering" replace />} />

            {/* Rutas Dinámicas del Kernel de Workflows (Plugin-Kernel) */}
            <Route path="workflows/:workflowId/:instanceId" element={<WorkflowRunnerPage />} />
            <Route path="workflows/:workflowId" element={<WorkflowRunnerPage />} />
            <Route path="workflows" element={<WorkflowRunnerPage />} />

            <Route path="alerts-details" element={<AlertsDetails />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="qaqc-welding" element={<Navigate to="/qa-qc-welding" replace />} />
            <Route path="integrity-ili" element={<Navigate to="/modulos/ili-pigging" replace />} />
            <Route path="modulos/:id" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <DisplayEnvironmentProvider>
          <AppContent />
        </DisplayEnvironmentProvider>
      </ThemeProvider>
    </Router>
  );
}
