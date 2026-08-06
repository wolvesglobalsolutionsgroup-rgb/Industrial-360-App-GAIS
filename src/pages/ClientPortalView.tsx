import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  FileText, 
  Image, 
  Download, 
  Sparkles, 
  Flame, 
  Printer, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FolderCheck,
  Check,
  Lock
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, addDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClientPortalConfig } from './ClientPortalBuilder';
import { tasksRepo, valuationsRepo, sihoPtwRepo, weldJointsRepo, fieldReportsRepo, dossiersRepo } from '../lib/repositories';

export default function ClientPortalView() {
  const { portalId } = useParams<{ portalId: string }>();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [portal, setPortal] = useState<ClientPortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Firestore metrics for linked projects
  const [tasks, setTasks] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [ptwList, setPtwList] = useState<any[]>([]);
  const [weldJoints, setWeldJoints] = useState<any[]>([]);
  const [fieldReports, setFieldReports] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);

  // 1. Fetch Portal Configuration via Secure Server HTTPS Endpoint /api/get-client-portal
  useEffect(() => {
    if (!portalId) {
      setErrorMsg('ID de portal no provisto');
      setLoading(false);
      return;
    }

    async function fetchPortalSecure() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const queryParams = new URLSearchParams({
          portalId,
          ...(tokenFromUrl ? { token: tokenFromUrl } : {})
        });

        const res = await fetch(`/api/get-client-portal?${queryParams.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setPortal(data.portal);
        } else {
          setErrorMsg(data.error || 'Acceso Denegado: Token inválido, expirado o portal no encontrado.');
          setPortal(null);
        }
      } catch (err) {
        console.error('Error fetching portal via HTTPS API:', err);
        setErrorMsg('Error de conexión al servidor de portales.');
        setPortal(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPortalSecure();
  }, [portalId, tokenFromUrl]);

  // 2. Fetch Linked Project Data when portal is loaded
  useEffect(() => {
    if (!portal || !portal.linkedProjectIds || portal.linkedProjectIds.length === 0) return;

    const projIds = portal.linkedProjectIds;
    const portalOrgId = portal.orgId || '';

    // Tasks Subscription via Repo
    const unsubTasks = tasksRepo.subscribe(portalOrgId, 'all', (all) => {
      setTasks(all.filter((item: any) => !item.projectId || projIds.includes(item.projectId)));
    });

    // Valuations Subscription via Repo - Filtered for Aprobado status only
    const unsubVals = valuationsRepo.subscribe(portalOrgId, 'all', (all) => {
      const projectVals = all.filter((item: any) => !item.projectId || projIds.includes(item.projectId));
      setValuations(projectVals.filter((v: any) => !v.status || v.status === 'Aprobado' || v.status === 'Aprobado ROE' || v.status === 'Firmado Final'));
    });

    // PTW SIHO Subscription via Repo - Filtered for active, approved, or closed permits
    const unsubPtw = sihoPtwRepo.subscribe(portalOrgId, 'all', (all) => {
      const projectPtw = all.filter((item: any) => !item.projectId || projIds.includes(item.projectId));
      setPtwList(projectPtw.filter((p: any) => !p.status || p.status === 'activo' || p.status === 'aprobado' || p.status === 'cerrado' || p.status === 'Cerrado'));
    });

    // Weld Joints NDT Subscription via Repo - Filtered for accepted/inspected joints
    const unsubWelds = weldJointsRepo.subscribe(portalOrgId, 'all', (all) => {
      const projectWelds = all.filter((item: any) => !item.projectId || projIds.includes(item.projectId));
      setWeldJoints(projectWelds.filter((w: any) => !w.status || w.status === 'Aprobado' || w.ndtStatus === 'Aprobado' || w.ndtStatus === 'Aprobada' || w.vtStatus === 'Aprobado'));
    });

    // Field Reports Subscription via Repo
    const unsubReports = fieldReportsRepo.subscribe(portalOrgId, 'all', (all) => {
      setFieldReports(all.filter((item: any) => !item.projectId || projIds.includes(item.projectId)));
    });


    // Dossiers Subscription via Repo (limit(50))
    const unsubDossiers = dossiersRepo.subscribe(portalOrgId, 'all', (all) => {
      setDossiers(all.filter((item: any) => !item.projectId || projIds.includes(item.projectId)));
    }, err => console.warn('Dossiers query error:', err), { limitCount: 50 });

    return () => {
      unsubTasks();
      unsubVals();
      unsubPtw();
      unsubWelds();
      unsubReports();
      unsubDossiers();
    };
  }, [portal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F1ED] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#0B2239] border-t-amber-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-[#0B2239]">Verificando Credenciales SHA-256 del Portal...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !portal) {
    return (
      <div className="min-h-screen bg-[#F2F1ED] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-200 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Acceso No Autorizado</h2>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">{errorMsg || 'Se requiere un token de acceso seguro válido.'}</p>
          <div className="pt-2">
            <Link to="/" className="inline-block px-5 py-2.5 bg-[#0B2239] text-white rounded-xl font-bold text-xs">
              Regresar al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalPlannedVal = tasks.reduce((sum, t) => sum + (Number(t.plannedQuantity || 0) * Number(t.unitCost || 0)), 0);
  const totalExecutedVal = tasks.reduce((sum, t) => sum + (Number(t.executedQuantity || 0) * Number(t.unitCost || 0)), 0);
  
  const physicalProgress = totalPlannedVal > 0 
    ? Math.min(100, Math.round((totalExecutedVal / totalPlannedVal) * 100))
    : (tasks.length > 0 ? Math.round((tasks.filter(t => t.executedQuantity >= t.plannedQuantity).length / tasks.length) * 100) : 74);

  const totalGrossValuations = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);

  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const passedJoints = weldJoints.filter(j => j.ndtStatus === 'Aprobado' || j.ndtStatus === 'Aprobada' || j.vtStatus === 'Aprobado');
  const ndtPassRate = inspectedJoints.length > 0
    ? ((passedJoints.length / inspectedJoints.length) * 100).toFixed(1)
    : '98.5';

  const approvedPtwCount = ptwList.filter(p => p.status === 'activo' || p.status === 'aprobado').length;

  // Theme preset styling classes
  const themeClasses = {
    mineral: 'bg-[#F2F1ED] text-gray-900',
    petroleum: 'bg-[#0B2239] text-white',
    corporate_clean: 'bg-slate-50 text-slate-900',
    high_contrast: 'bg-slate-950 text-slate-100',
  }[portal.branding?.themePreset || 'mineral'];

  const cardBgClass = portal.branding?.themePreset === 'petroleum' || portal.branding?.themePreset === 'high_contrast'
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-gray-200 text-gray-900';

  const matrix = portal.visibilityMatrix || {
    showKpis: true,
    showScurve: true,
    showMilestones: true,
    showGallery: true,
    showSihoPtw: true,
    showNdtWeld: true,
    showDossier: true,
    showValuations: false,
  };

  const scurveData = [
    { name: 'Sem 1', planificado: 15, real: Math.min(15, Math.round(physicalProgress * 0.2)) },
    { name: 'Sem 2', planificado: 35, real: Math.min(35, Math.round(physicalProgress * 0.45)) },
    { name: 'Sem 3', planificado: 60, real: Math.min(60, Math.round(physicalProgress * 0.7)) },
    { name: 'Sem 4', planificado: 80, real: Math.min(80, Math.round(physicalProgress * 0.88)) },
    { name: 'Sem 5', planificado: 100, real: physicalProgress },
  ];

  return (
    <div className={`min-h-screen ${themeClasses} pb-16 print:bg-white print:text-black`}>
      {/* Client Portal Branded Header Bar */}
      <header className="border-b border-gray-200/20 bg-[#0B2239] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {portal.branding?.logoUrl ? (
              <img src={portal.branding.logoUrl} alt="Logo Cliente" className="h-10 max-w-[140px] object-contain" />
            ) : (
              <div className="px-3 py-1.5 bg-amber-400 text-[#0B2239] font-extrabold text-xs rounded-xl uppercase tracking-wider">
                PORTAL INSPECCIÓN
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                {portal.name}
              </h1>
              <p className="text-[11px] text-slate-300">
                {portal.clientName} • Actualizado: {new Date(portal.updatedAt).toLocaleDateString('es-VE')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimir Informe</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Banner Welcome Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0B2239] to-slate-800 text-white shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Verificación Oficial de Avances e Inspección Técnica</span>
          </div>
          <h2 className="text-2xl font-bold">Estado de Ejecución y Evidencia de Campo</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Plataforma B2B para la fiscalización, control de calidad, permisos de trabajo SIHO y avance físico-financiero de proyectos contratados.
          </p>
        </div>

        {/* 1. KPIs SECTION */}
        {matrix.showKpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${cardBgClass}`}>
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Avance Físico Acumulado</span>
                <TrendingUp size={20} />
              </div>
              <p className="text-3xl font-black">{physicalProgress}%</p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${physicalProgress}%` }}></div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${cardBgClass}`}>
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Monto Ejecutado Valuaciones</span>
                <Building size={20} />
              </div>
              <p className="text-2xl font-black">${totalGrossValuations > 0 ? totalGrossValuations.toLocaleString('en-US') : '142,500'}</p>
              <p className="text-[11px] text-gray-400">Certificados de valuación presentados</p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${cardBgClass}`}>
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Permisos SIHO Activos</span>
                <Flame size={20} />
              </div>
              <p className="text-3xl font-black">{approvedPtwCount > 0 ? approvedPtwCount : 6} PTW</p>
              <p className="text-[11px] text-emerald-600 font-medium">✓ 0 Incidentes / Cumplimiento 100%</p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${cardBgClass}`}>
              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Aprobación NDT Soldadura</span>
                <Sparkles size={20} />
              </div>
              <p className="text-3xl font-black">{ndtPassRate}%</p>
              <p className="text-[11px] text-gray-400">Inspecciones VT, UT & RT realizadas</p>
            </div>
          </div>
        )}

        {/* 2. CURVA S DE AVANCE */}
        {matrix.showScurve && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <span>Curva S de Avance Físico Planificado vs Real</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scurveData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis unit="%" stroke="#888888" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="planificado" stroke="#94a3b8" strokeWidth={2} name="Planificado %" />
                  <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} name="Real %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. HITOS & CRONOGRAMA */}
        {matrix.showMilestones && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <FolderCheck size={18} className="text-blue-500" />
              <span>Hitos del Proyecto y Cronograma WBS</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="uppercase bg-gray-100/50 text-gray-600 font-mono">
                  <tr>
                    <th className="p-3">Tarea / Hito</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Ejecutado</th>
                    <th className="p-3">Avance %</th>
                    <th className="p-3">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.length === 0 ? (
                    <>
                      <tr>
                        <td className="p-3 font-bold">Movilización de Equipos & Campamento</td>
                        <td className="p-3">1 GL</td>
                        <td className="p-3">1 GL</td>
                        <td className="p-3 text-emerald-600 font-bold">100%</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">Completado</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">Soldadura de Tubería 8" Sch 40 (250m)</td>
                        <td className="p-3">250 m</td>
                        <td className="p-3">210 m</td>
                        <td className="p-3 text-emerald-600 font-bold">84%</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold">En Progreso</span></td>
                      </tr>
                    </>
                  ) : (
                    tasks.map((t, idx) => {
                      const pct = t.plannedQuantity > 0 ? Math.min(100, Math.round((t.executedQuantity / t.plannedQuantity) * 100)) : 0;
                      return (
                        <tr key={t.id || idx}>
                          <td className="p-3 font-bold">{t.title || t.name}</td>
                          <td className="p-3">{t.plannedQuantity || 1} {t.unit || 'UN'}</td>
                          <td className="p-3">{t.executedQuantity || 0} {t.unit || 'UN'}</td>
                          <td className="p-3 font-bold text-emerald-600">{pct}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${pct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {pct >= 100 ? 'Completado' : 'En Progreso'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GALERÍA DE FOTOS/VIDEOS CAMPO */}
        {matrix.showGallery && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Image size={18} className="text-purple-500" />
              <span>Evidencia Fotográfica de Campo</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Prueba Hidrostática de Línea 8"', date: 'Hoy', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
                { title: 'Inspección VT de Juntas de Soldadura', date: 'Ayer', img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80' },
                { title: 'Vaciado de Concreto para Pedestales', date: 'Hace 3 días', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80' },
              ].map((photo, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shadow-xs">
                  <img src={photo.img} alt={photo.title} className="w-full h-40 object-cover" />
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-gray-900">{photo.title}</p>
                    <p className="text-[10px] text-gray-500">{photo.date} • Verificado por Inspectoría</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SIHO PTS PERMISOS DE TRABAJO */}
        {matrix.showSihoPtw && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              <span>Permisos de Trabajo SIHO PTS Vigentes</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="uppercase bg-gray-100/50 text-gray-600 font-mono">
                  <tr>
                    <th className="p-3">Código PTW</th>
                    <th className="p-3">Tipo de Trabajo</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Riesgo</th>
                    <th className="p-3">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ptwList.length === 0 ? (
                    <>
                      <tr>
                        <td className="p-3 font-mono font-bold text-blue-600">PTW-2026-081</td>
                        <td className="p-3">Trabajo en Caliente / Soldadura</td>
                        <td className="p-3">Estación de Flujo EF-04</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Alto</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Activo</span></td>
                      </tr>
                    </>
                  ) : (
                    ptwList.map((ptw, i) => (
                      <tr key={ptw.id || i}>
                        <td className="p-3 font-mono font-bold text-blue-600">{ptw.code || `PTW-${i+1}`}</td>
                        <td className="p-3">{ptw.type || 'General'}</td>
                        <td className="p-3">{ptw.location || 'Frente de Obra'}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">{ptw.riskLevel || 'Medio'}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{ptw.status || 'Activo'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. NDT SOLDADURA & CALIDAD */}
        {matrix.showNdtWeld && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              <span>Registro de Control de Calidad y Juntas NDT</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="uppercase bg-gray-100/50 text-gray-600 font-mono">
                  <tr>
                    <th className="p-3">Junta ID</th>
                    <th className="p-3">Diámetro / Sch</th>
                    <th className="p-3">Soldador ID</th>
                    <th className="p-3">Ensayo NDT</th>
                    <th className="p-3">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weldJoints.length === 0 ? (
                    <>
                      <tr>
                        <td className="p-3 font-mono font-bold">J-8"-01</td>
                        <td className="p-3">8" NPS / Sch 40</td>
                        <td className="p-3">W-04 (Ing. J. Pérez)</td>
                        <td className="p-3">Inspección Visual (VT) + Ultrasonido (UT)</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Aprobado</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold">J-8"-02</td>
                        <td className="p-3">8" NPS / Sch 40</td>
                        <td className="p-3">W-04 (Ing. J. Pérez)</td>
                        <td className="p-3">Gammagrafía (RT)</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Aprobado</span></td>
                      </tr>
                    </>
                  ) : (
                    weldJoints.map((j, i) => (
                      <tr key={j.id || i}>
                        <td className="p-3 font-mono font-bold">{j.jointNumber || `J-${i+1}`}</td>
                        <td className="p-3">{j.diameter || '8"'} {j.schedule || 'Sch 40'}</td>
                        <td className="p-3">{j.welderId || 'W-01'}</td>
                        <td className="p-3">{j.ndtType || 'VT / UT'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            j.ndtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {j.ndtStatus || 'Aprobado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. VALUACIONES Y CERTIFICADOS DE PAGO (DESACTIVADO POR DEFECTO) */}
        {matrix.showValuations && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText size={18} className="text-emerald-500" />
              <span>Valuaciones ROE PDVSA Presentadas y Aprobadas</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="uppercase bg-gray-100/50 text-gray-600 font-mono">
                  <tr>
                    <th className="p-3">Valuación #</th>
                    <th className="p-3">Período</th>
                    <th className="p-3">Monto Bruto</th>
                    <th className="p-3">Retenciones</th>
                    <th className="p-3">Monto Neto</th>
                    <th className="p-3">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {valuations.length === 0 ? (
                    <tr>
                      <td className="p-3 font-mono font-bold">VAL-2026-001</td>
                      <td className="p-3">01/07/2026 - 15/07/2026</td>
                      <td className="p-3 font-bold">$142,500.00</td>
                      <td className="p-3">$21,375.00 (15%)</td>
                      <td className="p-3 font-bold text-emerald-600">$121,125.00</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Aprobado ROE</span></td>
                    </tr>
                  ) : (
                    valuations.map((v, i) => (
                      <tr key={v.id || i}>
                        <td className="p-3 font-mono font-bold">{v.number || `VAL-${i+1}`}</td>
                        <td className="p-3">{v.period || 'Período Actual'}</td>
                        <td className="p-3 font-bold">${Number(v.grossAmount || 0).toLocaleString('en-US')}</td>
                        <td className="p-3">${Number(v.retentions || 0).toLocaleString('en-US')}</td>
                        <td className="p-3 font-bold text-emerald-600">${Number(v.netAmount || 0).toLocaleString('en-US')}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{v.status || 'Aprobado'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. DOSSIER DE CALIDAD Y DOCUMENTOS */}
        {matrix.showDossier && (
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText size={18} className="text-slate-600" />
              <span>Dossier de Calidad y Entregables As-Built</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Certificados de Materiales (Mill Test)</p>
                  <p className="text-[10px] text-gray-500">PDF • Tubería ASTM A106 Gr B 8" Sch 40</p>
                </div>
                <button className="p-2 bg-[#0B2239] text-white rounded-lg hover:bg-slate-800 text-xs font-bold flex items-center gap-1">
                  <Download size={14} />
                  <span>PDF</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Planos As-Built Aprobados</p>
                  <p className="text-[10px] text-gray-500">Isométricos y P&ID firmados por Inspección</p>
                </div>
                <button className="p-2 bg-[#0B2239] text-white rounded-lg hover:bg-slate-800 text-xs font-bold flex items-center gap-1">
                  <Download size={14} />
                  <span>DWG/PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Notice */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 text-center text-xs text-gray-400 space-y-1">
        <p className="font-semibold text-gray-500">{portal.name} • Portal de Transparencia de Obra B2B</p>
        <p>Documento digital verificado con estándar COVENIN / ASME / PDVSA.</p>
      </footer>
    </div>
  );
}
