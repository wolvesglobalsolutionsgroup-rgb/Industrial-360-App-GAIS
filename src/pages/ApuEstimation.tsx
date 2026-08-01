import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, Layers, Users, Truck, Package, PieChart, 
  TrendingUp, FileSpreadsheet, Plus, Trash2, Edit2, Download, Upload, 
  CheckCircle2, RefreshCw, FileText, ChevronRight, ShieldCheck, Info
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import QuantityTakeoff from '../components/engineering/QuantityTakeoff';
import { parseBc3File } from '../lib/parsers/bc3Parser';
import { exportApuPresupuestoToXlsx } from '../lib/excelExporter';
import {
  ApuLabor,
  ApuEquipment,
  ApuMaterial,
  ApuItem,
  calculateApuUnitCost,
} from '../lib/engineering/apuCalculator';

export type { ApuLabor, ApuEquipment, ApuMaterial, ApuItem };
export { calculateApuUnitCost };

export const INITIAL_APUS: ApuItem[] = [
  {
    id: 'APU-001',
    code: 'MEC-TUB-16',
    title: 'Tendido, Alineación, Biselado y Soldadura de Tubería de Acero API 5L X52 16" OD x 0.375" WT',
    unit: 'm',
    category: 'Mecánica',
    fcasPercent: 425.8,
    performancePerDay: 40, // 40 metros/día por cuadrilla
    labor: [
      { id: 'l1', category: 'Supervisor Soldadura CWI', count: 1, baseSalaryDailyUsd: 65, cpttBonusesUsd: 25 },
      { id: 'l2', category: 'Soldador 6G ASME Sec. IX', count: 3, baseSalaryDailyUsd: 55, cpttBonusesUsd: 20 },
      { id: 'l3', category: 'Tubero Especialista O&G', count: 2, baseSalaryDailyUsd: 48, cpttBonusesUsd: 18 },
      { id: 'l4', category: 'Obrero de Campo / Ayudante', count: 4, baseSalaryDailyUsd: 28, cpttBonusesUsd: 12 }
    ],
    equipment: [
      { id: 'e1', name: 'Grúa Tendedora Sideboom 50 Ton', hourlyRateActiveUsd: 85, hourlyRateIdleUsd: 35, hoursActive: 8, hoursIdle: 0 },
      { id: 'e2', name: 'Módulo Camión Generador Lincoln Vantage 500A (x2)', hourlyRateActiveUsd: 38, hourlyRateIdleUsd: 15, hoursActive: 8, hoursIdle: 0 }
    ],
    materials: [
      { id: 'm1', description: 'Tubería API 5L PSL2 X52 16" Sch 40 Sin Costura', unit: 'm', unitPriceUsd: 145, wastePercent: 3, quantityPerUnit: 1.03 },
      { id: 'm2', description: 'Electrodos E7018 / E6010 Cellulosic (Caja 20kg)', unit: 'kg', unitPriceUsd: 8.5, wastePercent: 5, quantityPerUnit: 1.2 }
    ],
    indirectsPercent: 12,
    contingencyPercent: 5,
    profitPercent: 15,
    totalDirectCostUsd: 189.4,
    totalUnitCostUsd: 250.0,
    notes: 'Rendimiento basado en norma CPTT para tuberías en zanja con cuadrilla de 10 personas.'
  },
  {
    id: 'APU-002',
    code: 'CIV-EXC-ZANJA',
    title: 'Excavación en Tierra Tipo II con Maquinaria Pesada para Zanja de Oleoducto',
    unit: 'm3',
    category: 'Civil',
    fcasPercent: 425.8,
    performancePerDay: 250, // 250 m3/día
    labor: [
      { id: 'l1', category: 'Capataz de Campo', count: 1, baseSalaryDailyUsd: 45, cpttBonusesUsd: 15 },
      { id: 'l2', category: 'Operador de Excavadora CAT 330', count: 1, baseSalaryDailyUsd: 52, cpttBonusesUsd: 20 },
      { id: 'l3', category: 'Obrero Señalero / Rigging', count: 2, baseSalaryDailyUsd: 28, cpttBonusesUsd: 12 }
    ],
    equipment: [
      { id: 'e1', name: 'Excavadora Hidráulica CAT 330 2.2m3', hourlyRateActiveUsd: 110, hourlyRateIdleUsd: 45, hoursActive: 8, hoursIdle: 0 }
    ],
    materials: [],
    indirectsPercent: 12,
    contingencyPercent: 5,
    profitPercent: 15,
    totalDirectCostUsd: 8.50,
    totalUnitCostUsd: 11.22,
    notes: 'Incluye peinado de paredes de zanja y movimiento lateral a 5 metros.'
  }
];



