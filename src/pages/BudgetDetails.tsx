import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, ArrowLeft, Receipt, CreditCard, Calendar, 
  AlertCircle, RefreshCw, Filter, TrendingDown, TrendingUp,
  FileCheck
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface ExpenseDoc {
  id: string;
  concept?: string;
  description?: string;
  title?: string;
  category?: string;
  type?: string;
  amount?: number;
  monto?: number;
  cost?: number;
  currency?: string;
  moneda?: string;
  status?: string;
  date?: string;
  createdAt?: any;
  supplier?: string;
  proveedor?: string;
}

interface ValuationDoc {
  id: string;
  number?: string | number;
  code?: string;
  title?: string;
  amount?: number;
  monto?: number;
  currency?: string;
  moneda?: string;
  status?: string;
  date?: string;
  createdAt?: any;
  period?: string;
}

export default function BudgetDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || searchParams.get('categoryId');
  const typeParam = searchParams.get('type');

  const { currentOrganization, currentProject } = useProject();
  const orgId = currentOrganization?.id;
  const projId = currentProject?.id;

  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [valuations, setValuations] = useState<ValuationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !projId || projId === 'all') {
      setExpenses([]);
      setValuations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const expensesPath = `organizations/${orgId}/projects/${projId}/expenses`;
    const valuationsPath = `organizations/${orgId}/projects/${projId}/valuations`;

    let unsubValuations: (() => void) | null = null;

    const unsubExpenses = onSnapshot(
      collection(db, expensesPath),
      (snapshot) => {
        const eDocs: ExpenseDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setExpenses(eDocs);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, expensesPath);
        setError(`Error al cargar registro de gastos (${err.code || err.message})`);
        setLoading(false);
      }
    );

    unsubValuations = onSnapshot(
      collection(db, valuationsPath),
      (snapshot) => {
        const vDocs: ValuationDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setValuations(vDocs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, valuationsPath);
      }
    );

    return () => {
      unsubExpenses();
      if (unsubValuations) unsubValuations();
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
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Presupuesto</h1>
            <p className="text-xs text-muted">Análisis detallado de la ejecución financiera y valuaciones</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Contexto Requerido</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Selecciona una organización y un proyecto específico para visualizar los costos.
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
        <p className="text-sm text-muted font-medium">Cargando registros financieros y valuaciones desde Firestore...</p>
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
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Presupuesto</h1>
            <p className="text-xs text-muted">Análisis detallado de la ejecución financiera y valuaciones</p>
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

  // Empty State
  if (expenses.length === 0 && valuations.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Presupuesto</h1>
            <p className="text-xs text-muted">Análisis detallado de la ejecución financiera y valuaciones</p>
          </div>
        </header>

        <div className="bg-surface p-10 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-surface-2 text-muted rounded-2xl flex items-center justify-center mx-auto">
            <DollarSign size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Sin Registros Financieros</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No se registraron gastos ni valuaciones de obra en el proyecto ({currentProject?.name || projId}).
          </p>
        </div>
      </motion.div>
    );
  }

  // Filter Categories
  const categories = Array.from(new Set(expenses.map((e) => e.category || e.type || 'General'))).filter(Boolean);

  const filteredExpenses = expenses.filter((e) => {
    if (!categoryParam) return true;
    const cat = e.category || e.type || 'General';
    return cat.toLowerCase() === categoryParam.toLowerCase();
  });

  // Financial Summaries
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount ?? e.monto ?? e.cost ?? 0), 0);
  const totalValuations = valuations.reduce((sum, v) => sum + Number(v.amount ?? v.monto ?? 0), 0);
  const balanceMargin = totalValuations - totalExpenses;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Presupuesto</h1>
            <p className="text-xs text-muted">Auditoría financiera, egresos por categoría y valuaciones de obra</p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl text-xs">
            <Filter size={14} className="text-muted" />
            <select
              value={categoryParam || 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') setSearchParams({});
                else setSearchParams({ category: val });
              }}
              className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Total Gastos Ejecutados</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-ink font-mono">
            ${totalExpenses.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted">{filteredExpenses.length} comprobantes de egreso</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Valuaciones Certificadas</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-ink font-mono">
            ${totalValuations.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted">{valuations.length} valuaciones aprobadas</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Balance de Margen</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <p className={`text-2xl font-extrabold font-mono ${balanceMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${balanceMargin.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted">Diferencia acumulada</p>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-line space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-brand-600" />
              <h2 className="text-sm font-bold text-ink">Egresos / Gastos Registrados</h2>
            </div>
            <span className="text-[11px] font-mono text-muted">{filteredExpenses.length} registros</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted border border-dashed border-line rounded-xl">
              No hay egresos registrados en la categoría seleccionada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-bold">Concepto / Proveedor</th>
                    <th className="pb-2 font-bold">Categoría</th>
                    <th className="pb-2 font-bold">Fecha</th>
                    <th className="pb-2 font-bold text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredExpenses.map((exp) => {
                    const concept = exp.concept || exp.description || exp.title || 'Gasto Operativo';
                    const supplier = exp.supplier || exp.proveedor;
                    const cat = exp.category || exp.type || 'General';
                    const amt = Number(exp.amount ?? exp.monto ?? exp.cost ?? 0);
                    const curr = exp.currency || exp.moneda || 'USD';
                    const dateStr = exp.date || (exp.createdAt?.seconds
                      ? new Date(exp.createdAt.seconds * 1000).toLocaleDateString('es-VE')
                      : 'N/A');

                    return (
                      <tr key={exp.id} className="hover:bg-surface-2 transition-colors">
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-ink">{concept}</p>
                          {supplier && <p className="text-[10px] text-muted">{supplier}</p>}
                        </td>
                        <td className="py-3 pr-2">
                          <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-line text-[10px] font-mono text-muted">
                            {cat}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-muted font-mono text-[11px]">{dateStr}</td>
                        <td className="py-3 text-right font-mono font-bold text-ink">
                          {curr} {amt.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Valuations Panel */}
        <div className="bg-surface p-6 rounded-2xl border border-line space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-ink">Valuaciones de Obra</h2>
            </div>
            <span className="text-[11px] font-mono text-muted">{valuations.length}</span>
          </div>

          {valuations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted border border-dashed border-line rounded-xl">
              No hay valuaciones de obra registradas.
            </div>
          ) : (
            <div className="space-y-3">
              {valuations.map((val) => {
                const code = val.code || (val.number ? `Valuación #${val.number}` : val.id);
                const title = val.title || 'Valuación Periódica de Avance';
                const amt = Number(val.amount ?? val.monto ?? 0);
                const curr = val.currency || val.moneda || 'USD';
                const dateStr = val.date || (val.createdAt?.seconds
                  ? new Date(val.createdAt.seconds * 1000).toLocaleDateString('es-VE')
                  : 'N/A');

                return (
                  <div key={val.id} className="p-4 bg-surface-2 rounded-xl border border-line space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-brand-600">{code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {val.status || 'Aprobada'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink">{title}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-muted">
                      <span>{dateStr}</span>
                      <span className="font-mono font-extrabold text-ink">
                        {curr} {amt.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
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

