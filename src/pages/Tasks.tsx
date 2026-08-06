import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where, collectionGroup 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getAuthUser } from '../firebase';
import { tasksRepo } from '../lib/repositories';
import { 
  Plus, ClipboardList, HardHat, AlertTriangle, Sparkles, X, 
  KanbanSquare, Table2, Calendar, Search, Activity,
  Users, Edit2, Trash2, Upload, FileCode, CheckCircle2, ShieldCheck, Layers
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { callGeminiStructured } from '../lib/geminiProxy';
import { parseXerFile, parseBc3File, syncImportedTasksToFirestore } from '../lib/parsers';

// DND-KIT Imports
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

// Modular Board Components
import Column from '../components/board/Column';
import TaskModal from '../components/board/TaskModal';

// UI Primitives
import { 
  Button, 
  Card, 
  MetricCard, 
  StatusBadge, 
  Dialog, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  EmptyState, 
  Skeleton,
} from '../components/ui';

export interface TaskItem {
  id: string;
  projectId?: string;
  wbsCode: string;
  title: string;
  description?: string;
  unit: string;
  plannedQuantity: number;
  executedQuantity: number;
  unitCost: number;
  status: 'planificada' | 'en_campo' | 'bloqueada' | 'terminada' | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | any;
  specialty?: string;
  crewName?: string;
  frontName?: string;
  ptwRequired?: boolean;
  ptwStatus?: string;
  restrictionNotes?: string;
  subtasks?: Array<{ id: string; text: string; completed: boolean }>;
  startDate?: string;
  dueDate?: string;
}

const COLUMN_CONFIGS = [
  { id: 'planificada', title: 'Planificadas', colorAccent: 'blue' as const },
  { id: 'en_campo', title: 'En Campo', colorAccent: 'amber' as const },
  { id: 'bloqueada', title: 'Bloqueadas', colorAccent: 'rose' as const },
  { id: 'terminada', title: 'Terminadas / NDT', colorAccent: 'emerald' as const },
];

import { seedDemoData, FALLBACK_DEMO_TASKS } from '../lib/seedDemoData';
import { DEMO_AUTH_ENABLED } from '../config';

export default function Tasks() {
  const { currentProject, currentOrganization } = useProject();
  const orgId = currentOrganization?.id || 'default_org';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [defaultColumnForModal, setDefaultColumnForModal] = useState<string>('planificada');

  // AI Subtasks Modal State
  const [aiTaskTarget, setAiTaskTarget] = useState<TaskItem | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSubtasksLoading, setAiSubtasksLoading] = useState(false);
  const [aiSubtasksResult, setAiSubtasksResult] = useState<Array<{ name: string; description: string; estimatedDays: number }> | null>(null);
  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null);

  // Active Drag State
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const xerFileInputRef = useRef<HTMLInputElement>(null);
  const bc3FileInputRef = useRef<HTMLInputElement>(null);

  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    const res = await seedDemoData(true);
    setIsSeeding(false);
    setSeedMessage(res.message);
    setTimeout(() => setSeedMessage(null), 5000);
  };

  // Subscribe to Firestore Tasks (Multi-tenant)
  useEffect(() => {
    if (!currentProject) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const projId = currentProject.id || 'all';

    const unsubscribe = tasksRepo.subscribe(orgId, projId, (items) => {
      const taskMap = new Map<string, TaskItem>();
      items.forEach(d => {
        if (!taskMap.has(d.id)) {
          taskMap.set(d.id, {
            id: d.id,
            projectId: d.projectId || currentProject.id,
            wbsCode: d.wbsCode || d.code || 'WBS-1.0',
            title: d.title || d.name || 'Partida sin nombre',
            description: d.description || '',
            specialty: d.specialty || d.especialidad || 'Mecánica',
            unit: d.unit || 'm',
            plannedQuantity: Number(d.plannedQuantity || 100),
            executedQuantity: Number(d.executedQuantity || 0),
            unitCost: Number(d.unitCost || 120),
            status: (d.status as any) || 'planificada',
            priority: (d.priority as any) || 'medium',
            crewName: d.crewName || 'Cuadrilla Alfa',
            frontName: d.frontName || d.frente || 'Frente 1',
            ptwRequired: Boolean(d.ptwRequired || d.hasActivePtw),
            restrictionNotes: d.restrictionNotes || d.blockedReason || '',
            subtasks: d.subtasks || [],
            startDate: d.startDate,
            dueDate: d.dueDate || d.endDate,
          } as TaskItem);
        }
      });
      const tsks = Array.from(taskMap.values());

      if (tsks.length === 0) {
        if (DEMO_AUTH_ENABLED) {
          const filteredFallback = currentProject.id === 'all'
            ? FALLBACK_DEMO_TASKS
            : FALLBACK_DEMO_TASKS.filter(t => t.projectId === currentProject.id);
          setTasks(filteredFallback.length > 0 ? (filteredFallback as any) : (FALLBACK_DEMO_TASKS as any));
        } else {
          setTasks([]);
        }
      } else {
        setTasks(tsks);
      }
      setLoading(false);
      clearTimeout(timer);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
      if (DEMO_AUTH_ENABLED) {
        const filteredFallback = currentProject.id === 'all'
          ? FALLBACK_DEMO_TASKS
          : FALLBACK_DEMO_TASKS.filter(t => t.projectId === currentProject.id);
        setTasks(filteredFallback.length > 0 ? (filteredFallback as any) : (FALLBACK_DEMO_TASKS as any));
      } else {
        setTasks([]);
      }
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [currentProject, orgId]);

  // Drag Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const t = tasks.find(item => item.id === event.active.id);
    if (t) setActiveTask(t);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let targetStatus: string | null = null;
    if (['planificada', 'en_campo', 'bloqueada', 'terminada'].includes(overId)) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus) {
      const activeTaskItem = tasks.find(t => t.id === activeId);
      if (activeTaskItem && activeTaskItem.status !== targetStatus) {
        const itemProjId = activeTaskItem.projectId || currentProject?.id || 'default';
        const tasksPath = `organizations/${orgId}/projects/${itemProjId}/tasks`;
        try {
          await updateDoc(doc(db, tasksPath, activeId), {
            status: targetStatus,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          try {
            await updateDoc(doc(db, 'tasks', activeId), {
              status: targetStatus,
              updatedAt: new Date().toISOString()
            });
          } catch (err) {
            handleFirestoreError(error, OperationType.UPDATE, `${tasksPath}/${activeId}`);
          }
        }
      }
    }
  };

  // Progress Adjustment Delta
  const handleProgressChange = async (taskId: string, deltaPercent: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const deltaQty = (task.plannedQuantity * deltaPercent) / 100;
    const newExecuted = Math.max(0, Math.min(task.plannedQuantity, (task.executedQuantity || 0) + deltaQty));
    const isCompleted = newExecuted >= task.plannedQuantity;

    const itemProjId = task.projectId || currentProject?.id || 'default';
    const tasksPath = `organizations/${orgId}/projects/${itemProjId}/tasks`;

    try {
      await updateDoc(doc(db, tasksPath, taskId), {
        executedQuantity: newExecuted,
        status: isCompleted ? 'terminada' : task.status === 'planificada' ? 'en_campo' : task.status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          executedQuantity: newExecuted,
          status: isCompleted ? 'terminada' : task.status === 'planificada' ? 'en_campo' : task.status,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(error, OperationType.UPDATE, `${tasksPath}/${taskId}`);
      }
    }
  };

  // Save Task (Create or Edit)
  const handleSaveTask = async (taskData: any) => {
    if (!currentProject) return;

    const itemProjId = taskData.projectId || currentProject.id;
    const tasksPath = `organizations/${orgId}/projects/${itemProjId}/tasks`;

    if (taskData.id) {
      // Edit
      try {
        await updateDoc(doc(db, tasksPath, taskData.id), {
          ...taskData,
          orgId,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        try {
          await updateDoc(doc(db, 'tasks', taskData.id), {
            ...taskData,
            orgId,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(error, OperationType.UPDATE, `${tasksPath}/${taskData.id}`);
        }
      }
    } else {
      // Create
      try {
        const user = getAuthUser();
        await addDoc(collection(db, tasksPath), {
          projectId: itemProjId,
          orgId,
          ...taskData,
          assignedTo: user?.displayName || 'Supervisor Obra',
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, tasksPath);
      }
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta partida WBS?')) {
      const task = tasks.find(t => t.id === id);
      const itemProjId = task?.projectId || currentProject?.id || 'default';
      const tasksPath = `organizations/${orgId}/projects/${itemProjId}/tasks`;

      try {
        await deleteDoc(doc(db, tasksPath, id));
      } catch (error) {
        try {
          await deleteDoc(doc(db, 'tasks', id));
        } catch (err) {
          handleFirestoreError(error, OperationType.DELETE, `${tasksPath}/${id}`);
        }
      }
    }
  };

  // AI Subtasks Breakdown using Gemini
  const handleGenerateAiSubtasks = async (task: TaskItem) => {
    setAiTaskTarget(task);
    setIsAiModalOpen(true);
    setAiSubtasksLoading(true);
    setGeneratingTaskId(task.id);
    setAiSubtasksResult(null);

    const subtaskSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          description: { type: 'STRING' },
          estimatedDays: { type: 'NUMBER' }
        },
        required: ['name', 'description', 'estimatedDays']
      }
    };

    try {
      const result = await callGeminiStructured<Array<{ name: string; description: string; estimatedDays: number }>>(
        `Desglosa esta partida de obra en subtareas operativas secuenciales de ingeniería petrolera: ${task.title} (Código: ${task.wbsCode}). Especialidad: ${task.specialty || 'Mecánica'}. Cómputo: ${task.plannedQuantity} ${task.unit}.`,
        subtaskSchema,
        'Eres un ingeniero planificador senior EPC y especialista en control de obras industriales.'
      );

      setAiSubtasksResult(result);
    } catch (error) {
      console.error("Error al generar subtareas AI:", error);
    } finally {
      setAiSubtasksLoading(false);
      setGeneratingTaskId(null);
    }
  };

  const handleApplyAiSubtasks = async () => {
    if (!aiTaskTarget || !aiSubtasksResult) return;

    const formattedSubtasks = aiSubtasksResult.map((sub, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      text: `${sub.name}: ${sub.description}`,
      completed: false,
    }));

    const itemProjId = aiTaskTarget.projectId || currentProject?.id || 'default';
    const tasksPath = `organizations/${orgId}/projects/${itemProjId}/tasks`;

    try {
      await updateDoc(doc(db, tasksPath, aiTaskTarget.id), {
        subtasks: formattedSubtasks,
        updatedAt: new Date().toISOString(),
      });
      setIsAiModalOpen(false);
      setAiTaskTarget(null);
      setAiSubtasksResult(null);
    } catch (error) {
      try {
        await updateDoc(doc(db, 'tasks', aiTaskTarget.id), {
          subtasks: formattedSubtasks,
          updatedAt: new Date().toISOString(),
        });
        setIsAiModalOpen(false);
        setAiTaskTarget(null);
        setAiSubtasksResult(null);
      } catch (err) {
        handleFirestoreError(error, OperationType.UPDATE, `${tasksPath}/${aiTaskTarget.id}`);
      }
    }
  };

  // Import files (.xer, .bc3)
  const handleImportXer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = parseXerFile(evt.target?.result as string);
        if (parsed.length === 0) {
          alert('No se encontraron actividades en Primavera P6 (.xer)');
          return;
        }
        const { successCount } = await syncImportedTasksToFirestore(
          parsed,
          currentProject.id,
          orgId,
          'Primavera P6'
        );
        alert(`Sincronizadas ${successCount} partidas desde Primavera P6 (.xer)`);
      } catch (err) {
        alert('Error al procesar el archivo .xer');
      }
    };
    reader.readAsText(file);
    if (xerFileInputRef.current) xerFileInputRef.current.value = '';
  };

  const handleImportBc3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = parseBc3File(evt.target?.result as string);
        if (parsed.length === 0) {
          alert('No se encontraron partidas en archivo .bc3');
          return;
        }
        const { successCount } = await syncImportedTasksToFirestore(
          parsed,
          currentProject.id,
          orgId,
          'Presupuesto BC3'
        );
        alert(`Sincronizadas ${successCount} partidas desde Presupuesto BC3`);
      } catch (err) {
        alert('Error al procesar el archivo .bc3');
      }
    };
    reader.readAsText(file);
    if (bc3FileInputRef.current) bc3FileInputRef.current.value = '';
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.wbsCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.crewName && t.crewName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesSpecialty = filterSpecialty === 'all' || t.specialty === filterSpecialty;

    return matchesSearch && matchesPriority && matchesSpecialty;
  });

  const totalTasks = tasks.length;
  const totalPlannedValuation = tasks.reduce((sum, t) => sum + (t.plannedQuantity * (t.unitCost || 120)), 0);
  const totalExecutedValuation = tasks.reduce((sum, t) => sum + (t.executedQuantity * (t.unitCost || 120)), 0);
  const totalProgress = totalPlannedValuation > 0 ? (totalExecutedValuation / totalPlannedValuation) * 100 : 0;
  const blockedCount = tasks.filter(t => t.status === 'bloqueada').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Inputs */}
      <input type="file" accept=".xer" ref={xerFileInputRef} onChange={handleImportXer} className="hidden" />
      <input type="file" accept=".bc3" ref={bc3FileInputRef} onChange={handleImportBc3} className="hidden" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight font-display">
            Control de Partidas WBS & Kanban de Obra
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Gestión de catálogo WBS, avance físico-financiero y tablero Kanban industrial
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DEMO_AUTH_ENABLED && (
            <Button variant="outline" size="sm" onClick={handleSeedDemo} disabled={isSeeding} leftIcon={<Sparkles size={16} className="text-amber-500" />}>
              {isSeeding ? 'Sembrando...' : 'Cargar Datos Demo'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => xerFileInputRef.current?.click()} leftIcon={<FileCode size={16} />}>
            P6 (.xer)
          </Button>
          <Button variant="outline" size="sm" onClick={() => bc3FileInputRef.current?.click()} leftIcon={<Upload size={16} />}>
            BC3 (.bc3)
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />} 
            onClick={() => {
              setEditingTask(null);
              setDefaultColumnForModal('planificada');
              setIsTaskModalOpen(true);
            }}
          >
            Nueva Partida
          </Button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between animate-fade-in">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Partidas WBS"
          value={totalTasks}
          sublabel="En presupuesto contractual"
          icon={<ClipboardList size={22} />}
          accentColor="indigo"
        />
        <MetricCard
          title="Avance Físico Ponderado"
          value={`${totalProgress.toFixed(1)}%`}
          sublabel={`$${totalExecutedValuation.toLocaleString('en-US')} de $${totalPlannedValuation.toLocaleString('en-US')}`}
          icon={<Activity size={22} />}
          accentColor="emerald"
        />
        <MetricCard
          title="Partidas Bloqueadas"
          value={blockedCount}
          sublabel="Con restricciones activas"
          icon={<AlertTriangle size={22} />}
          accentColor={blockedCount > 0 ? "error" : "slate"}
        />
        <MetricCard
          title="Valuación Ejecutada"
          value={`$${totalExecutedValuation.toLocaleString('en-US')}`}
          sublabel="Acumulado certificado"
          icon={<HardHat size={22} />}
          accentColor="amber"
        />
      </div>

      {/* Control Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-3 rounded-2xl border border-line">
        {/* View Switcher */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
          {[
            { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
            { id: 'table', label: 'WBS Tabla', icon: Table2 },
            { id: 'calendar', label: 'Calendario', icon: Calendar },
          ].map(v => (
            <button 
              key={v.id} 
              onClick={() => setView(v.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                view === v.id ? 'bg-surface text-ink shadow-card' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <v.icon size={15} /> {v.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar por WBS o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none"
          >
            <option value="all">Especialidad: Todas</option>
            <option value="Mecánica">Mecánica</option>
            <option value="Civil">Civil</option>
            <option value="Electricidad">Electricidad</option>
            <option value="Instrumentación">Instrumentación</option>
            <option value="SIHO-A">SIHO-A</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none"
          >
            <option value="all">Prioridad: Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Main View Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} className="text-brand-500" />}
          title="No hay partidas registradas"
          description="Crea tu primera partida WBS o carga la estructura de datos demo industrial con proyectos, partidas WBS y valuaciones."
          actionLabel="Crear Partida WBS"
          onAction={() => {
            setEditingTask(null);
            setDefaultColumnForModal('planificada');
            setIsTaskModalOpen(true);
          }}
          secondaryAction={
            DEMO_AUTH_ENABLED ? (
              <Button variant="outline" onClick={handleSeedDemo} disabled={isSeeding}>
                ⚡ Cargar Partidas & Obras Demo
              </Button>
            ) : undefined
          }
        />
      ) : view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {COLUMN_CONFIGS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              const colValuation = colTasks.reduce((sum, t) => sum + (t.executedQuantity * (t.unitCost || 120)), 0);
              return (
                <Column
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  count={colTasks.length}
                  valuationTotal={colValuation}
                  colorAccent={col.colorAccent}
                  tasks={colTasks as any}
                  onProgressChange={handleProgressChange}
                  onGenerateAISubtasks={handleGenerateAiSubtasks}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onAddTask={(colId) => {
                    setEditingTask(null);
                    setDefaultColumnForModal(colId);
                    setIsTaskModalOpen(true);
                  }}
                  generatingTaskId={generatingTaskId}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="p-4 rounded-2xl bg-surface border border-brand-500 shadow-lift rotate-1 space-y-2 opacity-90">
                <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-surface-2">{activeTask.wbsCode}</span>
                <p className="text-xs font-bold text-ink">{activeTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : view === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableHead>Código WBS</TableHead>
              <TableHead>Partida de Obra</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Planificado</TableHead>
              <TableHead className="text-right">Ejecutado</TableHead>
              <TableHead className="text-right">P.U. ($)</TableHead>
              <TableHead className="text-right">Valuación ($)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableHeader>
            <TableBody>
              {filteredTasks.map(t => {
                const valuation = t.executedQuantity * (t.unitCost || 120);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-bold text-brand-500">{t.wbsCode}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-ink block">{t.title}</span>
                        {t.restrictionNotes && (
                          <span className="text-[10px] text-rose-500 font-semibold block">⚠️ {t.restrictionNotes}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-ink-soft">{t.specialty || 'Mecánica'}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">{t.plannedQuantity} {t.unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600 tabular">{t.executedQuantity} {t.unit}</TableCell>
                    <TableCell className="text-right font-mono tabular">${t.unitCost || 120}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-ink tabular">${valuation.toLocaleString('en-US')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleGenerateAiSubtasks(t)} 
                          className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer" 
                          title="Desglose AI"
                        >
                          <Sparkles size={15} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingTask(t);
                            setIsTaskModalOpen(true);
                          }} 
                          className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 rounded-lg cursor-pointer" 
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(t.id)} 
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer" 
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Calendar View */
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
            <h3 className="font-display font-bold text-ink">Cronograma de Ejecución y Planificación</h3>
            <span className="text-xs font-semibold text-ink-soft">Línea de tiempo WBS</span>
          </div>
          <div className="space-y-3">
            {filteredTasks.map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-surface-2 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded bg-surface border border-line">
                    {t.wbsCode}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{t.title}</h4>
                    <span className="text-xs text-ink-soft">Cuadrilla: {t.crewName || 'A1'} • Frente: {t.frontName || 'F1'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>Inicia: {t.startDate || 'Hoy'}</span>
                  <span>Entrega: {t.dueDate || '+14 días'}</span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TASK CREATE & EDIT MODAL */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
        defaultStatus={defaultColumnForModal}
      />

      {/* AI SUBTASKS MODAL */}
      <Dialog 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        title="Desglose Inteligente AI de Partida WBS"
      >
        <div className="space-y-4">
          {aiTaskTarget && (
            <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs">
              <span className="font-mono font-black text-brand-500 block mb-1">{aiTaskTarget.wbsCode}</span>
              <p className="font-bold text-ink">{aiTaskTarget.title}</p>
            </div>
          )}

          {aiSubtasksLoading ? (
            <div className="py-8 text-center space-y-3">
              <Sparkles size={32} className="mx-auto text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-ink">Project Brain AI analizando especificaciones y secuencias de ingeniería...</p>
            </div>
          ) : aiSubtasksResult ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-ink-soft">
                Project Brain ha generado las siguientes subtareas secuenciales:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {aiSubtasksResult.map((sub, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-2 border border-line text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>{i + 1}. {sub.name}</span>
                      <span className="text-[10px] font-mono text-brand-500">{sub.estimatedDays} días est.</span>
                    </div>
                    <p className="text-[11px] text-ink-soft leading-relaxed">{sub.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button variant="outline" size="sm" onClick={() => setIsAiModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyAiSubtasks} leftIcon={<CheckCircle2 size={16} />}>
                  Vincular Subtareas a Partida
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-500">No se pudo generar el desglose. Inténtalo nuevamente.</p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
