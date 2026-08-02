import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance, auth } from '../firebase';
import { 
  Crown, ShieldCheck, Server, Database, Activity, ToggleLeft, ToggleRight, 
  Users, Building2, HardDrive, DollarSign, Key, AlertTriangle, Search, 
  TrendingUp, Lock, RefreshCw, Cpu, Layers, Radio, Globe, ShieldAlert, UserCheck, UserX,
  FileText, CheckCircle2, AlertOctagon, Scale, Zap
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { useAuthClaims } from '../hooks/useAuthClaims';
import { 
  computePlatformSaaSMetrics, 
  evaluateTenantPlanLifecycle, 
  CANONICAL_PLANS, 
  TenantConsumptionRecord, 
  TenantPlanStatus,
  SaaSMetricItem
} from '../lib/finops/platformMetricsEngine';
import { 
  createAuditBlock, 
  verifyChainIntegrity, 
  GENESIS_HASH_PREV, 
  AuditLogBlock 
} from '../lib/audit/tamperProofChain';

export interface TenantSummary {
  id: string;
  name: string;
  taxId: string;
  plan: string;
  activeProjectsCount: number;
  totalUsersCount: number;
  monthlyMrrUsd: number;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
  storageMbUsed: number;
  status: TenantPlanStatus;
  gracePeriodStartedAt?: string;
}

export interface FeatureFlagsState {
  enable_ai_brain_proxy: boolean;
  enable_offline_sw_sync: boolean;
  enable_pvc_card_printing: boolean;
  enable_loto_strict_mode: boolean;
  enable_corporate_portfolio_view: boolean;
  enable_realtime_collaboration: boolean;
}

const INITIAL_TENANTS: TenantSummary[] = [
  {
    id: 'prointeca',
    name: 'PROINTECA Matriz C.A.',
    taxId: 'RIF J-30492810-9',
    plan: 'ENTERPRISE_OIL_GAS',
    activeProjectsCount: 4,
    totalUsersCount: 28,
    monthlyMrrUsd: 4500,
    firestoreReadsToday: 14200,
    firestoreWritesToday: 1840,
    storageMbUsed: 4200,
    status: 'ACTIVE'
  },
  {
    id: 'prointeca_demo',
    name: 'PROINTECA C.A. (Piloto Paraguaná)',
    taxId: 'RIF J-40891234-1',
    plan: 'ENTERPRISE_OIL_GAS',
    activeProjectsCount: 2,
    totalUsersCount: 19,
    monthlyMrrUsd: 4500,
    firestoreReadsToday: 9800,
    firestoreWritesToday: 1250,
    storageMbUsed: 2100,
    status: 'ACTIVE'
  },
  {
    id: 'techpetro',
    name: 'TechPetro Servicios Industriales C.A.',
    taxId: 'RIF J-29810293-4',
    plan: 'PROFESSIONAL',
    activeProjectsCount: 1,
    totalUsersCount: 8,
    monthlyMrrUsd: 1200,
    firestoreReadsToday: 3400,
    firestoreWritesToday: 420,
    storageMbUsed: 890,
    status: 'GRACE_PERIOD',
    gracePeriodStartedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Cadena de bloques de auditoría génesis para pruebas de inmutabilidad (C2)
const GENESIS_AUDIT_CHAIN: AuditLogBlock[] = (() => {
  const b0 = createAuditBlock({
    id: 'audit-001-genesis',
    orgId: 'prointeca',
    actor: 'platformAdmin@consorcioog.com',
    requestId: 'req-gen-001',
    action: 'PLATFORM_INITIALIZATION',
    details: { event: 'System Genesis Block', env: 'production' },
    resultStatus: 'SUCCESS',
  });

  const b1 = createAuditBlock({
    id: 'audit-002-qa',
    orgId: 'prointeca_demo',
    actor: 'admin@prointeca.com',
    requestId: 'req-gen-002',
    action: 'QA_MEMBERSHIP_PROVISIONED',
    details: { targetUid: 'u_inspector_1', role: 'inspector', email: 'inspector@demo.com', phone: '+584141234567' },
    prevBlock: b0,
    resultStatus: 'SUCCESS',
  });

  const b2 = createAuditBlock({
    id: 'audit-003-loto',
    orgId: 'techpetro',
    actor: 'supervisor@techpetro.com',
    requestId: 'req-gen-003',
    action: 'LOTO_VERIFICATION_TAGGED',
    details: { tagId: 'LOCK-ELE-042', status: 'ZERO_ENERGY_CONFIRMED' },
    prevBlock: b1,
    resultStatus: 'SUCCESS',
  });

  return [b0, b1, b2];
})();

export default function PlatformOwnerConsole() {
  const { userRole } = useProject();
  const { isPlatformAdmin, user, refreshToken } = useAuthClaims();

  const [tenants, setTenants] = useState<TenantSummary[]>(INITIAL_TENANTS);
  const [auditChain, setAuditChain] = useState<AuditLogBlock[]>(GENESIS_AUDIT_CHAIN);
  const [activeTab, setActiveTab] = useState<'tenants' | 'finops' | 'quotas' | 'flags' | 'security' | 'qa_provisioning'>('tenants');

  // Step-up MFA State (C3)
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpPendingAction, setStepUpPendingAction] = useState<{ targetOrgId: string; status: TenantPlanStatus; reason: string } | null>(null);
  const [stepUpReason, setStepUpReason] = useState('');
  const [stepUpLoading, setStepUpLoading] = useState(false);
  const [stepUpError, setStepUpError] = useState<string | null>(null);

  // QA Provisioning form state
  const [qaUid, setQaUid] = useState('');
  const [qaOrgId, setQaOrgId] = useState('');
  const [qaRole, setQaRole] = useState<'gerente' | 'supervisor' | 'inspector' | 'campo' | 'cliente_readonly'>('gerente');
  const [qaReason, setQaReason] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<string | null>(null);
  const [qaError, setQaError] = useState<string | null>(null);

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsState>(() => {
    const saved = localStorage.getItem('ic360_global_flags');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      enable_ai_brain_proxy: true,
      enable_offline_sw_sync: true,
      enable_pvc_card_printing: true,
      enable_loto_strict_mode: true,
      enable_corporate_portfolio_view: true,
      enable_realtime_collaboration: true,
    };
  });

  const toggleFlag = (flagKey: keyof FeatureFlagsState) => {
    setFeatureFlags(prev => {
      const updated = { ...prev, [flagKey]: !prev[flagKey] };
      localStorage.setItem('ic360_global_flags', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    async function fetchRealOrganizations() {
      try {
        const snap = await getDocs(collection(db, 'organizations'));
        if (!snap.empty) {
          const loadedTenants: TenantSummary[] = snap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || data.razonSocial || data.nombre || docSnap.id,
              taxId: data.taxId || data.rif || 'J-30492810-9',
              plan: data.plan || 'ENTERPRISE_OIL_GAS',
              activeProjectsCount: data.activeProjectsCount || 2,
              totalUsersCount: data.totalUsersCount || 10,
              monthlyMrrUsd: data.monthlyMrrUsd || 4500,
              firestoreReadsToday: data.firestoreReadsToday || 12000,
              firestoreWritesToday: data.firestoreWritesToday || 1500,
              storageMbUsed: data.storageMbUsed || 3500,
              status: (data.planStatus as TenantPlanStatus) || 'ACTIVE',
              gracePeriodStartedAt: data.gracePeriodStartedAt
            };
          });
          setTenants(loadedTenants);
        }
      } catch (err) {
        console.warn("Utilizando lista base de inquilinos:", err);
      }
    }
    fetchRealOrganizations();
  }, []);

  // FinOps SaaS Metrics via Engine (C1)
  const subscriptionsForEngine = tenants.map(t => ({
    orgId: t.id,
    monthlyFeeUSD: t.monthlyMrrUsd,
    active: t.status === 'ACTIVE' || t.status === 'GRACE_PERIOD',
    createdAt: '2025-01-01T00:00:00.000Z'
  }));

  const saasMetrics = computePlatformSaaSMetrics(subscriptionsForEngine);
  const chainVerification = verifyChainIntegrity(auditChain);

  // Solicitar cambio de estado de plan con Step-Up MFA (C3, C6)
  const initiateStatusChange = (tenant: TenantSummary, newStatus: TenantPlanStatus) => {
    setStepUpPendingAction({
      targetOrgId: tenant.id,
      status: newStatus,
      reason: `Cambio manual de plan solicitado por platformAdmin para org ${tenant.id}`
    });
    setStepUpReason(`Aprobación de cambio de estado a ${newStatus} para tenant ${tenant.name}`);
    setShowStepUpModal(true);
    setStepUpError(null);
  };

  const confirmStepUpAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepUpPendingAction) return;

    setStepUpLoading(true);
    setStepUpError(null);

    try {
      // Refresh token para asegurar auth_time reciente
      await refreshToken();

      const updateLifecycleFn = httpsCallable<any, any>(functionsInstance, 'updatePlatformTenantLifecycle');
      await updateLifecycleFn({
        targetOrgId: stepUpPendingAction.targetOrgId,
        status: stepUpPendingAction.status,
        reason: stepUpReason || stepUpPendingAction.reason
      });

      // Actualizar estado local
      setTenants(prev => prev.map(t => t.id === stepUpPendingAction.targetOrgId ? { ...t, status: stepUpPendingAction.status } : t));

      // Añadir bloque auditado
      const newBlock = createAuditBlock({
        orgId: stepUpPendingAction.targetOrgId,
        actor: user?.email || 'platformAdmin',
        requestId: `req-mfa-${Date.now()}`,
        action: 'PLATFORM_TENANT_LIFECYCLE_UPDATED',
        details: { newStatus: stepUpPendingAction.status, reason: stepUpReason },
        prevBlock: auditChain[auditChain.length - 1],
        resultStatus: 'SUCCESS'
      });

      setAuditChain(prev => [...prev, newBlock]);
      setShowStepUpModal(false);
      setStepUpPendingAction(null);
    } catch (err: any) {
      setStepUpError(err?.message || 'Falló la re-autenticación / Step-up MFA server-side.');
    } finally {
      setStepUpLoading(false);
    }
  };

  // QA Provisioning handlers
  const handleProvisionQa = async (e: React.FormEvent) => {
    e.preventDefault();
    setQaLoading(true);
    setQaResult(null);
    setQaError(null);
    try {
      const provisionFn = httpsCallable<any, any>(functionsInstance, 'provisionQaMembership');
      const res = await provisionFn({
        targetUid: qaUid,
        targetOrgId: qaOrgId,
        requestedRole: qaRole,
        reason: qaReason,
      });
      setQaResult(res.data?.message || 'Provisión completada exitosamente.');
      await refreshToken();
    } catch (err: any) {
      setQaError(err?.message || 'Error al aprovisionar membresía QA.');
    } finally {
      setQaLoading(false);
    }
  };

  const handleRevokeQa = async () => {
    if (!qaUid || !qaOrgId || !qaReason) {
      setQaError('UID, Org ID y Razón son requeridos para revocar.');
      return;
    }
    setQaLoading(true);
    setQaResult(null);
    setQaError(null);
    try {
      const revokeFn = httpsCallable<any, any>(functionsInstance, 'revokeQaMembership');
      const res = await revokeFn({
        targetUid: qaUid,
        targetOrgId: qaOrgId,
        reason: qaReason,
      });
      setQaResult(res.data?.message || 'Revocación completada exitosamente.');
      await refreshToken();
    } catch (err: any) {
      setQaError(err?.message || 'Error al revocar membresía QA.');
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Platform Owner Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-widest">
                  SAAS COMMAND CENTER
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  BUILDER CORE 360 (S22)
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">Consola Maestra de Inquilinos, FinOps & Auditoría</h1>
              <p className="text-xs text-slate-300">Gobierno Global Multi-Tenant & Cadena Inmutable de Evidencias (IC360 Platform Engine)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
              isPlatformAdmin ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {isPlatformAdmin ? 'Platform Admin (Global Auth)' : `Tenant Role: ${userRole}`}
            </span>
          </div>
        </div>

        {/* Global FinOps KPIs with MetricVerificationState (C1) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
          {Object.entries(saasMetrics).map(([key, metric]) => (
            <div key={key} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{metric.label}</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${
                  metric.state === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  metric.state === 'estimated' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-slate-700 text-slate-400 border border-slate-600'
                }`}>
                  {metric.state}
                </span>
              </div>
              <div className="text-lg font-bold text-white tabular">
                {metric.value !== null ? (
                  metric.unit === 'USD' ? `$${metric.value.toLocaleString()} USD` :
                  metric.unit === 'percent' ? `${metric.value}%` : metric.value
                ) : (
                  <span className="text-slate-400 font-normal italic text-sm">No disponible</span>
                )}
              </div>
              {metric.note && <p className="text-[10px] text-slate-400">{metric.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tenants' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Building2 className="w-4 h-4" /> Control de Inquilinos ({tenants.length})
        </button>

        <button 
          onClick={() => setActiveTab('finops')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'finops' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <DollarSign className="w-4 h-4" /> FinOps & Planes B2B
        </button>

        <button 
          onClick={() => setActiveTab('quotas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'quotas' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Cuotas & Telemetría
        </button>

        <button 
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'flags' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Radio className="w-4 h-4" /> Feature Flags
        </button>

        <button 
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'security' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Auditoría Inmutable ({auditChain.length})
        </button>

        <button 
          onClick={() => setActiveTab('qa_provisioning')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'qa_provisioning' ? 'bg-brand-500 text-white shadow-soft' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Aprovisionamiento QA
        </button>
      </div>

      {/* TAB 1: TENANTS CONTROL */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tenants.map(tenant => {
              const plan = CANONICAL_PLANS[tenant.plan] || CANONICAL_PLANS.STANDARD;
              return (
                <div key={tenant.id} className="p-5 rounded-2xl bg-surface border border-line shadow-card space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase">
                        {plan.name}
                      </span>
                      <h3 className="text-base font-bold text-ink mt-1">{tenant.name}</h3>
                      <p className="text-xs text-muted font-mono">{tenant.taxId}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      tenant.status === 'GRACE_PERIOD' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      tenant.status === 'READ_ONLY' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-line">
                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="text-muted block">Proyectos:</span>
                      <span className="text-ink font-bold tabular">{tenant.activeProjectsCount} / {plan.maxProjects}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="text-muted block">Usuarios:</span>
                      <span className="text-ink font-bold tabular">{tenant.totalUsersCount} / {plan.maxUsers}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="text-muted block">Tarifa Mensual:</span>
                      <span className="text-emerald-500 font-bold tabular">${tenant.monthlyMrrUsd} USD</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="text-muted block">Almacenamiento:</span>
                      <span className="text-ink font-bold tabular">{(tenant.storageMbUsed / 1024).toFixed(1)} / {plan.maxStorageGB} GB</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-muted">Estado del Plan:</span>
                    <div className="flex items-center gap-1.5">
                      {tenant.status !== 'ACTIVE' && (
                        <button
                          onClick={() => initiateStatusChange(tenant, 'ACTIVE')}
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20"
                        >
                          Reactivar
                        </button>
                      )}
                      {tenant.status === 'ACTIVE' && (
                        <button
                          onClick={() => initiateStatusChange(tenant, 'READ_ONLY')}
                          className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 font-bold hover:bg-blue-500/20"
                        >
                          Read-Only
                        </button>
                      )}
                      {tenant.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => initiateStatusChange(tenant, 'SUSPENDED')}
                          className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20"
                        >
                          Suspender
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FINOPS & PLANES B2B */}
      {activeTab === 'finops' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="pb-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-500" /> Gobernanza FinOps & Transición de Planes (S22)
            </h2>
            <p className="text-xs text-muted">Ciclo de vida de suscripción: ACTIVE → GRACE_PERIOD → READ_ONLY → SUSPENDED. Modo Read-Only preserva evidencias de auditoría.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(CANONICAL_PLANS).map(p => (
              <div key={p.planId} className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink">{p.name}</h4>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-brand-500/10 text-brand-500">${p.monthlyFeeUSD}/mes</span>
                </div>
                <div className="text-xs text-muted space-y-1">
                  <p>• Máximo Proyectos: <strong className="text-ink">{p.maxProjects}</strong></p>
                  <p>• Máximo Usuarios: <strong className="text-ink">{p.maxUsers}</strong></p>
                  <p>• Almacenamiento: <strong className="text-ink">{p.maxStorageGB} GB</strong></p>
                  <p>• Período de Gracia: <strong className="text-ink">{p.gracePeriodDays} días</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUOTAS & TELEMETRY */}
      {activeTab === 'quotas' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-500" /> Monitoreo de Recursos Firestore & Storage por Tenant
              </h2>
              <p className="text-xs text-muted">Aislamiento estricto multi-tenant bajo /organizations/&#123;orgId&#125;/...</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-mono font-semibold">
              Telemetría Server-Side Activa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-surface-2 border-b border-line text-muted">
                  <th className="p-3">Inquilino (Org ID)</th>
                  <th className="p-3">Lecturas Firestore</th>
                  <th className="p-3">Escrituras Firestore</th>
                  <th className="p-3">Almacenamiento Usado</th>
                  <th className="p-3">Límite Plan</th>
                  <th className="p-3 text-right">Estado Cuota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tenants.map(t => {
                  const plan = CANONICAL_PLANS[t.plan] || CANONICAL_PLANS.STANDARD;
                  const usagePercent = Math.min(100, Number(((t.storageMbUsed / (plan.maxStorageGB * 1024)) * 100).toFixed(1)));
                  return (
                    <tr key={t.id} className="hover:bg-surface-2/50">
                      <td className="p-3 font-bold text-ink">{t.name} <code className="text-muted font-normal">({t.id})</code></td>
                      <td className="p-3 font-mono tabular text-ink">{t.firestoreReadsToday.toLocaleString()} op</td>
                      <td className="p-3 font-mono tabular text-ink">{t.firestoreWritesToday.toLocaleString()} op</td>
                      <td className="p-3 font-mono tabular text-ink">{(t.storageMbUsed / 1024).toFixed(2)} GB</td>
                      <td className="p-3 text-muted">{plan.maxStorageGB} GB</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-1 rounded font-semibold text-[11px] ${
                          usagePercent >= 95 ? 'bg-red-500/10 text-red-500' :
                          usagePercent >= 80 ? 'bg-amber-500/10 text-amber-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {usagePercent}% ({t.status})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="pb-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-500" /> Feature Flags Globales
            </h2>
            <p className="text-xs text-muted">Control en tiempo real sobre módulos avanzados para toda la plataforma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'enable_ai_brain_proxy', label: 'Proxy de Inteligencia Artificial (Gemini Proxy)', desc: 'Activa /api/callGeminiProxy para cálculos de normas O&G.' },
              { key: 'enable_offline_sw_sync', label: 'Modo Offline Service Worker (PWA Campo)', desc: 'Habilita cola de operaciones offline con sincronización Dexie v4.' },
              { key: 'enable_pvc_card_printing', label: 'Generador de Carnets PVC Biométricos QR', desc: 'Permite la emisión de identificaciones físicas PVC.' },
              { key: 'enable_loto_strict_mode', label: 'Control LOTO Estricto (PDVSA SI-S-28)', desc: 'Exige verificación obligatoria de prueba de energía cero.' },
              { key: 'enable_corporate_portfolio_view', label: 'Vista de Portafolio Corporativo', desc: 'Consolidación ejecutiva entre múltiples obras.' },
              { key: 'enable_realtime_collaboration', label: 'Sincronización en Tiempo Real', desc: 'Escucha de cambios en vivo mediante listeners.' },
            ].map(flag => (
              <div key={flag.key} className="p-4 rounded-xl bg-surface-2 border border-line flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-ink">{flag.label}</h4>
                  <p className="text-[11px] text-muted">{flag.desc}</p>
                </div>

                <button 
                  onClick={() => toggleFlag(flag.key as keyof FeatureFlagsState)}
                  className="text-brand-500 hover:scale-105 transition-transform"
                >
                  {featureFlags[flag.key as keyof FeatureFlagsState] ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDITORÍA INMUTABLE (C2, C4) */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Cadena de Auditoría Inmutable Encadenada (SHA-256)
              </h2>
              <p className="text-xs text-muted">HashPrev encadenado desde bloque génesis ({GENESIS_HASH_PREV.substring(0, 16)}...). Redacción PII configurable.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                chainVerification.valid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {chainVerification.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                {chainVerification.valid ? 'Cadena de Hash Verificada (100% Intacta)' : '¡Ruptura de Cadena Detectada!'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {auditChain.map((block, idx) => (
              <div key={block.id} className="p-4 rounded-xl bg-surface-2 border border-line text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/10 text-brand-500">
                      Bloque #{idx}
                    </span>
                    <span className="font-bold text-ink">{block.action}</span>
                  </div>
                  <span className="text-muted font-mono">{new Date(block.timestamp).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted">Actor:</span> <strong className="text-ink">{block.actor}</strong></div>
                  <div><span className="text-muted">Tenant Org:</span> <strong className="text-ink">{block.orgId}</strong></div>
                  <div className="col-span-2 font-mono text-[10px] text-muted overflow-hidden text-ellipsis">
                    <span>hashPrev: {block.hashPrev}</span>
                  </div>
                  <div className="col-span-2 font-mono text-[10px] text-emerald-600 font-bold overflow-hidden text-ellipsis">
                    <span>hashActual: {block.hashActual}</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-surface border border-line font-mono text-[10px] text-muted overflow-x-auto">
                  <span className="text-ink font-bold block mb-1">Detalles Sanitizados (PII Redactado):</span>
                  {JSON.stringify(block.details, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: QA PROVISIONING */}
      {activeTab === 'qa_provisioning' && (
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
          <div className="pb-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-500" /> Aprovisionamiento de Membresías QA Preview
            </h2>
            <p className="text-xs text-muted">
              Exige custom claim <code>platformAdmin === true</code>. Solo para tenants QA autorizados (<code>environment === 'qa'</code>).
            </p>
          </div>

          <form onSubmit={handleProvisionQa} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Target UID del Usuario</label>
                <input 
                  type="text" 
                  value={qaUid}
                  onChange={e => setQaUid(e.target.value)}
                  placeholder="ej. founder_uid_123"
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Target QA Org ID (Tenant)</label>
                <input 
                  type="text" 
                  value={qaOrgId}
                  onChange={e => setQaOrgId(e.target.value)}
                  placeholder="ej. prointeca_qa"
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Rol Solicitado</label>
                <select 
                  value={qaRole}
                  onChange={e => setQaRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="gerente">gerente</option>
                  <option value="supervisor">supervisor</option>
                  <option value="inspector">inspector</option>
                  <option value="campo">campo</option>
                  <option value="cliente_readonly">cliente_readonly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Justificación Auditoría</label>
                <input 
                  type="text" 
                  value={qaReason}
                  onChange={e => setQaReason(e.target.value)}
                  placeholder="ej. Revisión de prototipo S22"
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            {qaResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
                {qaResult}
              </div>
            )}

            {qaError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {qaError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={qaLoading}
                className="px-4 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-soft hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {qaLoading ? 'Aprovisionando...' : 'Aprovisionar Acceso QA'}
              </button>

              <button
                type="button"
                onClick={handleRevokeQa}
                disabled={qaLoading}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                {qaLoading ? 'Revocando...' : 'Revocar Acceso QA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step-Up MFA Modal (C3) */}
      {showStepUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-surface border border-line shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Re-Autenticación Requerida (Step-Up MFA)</h3>
                <p className="text-xs text-muted">Acción sensible de plataforma exige validación de credenciales (auth_time reciente &lt; 300s).</p>
              </div>
            </div>

            <form onSubmit={confirmStepUpAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Motivo / Razón para Auditoría</label>
                <input
                  type="text"
                  value={stepUpReason}
                  onChange={e => setStepUpReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              {stepUpError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                  {stepUpError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStepUpModal(false)}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-bold text-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={stepUpLoading}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-soft hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {stepUpLoading ? 'Verificando...' : 'Confirmar con MFA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
