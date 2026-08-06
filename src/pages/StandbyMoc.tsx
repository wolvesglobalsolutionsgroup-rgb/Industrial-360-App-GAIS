import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, FileText, CircleDollarSign, AlertTriangle, 
  Send, Plus, CheckCircle2, XCircle, ChevronRight, Calculator, 
  Building2, UserCheck, Scale, Sparkles, FileCheck, Layers, FileSpreadsheet, Download
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { standbyClaimsRepo, mocRequestsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';

export interface StandbyEvent {
  id?: string;
  claimCode: string;
  date: string;
  cause: string;
  responsibleParty: 'Cliente / Supervisor (PDVSA/Chevron)' | 'Condiciones Ambientales Extremas' | 'Interferencia Terceros / Comunidad';
  equipmentAffected: string;
  equipmentCount: number;
  equipmentStandbyRateUsdHr: number;
  personnelAffectedCount: number;
  personnelStandbyRateUsdHr: number;
  hoursDelayed: number;
  standbyRatePerHour: number;
  totalCostUsd: number;
  status: 'Registrado' | 'Notificado a Cliente' | 'Reclamo Formal Presentado' | 'Aprobado para Pago' | 'Rechazado';
  pdvsaIrS06Ref?: string;
  createdAt?: any;
}

export interface MocRequest {
  id?: string;
  code: string;
  title: string;
  changeCategory: 'Físico (Estructura/Tubería)' | 'Operacional (Presión/Temperatura)' | 'Procedimental (Norma/Secuencia)' | 'Emergencia Operational';
  description: string;
  technicalJustification: string;
  shaRiskEvaluation: 'Riesgo Bajo' | 'Riesgo Medio (Hazop Requerido)' | 'Riesgo Alto (Comité MOC PDVSA IR-S-06)';
  requestedBy: string;
  costImpactUsd: number;
  timeImpactDays: number;
  status: 'Borrador' | 'En Evaluación Comité MOC' | 'Aprobada Cliente' | 'Rechazada';
  date: string;
  pdvsaIrS06Form: {
    originatorName: string;
    custodianAuthority: string;
    shaOfficerName: string;
    affectedUnit: string;
  };
  createdAt?: any;
}

export const INITIAL_STANDBY_EVENTS: StandbyEvent[] = [
  {
    id: 'STB-001',
    claimCode: 'STB-2026-001',
    date: '2026-07-20',
    cause: 'Falta de liberación de línea por purgado de gas e inactividad de inspector SIHO de la operadora',
    responsibleParty: 'Cliente / Supervisor (PDVSA/Chevron)',
    equipmentAffected: 'Planta de Soldadura Diésel 500A + Camión Grúa 15T Telescópico',
    equipmentCount: 2,
    equipmentStandbyRateUsdHr: 180,
    personnelAffectedCount: 8,
    personnelStandbyRateUsdHr: 100,
    hoursDelayed: 7.5,
    standbyRatePerHour: 280,
    totalCostUsd: 2100,
    status: 'Notificado a Cliente',
    pdvsaIrS06Ref: 'PDVSA-IR-S-06-CLA-019'
  },
  {
    id: 'STB-002',
    claimCode: 'STB-2026-002',
    date: '2026-07-22',
    cause: 'Demora en autorización de permiso de trabajo en caliente (PTW) y prueba de atmostera explosiva (Gasotester)',
    responsibleParty: 'Cliente / Supervisor (PDVSA/Chevron)',
    equipmentAffected: 'Cuadrilla de Izamiento, Compresor 375 CFM y Vacuum 80 Bbl',
    equipmentCount: 3,
    equipmentStandbyRateUsdHr: 260,
    personnelAffectedCount: 14,
    personnelStandbyRateUsdHr: 160,
    hoursDelayed: 5.0,
    standbyRatePerHour: 420,
    totalCostUsd: 2100,
    status: 'Reclamo Formal Presentado',
    pdvsaIrS06Ref: 'PDVSA-IR-S-06-CLA-022'
  }
];

export const INITIAL_MOC_REQUESTS: MocRequest[] = [
  {
    id: 'MOC-001',
    code: 'MOC-IC360-2026-001',
    title: 'Modificación de trazado de tubería 16" por interferencia no mapeada con poliducto existente',
    changeCategory: 'Físico (Estructura/Tubería)',
    description: 'Cruce no registrado en planos As-Built con tubería de 8" de agua de formación y canalización eléctrica de alta tensión.',
    technicalJustification: 'Desvío de trazado en 45 metros con colocación de 2 codos de 45° ASME B16.9 para evitar interferencias críticas.',
    shaRiskEvaluation: 'Riesgo Medio (Hazop Requerido)',
    requestedBy: 'Ing. Carlos Mendoza (Inspector de Campo)',
    costImpactUsd: 18500,
    timeImpactDays: 4,
    status: 'En Evaluación Comité MOC',
    date: '2026-07-21',
    pdvsaIrS06Form: {
      originatorName: 'Ing. Carlos Mendoza',
      custodianAuthority: 'Gerencia de Gerencia de Procesos PDVSA Jusepín',
      shaOfficerName: 'Ing. Roberto Silva (SIHO-PDVSA)',
      affectedUnit: 'Estación de Flujo K-12 Tramo Oleoducto Principal'
    }
  },
  {
    id: 'MOC-002',
    code: 'MOC-IC360-2026-002',
    title: 'Cambio de especificación de recubrimiento anticorrosivo por alta salinidad del suelo',
    changeCategory: 'Procedimental (Norma/Secuencia)',
    description: 'Sustitución de recubrimiento epóxico simple por sistema de cinta polimérica tricapa de poliolefina aplicable en campo.',
    technicalJustification: 'Estudio de resistividad de suelo indicó presencia de cloruros > 800 ppm, requiriendo mayor rigidez dieléctrica según NACE SP0169 / PDVSA O-201.',
    shaRiskEvaluation: 'Riesgo Bajo',
    requestedBy: 'Ing. María Rivas (QA/QC)',
    costImpactUsd: 9200,
    timeImpactDays: 2,
    status: 'Aprobada Cliente',
    date: '2026-07-18',
    pdvsaIrS06Form: {
      originatorName: 'Ing. María Rivas',
      custodianAuthority: 'Superintendencia de Integridad Mecánica',
      shaOfficerName: 'Ing. Elena Gómez (SIHO)',
      affectedUnit: 'Línea de Recolección de Crudo 12"'
    }
  }
];

export default function StandbyMoc() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'standby' | 'letterGenerator' | 'moc'>('standby');

  // Firestore & local state
  const [events, setEvents] = useState<StandbyEvent[]>(INITIAL_STANDBY_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<StandbyEvent | null>(INITIAL_STANDBY_EVENTS[0]);

  // Form for New Standby
  const [cause, setCause] = useState('Demora en Firma de Permiso SIHO / Permiso de Trabajo en Caliente (PTW)');
  const [equipment, setEquipment] = useState('Grúa Telescópica 80T + Camión Chuto Vacuum 80 Bbl');
  const [equipRate, setEquipRate] = useState(220);
  const [personnelCount, setPersonnelCount] = useState(12);
  const [personnelRate, setPersonnelRate] = useState(130);
  const [hours, setHours] = useState(6);
  const [responsible, setResponsible] = useState<'Cliente / Supervisor (PDVSA/Chevron)' | 'Condiciones Ambientales Extremas' | 'Interferencia Terceros / Comunidad'>('Cliente / Supervisor (PDVSA/Chevron)');

  // MOC State
  const [mocList, setMocList] = useState<MocRequest[]>(INITIAL_MOC_REQUESTS);
  const [selectedMoc, setSelectedMoc] = useState<MocRequest | null>(INITIAL_MOC_REQUESTS[0]);
  const [showNewMocModal, setShowNewMocModal] = useState(false);

  // New MOC Form
  const [mocTitle, setMocTitle] = useState('');
  const [mocCategory, setMocCategory] = useState<'Físico (Estructura/Tubería)' | 'Operacional (Presión/Temperatura)' | 'Procedimental (Norma/Secuencia)' | 'Emergencia Operational'>('Físico (Estructura/Tubería)');
  const [mocDescription, setMocDescription] = useState('');
  const [mocJustification, setMocJustification] = useState('');
  const [mocRisk, setMocRisk] = useState<'Riesgo Bajo' | 'Riesgo Medio (Hazop Requerido)' | 'Riesgo Alto (Comité MOC PDVSA IR-S-06)'>('Riesgo Medio (Hazop Requerido)');
  const [mocCost, setMocCost] = useState(12500);
  const [mocDays, setMocDays] = useState(3);
  const [mocCustodian, setMocCustodian] = useState('Gerencia Operacional PDVSA');

  // Letter Generator
  const [letterRecipient, setLetterRecipient] = useState('Ing. Pedro Escalona - Gerente de Obras PDVSA / Client Supervisor');
  const [letterContractRef, setLetterContractRef] = useState('Contrato N° IC360-2026-CT-049');
  const [generatedLetter, setGeneratedLetter] = useState('');

  // Firestore Sync for Standby Claims via Repository (limit(50))
  useEffect(() => {
    if (!currentProject?.orgId || !currentProject?.id) return;

    const unsubscribe = standbyClaimsRepo.subscribe(currentProject.orgId, currentProject.id, (items) => {
      if (items.length > 0) {
        const loaded = items as unknown as StandbyEvent[];
        setEvents(loaded);
        if (!selectedEvent && loaded.length > 0) setSelectedEvent(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    return () => unsubscribe();
  }, [currentProject?.orgId, currentProject?.id]);

  // Firestore Sync for MOC Requests via Repository (limit(50))
  useEffect(() => {
    if (!currentProject?.orgId || !currentProject?.id) return;

    const unsubscribe = mocRequestsRepo.subscribe(currentProject.orgId, currentProject.id, (items) => {
      if (items.length > 0) {
        const loaded = items as unknown as MocRequest[];
        setMocList(loaded);
        if (!selectedMoc && loaded.length > 0) setSelectedMoc(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    return () => unsubscribe();
  }, [currentProject?.orgId, currentProject?.id]);

  const calculatedHourlyRate = equipRate + personnelRate;
  const calculatedTotalCost = hours * calculatedHourlyRate;

  const handleAddStandbyEvent = async () => {
    const claimCode = `STB-2026-00${events.length + 1}`;
    const newEv: StandbyEvent = {
      claimCode,
      date: new Date().toISOString().split('T')[0],
      cause,
      responsibleParty: responsible,
      equipmentAffected: equipment,
      equipmentCount: 2,
      equipmentStandbyRateUsdHr: equipRate,
      personnelAffectedCount: personnelCount,
      personnelStandbyRateUsdHr: personnelRate,
      hoursDelayed: hours,
      standbyRatePerHour: calculatedHourlyRate,
      totalCostUsd: calculatedTotalCost,
      status: 'Registrado',
      pdvsaIrS06Ref: `PDVSA-IR-S-06-CLA-00${events.length + 1}`
    };

    if (currentProject?.orgId && currentProject?.id) {
      try {
        const claimsPath = `organizations/${currentProject.orgId}/projects/${currentProject.id}/standby_claims`;
        await addDoc(collection(db, claimsPath), {
          ...newEv,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'standby_claims');
      }
    } else {
      setEvents([newEv, ...events]);
    }

    setSelectedEvent(newEv);
  };

  const handleCreateMoc = async () => {
    if (!mocTitle) return;

    const code = `MOC-IC360-2026-00${mocList.length + 1}`;
    const newMoc: MocRequest = {
      code,
      title: mocTitle,
      changeCategory: mocCategory,
      description: mocDescription,
      technicalJustification: mocJustification,
      shaRiskEvaluation: mocRisk,
      requestedBy: 'Ingeniero Residente de Obra IC360',
      costImpactUsd: mocCost,
      timeImpactDays: mocDays,
      status: 'En Evaluación Comité MOC',
      date: new Date().toISOString().split('T')[0],
      pdvsaIrS06Form: {
        originatorName: 'Ingeniero Residente IC360',
        custodianAuthority: mocCustodian,
        shaOfficerName: 'Inspector SIHO PDVSA',
        affectedUnit: currentProject?.name || 'Unidad de Proceso'
      }
    };

    if (currentProject?.orgId && currentProject?.id) {
      try {
        const mocPath = `organizations/${currentProject.orgId}/projects/${currentProject.id}/moc_requests`;
        await addDoc(collection(db, mocPath), {
          ...newMoc,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'moc_requests');
      }
    } else {
      setMocList([newMoc, ...mocList]);
    }

    setShowNewMocModal(false);
    setMocTitle('');
    setMocDescription('');
  };

  const handleGenerateLetter = (event: StandbyEvent) => {
    const letter = `
CARTA REF: IC360-NOT-STB-${event.claimCode}-2026
CONTRATISTA INDUSTRIAL PROINTECA C.A. / SISTEMA INDUSTRIAL CONTROL 360
Fecha: ${new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}

Atención:
${letterRecipient}

ASUNTO: NOTIFICACIÓN FORMAL DE TIEMPO MUERTO (STAND-BY) NO IMPUTABLE A LA CONTRATISTA
NORMATIVA RECLAMANTE: PDVSA IR-S-06 / CLÁUSULAS DE PARADAS INVOLUNTARIAS Y FUERZA MAYOR
REFERENCIA CONTRACTUAL: ${letterContractRef}
PROYECTO: "${currentProject?.name || 'Obra Mecánica y Piping Industrial'}"

Estimados Señores:

Por medio de la presente, nos dirigimos a ustedes en su carácter de Inspección y Custodia Operacional del Proyecto para hacer de su conocimiento formal que en fecha ${event.date}, las actividades de obra sufrieron una paralización involuntaria no imputable a la Contratista.

1. CAUSA RAIZ DEL STAND-BY:
"${event.cause}"
Responsable Atribuible: ${event.responsibleParty}.

2. DESGLOSE DE RECURSOS AFECTADOS Y COSTO HORARIO (PDVSA IR-S-06):
- Equipos en Espera Inactiva: ${event.equipmentAffected} (Tarifa Stand-by: $${event.equipmentStandbyRateUsdHr} USD/Hora).
- Cuadrilla de Personal Directo: ${event.personnelAffectedCount} trabajadores en sitio (Tarifa Costo Hundido/Salario: $${event.personnelStandbyRateUsdHr} USD/Hora).
- Tiempo Total de Retraso Registrado: ${event.hoursDelayed} Horas Operativas.
- Tarifa Horaria Total Combinada: $${event.standbyRatePerHour} USD/Hora.

3. MONTO TOTAL DEL RECLAMO FINANCIERO:
COSTO TOTAL IMPUTABLE: $${event.totalCostUsd.toLocaleString()} USD (Son: ${event.totalCostUsd} Dólares de los Estados Unidos de América).

4. SOLICITUDES RECLAMATORIAS FORMALES:
- Incorporación del monto de $${event.totalCostUsd.toLocaleString()} USD en la Valuación Imprevistos / Stand-by del período actual.
- Otorgamiento de Prórroga en el Cronograma de Ejecución CPM por un total de ${event.hoursDelayed} horas (${(event.hoursDelayed / 8).toFixed(1)} días hábiles).

Agradeciendo firmar el duplicado de la presente en señal de notificación conforme.

Atentamente,

__________________________________________
ING. RESIDENTE DE OBRA Y GERENCIA DE PROYECTO
PROINTECA C.A. / INDUSTRIAL CONTROL 360
Ref. Solicitud MOC: ${event.pdvsaIrS06Ref || 'PDVSA-IR-S-06-CLA-001'}
    `.trim();

    setGeneratedLetter(letter);
    setActiveTab('letterGenerator');
  };

  const totalStandbyClaimUsd = events.reduce((sum, e) => sum + e.totalCostUsd, 0);
  const totalMocCostUsd = mocList.reduce((sum, m) => sum + m.costImpactUsd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Clock size={16} /> Módulo Prioritario 4 · Protección Financiera, Claims & MOC PDVSA IR-S-06
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Gestión de Stand-by Claims & MOC</h1>
          <p className="text-ink-soft text-sm mt-1 font-medium">
            Registro de paros de obra imputables al cliente, cálculo de costo horario de cuadrillas/equipos parados y reclamos legales de cambio (PDVSA IR-S-06).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-right">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase block font-bold">Total Reclamos Stand-by</span>
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">${totalStandbyClaimUsd.toLocaleString()} USD</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-right">
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase block font-bold">Total Variaciones MOC</span>
            <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">${totalMocCostUsd.toLocaleString()} USD</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-line bg-surface rounded-2xl p-1 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('standby')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'standby' ? 'bg-amber-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Clock size={16} /> Registro de Stand-by Claims ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('letterGenerator')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'letterGenerator' ? 'bg-amber-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Sparkles size={16} /> Cartas Reclamatorias Legal PDVSA IR-S-06
        </button>
        <button
          onClick={() => setActiveTab('moc')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'moc' ? 'bg-blue-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
          }`}
        >
          <Layers size={16} /> Control de Órdenes MOC ({mocList.length})
        </button>
      </div>

      {/* TAB 1: STANDBY CLAIMS REGISTRATION */}
      {activeTab === 'standby' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* New Standby Form (5 cols) */}
          <div className="lg:col-span-5 bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
              <Plus size={18} className="text-amber-500" />
              Registrar Evento Paro de Obra (Stand-by)
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Responsable Atribuible</label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl font-medium text-ink outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Cliente / Supervisor (PDVSA/Chevron)">Cliente / Supervisor (PDVSA/Chevron)</option>
                  <option value="Condiciones Ambientales Extremas">Condiciones Ambientales Extremas</option>
                  <option value="Interferencia Terceros / Comunidad">Interferencia Terceros / Comunidad</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Causa del Stand-by / Inactividad</label>
                <textarea
                  rows={2}
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  placeholder="Ej: Demora en firmas de permisos de trabajo en caliente SIHO, falta de purgado de gas por operaciones..."
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Equipos Parados / Afectados</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Costo Horario Equipos ($/h)</label>
                  <input
                    type="number"
                    value={equipRate}
                    onChange={(e) => setEquipRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Trabajadores Afectados</label>
                  <input
                    type="number"
                    value={personnelCount}
                    onChange={(e) => setPersonnelCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Costo Horario Personal ($/h)</label>
                  <input
                    type="number"
                    value={personnelRate}
                    onChange={(e) => setPersonnelRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Horas Paro Retraso (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl space-y-1 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span>Tarifa Horaria Combinada:</span>
                  <strong>${calculatedHourlyRate} USD/hr</strong>
                </div>
                <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-amber-500/20">
                  <span>Total Reclamo Calculado:</span>
                  <span className="text-amber-600 dark:text-amber-400">${calculatedTotalCost.toLocaleString()} USD</span>
                </div>
              </div>

              <button
                onClick={handleAddStandbyEvent}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Guardar Reclamo en Bitácora
              </button>
            </div>
          </div>

          {/* List & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-ink border-b border-line pb-3 flex justify-between items-center">
                <span>Bitácora de Reclamos Stand-by Registrados</span>
                <span className="text-xs font-mono text-ink-soft font-normal">{events.length} Eventos</span>
              </h2>

              <div className="space-y-3">
                {events.map((ev) => {
                  const isSelected = selectedEvent?.claimCode === ev.claimCode;
                  return (
                    <div
                      key={ev.claimCode}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                          : 'border-line bg-surface hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{ev.claimCode}</span>
                            <span className="text-[10px] bg-surface-2 px-2 py-0.5 rounded text-ink-soft font-mono font-bold">{ev.date}</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-semibold">{ev.responsibleParty}</span>
                          </div>
                          <p className="text-xs text-ink font-semibold mt-2">{ev.cause}</p>
                        </div>
                        <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400 shrink-0">
                          ${ev.totalCostUsd.toLocaleString()} USD
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-line flex flex-wrap justify-between items-center text-[11px] text-ink-soft gap-2">
                        <span>Equipos: {ev.equipmentAffected} ({ev.hoursDelayed} hrs)</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                            handleGenerateLetter(ev);
                          }}
                          className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          <Sparkles size={13} /> Generar Carta Reclamatoria PDVSA IR-S-06
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI LEGAL LETTER GENERATOR */}
      {activeTab === 'letterGenerator' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Redactor de Carta Reclamatoria PDVSA IR-S-06
              </h2>
              <p className="text-xs text-ink-soft">Generación de carta legal con sustento contractual para someter al cliente / fiscal de obra.</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedLetter);
                alert('Carta reclamatoria copiada al portapapeles.');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck size={15} /> Copiar Texto Legal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Destinatario / Supervisor Cliente</label>
              <input
                type="text"
                value={letterRecipient}
                onChange={(e) => setLetterRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Referencia de Contrato</label>
              <input
                type="text"
                value={letterContractRef}
                onChange={(e) => setLetterContractRef(e.target.value)}
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="bg-surface-2 text-ink p-6 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-line shadow-inner">
            {generatedLetter || 'Selecciona un evento en el "Registro de Stand-by Claims" y presiona "Generar Carta Reclamatoria PDVSA IR-S-06".'}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGEMENT OF CHANGE (MOC) */}
      {activeTab === 'moc' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                Control de Órdenes de Cambio MOC (PDVSA IR-S-06)
              </h2>
              <p className="text-xs text-ink-soft">
                Gestión de variaciones técnicas de alcance, presión, trazado e ingeniería con evaluación de riesgos SHA y aprobación del custodio.
              </p>
            </div>

            <button
              onClick={() => setShowNewMocModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus size={16} /> Crear Solicitud MOC
            </button>
          </div>

          <div className="space-y-4">
            {mocList.map((m) => (
              <div key={m.code} className="p-5 border border-line rounded-2xl space-y-3 bg-surface-2/40 hover:bg-surface-2/70 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/20">{m.code}</span>
                      <span className="text-[10px] bg-surface-2 text-ink-soft px-2 py-0.5 rounded font-mono font-bold">{m.date}</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-semibold">{m.changeCategory}</span>
                    </div>
                    <h3 className="text-sm font-bold text-ink mt-2">{m.title}</h3>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    m.status === 'Aprobada Cliente' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed">{m.description}</p>

                <div className="p-3 bg-surface rounded-xl border border-line text-xs space-y-1 text-ink-soft">
                  <div><strong className="text-ink">Justificación Técnica:</strong> {m.technicalJustification}</div>
                  <div><strong className="text-ink">Evaluación de Riesgos SHA:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">{m.shaRiskEvaluation}</span></div>
                  <div><strong className="text-ink">Autoridad Custodia:</strong> {m.pdvsaIrS06Form.custodianAuthority}</div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-line text-xs font-mono">
                  <span className="text-ink-soft">Impacto Financiero: <strong className="text-blue-600 dark:text-blue-400 font-black">${m.costImpactUsd.toLocaleString()} USD</strong></span>
                  <span className="text-ink-soft">Impacto Cronograma: <strong className="text-blue-600 dark:text-blue-400 font-black">+{m.timeImpactDays} días hábiles</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW MOC MODAL */}
      {showNewMocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-line p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-ink border-b border-line pb-3">
              Crear Nueva Orden de Cambio MOC (PDVSA IR-S-06)
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Título de la Variación Técnica</label>
                <input
                  type="text"
                  value={mocTitle}
                  onChange={(e) => setMocTitle(e.target.value)}
                  placeholder="Ej: Modificación de trazado de tubería por interferencia..."
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Categoría de Cambio</label>
                  <select
                    value={mocCategory}
                    onChange={(e) => setMocCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Físico (Estructura/Tubería)">Físico (Estructura/Tubería)</option>
                    <option value="Operacional (Presión/Temperatura)">Operacional (Presión/Temperatura)</option>
                    <option value="Procedimental (Norma/Secuencia)">Procedimental (Norma/Secuencia)</option>
                    <option value="Emergencia Operational">Emergencia Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Evaluación Riesgo SHA</label>
                  <select
                    value={mocRisk}
                    onChange={(e) => setMocRisk(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Riesgo Bajo">Riesgo Bajo</option>
                    <option value="Riesgo Medio (Hazop Requerido)">Riesgo Medio (Hazop Requerido)</option>
                    <option value="Riesgo Alto (Comité MOC PDVSA IR-S-06)">Riesgo Alto (Comité MOC PDVSA IR-S-06)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Descripción del Cambio</label>
                <textarea
                  rows={2}
                  value={mocDescription}
                  onChange={(e) => setMocDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Justificación Técnica Normativa</label>
                <input
                  type="text"
                  value={mocJustification}
                  onChange={(e) => setMocJustification(e.target.value)}
                  placeholder="Ej: Normas ASME B31.4 / NACE SP0169..."
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Impacto Costo Estimado ($ USD)</label>
                  <input
                    type="number"
                    value={mocCost}
                    onChange={(e) => setMocCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Impacto Tiempo (Días)</label>
                  <input
                    type="number"
                    value={mocDays}
                    onChange={(e) => setMocDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-soft mb-1 uppercase tracking-wider">Autoridad Custodia / Operadora</label>
                <input
                  type="text"
                  value={mocCustodian}
                  onChange={(e) => setMocCustodian(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                onClick={() => setShowNewMocModal(false)}
                className="px-4 py-2 bg-surface-2 hover:bg-elevated text-ink font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMoc}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Guardar MOC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