export default function ApuEstimation() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'apu_list' | 'fcas_calculator' | 'escalation_formulas' | 'takeoffs'>('apu_list');
  const [apusList, setApusList] = useState<ApuItem[]>(INITIAL_APUS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedApuId, setSelectedApuId] = useState<string | null>('APU-001');

  // FCAS Matrix Calculator State
  const [daysWorkedYear, setDaysWorkedYear] = useState<number>(220); // Días laborados efectivos
  const [daysPaidYear, setDaysPaidYear] = useState<number>(365);
  const [vacationBonusDays, setVacationBonusDays] = useState<number>(75);
  const [profitSharingDays, setProfitSharingDays] = useState<number>(120);
  const [severanceDays, setSeveranceDays] = useState<number>(60);
  const [cpttFoodAllowanceUsd, setCpttFoodAllowanceUsd] = useState<number>(12); // Bono alimentación diario
  const [cpttTravelTimeUsd, setCpttTravelTimeUsd] = useState<number>(8); // Tiempo de viaje diario

  // Price Escalation Formula (Fórmula Escalatoria de Reajuste O&G) State
  const [laborWeightA, setLaborWeightA] = useState<number>(0.35); // a: Mano de Obra
  const [equipmentWeightB, setEquipmentWeightB] = useState<number>(0.25); // b: Equipos
  const [materialsWeightC, setMaterialsWeightC] = useState<number>(0.30); // c: Materiales
  const [indirectsWeightD, setIndirectsWeightD] = useState<number>(0.10); // d: Indirectos

  const [laborIndex0, setLaborIndex0] = useState<number>(100);
  const [laborIndexCurrent, setLaborIndexCurrent] = useState<number>(128.5);

  const [equipmentIndex0, setEquipmentIndex0] = useState<number>(100);
  const [equipmentIndexCurrent, setEquipmentIndexCurrent] = useState<number>(115.2);

  const [materialsIndex0, setMaterialsIndex0] = useState<number>(100);
  const [materialsIndexCurrent, setMaterialsIndexCurrent] = useState<number>(132.8);

  const [indirectsIndex0, setIndirectsIndex0] = useState<number>(100);
  const [indirectsIndexCurrent, setIndirectsIndexCurrent] = useState<number>(120.0);

  const [baseValuationUsd, setBaseValuationUsd] = useState<number>(150000);

  // Firestore Synchronization
  useEffect(() => {
    if (!currentProject?.id || !currentProject?.orgId) {
      setLoading(false);
      return;
    }

    const apuRef = collection(db, 'organizations', currentProject.orgId, 'projects', currentProject.id, 'apus');
    const unsubscribe = onSnapshot(apuRef, (snapshot) => {
      const docsData: ApuItem[] = [];
      snapshot.forEach((docSnap) => {
        docsData.push({ id: docSnap.id, ...docSnap.data() } as ApuItem);
      });

      if (docsData.length > 0) {
        setApusList(docsData);
      } else {
        setApusList(INITIAL_APUS);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'APUs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject?.id, currentProject?.orgId]);

  // Selected APU Detailed Calculation
  const selectedApu = apusList.find(a => a.id === selectedApuId) || apusList[0];

  const currentCalc = calculateApuUnitCost(selectedApu);

  // FCAS Calculated Percentage
  const calculatedFcasPercent = (() => {
    // Days ratio factor
    const daysRatio = daysPaidYear / daysWorkedYear; // e.g. 365 / 220 = 1.659
    const benefitsDaysTotal = vacationBonusDays + profitSharingDays + severanceDays; // 75 + 120 + 60 = 255
    const benefitsPercent = (benefitsDaysTotal / daysWorkedYear) * 100; // (255 / 220) * 100 = 115.9%
    const cpttDailyAddonPercent = ((cpttFoodAllowanceUsd + cpttTravelTimeUsd) / 45) * 100; // CPTT additions
    const totalFcas = Math.round(((daysRatio - 1) * 100 + benefitsPercent + cpttDailyAddonPercent + 120) * 10) / 10;
    return totalFcas;
  })();

  // Escalation Adjustment Coefficient K calculation
  const escalationCoefficientK = (() => {
    const kLabor = laborWeightA * (laborIndexCurrent / laborIndex0);
    const kEquip = equipmentWeightB * (equipmentIndexCurrent / equipmentIndex0);
    const kMat = materialsWeightC * (materialsIndexCurrent / materialsIndex0);
    const kInd = indirectsWeightD * (indirectsIndexCurrent / indirectsIndex0);
    const totalK = kLabor + kEquip + kMat + kInd;
    const adjustedAmount = baseValuationUsd * totalK;
    const priceAdjustmentDelta = adjustedAmount - baseValuationUsd;

    return {
      kLabor: Math.round(kLabor * 10000) / 10000,
      kEquip: Math.round(kEquip * 10000) / 10000,
      kMat: Math.round(kMat * 10000) / 10000,
      kInd: Math.round(kInd * 10000) / 10000,
      totalK: Math.round(totalK * 10000) / 10000,
      percentIncrement: Math.round((totalK - 1) * 10000) / 100,
      adjustedAmount: Math.round(adjustedAmount * 100) / 100,
      priceAdjustmentDelta: Math.round(priceAdjustmentDelta * 100) / 100
    };
  })();

  // BC3 File Import Handler
  const handleFileUploadBc3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseBc3File(content);
        if (parsed.length > 0) {
          const newApuItems: ApuItem[] = parsed.map((p, idx) => ({
            id: `BC3-${Date.now()}-${idx}`,
            code: p.code,
            title: p.name,
            unit: p.unit || 'm3',
            category: 'Importado BC3',
            fcasPercent: 425.8,
            performancePerDay: 50,
            labor: [{ id: `l-${idx}`, category: 'Cuadrilla Estándar BC3', count: 1, baseSalaryDailyUsd: 120, cpttBonusesUsd: 30 }],
            equipment: [],
            materials: [],
            indirectsPercent: 12,
            contingencyPercent: 5,
            profitPercent: 15,
            totalDirectCostUsd: Math.round((p.unitCost * 0.75) * 100) / 100,
            totalUnitCostUsd: p.unitCost
          }));

          setApusList(prev => [...newApuItems, ...prev]);
          if (newApuItems[0]?.id) setSelectedApuId(newApuItems[0].id);
          alert(`✅ Éxito: Se importaron ${parsed.length} partidas del archivo FIEBDC-3 (.bc3).`);
        }
      }
    };
    reader.readAsText(file);
  };

  // Export APUs to Excel XLSX
  const handleExportXlsx = () => {
    exportApuPresupuestoToXlsx(
      apusList,
      currentProject?.name || currentProject?.id || 'PROINTECA_PRJ',
      'PROINTECA C.A. / PDVSA'
    );
  };

  // Export APUs to BC3 File Format
  const handleExportBc3 = () => {
    let bc3Text = `~V|FIEBDC-3/2004|PROINTECA APU ESTIMATION ENGINE|3.0||\n`;
    bc3Text += `~K|\\200000\\USD\\1\\0||\n`;

    apusList.forEach(apu => {
      const calc = calculateApuUnitCost(apu);
      bc3Text += `~C|${apu.code}|${apu.unit}|${apu.title}|${calc.totalUnitCost}|${new Date().toISOString().split('T')[0]}|0|\n`;
    });

    const blob = new Blob([bc3Text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Presupuesto_APU_FIEBDC3_${currentProject?.id || 'PRJ'}.bc3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER TITLE BAR */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              <Calculator size={22} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-ink flex items-center gap-2">
                Módulo de Estimación APU, Fórmulas Escalatorias BC3 y Cómputos Métricos
              </h1>
              <p className="text-xs text-ink-soft mt-0.5">
                Análisis de Precios Unitarios en 4 Rubros (Mano de Obra, Equipos, Materiales, Indirectos) acorde a la Convención Colectiva Petrolera CPTT.
              </p>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-2 p-1.5 rounded-xl border border-line text-xs font-semibold">
          <button
            onClick={() => setActiveTab('apu_list')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'apu_list' 
                ? 'bg-amber-600 text-white font-bold shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <DollarSign size={14} />
            Matriz APU
          </button>

          <button
            onClick={() => setActiveTab('fcas_calculator')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fcas_calculator' 
                ? 'bg-amber-600 text-white font-bold shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Users size={14} />
            FCAS / FCO CPTT
          </button>

          <button
            onClick={() => setActiveTab('escalation_formulas')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'escalation_formulas' 
                ? 'bg-amber-600 text-white font-bold shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <TrendingUp size={14} />
            Fórmulas Escalatorias BC3
          </button>

          <button
            onClick={() => setActiveTab('takeoffs')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'takeoffs' 
                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <FileSpreadsheet size={14} />
            Libro Cómputos SIDCON
          </button>
        </div>
      </div>

      {/* TAB 1: ANALISIS DE PRECIOS UNITARIOS (APU) */}
      {activeTab === 'apu_list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* APU LIST SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Layers size={16} className="text-amber-500" />
                Catálogo de APUs ({apusList.length})
              </h3>

              <div className="flex items-center gap-1">
                <label className="p-1.5 rounded-lg bg-surface hover:bg-surface-2 text-ink-soft hover:text-ink border border-line cursor-pointer transition-all" title="Importar BC3">
                  <Upload size={14} />
                  <input type="file" accept=".bc3,.txt" onChange={handleFileUploadBc3} className="hidden" />
                </label>
                
                <button
                  onClick={handleExportXlsx}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 font-bold text-xs"
                  title="Exportar a Excel (.xlsx)"
                >
                  <FileSpreadsheet size={14} />
                  <span>XLSX</span>
                </button>

                <button
                  onClick={handleExportBc3}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-2 text-ink-soft hover:text-ink border border-line transition-all cursor-pointer"
                  title="Exportar a FIEBDC-3 (.bc3)"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {apusList.map((apu) => {
                const calc = calculateApuUnitCost(apu);
                const isSelected = apu.id === selectedApuId;

                return (
                  <div
                    key={apu.id}
                    onClick={() => setSelectedApuId(apu.id || null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500/40 text-ink shadow-sm' 
                        : 'bg-surface-2/60 border-line text-ink-soft hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {apu.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-line font-bold font-mono">
                        {apu.unit}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-ink mt-1 line-clamp-2">{apu.title}</h4>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/50 text-xs">
                      <span className="text-ink-soft font-semibold">Costo Unitario:</span>
                      <span className="font-extrabold text-ink font-mono text-sm">
                        ${calc.totalUnitCost.toLocaleString()} / {apu.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* APU DETAIL & 4 RUBRICS MATRIX (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* APU HEADER DETAIL CARD */}
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      {selectedApu.code}
                    </span>
                    <span className="text-xs font-bold text-ink-soft">
                      Especialidad: {selectedApu.category}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-ink mt-1">{selectedApu.title}</h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-ink-soft block uppercase">Precio Unitario Total</span>
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    ${currentCalc.totalUnitCost.toLocaleString()} / {selectedApu.unit}
                  </span>
                </div>
              </div>

              {/* PERFORMANCE & FCAS KPI BADGES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-surface-2 p-2.5 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Rendimiento Cuadrilla</span>
                  <span className="font-mono font-bold text-ink text-sm mt-0.5 block">
                    {selectedApu.performancePerDay} {selectedApu.unit} / día
                  </span>
                </div>

                <div className="bg-surface-2 p-2.5 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Factor FCAS Petrolero</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 block">
                    {selectedApu.fcasPercent}%
                  </span>
                </div>

                <div className="bg-surface-2 p-2.5 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Costo Directo Unitario</span>
                  <span className="font-mono font-bold text-ink text-sm mt-0.5 block">
                    ${currentCalc.directCost.toLocaleString()} / {selectedApu.unit}
                  </span>
                </div>

                <div className="bg-surface-2 p-2.5 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Indirectos + Utilidad</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    {selectedApu.indirectsPercent + selectedApu.contingencyPercent + selectedApu.profitPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* RUBRO 1: MANO DE OBRA CPTT */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden text-xs">
              <div className="p-3.5 bg-surface-2 border-b border-line flex items-center justify-between">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  1. Mano de Obra (Salarios Base + Recargos CPTT + FCAS {selectedApu.fcasPercent}%)
                </h3>
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                  Subtotal: ${currentCalc.laborPerUnit.toLocaleString()} / {selectedApu.unit}
                </span>
              </div>

              <table className="w-full text-left">
                <thead className="bg-surface-2/60 text-ink-soft font-bold border-b border-line">
                  <tr>
                    <th className="p-2.5">Categoría CPTT</th>
                    <th className="p-2.5 text-center">Cant.</th>
                    <th className="p-2.5 text-right">Salario Base ($/día)</th>
                    <th className="p-2.5 text-right">Bono CPTT ($/día)</th>
                    <th className="p-2.5 text-right">Costo Diario con FCAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {selectedApu.labor.map((l) => {
                    const fcasFactor = 1 + (selectedApu.fcasPercent / 100);
                    const dailyWithFcas = (l.baseSalaryDailyUsd * fcasFactor) + l.cpttBonusesUsd;

                    return (
                      <tr key={l.id} className="hover:bg-surface-2/40">
                        <td className="p-2.5 font-bold text-ink">{l.category}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{l.count}</td>
                        <td className="p-2.5 text-right font-mono">${l.baseSalaryDailyUsd.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">+${l.cpttBonusesUsd.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-ink">${dailyWithFcas.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RUBRO 2: EQUIPOS Y MAQUINARIA */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden text-xs">
              <div className="p-3.5 bg-surface-2 border-b border-line flex items-center justify-between">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Truck size={16} className="text-amber-500" />
                  2. Equipos y Maquinaria Pesada (Costo Horario Operativo)
                </h3>
                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  Subtotal: ${currentCalc.equipPerUnit.toLocaleString()} / {selectedApu.unit}
                </span>
              </div>

              <table className="w-full text-left">
                <thead className="bg-surface-2/60 text-ink-soft font-bold border-b border-line">
                  <tr>
                    <th className="p-2.5">Equipo / Maquinaria</th>
                    <th className="p-2.5 text-right">Tarifa Activo ($/hr)</th>
                    <th className="p-2.5 text-right">Tarifa Standby ($/hr)</th>
                    <th className="p-2.5 text-center">Horas (Act / Standby)</th>
                    <th className="p-2.5 text-right">Costo Diario ($/día)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {selectedApu.equipment.map((e) => {
                    const dailyCost = (e.hourlyRateActiveUsd * e.hoursActive) + (e.hourlyRateIdleUsd * e.hoursIdle);

                    return (
                      <tr key={e.id} className="hover:bg-surface-2/40">
                        <td className="p-2.5 font-bold text-ink">{e.name}</td>
                        <td className="p-2.5 text-right font-mono">${e.hourlyRateActiveUsd.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-ink-soft">${e.hourlyRateIdleUsd.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-mono">{e.hoursActive}h / {e.hoursIdle}h</td>
                        <td className="p-2.5 text-right font-mono font-bold text-ink">${dailyCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RUBRO 3: MATERIALES E INSUMOS */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden text-xs">
              <div className="p-3.5 bg-surface-2 border-b border-line flex items-center justify-between">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Package size={16} className="text-emerald-500" />
                  3. Materiales e Insumos Directos
                </h3>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  Subtotal: ${currentCalc.matPerUnit.toLocaleString()} / {selectedApu.unit}
                </span>
              </div>

              <table className="w-full text-left">
                <thead className="bg-surface-2/60 text-ink-soft font-bold border-b border-line">
                  <tr>
                    <th className="p-2.5">Descripción Material</th>
                    <th className="p-2.5 text-center">Unidad</th>
                    <th className="p-2.5 text-right">Precio Unitario ($)</th>
                    <th className="p-2.5 text-center">Merma %</th>
                    <th className="p-2.5 text-right">Costo Unitario ($/{selectedApu.unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {selectedApu.materials.map((m) => {
                    const wasteFactor = 1 + (m.wastePercent / 100);
                    const costPerApuUnit = m.unitPriceUsd * m.quantityPerUnit * wasteFactor;

                    return (
                      <tr key={m.id} className="hover:bg-surface-2/40">
                        <td className="p-2.5 font-bold text-ink">{m.description}</td>
                        <td className="p-2.5 text-center font-mono">{m.unit}</td>
                        <td className="p-2.5 text-right font-mono">${m.unitPriceUsd.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-mono text-amber-600 dark:text-amber-400">+{m.wastePercent}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-ink">${costPerApuUnit.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RUBRO 4: INDIRECTOS, IMPREVISTOS Y UTILIDAD */}
            <div className="bg-surface rounded-2xl border border-line p-4 shadow-sm text-xs space-y-3">
              <h3 className="font-bold text-ink flex items-center gap-2 border-b border-line pb-2">
                <PieChart size={16} className="text-purple-500" />
                4. Gastos Indirectos, Imprevistos y Margen de Utilidad
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-surface-2 p-3 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Gastos Indirectos (Oficina/Campo)</span>
                  <span className="font-mono font-bold text-ink text-sm mt-0.5 block">
                    {selectedApu.indirectsPercent}% sobre Costo Directo
                  </span>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Imprevistos & Contingencias</span>
                  <span className="font-mono font-bold text-ink text-sm mt-0.5 block">
                    {selectedApu.contingencyPercent}% sobre Costo Directo
                  </span>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-line">
                  <span className="text-ink-soft block font-semibold">Utilidad del Contratista</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    {selectedApu.profitPercent}% sobre Costo Total
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE CALCULOS FCAS CPTT */}
      {activeTab === 'fcas_calculator' && (
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm space-y-6 text-xs">
          <div className="border-b border-line pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Users className="text-amber-500" size={20} />
                Matriz de Cálculo de Factor de Costos de Manutención y Prestaciones Sociales (FCAS / FCO)
              </h3>
              <p className="text-xs text-ink-soft mt-1">
                Conforme a Convención Colectiva Petrolera CPTT / Ley Orgánica del Trabajo LOTTT.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl text-right">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Factor FCAS Calculado</span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {calculatedFcasPercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* PARAM 1: DIAS LABORADOS */}
            <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
              <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 border-b border-line pb-2">
                📅 Días Efectivamente Laborados
              </h4>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Días Pagados al Año (Nominales)</label>
                <input 
                  type="number" 
                  value={daysPaidYear} 
                  onChange={(e) => setDaysPaidYear(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Días Efectivamente Laborados</label>
                <input 
                  type="number" 
                  value={daysWorkedYear} 
                  onChange={(e) => setDaysWorkedYear(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-line text-[11px] text-ink-soft">
                Relación de Días Inactivos: <strong className="text-ink font-mono font-bold">{((daysPaidYear / daysWorkedYear) * 100).toFixed(1)}%</strong>
              </div>
            </div>

            {/* PARAM 2: PRESTACIONES & VACACIONES */}
            <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
              <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 border-b border-line pb-2">
                🏖️ Vacaciones, Utilidades y Antigüedad
              </h4>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Días Vacaciones + Bono Vacacional</label>
                <input 
                  type="number" 
                  value={vacationBonusDays} 
                  onChange={(e) => setVacationBonusDays(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Días Utilidades (Bonificación Fin de Año)</label>
                <input 
                  type="number" 
                  value={profitSharingDays} 
                  onChange={(e) => setProfitSharingDays(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Días Antigüedad / Fideicomiso LOTTT</label>
                <input 
                  type="number" 
                  value={severanceDays} 
                  onChange={(e) => setSeveranceDays(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>
            </div>

            {/* PARAM 3: BENEFICIOS CPTT */}
            <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
              <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 border-b border-line pb-2">
                🛢️ Beneficios Convención Petrolera CPTT
              </h4>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Bono Alimentación Diario ($/día)</label>
                <input 
                  type="number" 
                  value={cpttFoodAllowanceUsd} 
                  onChange={(e) => setCpttFoodAllowanceUsd(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-semibold mb-1">Tiempo de Viaje / Traslado ($/día)</label>
                <input 
                  type="number" 
                  value={cpttTravelTimeUsd} 
                  onChange={(e) => setCpttTravelTimeUsd(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 font-mono font-bold text-ink"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300">
                <span className="font-bold block">Factor FCAS Oficial Resultante:</span>
                <span className="text-lg font-mono font-extrabold">{calculatedFcasPercent}%</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: FORMULAS ESCALATORIAS DE REAJUSTE */}
      {activeTab === 'escalation_formulas' && (
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm space-y-6 text-xs">
          <div className="border-b border-line pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} />
                Calculadora de Fórmulas Escalatorias de Reajuste de Precios O&G
              </h3>
              <p className="text-xs text-ink-soft mt-1">
                Fórmula polinómica de ajuste por variación de índices de precios BCV / INE / OPE.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl text-right">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Coeficiente K Reajuste</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                K = {escalationCoefficientK.totalK.toFixed(4)}
              </span>
            </div>
          </div>

          {/* FORMULA DISPLAY */}
          <div className="p-4 rounded-xl bg-surface-2 border border-line text-center font-mono text-sm font-bold text-ink">
            K = {laborWeightA} × (M/M₀) + {equipmentWeightB} × (E/E₀) + {materialsWeightC} × (Mat/Mat₀) + {indirectsWeightD} × (Ind/Ind₀)
          </div>

          {/* WEIGHTS & INDICES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* RUBRO 1: MANO DE OBRA */}
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
              <h4 className="font-bold text-ink text-xs border-b border-line pb-1.5">👷 Mano de Obra (M)</h4>
              <div>
                <label className="block text-ink-soft mb-1">Peso Ponderado (a)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  value={laborWeightA} 
                  onChange={(e) => setLaborWeightA(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Base (M₀)</label>
                <input 
                  type="number" 
                  value={laborIndex0} 
                  onChange={(e) => setLaborIndex0(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Actual (M)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={laborIndexCurrent} 
                  onChange={(e) => setLaborIndexCurrent(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div className="p-2 bg-surface rounded border border-line text-right font-mono font-bold text-blue-600">
                Aporte: {escalationCoefficientK.kLabor.toFixed(4)}
              </div>
            </div>

            {/* RUBRO 2: EQUIPOS */}
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
              <h4 className="font-bold text-ink text-xs border-b border-line pb-1.5">🚜 Equipos (E)</h4>
              <div>
                <label className="block text-ink-soft mb-1">Peso Ponderado (b)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  value={equipmentWeightB} 
                  onChange={(e) => setEquipmentWeightB(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Base (E₀)</label>
                <input 
                  type="number" 
                  value={equipmentIndex0} 
                  onChange={(e) => setEquipmentIndex0(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Actual (E)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={equipmentIndexCurrent} 
                  onChange={(e) => setEquipmentIndexCurrent(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div className="p-2 bg-surface rounded border border-line text-right font-mono font-bold text-amber-600">
                Aporte: {escalationCoefficientK.kEquip.toFixed(4)}
              </div>
            </div>

            {/* RUBRO 3: MATERIALES */}
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
              <h4 className="font-bold text-ink text-xs border-b border-line pb-1.5">🧱 Materiales (Mat)</h4>
              <div>
                <label className="block text-ink-soft mb-1">Peso Ponderado (c)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  value={materialsWeightC} 
                  onChange={(e) => setMaterialsWeightC(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Base (Mat₀)</label>
                <input 
                  type="number" 
                  value={materialsIndex0} 
                  onChange={(e) => setMaterialsIndex0(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Actual (Mat)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={materialsIndexCurrent} 
                  onChange={(e) => setMaterialsIndexCurrent(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div className="p-2 bg-surface rounded border border-line text-right font-mono font-bold text-emerald-600">
                Aporte: {escalationCoefficientK.kMat.toFixed(4)}
              </div>
            </div>

            {/* RUBRO 4: INDIRECTOS */}
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
              <h4 className="font-bold text-ink text-xs border-b border-line pb-1.5">📊 Indirectos (Ind)</h4>
              <div>
                <label className="block text-ink-soft mb-1">Peso Ponderado (d)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  value={indirectsWeightD} 
                  onChange={(e) => setIndirectsWeightD(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Base (Ind₀)</label>
                <input 
                  type="number" 
                  value={indirectsIndex0} 
                  onChange={(e) => setIndirectsIndex0(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-soft mb-1">Índice Actual (Ind)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={indirectsIndexCurrent} 
                  onChange={(e) => setIndirectsIndexCurrent(Number(e.target.value))} 
                  className="w-full bg-surface border border-line rounded-lg px-2.5 py-1.5 font-mono font-bold text-ink"
                />
              </div>
              <div className="p-2 bg-surface rounded border border-line text-right font-mono font-bold text-purple-600">
                Aporte: {escalationCoefficientK.kInd.toFixed(4)}
              </div>
            </div>

          </div>

          {/* SIMULATION RESULT ON VALUATION */}
          <div className="p-5 bg-surface-2 border border-line rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-ink-soft block uppercase">Monto Base de Valuación a Reajustar</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-ink">$</span>
                <input 
                  type="number" 
                  value={baseValuationUsd} 
                  onChange={(e) => setBaseValuationUsd(Number(e.target.value))} 
                  className="bg-surface border border-line rounded-xl px-3 py-1.5 font-mono font-extrabold text-ink text-base w-40"
                />
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-ink-soft block uppercase">Monto Reajustado por Escalación</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ${escalationCoefficientK.adjustedAmount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                (+${escalationCoefficientK.priceAdjustmentDelta.toLocaleString()} / +{escalationCoefficientK.percentIncrement}%)
              </span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: LIBRO DE COMPUTOS METRICOS SIDCON */}
      {activeTab === 'takeoffs' && (
        <QuantityTakeoff />
      )}

    </div>
  );
}
