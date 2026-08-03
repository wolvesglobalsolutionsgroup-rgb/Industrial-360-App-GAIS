import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, ArrowLeft, FileText, Calendar, Layers, 
  AlertCircle, RefreshCw, Filter, CheckCircle2, BarChart2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface TaskDoc {
  id: string;
  name?: string;
  title?: string;
  wbsName?: string;
  wbsCode?: string;
  code?: string;
  unit?: string;
  unidad?: string;
  plannedVolume?: number;
  plannedQuantity?: number;
  planned?: number;
  executedVolume?: number;
  completedQuantity?: number;
  executed?: number;
  advancePercent?: number;
  progressPercent?: number;
  progress?: number;
  status?: string;
  category?: string;
}

interface FieldReportDoc {
  id: string;
  taskId?: string;
  wbsCode?: string;
  title?: string;
  description?: string;
  summary?: string;
  date?: string;
  timestamp?: any;
  authorName?: string;
  reporter?: string;
  advanceDelta?: number;
}

export default function ProgressDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId') || searchParams.get('id');
  const wbsCodeParam = searchParams.get('wbsCode');

  const { currentOrganization, currentProject } = useProject();
  const orgId = currentOrganization?.id;
  const projId = currentProject?.id;

  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !projId || projId === 'all') {
      setTasks([]);
      setFieldReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const tasksPath = `organizations/${orgId}/projects/${projId}/tasks`;
    const reportsPath = `organizations/${orgId}/projects/${projId}/field_reports`;

    let unsubReports: (() => void) | null = null;

    const unsubTasks = onSnapshot(
      collection(db, tasksPath),
      (snapshot) => {
        const docs: TaskDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setTasks(docs);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, tasksPath);
        setError(`Error al cargar partidas de avance (${err.code || err.message})`);
        setLoading(false);
      }
    );

    unsubReports = onSnapshot(
      collection(db, reportsPath),
      (snapshot) => {
        const rDocs: FieldReportDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setFieldReports(rDocs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, reportsPath);
      }
    );

    return () => {
      unsubTasks();
      if (unsubReports) unsubReports();
    };
  }, [orgId, projId]);

  // Context Guard
  if (!orgId || !projId || projId === 'all') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Avance Físico</h1>
            <p className="text-xs text-muted">Análisis detallado del progreso de la obra</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Contexto Requerido</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Selecciona una organización y un proyecto específico para continuar.
          </p>
        </div>
      </motion.div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin text-brand-500 mx-auto" />
        <p className="text-sm text-muted font-medium">Cargando partidas y reportes de avance desde Firestore...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Avance Físico</h1>
            <p className="text-xs text-muted">Análisis detallado del progreso de la obra</p>
          </div>
        </header>

        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={20} />
            <span>Error de Acceso o Consulta</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      </motion.div>
    );
  }

  // Empty State if no tasks exist
  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Avance Físico</h1>
            <p className="text-xs text-muted">Análisis detallado del progreso de la obra</p>
          </div>
        </header>

        <div className="bg-surface p-10 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-surface-2 text-muted rounded-2xl flex items-center justify-center mx-auto">
            <Layers size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Sin Partidas de Avance</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No se encontraron partidas registradas en el proyecto ({currentProject?.name || projId}).
          </p>
        </div>
      </motion.div>
    );
  }

  // Find target task
  let selectedTask: TaskDoc | undefined;
  if (taskIdParam) {
    selectedTask = tasks.find((t) => t.id === taskIdParam);
  } else if (wbsCodeParam) {
    selectedTask = tasks.find((t) => t.wbsCode === wbsCodeParam || t.code === wbsCodeParam);
  }

  if ((taskIdParam || wbsCodeParam) && !selectedTask) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Avance Físico</h1>
            <p className="text-xs text-muted">Análisis detallado del progreso de la obra</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Partida No Encontrada</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No existe ninguna partida con el identificador "{taskIdParam || wbsCodeParam}".
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
          >
            Ver primera partida disponible
          </button>
        </div>
      </motion.div>
    );
  }

  const activeTask = selectedTask || tasks[0];

  // Defensive values
  const taskTitle = activeTask.name || activeTask.title || activeTask.wbsName || 'Partida WBS sin título';
  const wbsCode = activeTask.wbsCode || activeTask.code || activeTask.id;
  const unit = activeTask.unit || activeTask.unidad || 'UND';
  const plannedVol = Number(activeTask.plannedVolume ?? activeTask.plannedQuantity ?? activeTask.planned ?? 0);
  const executedVol = Number(activeTask.executedVolume ?? activeTask.completedQuantity ?? activeTask.executed ?? activeTask.progress ?? 0);

  const calcPercent = plannedVol > 0
    ? Math.min(100, Math.max(0, (executedVol / plannedVol) * 100))
    : Number(activeTask.advancePercent ?? activeTask.progressPercent ?? 0);

  // Filter 3 related field reports
  const relatedReports = fieldReports
    .filter((r) => r.taskId === activeTask.id || (r.wbsCode && r.wbsCode === wbsCode))
    .sort((a, b) => {
      const tA = a.timestamp?.seconds || (a.date ? new Date(a.date).getTime() : 0);
      const tB = b.timestamp?.seconds || (b.date ? new Date(b.date).getTime() : 0);
      return tB - tA;
    })
    .slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Avance Físico</h1>
            <p className="text-xs text-muted">Desglose técnico de volumen ejecutado y trazabilidad de campo</p>
          </div>
        </div>

        {/* Task Selector */}
        {tasks.length > 1 && (
          <div className="flex items-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl text-xs">
            <Filter size={14} className="text-muted" />
            <select
              value={activeTask.id}
              onChange={(e) => setSearchParams({ taskId: e.target.value })}
              className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.wbsCode || t.code || 'WBS'}] {t.name || t.title || t.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Task Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Metrics Panel */}
        <div className="bg-surface p-6 rounded-2xl border border-line space-y-6">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase">
              WBS: {wbsCode}
            </span>
            <h2 className="text-lg font-bold text-ink leading-tight">{taskTitle}</h2>
            <p className="text-xs text-muted font-medium">Unidad de Medida: <span className="font-mono font-bold text-ink">{unit}</span></p>
          </div>

          {/* Progress Bar & Stat */}
          <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-muted">Avance Físico</span>
              <span className="text-2xl font-extrabold text-brand-600 font-mono">{calcPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${calcPercent}%` }}
              />
            </div>
          </div>

          {/* Volumetric Breakdown */}
          <div className="space-y-3 text-xs pt-2">
            <div className="flex justify-between items-center py-1.5 border-b border-line">
              <span className="text-muted">Volumen Planificado:</span>
              <span className="font-mono font-bold text-ink">{plannedVol.toLocaleString('es-VE')} {unit}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-line">
              <span className="text-muted">Volumen Ejecutado:</span>
              <span className="font-mono font-bold text-emerald-700">{executedVol.toLocaleString('es-VE')} {unit}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted">Diferencia / Remanente:</span>
              <span className="font-mono font-bold text-amber-700">
                {Math.max(0, plannedVol - executedVol).toLocaleString('es-VE')} {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Field Reports Panel (Last 3) */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-line space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-ink">Últimos Reportes de Campo Vinculados (Máx. 3)</h3>
            </div>
            <span className="text-[11px] text-muted font-mono">{relatedReports.length} reportes</span>
          </div>

          {relatedReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted border border-dashed border-line rounded-xl">
              No hay reportes diarios de campo vinculados a esta partida.
            </div>
          ) : (
            <div className="space-y-3">
              {relatedReports.map((rep) => {
                const repDate = rep.date || (rep.timestamp?.seconds
                  ? new Date(rep.timestamp.seconds * 1000).toLocaleDateString('es-VE')
                  : 'Fecha N/A');
                return (
                  <div key={rep.id} className="p-4 bg-surface-2 rounded-xl border border-line/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{rep.title || `Reporte #${rep.id.substring(0, 6)}`}</span>
                      <span className="font-mono text-[11px] text-muted flex items-center gap-1">
                        <Calendar size={12} /> {repDate}
                      </span>
                    </div>
                    {(rep.description || rep.summary) && (
                      <p className="text-xs text-muted line-clamp-2">{rep.description || rep.summary}</p>
                    )}
                    {rep.authorName || rep.reporter ? (
                      <p className="text-[10px] text-faint font-medium">Inspector: {rep.authorName || rep.reporter}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

