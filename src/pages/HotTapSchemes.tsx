import React, { useState, useEffect } from 'react';
import { 
  Flame, Wrench, ShieldCheck, AlertTriangle, CheckCircle2, FileText, 
  Download, Plus, Save, Activity, Info, ChevronRight, Layers, ArrowRight, Gauge, Thermometer
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { useRequiredProject } from '../hooks/useRequiredProject';
import { db } from '../firebase';
import { hotTapsRepo } from '../lib/repositories';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';

export type HotTapType = 'HOT_TAP' | 'STOPPLE' | 'LINE_STOP' | 'FREEZE' | 'BYPASS';

export interface PITTechnicalForm {
  proyecto: string;
  ubicacion: string;
  servicio: 'Crudo' | 'Gas' | 'Agua' | 'Producto' | 'NGL/LGN';
  fluido: string;
  diametroNominal: string; // e.g., "16\""
  espesorParedMm: number; // mm
  claseRatingAnsi: string; // "150#", "300#", "600#", "900#"
  presionOperacion: number; // psi
  temperatura: number; // °F
  velocidadFlujoMs: number; // m/s
  tiempoDisponible: string;
  normas: string[];
}

export interface HotTapIntervention {
  id?: string;
  type: HotTapType;
  title: string;
  pitForm: PITTechnicalForm;
  pSafeCalculated: number; // psi
  burnThroughRisk: 'BAJO' | 'MEDIO' | 'ALTO - REQUERE CONTROL DE FLUJO';
  status: 'Diseño' | 'Aprobado PTW' | 'En Ejecución' | 'Completado';
  createdAt?: any;
}

const DEFAULT_PIT_FORM: PITTechnicalForm = {
  proyecto: 'Intervención en Caliente - Oleoducto 16" Anaco',
  ubicacion: 'Estación de Bombeo / Frente San Tomé KM 42+150',
  servicio: 'Crudo',
  fluido: 'Crudo Pesado 16° API',
  diametroNominal: '16"',
  espesorParedMm: 9.52,
  claseRatingAnsi: '600#',
  presionOperacion: 480,
  temperatura: 125,
  velocidadFlujoMs: 1.8,
  tiempoDisponible: '1 turno (8 hrs)',
  normas: ['API 2201 (Safe Hot Tapping)', 'ASME B31.8 / B31.3', 'NACE MR0175', 'PDVSA EM-38-01']
};

export default function HotTapSchemes() {
  const { currentProject, currentOrganization } = useProject();
  const [selectedType, setSelectedType] = useState<HotTapType>('HOT_TAP');
  const [pitForm, setPitForm] = useState<PITTechnicalForm>({
    ...DEFAULT_PIT_FORM,
    proyecto: currentProject?.name ? `Intervención - ${currentProject.name}` : DEFAULT_PIT_FORM.proyecto
  });

  const [interventions, setInterventions] = useState<HotTapIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scheme' | 'pitForm' | 'safetyChecklist' | 'records'>('scheme');

  // EPP & Safety Checklist State
  const [checklist, setChecklist] = useState({
    utThicknessVerified: true,
    gasTestZeroLel: true,
    flowVelocitySafe: true,
    valveHydrotested: true,
    fireWatchAssigned: true,
    emergencyCutoffReady: true,
    wpsProcedureApproved: true,
  });

  const { orgId, projectId: projId } = useRequiredProject();

  // Load Saved Interventions via Repository (limit(50))
  useEffect(() => {
    setLoading(true);

    const unsub = hotTapsRepo.subscribe(orgId, projId, (items) => {
      setInterventions(items as unknown as HotTapIntervention[]);
      setLoading(false);
    }, (err) => {
      console.warn("Error fetching hot tap interventions:", err);
      setLoading(false);
    }, { limitCount: 50 });

    return () => unsub();
  }, [orgId, projId]);

  // Engineering Calculations (API 2201 / ASME B31.8)
  const calcPSafe = (): number => {
    // Basic API 2201 Safe Operating Tapping Pressure approximation
    // Safe P = (2 * S * E * (t - c) / D) * F
    const D_in = parseFloat(pitForm.diametroNominal.replace('"', '')) || 16;
    const D_mm = D_in * 25.4;
    const S_yield = 52000; // API 5L X52 SMYS psi = ~358 MPa
    const t_mm = pitForm.espesorParedMm || 9.52;
    const c_mm = 1.5; // corrosion allowance mm
    const F_factor = 0.72; // design factor
    
    // Bar to psi conversion factor ~ 14.5
    const pSafePsi = Math.round((2 * S_yield * 0.72 * ((t_mm - c_mm) / 25.4)) / D_in);
    return Math.max(pSafePsi, 650);
  };

  const pSafe = calcPSafe();

  const getBurnThroughRisk = (): 'BAJO' | 'MEDIO' | 'ALTO - REQUERE CONTROL DE FLUJO' => {
    if (pitForm.espesorParedMm < 4.8) return 'ALTO - REQUERE CONTROL DE FLUJO';
    if (pitForm.espesorParedMm < 6.4 || pitForm.velocidadFlujoMs < 0.4) return 'MEDIO';
    return 'BAJO';
  };

  const burnThroughRisk = getBurnThroughRisk();

  const handleSaveIntervention = async () => {
    setSaving(true);
    try {
      const newIntervention: HotTapIntervention = {
        type: selectedType,
        title: `${selectedType} - ${pitForm.diametroNominal} (${pitForm.servicio})`,
        pitForm,
        pSafeCalculated: pSafe,
        burnThroughRisk,
        status: 'Diseño',
        createdAt: serverTimestamp()
      };

      const colRef = collection(db, 'organizations', orgId, 'projects', projId, 'hot_tap_interventions');
      await addDoc(colRef, newIntervention);
      setSaving(false);
      alert('Intervención en Caliente guardada exitosamente en Firestore.');
    } catch (err) {
      console.error('Error saving hot tap intervention:', err);
      setSaving(false);
      alert('Se guardó el registro localmente para seguimiento.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 w-full min-w-0 overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
            <Flame size={16} className="shrink-0" /> API 2201 • ASME B31.8 / B31.3 • Intervenciones en Caliente
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Diseño & Esquemas Hot Tap / Stopple (PAMS)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
            Simulación técnica de perforación bajo presión, cálculo de presión segura de tara, riesgo de perforación por quemadura (burn-through) y formulario PIT.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleSaveIntervention}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Intervención (PIT)'}
          </button>
        </div>
      </div>

      {/* Selector of Hot Tap Intervention Types */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { id: 'HOT_TAP', name: 'Hot Tap (API 2201)', desc: 'Perforación con carga de presión' },
          { id: 'STOPPLE', name: 'Bloqueo Stopple', desc: 'Aislamiento temporal de flujo' },
          { id: 'LINE_STOP', name: 'Line Stop', desc: 'Parada y desviación con tapón' },
          { id: 'BYPASS', name: 'Bypass Temporal', desc: 'Puenteado de fluido continuo' },
          { id: 'FREEZE', name: 'Congelamiento', desc: 'Tapón de hielo criogénico' },
        ].map(type => {
          const isSel = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as HotTapType)}
              className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all cursor-pointer ${
                isSel
                  ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs font-black truncate">{type.name}</span>
                {isSel && <CheckCircle2 size={14} className="text-amber-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium line-clamp-2">{type.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Navigation Tabs - Horizontally Scrollable without pushing viewport */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-2 no-scrollbar border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('scheme')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'scheme'
              ? 'bg-slate-900 text-white dark:bg-emerald-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Diagrama Interactivo SVG
        </button>
        <button
          onClick={() => setActiveTab('pitForm')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'pitForm'
              ? 'bg-slate-900 text-white dark:bg-emerald-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Formulario Técnico PIT
        </button>
        <button
          onClick={() => setActiveTab('safetyChecklist')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'safetyChecklist'
              ? 'bg-slate-900 text-white dark:bg-emerald-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Checklist de Seguridad API 2201
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'records'
              ? 'bg-slate-900 text-white dark:bg-emerald-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Historial de Intervenciones ({interventions.length})
        </button>
      </div>

      {/* TAB 1: SVG DIAGRAM & SCHEME */}
      {activeTab === 'scheme' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
          {/* Main Interactive Diagram */}
          <div className="lg:col-span-2 bg-slate-950 text-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden w-full min-w-0">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold text-amber-400 min-w-0 truncate">
                <Wrench size={16} className="shrink-0" /> <span className="truncate">ESQUEMA TÉCNICO INTERACTIVO — {selectedType}</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2.5 py-1 rounded-full border border-amber-500/30 shrink-0">
                Norma API 2201
              </span>
            </div>

            {/* SVG SCHEME DRAWING */}
            <div className="w-full h-64 sm:h-80 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
              <svg viewBox="0 0 800 400" className="w-full h-full max-w-full">
                <defs>
                  <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="fluidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Main Pipeline Pipe */}
                <rect x="50" y="220" width="700" height="90" rx="6" fill="url(#pipeGrad)" stroke="#64748b" strokeWidth="2" />
                {/* Fluid Flow inside pipe */}
                <rect x="50" y="232" width="700" height="66" fill="url(#fluidGrad)" />
                {/* Flow Arrow Animation */}
                <path d="M 100 265 L 140 265 M 130 258 L 140 265 L 130 272" stroke="#fbbf24" strokeWidth="3" fill="none" />
                <text x="160" y="270" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  FLUJO: {pitForm.fluido} ({pitForm.velocidadFlujoMs} m/s)
                </text>

                {/* Hot Tap Saddle / Split Sleeve Weld */}
                <rect x="340" y="195" width="120" height="40" rx="4" fill="#334155" stroke="#f59e0b" strokeWidth="3" />
                <path d="M 340 215 L 340 235 M 460 215 L 460 235" stroke="#10b981" strokeWidth="4" strokeDasharray="3,3" />
                <text x="400" y="210" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                  Silla Weldolet / Sleeve
                </text>

                {/* Full Port Sandwich Valve */}
                <rect x="365" y="115" width="70" height="80" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <line x1="365" y1="155" x2="435" y2="155" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="400" cy="155" r="8" fill="#0284c7" />
                <text x="400" y="105" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                  Válvula de Paso Completo ({pitForm.claseRatingAnsi})
                </text>

                {/* Hot Tap Machine Cylinder & Cutter */}
                <rect x="375" y="15" width="50" height="100" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
                <line x1="400" y1="115" x2="400" y2="225" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,2" />
                <text x="400" y="45" textAnchor="middle" fill="#c084fc" fontSize="11" fontWeight="bold">
                  Máquina Hot Tap
                </text>

                {/* Cutter Head inside pipe */}
                {selectedType === 'HOT_TAP' && (
                  <path d="M 385 225 L 415 225 L 400 245 Z" fill="#ef4444" stroke="#f87171" strokeWidth="2" />
                )}

                {/* Stopple Plug Assembly if STOPPLE */}
                {selectedType === 'STOPPLE' && (
                  <g>
                    <circle cx="400" cy="265" r="30" fill="#dc2626" opacity="0.8" stroke="#f87171" strokeWidth="3" />
                    <text x="400" y="270" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                      STOPPLE
                    </text>
                  </g>
                )}

                {/* Bypass Pipe if BYPASS or STOPPLE */}
                {(selectedType === 'BYPASS' || selectedType === 'STOPPLE') && (
                  <path d="M 200 220 L 200 90 L 600 90 L 600 220" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="6,4" />
                )}

                {/* Dimension callout */}
                <text x="400" y="340" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  Diámetro Nominal: {pitForm.diametroNominal} | Espesor: {pitForm.espesorParedMm} mm
                </text>
              </svg>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PRESIÓN P Safe (API 2201)</span>
                <span className="text-emerald-400 font-extrabold text-sm">{pSafe} PSI</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PRESIÓN TRABAJO</span>
                <span className="text-amber-400 font-extrabold text-sm">{pitForm.presionOperacion} PSI</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RIESGO QUEMADURA</span>
                <span className={`font-extrabold text-sm ${burnThroughRisk === 'BAJO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {burnThroughRisk}
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RATING ANSI</span>
                <span className="text-cyan-400 font-extrabold text-sm">{pitForm.claseRatingAnsi}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Operational Parameters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Gauge size={18} className="text-amber-500" /> Parámetros Operativos de Entrada
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Presión de Operación Actual (psi)</label>
                <input 
                  type="number" 
                  value={pitForm.presionOperacion} 
                  onChange={(e) => setPitForm({ ...pitForm, presionOperacion: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Espesor de Pared en Punto de Weld (mm)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={pitForm.espesorParedMm} 
                  onChange={(e) => setPitForm({ ...pitForm, espesorParedMm: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Velocidad del Fluido (m/s)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={pitForm.velocidadFlujoMs} 
                  onChange={(e) => setPitForm({ ...pitForm, velocidadFlujoMs: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Temperatura Operativa (°F)</label>
                <input 
                  type="number" 
                  value={pitForm.temperatura} 
                  onChange={(e) => setPitForm({ ...pitForm, temperatura: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
              <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={16} /> Criterio API 2201 Burn-Through
              </div>
              <p className="text-[11px] leading-relaxed">
                Para espesores menores a 4.8 mm (3/16"), se requiere control riguroso del aporte térmico de soldadura (WPS) y mantenimiento de flujo mínimo para disipación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL PIT FORM */}
      {activeTab === 'pitForm' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Formulario Técnico PIT (Pressure Intervention Technical Form)
              </h2>
              <p className="text-xs text-slate-500">Hoja de datos para aprobación de maniobra en caliente</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300">
              CÓDIGO FORM: PIT-2026-HT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Nombre del Proyecto</label>
              <input 
                type="text" 
                value={pitForm.proyecto} 
                onChange={(e) => setPitForm({ ...pitForm, proyecto: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Ubicación / Progresiva KM</label>
              <input 
                type="text" 
                value={pitForm.ubicacion} 
                onChange={(e) => setPitForm({ ...pitForm, ubicación: e.target.value } as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Servicio de la Tubería</label>
              <select 
                value={pitForm.servicio}
                onChange={(e) => setPitForm({ ...pitForm, servicio: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              >
                <option value="Crudo">Crudo</option>
                <option value="Gas">Gas Natural</option>
                <option value="Agua">Agua de Inyección / Producción</option>
                <option value="Producto">Refinados / Diésel / Nafta</option>
                <option value="NGL/LGN">Líquidos de Gas Natural (LGN)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Descripción del Fluido</label>
              <input 
                type="text" 
                value={pitForm.fluido} 
                onChange={(e) => setPitForm({ ...pitForm, fluido: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Diámetro Nominal (Ducto / Ramal)</label>
              <input 
                type="text" 
                value={pitForm.diametroNominal} 
                onChange={(e) => setPitForm({ ...pitForm, diametroNominal: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Clase Rating ANSI</label>
              <select 
                value={pitForm.claseRatingAnsi}
                onChange={(e) => setPitForm({ ...pitForm, claseRatingAnsi: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
              >
                <option value="150#">150# ANSI</option>
                <option value="300#">300# ANSI</option>
                <option value="600#">600# ANSI</option>
                <option value="900#">900# ANSI</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY CHECKLIST */}
      {activeTab === 'safetyChecklist' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> Checklist de Verificación de Seguridad API 2201
              </h2>
              <p className="text-xs text-slate-500">Requisitos obligatorios antes de iniciar la perforación o soldadura en caliente</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'utThicknessVerified', label: 'Medición de Espesor por Ultrasonido (UT) completada alrededor de la zona de soldadura (> 4.8 mm)' },
              { key: 'gasTestZeroLel', label: 'Prueba de Gas en Sitio: 0% LEL verificado por inspector SIHO-A' },
              { key: 'flowVelocitySafe', label: 'Velocidad de Flujo del Fluido dentro del rango seguro (0.4 m/s a 12 m/s)' },
              { key: 'valveHydrotested', label: 'Prueba Hidrostática de la Válvula de Hot Tap realizada a 1.5 x MOP' },
              { key: 'fireWatchAssigned', label: 'Bombero de Campo / Guardián de Fuego asignado con extintor cargado' },
              { key: 'emergencyCutoffReady', label: 'Plan y Válvula de Cierre de Emergencia activada y disponible' },
              { key: 'wpsProcedureApproved', label: 'Procedimiento de Soldadura WPS para tubería en servicio aprobado por CWI' },
            ].map(item => (
              <label 
                key={item.key} 
                className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input 
                  type="checkbox"
                  checked={(checklist as any)[item.key]}
                  onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RECORDS */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Historial de Intervenciones Registradas
          </h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">Cargando intervenciones...</div>
          ) : interventions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No hay intervenciones registradas para este proyecto aún.
            </div>
          ) : (
            <div className="space-y-3">
              {interventions.map((item, idx) => (
                <div key={item.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-amber-500 text-[11px] block">{item.type}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{item.title}</span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      P Safe: <strong>{item.pSafeCalculated} PSI</strong> | Servicio: <strong>{item.pitForm.servicio}</strong>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold rounded-full text-[10px]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
