import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2, ShieldAlert, 
  Trash2, Copy, Check, Filter, Search, ArrowRight, Eye, Layers, Lock, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { 
  getSyncCenterOperations, 
  SyncCenterOperation, 
  flushOutbox, 
  retryOperation, 
  resolveConflictKeepLocal, 
  resolveConflictKeepRemote, 
  resolveConflictMerge, 
  discardOperation, 
  cleanupExpiredSyncLogs,
  useOfflineStatus,
  isBrowserOnline
} from '../lib/offline/syncEngine';
import { clearLocalDrafts } from '../lib/offline/outbox';
import PageHeader from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

type FilterStatus = 'ALL' | 'pending' | 'syncing' | 'synced' | 'duplicate' | 'conflict-blocked' | 'failed' | 'denied';

export default function SyncCenter() {
  const { currentOrganization, currentProject } = useProject();
  const { isOnline, isSyncing, triggerSync } = useOfflineStatus();

  const [operations, setOperations] = useState<SyncCenterOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de resolución de conflicto y Diff
  const [diffOp, setDiffOp] = useState<SyncCenterOperation | null>(null);
  const [mergedFields, setMergedFields] = useState<Record<string, any>>({});
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const orgId = currentOrganization?.id || '';
  const projectId = currentProject?.id || '';

  const loadOperations = useCallback(async () => {
    setLoading(true);
    try {
      const ops = await getSyncCenterOperations(orgId, projectId);
      setOperations(ops);
    } catch (err) {
      console.error('[SyncCenter] Error cargando operaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId]);

  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 5000);
    return () => clearInterval(interval);
  }, [loadOperations]);

  const handleManualFlush = async () => {
    await triggerSync(orgId, projectId);
    await loadOperations();
    showToast('Sincronización de cola ejecutada exitosamente.');
  };

  const handleCleanHistory = async () => {
    const count = await cleanupExpiredSyncLogs();
    await loadOperations();
    showToast(`Se limpiaron ${count} registros de historial antiguos (>30 días).`);
  };

  const handleClearDrafts = async () => {
    if (window.confirm('¿Está seguro de eliminar los borradores locales no vinculados a la cola outbox?')) {
      await clearLocalDrafts();
      await loadOperations();
      showToast('Borradores locales limpiados.');
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = async (opId: string) => {
    await retryOperation(opId, orgId, projectId);
    await loadOperations();
    showToast(`Reintento iniciado para la operación ${opId.substring(0, 8)}...`);
  };

  const handleDiscard = async (opId: string) => {
    if (window.confirm(`¿Confirma eliminar la operación ${opId} de la cola offline?`)) {
      await discardOperation(opId);
      await loadOperations();
      showToast('Operación descartada de la cola outbox.');
    }
  };

  const handleKeepLocal = async (opId: string) => {
    await resolveConflictKeepLocal(opId, orgId, projectId);
    setDiffOp(null);
    await loadOperations();
    showToast('Conflicto resuelto conservando la versión local.');
  };

  const handleKeepRemote = async (opId: string) => {
    await resolveConflictKeepRemote(opId);
    setDiffOp(null);
    await loadOperations();
    showToast('Conflicto resuelto conservando la versión del servidor.');
  };

  const handleSaveMerge = async () => {
    if (!diffOp) return;
    await resolveConflictMerge(diffOp.operationId, mergedFields, orgId, projectId);
    setDiffOp(null);
    setIsMerging(false);
    await loadOperations();
    showToast('Campos combinados manualmente y re-encolados para sincronización.');
  };

  const openDiffModal = (op: SyncCenterOperation) => {
    setDiffOp(op);
    setMergedFields(op.payload || {});
    setIsMerging(false);
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Conteos
  const counts = {
    pending: operations.filter(o => o.status === 'pending').length,
    syncing: operations.filter(o => o.status === 'syncing').length,
    synced: operations.filter(o => o.status === 'synced').length,
    duplicate: operations.filter(o => o.status === 'duplicate').length,
    blocked: operations.filter(o => o.status === 'conflict-blocked').length,
    failed: operations.filter(o => o.status === 'failed').length,
    denied: operations.filter(o => o.status === 'denied').length,
  };

  // Filtrado
  const filteredOps = operations.filter(op => {
    if (selectedFilter !== 'ALL' && op.status !== selectedFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = op.operationId.toLowerCase().includes(q);
      const matchEntidad = op.entidad.toLowerCase().includes(q);
      const matchMotivo = op.motivoSanitizado.toLowerCase().includes(q);
      const matchDoc = op.docId ? op.docId.toLowerCase().includes(q) : false;
      return matchId || matchEntidad || matchMotivo || matchDoc;
    }
    return true;
  });

  const getStatusBadge = (status: SyncCenterOperation['status']) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"><RefreshCw size={12} className="animate-spin" /> Pendiente</span>;
      case 'syncing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"><RefreshCw size={12} className="animate-spin" /> Transmitiendo</span>;
      case 'synced':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={12} /> Sincronizado</span>;
      case 'duplicate':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"><Copy size={12} /> Idempotente / Duplicado</span>;
      case 'conflict-blocked':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"><ShieldAlert size={12} /> Conflicto Bloqueante</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20"><AlertTriangle size={12} /> Error Red / Reintento</span>;
      case 'denied':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"><Lock size={12} /> Denegado / Permisos</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <PageHeader
        title="Centro de Sincronización & Resolución de Conflictos"
        subtitle="Gestión autoritativa de la cola offline, idempotencia UUID v4, máquina de estados por dominio y resiliencia transaccional."
      />

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
          <CheckCircle2 size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Estado Red</span>
            {isOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500" />}
          </div>
          <p className="text-sm font-extrabold text-ink mt-2">
            {isOnline ? <span className="text-emerald-600 dark:text-emerald-400">Online</span> : <span className="text-rose-600 dark:text-rose-400">Offline</span>}
          </p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Pendientes</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.pending}</p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Transmitiendo</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{counts.syncing}</p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Sincronizados</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{counts.synced + counts.duplicate}</p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Bloqueados</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{counts.blocked}</p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Errores</span>
          <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">{counts.failed}</p>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex flex-col justify-between shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Denegados</span>
          <p className="text-xl font-black text-red-700 dark:text-red-400 mt-1">{counts.denied}</p>
        </div>
      </div>

      {/* Control Actions & Toolbar */}
      <Card className="bg-surface border-border shadow-xs">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualFlush}
              disabled={isSyncing || !isOnline}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 hover:bg-brand-600 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Cola Ahora'}</span>
            </button>

            <button
              onClick={handleCleanHistory}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Purga de registros sincronizados más antiguos a 30 días"
            >
              <Trash2 size={13} />
              <span>Limpiar Histórico (&gt;30d)</span>
            </button>

            <button
              onClick={handleClearDrafts}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <FileText size={13} />
              <span>Limpiar Borradores</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID, entidad o error..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border text-xs font-bold">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-brand-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos ({operations.length})
        </button>
        <button
          onClick={() => setSelectedFilter('pending')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pendientes ({counts.pending})
        </button>
        <button
          onClick={() => setSelectedFilter('syncing')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'syncing'
              ? 'bg-blue-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Transmitiendo ({counts.syncing})
        </button>
        <button
          onClick={() => setSelectedFilter('conflict-blocked')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'conflict-blocked'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Conflicto Bloqueante ({counts.blocked})
        </button>
        <button
          onClick={() => setSelectedFilter('failed')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'failed'
              ? 'bg-orange-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Errores ({counts.failed})
        </button>
        <button
          onClick={() => setSelectedFilter('denied')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'denied'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Denegados ({counts.denied})
        </button>
        <button
          onClick={() => setSelectedFilter('synced')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'synced'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Sincronizados ({counts.synced})
        </button>
        <button
          onClick={() => setSelectedFilter('duplicate')}
          className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
            selectedFilter === 'duplicate'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Duplicados ({counts.duplicate})
        </button>
      </div>

      {/* Operations List / Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-500" />
          <span>Cargando estado de la cola y registros de sincronización...</span>
        </div>
      ) : filteredOps.length === 0 ? (
        <Card className="bg-surface border-border text-center py-12">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
          <h4 className="text-sm font-extrabold text-ink">Sin operaciones registradas</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            No existen operaciones pendientes o registradas que coincidan con los criterios de filtro seleccionados.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOps.map((op) => (
            <Card key={op.id} className="bg-surface border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(op.status)}
                    <span className="font-mono text-xs font-black text-ink">{op.entidad}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {op.operationType}
                    </span>
                    {op.conflictStrategy === 'BLOCKING' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        BLOQUEANTE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Momento: {new Date(op.momento).toLocaleString()}</span>
                    {op.retries > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        (Reintentos: {op.retries})
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* UUID & Entity */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Operation ID (UUID v4)</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono font-bold text-brand-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-border truncate max-w-[220px]">
                        {op.operationId}
                      </code>
                      <button
                        onClick={() => handleCopyId(op.operationId)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                        title="Copiar UUID"
                      >
                        {copiedId === op.operationId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Sanitized Reason */}
                  <div className="md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Diagnóstico / Motivo Sanitizado</span>
                    <p className="text-xs text-ink bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-border">
                      {op.motivoSanitizado}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {op.docId ? <span>Target Doc: <strong className="text-ink">{op.docId}</strong></span> : <span>Nuevo documento</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {op.isOutboxItem && (op.status === 'failed' || op.status === 'pending' || op.status === 'denied') && (
                      <button
                        onClick={() => handleRetry(op.operationId)}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        <span>Reintentar</span>
                      </button>
                    )}

                    {op.isOutboxItem && (op.status === 'conflict-blocked' || op.status === 'failed') && (
                      <button
                        onClick={() => openDiffModal(op)}
                        className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-extrabold hover:bg-brand-600 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Eye size={12} />
                        <span>Resolver Conflicto / Diff</span>
                      </button>
                    )}

                    {op.isOutboxItem && (
                      <button
                        onClick={() => handleDiscard(op.operationId)}
                        className="px-2.5 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Descartar de la cola outbox"
                      >
                        <Trash2 size={12} />
                        <span>Descartar</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diff & Resolution Modal */}
      {diffOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-500" />
                <h3 className="text-sm font-extrabold text-ink">
                  Resolución de Conflicto — {diffOp.entidad}
                </h3>
              </div>
              <button
                onClick={() => setDiffOp(null)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {diffOp.conflictStrategy === 'BLOCKING' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <Lock size={14} />
                    <span>Integridad de Entidad Crítica (BLOCKING)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Esta entidad (PTW, Valuación, Asistencia, QA/QC o Sello) requiere validación autoritativa. La resolución manual debe ser justificada y aprobada según el rol asignado.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Motivo del Bloqueo</span>
                <p className="text-xs text-ink font-mono">{diffOp.motivoSanitizado}</p>
              </div>

              {/* Payload Comparison / Diff */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-ink">Comparación de Campos (Payload Local vs Servidor)</span>
                  <button
                    onClick={() => setIsMerging(!isMerging)}
                    className="text-xs font-bold text-brand-500 hover:underline cursor-pointer"
                  >
                    {isMerging ? 'Cancelar Edición Manual' : 'Editar Campos Manualmente'}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(diffOp.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {isMerging && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block">
                    Edición de Campos Combinados (Merge Manual)
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Modifique directamente el objeto JSON antes de re-encolar la transmisión.
                  </p>
                  <textarea
                    rows={6}
                    value={JSON.stringify(mergedFields, null, 2)}
                    onChange={(e) => {
                      try {
                        setMergedFields(JSON.parse(e.target.value));
                      } catch (err) {
                        // permit parsing error during live edit
                        console.debug('[SyncCenter] live JSON parse error while typing', err);
                      }
                    }}
                    className="w-full p-2 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-border focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleKeepRemote(diffOp.operationId)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Mantener Servidor (Descartar Local)
              </button>

              <div className="flex items-center gap-2">
                {isMerging ? (
                  <button
                    onClick={handleSaveMerge}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                  >
                    Guardar Combinación & Re-encolar
                  </button>
                ) : (
                  <button
                    onClick={() => handleKeepLocal(diffOp.operationId)}
                    className="px-4 py-2 bg-brand-500 text-white rounded-xl font-extrabold hover:bg-brand-600 transition-all shadow-xs cursor-pointer"
                  >
                    Mantener Local (Forzar Sobreescritura)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
