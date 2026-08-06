import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, ArrowLeft, AlertTriangle, CheckCircle2, Info, 
  Bell, RefreshCw, Filter, Calendar, ShieldAlert
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { alertsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';

interface AlertDoc {
  id: string;
  title?: string;
  message?: string;
  description?: string;
  type?: string;
  category?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info' | string;
  nivel?: string;
  status?: 'active' | 'resolved' | 'acknowledged' | string;
  estado?: string;
  createdAt?: any;
  date?: string;
  timestamp?: any;
  source?: string;
  module?: string;
}

export default function AlertsDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const alertIdParam = searchParams.get('alertId') || searchParams.get('id');
  const severityFilter = searchParams.get('severity');

  const { currentOrganization, currentProject } = useProject();
  const orgId = currentOrganization?.id;
  const projId = currentProject?.id;

  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !projId || projId === 'all') {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubAlerts = alertsRepo.subscribe(orgId, projId, (items) => {
      setAlerts(items as AlertDoc[]);
      setLoading(false);
    }, (err) => {
      setError(`Error al cargar el centro de alertas (${err.code || err.message})`);
      setLoading(false);
    }, { limitCount: 50 });

    return () => unsubAlerts();
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
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Centro de Alertas</h1>
            <p className="text-xs text-muted">Gestión de riesgos, desviación operacional y seguridad</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Contexto Requerido</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Selecciona una organización y un proyecto específico para acceder al registro de alertas.
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
        <p className="text-sm text-muted font-medium">Cargando alertas del proyecto desde Firestore...</p>
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
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Centro de Alertas</h1>
            <p className="text-xs text-muted">Gestión de riesgos, desviación operacional y seguridad</p>
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
  if (alerts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Centro de Alertas</h1>
            <p className="text-xs text-muted">Gestión de riesgos, desviación operacional y seguridad</p>
          </div>
        </header>

        <div className="bg-surface p-10 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Sin Alertas Registradas</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No se han registrado desviaciones ni alertas de evento en el proyecto ({currentProject?.name || projId}).
          </p>
        </div>
      </motion.div>
    );
  }

  // Filter logic
  const filteredAlerts = alerts.filter((a) => {
    if (!severityFilter) return true;
    const sev = (a.severity || a.nivel || 'low').toLowerCase();
    return sev === severityFilter.toLowerCase();
  });

  // Calculate Metrics
  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => {
    const s = (a.severity || a.nivel || '').toLowerCase();
    return s === 'critical' || s === 'high' || s === 'alta' || s === 'critica';
  }).length;
  const activeCount = alerts.filter((a) => {
    const st = (a.status || a.estado || 'active').toLowerCase();
    return st === 'active' || st === 'pendiente';
  }).length;

  const getSeverityBadge = (sevRaw?: string) => {
    const s = (sevRaw || 'low').toLowerCase();
    if (s === 'critical' || s === 'critica') {
      return { label: 'Crítica', bg: 'bg-red-50 text-red-700 border-red-200', icon: ShieldAlert };
    }
    if (s === 'high' || s === 'alta') {
      return { label: 'Alta', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
    }
    if (s === 'medium' || s === 'media') {
      return { label: 'Media', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle };
    }
    return { label: 'Informativa', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Centro de Alertas</h1>
            <p className="text-xs text-muted">Monitor de riesgos, desviaciones de costo/tiempo y hallazgos HSE</p>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl text-xs">
          <Filter size={14} className="text-muted" />
          <select
            value={severityFilter || 'ALL'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'ALL') setSearchParams({});
              else setSearchParams({ severity: val });
            }}
            className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="critical">Críticas</option>
            <option value="high">Altas</option>
            <option value="medium">Medias</option>
            <option value="low">Bajas / Info</option>
          </select>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Total Alertas Emitidas</span>
            <div className="p-2 bg-surface-2 text-ink rounded-xl">
              <Bell size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-ink font-mono">{totalCount}</p>
          <p className="text-[11px] text-muted">Histórico registrado en el proyecto</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Severidad Alta / Crítica</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600 font-mono">{criticalCount}</p>
          <p className="text-[11px] text-muted">Requieren acción prioritaria</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Alertas Activas / Pendientes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">{activeCount}</p>
          <p className="text-[11px] text-muted">En proceso de atención</p>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-surface p-6 rounded-2xl border border-line space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <span>Listado de Alertas del Proyecto</span>
          </h2>
          <span className="text-[11px] font-mono text-muted">{filteredAlerts.length} visibles</span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted border border-dashed border-line rounded-xl">
            No existen alertas registradas bajo el filtro de severidad seleccionado.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const badge = getSeverityBadge(alert.severity || alert.nivel);
              const BadgeIcon = badge.icon;
              const title = alert.title || alert.type || `Alerta #${alert.id.substring(0, 6)}`;
              const description = alert.message || alert.description || 'Sin detalle descriptivo proporcionado.';
              const sourceModule = alert.source || alert.module || alert.category || 'Sistema General';
              const statusStr = alert.status || alert.estado || 'Activa';
              const dateStr = alert.date || (alert.createdAt?.seconds
                ? new Date(alert.createdAt.seconds * 1000).toLocaleString('es-VE')
                : 'N/A');

              const isTargeted = alertIdParam === alert.id;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isTargeted
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-surface-2 border-line hover:border-line-hover'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-line text-[10px] font-mono font-medium text-muted">
                        {sourceModule}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {dateStr}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-sans text-[10px] font-semibold ${
                        statusStr.toLowerCase() === 'resolved' || statusStr.toLowerCase() === 'resuelta'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-surface border border-line text-ink'
                      }`}>
                        {statusStr}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-ink">{title}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

