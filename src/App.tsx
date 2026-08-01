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
import { CommandPalette } from './components/CommandPalette';
import { ProjectProvider } from './ProjectContext';
import { ThemeProvider } from './theme/ThemeContext';
import { DisplayEnvironmentProvider } from './theme/DisplayEnvironmentContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded page components
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const ProcurementInventory = lazy(() => import('./pages/ProcurementInventory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const VoiceChat = lazy(() => import('./pages/VoiceChat'));
const BIMViewer = lazy(() => import('./pages/BIMViewer'));
const EngineeringTools = lazy(() => import('./pages/EngineeringTools'));
const Settings = lazy(() => import('./pages/Settings'));
const ModulePlaceholder = lazy(() => import('./pages/ModulePlaceholder'));
const ProgressDetails = lazy(() => import('./pages/ProgressDetails'));
const BudgetDetails = lazy(() => import('./pages/BudgetDetails'));
const PersonnelDetails = lazy(() => import('./pages/PersonnelDetails'));
const AlertsDetails = lazy(() => import('./pages/AlertsDetails'));
const FieldReports = lazy(() => import('./pages/FieldReports'));
const SyncCenter = lazy(() => import('./pages/SyncCenter'));
const ProjectBrain = lazy(() => import('./pages/ProjectBrain'));
const Intelligence = lazy(() => import('./pages/Intelligence'));
const Documents = lazy(() => import('./pages/Documents'));
const Valuations = lazy(() => import('./pages/Valuations'));
const LogisticsMap = lazy(() => import('./pages/LogisticsMap'));
const SihoPtw = lazy(() => import('./pages/SihoPtw'));
const QaQcWelding = lazy(() => import('./pages/QaQcWelding'));
const IntegrityIli = lazy(() => import('./pages/IntegrityIli'));
const StandbyMoc = lazy(() => import('./pages/StandbyMoc'));
const FleetEquipment = lazy(() => import('./pages/FleetEquipment'));
const InteroperabilityEngine = lazy(() => import('./pages/InteroperabilityEngine'));
const DossierCompiler = lazy(() => import('./pages/DossierCompiler'));
const ClientPortalBuilder = lazy(() => import('./pages/ClientPortalBuilder'));
const ClientPortalView = lazy(() => import('./pages/ClientPortalView'));
const HotTapSchemes = lazy(() => import('./pages/HotTapSchemes'));
const ApuEstimation = lazy(() => import('./pages/ApuEstimation'));
const WorkerQrRegistry = lazy(() => import('./pages/WorkerQrRegistry'));
const EnvironmentalManagement = lazy(() => import('./pages/EnvironmentalManagement'));
const LotoIsolation = lazy(() => import('./pages/LotoIsolation'));
const PlatformOwnerConsole = lazy(() => import('./pages/PlatformOwnerConsole'));
const InstrumentationControl = lazy(() => import('./pages/InstrumentationControl'));
const CivilEngineeringRegistry = lazy(() => import('./pages/CivilEngineeringRegistry'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
      <CommandPalette />
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
                <SihoPtw />
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

            <Route path="environmental-management" element={<EnvironmentalManagement />} />
            <Route path="environmental" element={<Navigate to="/environmental-management" replace />} />

            <Route path="loto-isolation" element={
              <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Control de Fuentes de Energía y LOTO">
                <LotoIsolation />
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
                <CivilEngineeringRegistry />
              </ProtectedRoute>
            } />
            <Route path="civil" element={<Navigate to="/civil-engineering" replace />} />

            <Route path="alerts-details" element={<AlertsDetails />} />
            <Route path="modulos/:id" element={<ModulePlaceholder />} />
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
