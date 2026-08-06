import { useRef, useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Download, CloudRain, 
  ShieldCheck, Activity, LayoutDashboard, AlertTriangle, Building, ChevronRight, BrainCircuit
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { 
  tasksRepo, expensesRepo, valuationsRepo, sihoPtwRepo, weldJointsRepo, wbsSnapshotsRepo 
} from '../lib/repositories';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../ProjectContext';
import { 
  Card, CardHeader, CardContent, Button, 
  StatusBadge, Skeleton, EmptyState 
} from '../components/ui';
import StatCard from '../components/common/StatCard';
import HeroCard from '../components/dashboard/HeroCard';
import PageHeader from '../components/common/PageHeader';
import QaBanner from '../components/ui/QaBanner';

import SourceBadge from '../components/states/SourceBadge';
import LastUpdated from '../components/states/LastUpdated';
import ErrorState from '../components/states/ErrorState';
import PermissionDenied from '../components/states/PermissionDenied';

export default function Dashboard() {
  const { currentProject, currentOrganization, projects } = useProject();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Live Firestore State Metrics
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [ptwList, setPtwList] = useState<any[]>([]);
  const [weldJoints, setWeldJoints] = useState<any[]>([]);
  const [wbsSnapshots, setWbsSnapshots] = useState<any[]>([]);

  // Subscribe to Firestore Collections via Repositories (Multi-tenant, limit(50))
  useEffect(() => {
    setIsLoadingData(true);
    setErrorState(null);

    const orgId = currentOrganization?.id;
    if (!orgId) {
      setIsLoadingData(false);
      return;
    }

    const projId = currentProject?.id || 'all';

    const timer = setTimeout(() => {
      setIsLoadingData(false);
    }, 1000);
    
    try {
      const unsubTasks = tasksRepo.subscribe(orgId, projId, (items) => {
        setTasks(items);
        setIsLoadingData(false);
        clearTimeout(timer);
      }, () => {
        setIsLoadingData(false);
        clearTimeout(timer);
      }, { limitCount: 50 });

      const unsubExpenses = expensesRepo.subscribe(orgId, projId, (items) => {
        setExpenses(items);
      }, undefined, { limitCount: 50 });

      const unsubValuations = valuationsRepo.subscribe(orgId, projId, (items) => {
        setValuations(items);
      }, undefined, { limitCount: 50 });

      const unsubPtw = sihoPtwRepo.subscribe(orgId, projId, (items) => {
        setPtwList(items);
      }, undefined, { limitCount: 50 });

      const unsubWelds = weldJointsRepo.subscribe(orgId, projId, (items) => {
        setWeldJoints(items);
      }, undefined, { limitCount: 50 });

      const unsubSnapshots = wbsSnapshotsRepo.subscribe(orgId, projId, (items) => {
        const sorted = [...items].sort((a, b) => (a.createdAt || a.date || '').localeCompare(b.createdAt || b.date || ''));
        setWbsSnapshots(sorted);
      }, undefined, { limitCount: 50 });

      return () => {
        clearTimeout(timer);
        unsubTasks();
        unsubExpenses();
        unsubValuations();
        unsubPtw();
        unsubWelds();
        unsubSnapshots();
      };
    } catch (err: any) {
      clearTimeout(timer);
      setIsLoadingData(false);
    }
  }, [currentProject, currentOrganization]);

  // COMPUTED METRICS (Traceable & Tenant-isolated)
  const totalPlannedVal = tasks.reduce((sum, t) => sum + (Number(t.plannedQuantity || 0) * Number(t.unitCost || 0)), 0);
  const totalExecutedVal = tasks.reduce((sum, t) => sum + (Number(t.executedQuantity || 0) * Number(t.unitCost || 0)), 0);
  
  const physicalProgress = totalPlannedVal > 0 
    ? Math.min(100, Number(((totalExecutedVal / totalPlannedVal) * 100).toFixed(1)))
    : (tasks.length > 0 ? Number(((tasks.filter(t => Number(t.executedQuantity || 0) >= Number(t.plannedQuantity || 0)).length / tasks.length) * 100).toFixed(1)) : null);

  const totalGastadoExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalValuationsVal = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);
  const totalBudgetCost = totalPlannedVal > 0 ? totalPlannedVal : null;
  const currentSpent = totalGastadoExpenses > 0 ? totalGastadoExpenses : (totalValuationsVal > 0 ? totalValuationsVal : null);

  // Traceable HHT Calculation: strictly from project field or accumulated PTW/worker hours
  const totalPtwHht = ptwList.reduce((sum, p) => sum + Number(p.hht || p.hoursWorked || (p.workersCount ? p.workersCount * 8 : 0)), 0);
  const hhtTotal = (typeof currentProject?.hhtCount === 'number' && currentProject.hhtCount > 0)
    ? currentProject.hhtCount
    : (totalPtwHht > 0 ? totalPtwHht : null);

  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const rejectedJoints = weldJoints.filter(j => j.ndtStatus === 'Rechazado' || j.ndtStatus === 'Rechazada' || j.vtStatus === 'Rechazado');
  const weldRejectRate = inspectedJoints.length > 0
    ? Number(((rejectedJoints.length / inspectedJoints.length) * 100).toFixed(1))
    : null;

  // Real S-Curve data mapped from Firestore wbs_snapshots
  const progressData = wbsSnapshots.map(s => ({
    name: s.name || s.week || s.date || 'Snapshot',
    planificado: Number(s.plannedProgress ?? s.planificado ?? 0),
    real: Number(s.actualProgress ?? s.real ?? 0),
  }));

  const ptwHot = ptwList.filter(p => p.type === 'hot' || p.type === 'caliente' || p.permitType === 'caliente' || p.title?.toLowerCase().includes('caliente')).length;
  const ptwCold = ptwList.filter(p => p.type === 'cold' || p.type === 'frio' || p.permitType === 'frio' || p.title?.toLowerCase().includes('frio')).length;
  const ptwIas = ptwList.filter(p => p.type === 'ias' || p.status === 'en_revision' || p.status === 'revision').length;

  const isQaEnvironment = currentOrganization?.environment === 'qa' || currentOrganization?.id === 'ic360-qa-pilot' || import.meta.env.VITE_ENVIRONMENT === 'qa';

  const exportToPDF = async () => {
    if (!dashboardRef.current || !currentProject) return;
    setIsExporting(true);
    try {
      const filter = (node: HTMLElement) => {
        return !node.hasAttribute?.('data-html2canvas-ignore');
      };
      
      const imgData = await toPng(dashboardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        filter: filter as any
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (isQaEnvironment) {
        pdf.setTextColor(220, 38, 38);
        pdf.setFontSize(14);
        pdf.text("DATOS SINTÉTICOS — ENTORNO QA — NO OPERACIONAL", 10, 10);
      }

      pdf.save(`informe-ejecutivo-${currentOrganization?.id || 'org'}-${currentProject?.id || 'general'}.pdf`);
    } catch (error) {
      console.error("Error al exportar informe a PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentOrganization?.id) {
    return (
      <div className="p-6">
        <PermissionDenied
          title="Sin Organización Autorizada"
          message="No se detectó una organización activa para el usuario. Por favor seleccione o solicite acceso a una organización autorizada para visualizar los indicadores de obra."
        />
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="p-6">
        <ErrorState
          title="Error al Cargar Panel Ejecutivo"
          message={errorState}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <QaBanner environment={currentOrganization?.environment} orgId={currentOrganization?.id} />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6 pb-8 p-4 sm:p-6" 
        ref={dashboardRef}
      >
        {/* Page Header */}
        <PageHeader
          title={currentProject?.id === 'all' 
            ? 'Portafolio Corporativo Consolidado' 
            : `Panel Ejecutivo: ${currentProject?.name || 'Proyecto Activo'}`}
          subtitle={`Organización: ${currentOrganization?.name || 'Sin Organización'} · Estado operativo en tiempo real`}
          badge={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-brand-500 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Building size={12} />
                {currentProject?.id === 'all' ? `${projects.length} Obras` : 'Proyecto Activo'}
              </span>
              <SourceBadge 
                source={isQaEnvironment ? 'qa_seed' : 'firestore'} 
                detail={isQaEnvironment ? 'DS-IC360-QA-CANONICAL' : currentOrganization?.id}
              />
              <LastUpdated timestamp={lastSync} onRefresh={() => setLastSync(new Date())} />
            </div>
          }
          actions={
            <Button 
              variant="primary" 
              onClick={exportToPDF}
              isLoading={isExporting}
              disabled={!currentProject || tasks.length === 0 || physicalProgress === null || currentSpent === null}
              data-html2canvas-ignore
              leftIcon={<Download size={16} />}
            >
              {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
            </Button>
          }
        />

        {/* KPI StatCard Row */}
        {isLoadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Avance Físico Ponderado"
              value={physicalProgress !== null ? `${physicalProgress}%` : 'Sin dato'}
              icon={<TrendingUp size={20} />}
              sublabel={physicalProgress !== null ? "Avance Ponderado WBS" : "Sin partidas con avance"}
              accentColor="emerald"
            />

            <StatCard
              title="Presupuesto Ejecutado"
              value={currentSpent !== null ? `$ ${(currentSpent >= 1000000 ? (currentSpent / 1000000).toFixed(1) + 'M' : (currentSpent / 1000).toFixed(0) + 'k')}` : 'Sin dato'}
              icon={<DollarSign size={20} />}
              sublabel={totalBudgetCost !== null ? `de $ ${(totalBudgetCost >= 1000000 ? (totalBudgetCost / 1000000).toFixed(1) + 'M' : (totalBudgetCost / 1000).toFixed(0) + 'k')} total` : "Sin presupuesto registrado"}
              accentColor="indigo"
            />

            <StatCard
              title="HHT sin Accidentes"
              value={hhtTotal !== null ? hhtTotal.toLocaleString() : 'Sin dato'}
              icon={<ShieldCheck size={20} />}
              sublabel="SIHO-A Registro de Campo"
              accentColor="brand"
            />

            <StatCard
              title="Rechazo Soldadura NDT"
              value={weldRejectRate !== null ? `${weldRejectRate}%` : 'Sin dato'}
              icon={<Activity size={20} />}
              sublabel="API 1104 / ASME IX"
              accentColor="amber"
            />
          </div>
        )}

        {/* Bento Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main HeroCard */}
            <HeroCard
              projectName={currentProject?.name || 'Proyecto Seleccionado'}
              wbsProgress={physicalProgress ?? undefined}
              executedValuation={currentSpent ?? undefined}
              totalBudget={totalBudgetCost ?? undefined}
              hhtCount={hhtTotal ?? undefined}
              activeFronts={tasks.filter(t => t.status === 'en_campo').length}
            />

            {/* S-Curve Chart */}
            <Card hoverEffect>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-ink text-base sm:text-lg">
                    Curva S — Avance Físico Acumulado
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Proyección contractual vs avance ejecutado en frentes de obra
                  </p>
                </div>
              </CardHeader>

              <CardContent className="h-72">
                {progressData.length < 2 ? (
                  <EmptyState
                    icon={<TrendingUp size={28} />}
                    title="Datos insuficientes para Curva S"
                    description="Se requieren al menos 2 snapshots de avance WBS registrados para trazar la Curva S."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--color-line)', 
                          background: 'var(--color-surface)',
                          color: 'var(--color-ink)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="planificado" stroke="var(--color-ink-faint)" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                      <Line type="monotone" dataKey="real" stroke="var(--color-brand-500)" strokeWidth={3} name="Real %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Partidas en Ejecución Table */}
            <Card hoverEffect>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-ink text-base sm:text-lg">
                    Partidas en Ejecución Campo
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Top partidas con volumen activo en Kanban WBS
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                  Ver Kanban de Partidas
                </Button>
              </CardHeader>

              <CardContent>
                {tasks.length === 0 ? (
                  <EmptyState 
                    icon={<LayoutDashboard size={28} />}
                    title="Sin partidas registradas"
                    description="No hay partidas activas en ejecución para este proyecto."
                    actionLabel="Ir a Partidas"
                    onAction={() => navigate('/tasks')}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-line text-ink-faint uppercase text-[10px] font-extrabold tracking-wider">
                          <th className="py-2.5 px-3">WBS / Partida</th>
                          <th className="py-2.5 px-3">Especialidad</th>
                          <th className="py-2.5 px-3 text-right">Planificado</th>
                          <th className="py-2.5 px-3 text-right">Ejecutado</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {tasks.slice(0, 5).map((task) => {
                          return (
                            <tr key={task.id} className="hover:bg-surface-2 transition-colors">
                              <td className="py-3 px-3 font-bold text-ink">
                                <div>{task.title || task.wbsCode || 'Partida de Obra'}</div>
                                <span className="text-[10px] text-ink-faint font-mono">{task.wbsCode || task.id.substring(0, 8)}</span>
                              </td>
                              <td className="py-3 px-3 text-ink-soft font-semibold">
                                {task.specialty || 'General'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-ink font-semibold">
                                {task.plannedQuantity !== undefined ? `${task.plannedQuantity} ${task.unit || 'm'}` : 'Sin dato'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-brand-500">
                                {task.executedQuantity !== undefined ? `${task.executedQuantity} ${task.unit || 'm'}` : '0'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <StatusBadge status={task.status || 'en_campo'} size="sm" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right 1 Column */}
          <div className="space-y-6">

            {/* Project Brain AI Diagnostic Card */}
            <Card hoverEffect className="bg-brand-500/5 border-brand-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-brand-500" />
                  <h3 className="font-display font-bold text-ink text-sm">Project Brain AI</h3>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500 text-white">
                  Diagnóstico
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-ink-soft leading-relaxed italic">
                  "Sin diagnóstico activo. Inicie una consulta interactiva en Project Brain para analizar el proyecto en tiempo real."
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold"
                  onClick={() => navigate('/project-brain')}
                  rightIcon={<ChevronRight size={14} />}
                >
                  Consultar al Cerebro
                </Button>
              </CardContent>
            </Card>

            {/* PTW SIHO-A Active Permits Card */}
            <Card hoverEffect>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-display font-bold text-ink text-sm">Permisos PTW SIHO-A</h3>
                <StatusBadge status="en_campo" customText="Resumen" size="sm" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line">
                  <span className="text-xs font-bold text-ink">Permisos Caliente (PTW-H)</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">{ptwHot} Activos</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line">
                  <span className="text-xs font-bold text-ink">Permisos Frío (PTW-C)</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">{ptwCold} Activos</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-line">
                  <span className="text-xs font-bold text-ink">I.A.S. de Seguridad</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{ptwIas} En Revisión</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={() => navigate('/siho-ptw')}
                >
                  Ver Módulo SIHO-A
                </Button>
              </CardContent>
            </Card>

            {/* Weather Widget */}
            <Card hoverEffect>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-ink font-bold text-xs">
                  <CloudRain size={16} className="text-cyan-500" />
                  <span>Clima Operativo Campo</span>
                </div>
                <span className="text-[10px] font-mono text-ink-faint">Anzoátegui / Monagas</span>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Clima no disponible"
                  subtitle="Integración meteorológica pendiente."
                />
              </CardContent>
            </Card>

          </div>

        </div>
      </motion.div>
    </>
  );
}
