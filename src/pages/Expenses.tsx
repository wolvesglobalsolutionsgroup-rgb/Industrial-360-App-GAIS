import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where, collectionGroup
} from 'firebase/firestore';
import { db, getAuthUser, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { expensesRepo } from '../lib/repositories';

import { 
  Plus, Search, DollarSign, TrendingUp, Camera, Upload, Download, Edit2, Trash2, 
  FileText, Loader2, Calendar, Package, Users, Wrench, Building2, Car, Truck, 
  ShieldCheck, Receipt, Sparkles, CheckCircle2, Clock, AlertTriangle, Tag
} from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';
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

export interface ExpenseItem {
  id: string;
  vendor: string;
  invoiceNumber?: string;
  date: string;
  amount: number;
  category: string;
  wbsItem?: string;
  description?: string;
  status: 'aprobado' | 'pendiente' | 'rechazado';
  ownerId?: string;
  createdAt?: string;
}

export const EXPENSE_CATEGORIES = [
  { id: 'materiales', label: 'Materiales', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'mano_obra', label: 'Mano de Obra', icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'equipos', label: 'Equipos & Maquinaria', icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'subcontratos', label: 'Subcontratos', icon: Building2, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'viaticos', label: 'Viáticos & Campo', icon: Car, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'transporte', label: 'Transporte & Flete', icon: Truck, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'servicios', label: 'Servicios Técnicos', icon: FileText, color: 'text-rose-500 bg-rose-500/10' },
  { id: 'seguridad', label: 'Seguridad Industrial', icon: ShieldCheck, color: 'text-teal-500 bg-teal-500/10' },
  { id: 'generales', label: 'Gastos Generales', icon: DollarSign, color: 'text-slate-500 bg-slate-500/10' },
];

export default function Expenses() {
  const { currentProject, currentOrganization, projects } = useProject();
  const orgId = currentOrganization?.id || '';
  const targetProjectId = (currentProject && currentProject.id !== 'all')
    ? currentProject.id
    : (projects.find(p => p.id && p.id !== 'all')?.id || '');

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);

  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [form, setForm] = useState({
    vendor: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'materiales',
    wbsItem: '',
    description: '',
    status: 'aprobado' as 'aprobado' | 'pendiente' | 'rechazado'
  });

  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const scanCameraInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Firestore expenses
  useEffect(() => {
    setIsLoading(true);
    const projId = currentProject?.id || 'all';
    const unsubscribe = expensesRepo.subscribe(orgId, projId, (exps: any) => {
      setExpenses(exps);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject, orgId]);

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.wbsItem?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || exp.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Metrics
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthSpent = expenses
    .filter(e => e.date?.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const pendingExpensesCount = expenses.filter(e => e.status === 'pendiente').length;

  // Category with highest total
  const categorySums: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || 'generales';
    categorySums[cat] = (categorySums[cat] || 0) + Number(e.amount || 0);
  });
  const topCategoryKey = Object.keys(categorySums).sort((a, b) => categorySums[b] - categorySums[a])[0];
  const topCategoryObj = EXPENSE_CATEGORIES.find(c => c.id === topCategoryKey);

  // Modal Handlers
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setForm({
      vendor: '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'materiales',
      wbsItem: '',
      description: '',
      status: 'aprobado'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setForm({
      vendor: expense.vendor || '',
      invoiceNumber: expense.invoiceNumber || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      amount: expense.amount !== undefined ? String(expense.amount) : '',
      category: expense.category || 'materiales',
      wbsItem: expense.wbsItem || '',
      description: expense.description || '',
      status: expense.status || 'aprobado'
    });
    setIsModalOpen(true);
  };

  // Save Expense (Create / Edit)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId || targetProjectId === 'all') {
      alert('Debe seleccionar un proyecto específico antes de registrar o modificar gastos.');
      return;
    }
    const user = getAuthUser();
    setIsSubmitting(true);

    const expenseData = {
      vendor: form.vendor,
      invoiceNumber: form.invoiceNumber,
      date: form.date,
      amount: Number(form.amount || 0),
      category: form.category,
      wbsItem: form.wbsItem,
      description: form.description,
      status: form.status,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingExpense) {
        await expensesRepo.update(orgId, targetProjectId, editingExpense.id, expenseData);
      } else {
        await expensesRepo.create(orgId, targetProjectId, {
          ...expenseData,
          ownerId: user?.uid || 'anonymous',
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setIsScanModalOpen(false);
      setScanPreviewUrl(null);
    } catch (error) {
      handleFirestoreError(error, editingExpense ? OperationType.UPDATE : OperationType.CREATE, 'expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string, vendor: string) => {
    if (!targetProjectId || targetProjectId === 'all') {
      alert('Debe seleccionar un proyecto específico antes de eliminar gastos.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el registro de gasto de "${vendor}"?`)) {
      try {
        await expensesRepo.delete(orgId, targetProjectId, id);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
      }
    }
  };

  // OCR Receipt Scan with Gemini AI
  const handleScanFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScanPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    try {
      // Base64 string for Gemini inlineData
      const base64Data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => {
          const b64 = (r.result as string).split(',')[1];
          resolve(b64);
        };
        r.readAsDataURL(file);
      });

      const prompt = `Analiza esta factura o comprobante fiscal de compra/gasto para obra industrial.
      Extrae los datos en formato JSON estricto con las siguientes llaves:
      {
        "vendor": "Nombre comercial del proveedor o comercio",
        "invoiceNumber": "Número de factura o control fiscal si existe",
        "date": "Fecha en formato YYYY-MM-DD",
        "amount": monto total numérico sin símbolos,
        "description": "Detalle o concepto breve de los artículos comprados",
        "category": "Elegir exactamente una categoría de estas opciones: materiales, mano_obra, equipos, subcontratos, viaticos, transporte, servicios, seguridad, generales",
        "wbsItem": "Partida WBS estimada si es deducible (ej. WBS 1.2, WBS 3.1) o dejar vacío"
      }
      Devuelve SOLO el objeto JSON sin marcas markdown ni texto adicional.`;

      const response = await callGeminiProxy({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg'
            }
          },
          prompt
        ]
      });

      const jsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const extracted = JSON.parse(jsonText);

      // Populate form state with extracted values
      setEditingExpense(null);
      setForm({
        vendor: extracted.vendor || 'Proveedor Desconocido',
        invoiceNumber: extracted.invoiceNumber || '',
        date: extracted.date || new Date().toISOString().split('T')[0],
        amount: extracted.amount !== undefined ? String(extracted.amount) : '0',
        category: extracted.category && EXPENSE_CATEGORIES.some(c => c.id === extracted.category) 
          ? extracted.category 
          : 'materiales',
        wbsItem: extracted.wbsItem || '',
        description: extracted.description || 'Gasto escaneado por IA',
        status: 'aprobado'
      });

      // Close scan modal and open verify/save modal
      setIsScanModalOpen(false);
      setIsModalOpen(true);

    } catch (error) {
      console.error("Error al escanear factura con Gemini:", error);
      alert("No se pudo extraer la información de la imagen. Por favor completa los campos manualmente.");
      handleOpenCreate();
    } finally {
      setIsScanning(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    const headers = ['Fecha', 'Proveedor', 'N° Factura', 'Categoría', 'Partida WBS', 'Monto ($)', 'Estado', 'Descripción'];
    const rows = filteredExpenses.map(exp => [
      `"${exp.date || ''}"`,
      `"${exp.vendor || ''}"`,
      `"${exp.invoiceNumber || ''}"`,
      `"${EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || exp.category}"`,
      `"${exp.wbsItem || ''}"`,
      exp.amount || 0,
      `"${exp.status || 'aprobado'}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos_obra_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Status badge map
  const getBadgeStatus = (statusStr: string) => {
    if (statusStr === 'aprobado') return 'terminada';
    if (statusStr === 'pendiente') return 'planificada';
    if (statusStr === 'rechazado') return 'bloqueada';
    return 'planificada';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden Scanner File & Camera Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={scanFileInputRef}
        onChange={handleScanFileUpload}
      />
      <input 
        type="file" 
        accept="image/*"
        capture="environment" 
        className="hidden" 
        ref={scanCameraInputRef}
        onChange={handleScanFileUpload}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display">
            Control de Costos & Gastos
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Registro, categorización según norma PDVSA L-STC-001 y escaneo inteligente de facturas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            leftIcon={<Download size={16} />}
          >
            Exportar CSV
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsScanModalOpen(true)}
            leftIcon={<Camera size={16} className="text-brand-500" />}
          >
            Escanear Factura
          </Button>

          <Button 
            variant="primary" 
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus size={18} />}
          >
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Acumulado"
          value={`$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel={`${expenses.length} registros totales`}
          icon={<DollarSign size={22} />}
          accentColor="amber"
        />
        <MetricCard
          title="Gasto del Mes"
          value={`$${monthSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="Período actual YYYY-MM"
          icon={<TrendingUp size={22} />}
          accentColor="emerald"
        />
        <MetricCard
          title="Categoría Mayor"
          value={topCategoryObj?.label || 'Materiales'}
          sublabel={topCategoryKey ? `$${(categorySums[topCategoryKey] || 0).toLocaleString('en-US')} asignados` : 'Sin registros'}
          icon={<Tag size={22} />}
          accentColor="indigo"
        />
        <MetricCard
          title="Pendientes Revisión"
          value={pendingExpensesCount}
          sublabel="Facturas por aprobar"
          icon={<Clock size={22} />}
          accentColor="rose"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-line">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por proveedor, N° factura, WBS o concepto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas las Categorías</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={40} className="text-brand-500" />}
          title={searchQuery || selectedCategory !== 'all' ? "No hay gastos con los filtros aplicados" : "No hay gastos registrados"}
          description={searchQuery ? "Intenta modificar los criterios de búsqueda o limpia los filtros." : "Escanea tu primera factura fiscal o registra un comprobante de gasto manualmente."}
          actionLabel="Registrar Primer Gasto"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor / Comercio</TableHead>
              <TableHead>Categoría PDVSA</TableHead>
              <TableHead>Partida WBS</TableHead>
              <TableHead className="text-right">Monto ($)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const categoryObj = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                const IconComponent = categoryObj?.icon || DollarSign;

                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-mono text-xs text-ink-soft whitespace-nowrap">
                      {expense.date}
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="font-bold text-ink block text-sm">{expense.vendor}</span>
                        {expense.invoiceNumber && (
                          <span className="text-[11px] font-mono text-ink-faint">Fact: {expense.invoiceNumber}</span>
                        )}
                        {expense.description && (
                          <p className="text-xs text-ink-soft line-clamp-1 mt-0.5">{expense.description}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg ${categoryObj?.color || 'text-slate-500 bg-slate-500/10'}`}>
                          <IconComponent size={14} />
                        </span>
                        <span className="text-xs font-medium text-ink">
                          {categoryObj?.label || expense.category}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs font-bold text-brand-500">
                      {expense.wbsItem || 'Gasto General'}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-ink tabular">
                      ${(expense.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={getBadgeStatus(expense.status)} size="sm" />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 rounded-lg cursor-pointer transition-colors"
                          title="Editar Gasto"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.vendor)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Eliminar Gasto"
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

      {/* SCANNER MODAL */}
      <Dialog
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Escaneo Inteligente de Facturas (OCR AI)"
        description="Sube una foto de recibo o factura fiscal. Gemini AI extraerá automáticamente proveedor, monto, fecha y categoría."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div 
            onClick={() => scanFileInputRef.current?.click()}
            className="border-2 border-dashed border-line hover:border-brand-500 rounded-2xl p-8 text-center bg-surface-2/50 hover:bg-surface-2 transition-all cursor-pointer group"
          >
            {scanPreviewUrl ? (
              <div className="space-y-3">
                <img src={scanPreviewUrl} alt="Factura cargada" className="max-h-60 mx-auto rounded-xl shadow-md border border-line" />
                <p className="text-xs text-ink-soft">Haz clic para seleccionar otra imagen</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl brand-gradient text-white flex items-center justify-center shadow-brand group-hover:scale-105 transition-transform">
                  <Upload size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Haz clic para subir imagen de comprobante</p>
                  <p className="text-xs text-ink-soft mt-1">Soporta formatos JPG, PNG, WEBP (hasta 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center gap-3 animate-pulse">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs font-bold font-display">Analizando estructura fiscal de la factura con Gemini AI...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsScanModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => scanFileInputRef.current?.click()}
              isLoading={isScanning}
              leftIcon={<Upload size={16} />}
            >
              Seleccionar Archivo
            </Button>
            <Button
              variant="primary"
              onClick={() => scanCameraInputRef.current?.click()}
              isLoading={isScanning}
              leftIcon={<Camera size={16} />}
            >
              Tomar Foto con Cámara
            </Button>
          </div>
        </div>
      </Dialog>

      {/* CREATE & EDIT EXPENSE FORM MODAL */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Editar Registro de Gasto" : "Registrar Nuevo Gasto de Obra"}
        description="Ingresa los datos contractuales del comprobante o factura fiscal"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proveedor / Comercio"
              required
              placeholder="Ej: Materiales & Ferretería Industrial C.A."
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />

            <Input
              label="N° Factura / Control Fiscal"
              placeholder="Ej: FACT-2026-0982"
              value={form.invoiceNumber}
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Fecha del Comprobante"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              leftIcon={<Calendar size={16} />}
            />

            <Input
              label="Monto Total ($)"
              type="number"
              step="0.01"
              required
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              leftIcon={<DollarSign size={16} />}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
                Categoría (PDVSA L-STC)
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2.5 px-3 bg-surface-2 border border-line rounded-2xl text-xs sm:text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Partida WBS Asociada"
              placeholder="Ej: WBS 1.2.3 — Tubería 12 pulgadas"
              value={form.wbsItem}
              onChange={(e) => setForm({ ...form, wbsItem: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
                Estado del Comprobante
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full py-2.5 px-3 bg-surface-2 border border-line rounded-2xl text-xs sm:text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              >
                <option value="aprobado">Aprobado / Contabilizado</option>
                <option value="pendiente">Pendiente de Revisión</option>
                <option value="rechazado">Rechazado / Observado</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
              Descripción / Concepto del Gasto
            </label>
            <textarea
              rows={3}
              placeholder="Detalle de insumos comprados, especificaciones o motivo del gasto..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 bg-surface-2 border border-line rounded-2xl text-xs sm:text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
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
              {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

