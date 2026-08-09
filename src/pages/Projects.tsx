import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc 
} from 'firebase/firestore';
import { db, getAuthUser, handleFirestoreError, OperationType } from '../firebase';
import { projectsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { 
  Plus, Search, Building2, DollarSign, TrendingUp, Edit2, Trash2, CheckCircle2, FileSpreadsheet, Loader2, Calendar, Sparkles 
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { seedDemoData } from '../lib/seedDemoData';
import { DEMO_AUTH_ENABLED } from '../config';
import { PhaseManager } from '../components/projects/PhaseManager';
import {
  MetricCard, 
  Card, 
  Button,
  StatusBadge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  Dialog, 
  Input, 
  Skeleton, 
  EmptyState
} from '../components/ui';

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  advancePercent?: number;
  startDate?: string;
  status?: string;
  ownerId?: string;
}

export default function Projects() {
  const { currentOrganization } = useProject();
  const orgId = currentOrganization?.id || '';
  const projectsPath = `organizations/${orgId}/projects`;

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    const res = await seedDemoData(true);
    setIsSeeding(false);
    setSeedMessage(res.message);
    setTimeout(() => setSeedMessage(null), 5000);
  };

  const [form, setForm] = useState({
    name: '',
    description: '',
    budget: '',
    advancePercent: '0',
    startDate: '',
    status: 'en_campo'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Firestore Projects under Multi-tenant Organization Hierarchy
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const unsubscribe = projectsRepo.subscribe(orgId, 'all', (items) => {
      setProjects(items as unknown as ProjectItem[]);
      setIsLoading(false);
      clearTimeout(timer);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, projectsPath);
      setIsLoading(false);
      clearTimeout(timer);
    }, { limitCount: 50 });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [projectsPath]);

  // Filter projects by search
  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'en_campo' || p.status === 'active' || p.status === 'planificada' || !p.status).length;
  const completedProjects = projects.filter(p => p.status === 'terminada' || p.status === 'completed').length;

  // Modal Control
  const handleOpenCreate = () => {
    setEditingProject(null);
    setForm({
      name: '',
      description: '',
      budget: '',
      advancePercent: '0',
      startDate: new Date().toISOString().split('T')[0],
      status: 'planificada'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setForm({
      name: project.name || '',
      description: project.description || '',
      budget: project.budget !== undefined ? String(project.budget) : '',
      advancePercent: project.advancePercent !== undefined ? String(project.advancePercent) : '0',
      startDate: project.startDate || '',
      status: project.status || 'planificada'
    });
    setIsModalOpen(true);
  };

  // CRUD Actions
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getAuthUser();
    setIsSubmitting(true);

    const projectData = {
      name: form.name,
      description: form.description,
      budget: Number(form.budget || 0),
      advancePercent: Number(form.advancePercent || 0),
      startDate: form.startDate,
      status: form.status,
      orgId,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProject) {
        await updateDoc(doc(db, projectsPath, editingProject.id), projectData);
      } else {
        await addDoc(collection(db, projectsPath), {
          ...projectData,
          ownerId: user?.uid || 'anonymous',
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingProject ? OperationType.UPDATE : OperationType.CREATE, projectsPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el proyecto "${name}"?`)) {
      try {
        await deleteDoc(doc(db, projectsPath, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${projectsPath}/${id}`);
      }
    }
  };

  // Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = getAuthUser();
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return;

      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim();
      });

      const jsonData: Record<string, any>[] = [];
      for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowObj: Record<string, any> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let val: any = cell.value;
            if (val && typeof val === 'object' && 'result' in val) {
              val = val.result;
            } else if (val && typeof val === 'object' && 'text' in val) {
              val = val.text;
            }
            rowObj[header] = val;
          }
        });
        if (Object.keys(rowObj).length > 0) {
          jsonData.push(rowObj);
        }
      }

      let importedCount = 0;

      for (const row of jsonData as any[]) {
        const name = row['Nombre'] || row['name'] || row['Proyecto'] || 'Proyecto Importado';
        const description = row['Descripción'] || row['description'] || row['Detalle'] || '';
        const budget = Number(row['Presupuesto'] || row['budget'] || row['Monto'] || 0);
        const advancePercent = Number(row['Avance'] || row['advancePercent'] || 0);

        let startDate = new Date().toISOString().split('T')[0];
        if (row['Fecha de Inicio'] || row['startDate'] || row['Fecha']) {
          const rawDate = row['Fecha de Inicio'] || row['startDate'] || row['Fecha'];
          if (typeof rawDate === 'number') {
            const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            startDate = date.toISOString().split('T')[0];
          } else if (typeof rawDate === 'string') {
            startDate = rawDate;
          }
        }

        await addDoc(collection(db, projectsPath), {
          name,
          description,
          budget,
          advancePercent,
          startDate,
          status: 'planificada',
          orgId,
          ownerId: user?.uid || 'anonymous',
          createdAt: new Date().toISOString()
        });
        importedCount++;
      }

      alert(`Se importaron ${importedCount} proyectos exitosamente.`);
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert("Hubo un error al importar el archivo Excel. Verifica el formato.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Map database status string to StatusBadge status
  const getBadgeStatus = (statusStr?: string) => {
    if (!statusStr) return 'planificada';
    const lower = statusStr.toLowerCase();
    if (lower === 'active' || lower === 'en_ejecucion' || lower === 'en_campo') return 'en_campo';
    if (lower === 'completed' || lower === 'terminada') return 'terminada';
    if (lower === 'blocked' || lower === 'bloqueada') return 'bloqueada';
    return 'planificada';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleImportExcel}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display">
            Proyectos & Obras
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Gestión del portafolio contractual, presupuestos y control de frentes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DEMO_AUTH_ENABLED && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSeedDemo}
              isLoading={isSeeding}
              leftIcon={<Sparkles size={16} className="text-amber-500" />}
            >
              {isSeeding ? 'Sembrando...' : 'Cargar Obras Demo'}
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()} 
            isLoading={isImporting}
            leftIcon={<FileSpreadsheet size={16} className="text-emerald-500" />}
          >
            {isImporting ? 'Importando...' : 'Importar Excel'}
          </Button>

          <Button 
            variant="primary" 
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus size={18} />}
          >
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Proyectos"
          value={totalProjects}
          sublabel="Obras en catálogo"
          icon={<Building2 size={22} />}
          accentColor="indigo"
        />
        <MetricCard
          title="Presupuesto Total"
          value={`$${totalBudget.toLocaleString('en-US')}`}
          sublabel="Monto acumulado"
          icon={<DollarSign size={22} />}
          accentColor="amber"
        />
        <MetricCard
          title="En Ejecución"
          value={activeProjects}
          sublabel="Obras activas / planificadas"
          icon={<TrendingUp size={22} />}
          accentColor="emerald"
        />
        <MetricCard
          title="Completados"
          value={completedProjects}
          sublabel="Obras entregadas"
          icon={<CheckCircle2 size={22} />}
          accentColor="cyan"
        />
      </div>

      {/* Phase Manager Component (PAMS V/C/D/I/O) */}
      <PhaseManager currentPhase="I" />

      {/* Toolbar & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-3 rounded-2xl border border-line">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción de obra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>
        <div className="text-xs font-bold text-ink-soft self-end sm:self-center">
          Mostrando {filteredProjects.length} de {projects.length} proyectos
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} className="text-brand-500" />}
          title={searchQuery ? "No se encontraron proyectos" : "No hay proyectos registrados"}
          description={searchQuery ? `No hay resultados que coincidan con "${searchQuery}".` : "Crea tu primer proyecto para comenzar a registrar obras, WBS y valuaciones o carga la estructura de prueba."}
          actionLabel="Crear Primer Proyecto"
          onAction={handleOpenCreate}
          secondaryAction={
            DEMO_AUTH_ENABLED ? (
              <Button variant="outline" onClick={handleSeedDemo} isLoading={isSeeding}>
                ⚡ Cargar Obras & Datos Demo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableHead>Nombre del Proyecto</TableHead>
              <TableHead className="text-right">Presupuesto ($)</TableHead>
              <TableHead className="w-48">Avance Físico</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const advance = project.advancePercent || 0;
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <span className="font-bold text-ink block text-sm">{project.name}</span>
                        {project.description && (
                          <span className="text-xs text-ink-soft line-clamp-1 mt-0.5">{project.description}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-ink tabular">
                      ${(project.budget || 0).toLocaleString('en-US')}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono font-bold">
                          <span>{advance}%</span>
                        </div>
                        <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
                          <div 
                            className="bg-brand-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, advance))}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={getBadgeStatus(project.status)} size="sm" />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-ink-soft">
                      {project.startDate || 'Sin fecha'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 rounded-lg cursor-pointer transition-colors"
                          title="Editar Proyecto"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Eliminar Proyecto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* CREATE & EDIT MODAL */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Editar Proyecto" : "Nuevo Proyecto de Obra"}
        description={editingProject ? "Modifica la información contractual del proyecto" : "Registra un nuevo proyecto contractual en el sistema"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input
            label="Nombre de la Obra"
            required
            placeholder="Ej: Ampliación Estación de Gas - Frente Norte"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Descripción del Alcance
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descripción general del alcance técnico y contractual..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Presupuesto Estimado ($)"
              type="number"
              required
              min="0"
              placeholder="0.00"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              leftIcon={<DollarSign size={16} />}
            />

            <Input
              label="Porcentaje de Avance (%)"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={form.advancePercent}
              onChange={(e) => setForm({ ...form, advancePercent: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              leftIcon={<Calendar size={16} />}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Estado Contractual
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              >
                <option value="planificada">Planificada</option>
                <option value="en_campo">En Campo / Activa</option>
                <option value="bloqueada">Bloqueada</option>
                <option value="terminada">Terminada / Entregada</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

