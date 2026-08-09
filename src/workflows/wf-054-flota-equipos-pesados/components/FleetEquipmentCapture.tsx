import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Wrench,
  Fuel,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export interface PreOpChecklist {
  checkEngineOil: boolean;
  checkHydraulicLeaks: boolean;
  checkBrakesAlerts: boolean;
  checkFireExtinguisher: boolean;
  checkEmergencyStop: boolean;
  passedAll: boolean;
}

export interface FleetEquipmentItem {
  id: string;
  tag: string; // e.g. GRU-IC360-80T
  name: string; // e.g. Grúa Telescópica TEREX 80 Toneladas
  type: string; // Grúa, Retroexcavadora, Generador, Compresor, etc.
  brandModel: string; // Terex RT-780
  currentHorometer: number;
  lastServiceHorometer: number;
  nextServiceHorometer: number;
  maintenanceIntervalHours: number;
  status: 'OPERATIONAL' | 'MAINTENANCE_DUE' | 'OUT_OF_SERVICE';
  preOpChecklist?: PreOpChecklist;
  notes?: string;
}

export interface FleetData {
  equipment: FleetEquipmentItem[];
  summaryNotes?: string;
}

export const FleetEquipmentCapture: React.FC<WorkflowComponentProps<FleetData>> = ({
  data,
  onChange,
  isReadOnly = false,
  errors = [],
}) => {
  const equipment = data?.equipment || [];
  const summaryNotes = data?.summaryNotes || '';

  const [selectedEqId, setSelectedEqId] = useState<string | null>(
    equipment.length > 0 ? equipment[0].id : null
  );

  // New Equipment Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Grúa Telescópica');
  const [newBrandModel, setNewBrandModel] = useState('');
  const [newCurrentHorometer, setNewCurrentHorometer] = useState(0);
  const [newInterval, setNewInterval] = useState(0);

  const selectedItem = equipment.find((e) => e.id === selectedEqId) || equipment[0] || null;

  const updateEquipment = (nextEq: FleetEquipmentItem[]) => {
    onChange({
      equipment: nextEq,
      summaryNotes,
    });
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newName.trim()) return;

    const horometer = Number(newCurrentHorometer) || 0;
    const interval = Number(newInterval) || 0;

    const newItem: FleetEquipmentItem = {
      id: `fleet_${Date.now()}`,
      tag: newTag.trim().toUpperCase(),
      name: newName.trim(),
      type: newType,
      brandModel: newBrandModel.trim(),
      currentHorometer: horometer,
      lastServiceHorometer: horometer,
      nextServiceHorometer: interval > 0 ? horometer + interval : 0,
      maintenanceIntervalHours: interval,
      status: 'OUT_OF_SERVICE',
      preOpChecklist: {
        checkEngineOil: false,
        checkHydraulicLeaks: false,
        checkBrakesAlerts: false,
        checkFireExtinguisher: false,
        checkEmergencyStop: false,
        passedAll: false,
      },
    };

    const next = [...equipment, newItem];
    updateEquipment(next);
    setSelectedEqId(newItem.id);
    setShowAddModal(false);
    setNewTag('');
    setNewName('');
    setNewBrandModel('');
    setNewCurrentHorometer(0);
    setNewInterval(0);
  };

  const handleDeleteEquipment = (eqId: string) => {
    if (isReadOnly) return;
    const next = equipment.filter((e) => e.id !== eqId);
    updateEquipment(next);
    if (selectedEqId === eqId) {
      setSelectedEqId(next.length > 0 ? next[0].id : null);
    }
  };

  const handleUpdateHorometer = (eqId: string, horometer: number) => {
    if (isReadOnly) return;
    const nextEq = equipment.map((item) => {
      if (item.id !== eqId) return item;
      const isDue = item.nextServiceHorometer > 0 && horometer >= item.nextServiceHorometer;
      const status: FleetEquipmentItem['status'] = isDue
        ? 'MAINTENANCE_DUE'
        : item.preOpChecklist?.passedAll
        ? 'OPERATIONAL'
        : 'OUT_OF_SERVICE';
      return {
        ...item,
        currentHorometer: horometer,
        status,
      };
    });
    updateEquipment(nextEq);
  };

  const handleToggleChecklist = (eqId: string, key: keyof Omit<PreOpChecklist, 'passedAll'>) => {
    if (isReadOnly) return;
    const nextEq = equipment.map((item) => {
      if (item.id !== eqId) return item;
      const currentCl = item.preOpChecklist || {
        checkEngineOil: false,
        checkHydraulicLeaks: false,
        checkBrakesAlerts: false,
        checkFireExtinguisher: false,
        checkEmergencyStop: false,
        passedAll: false,
      };
      const updatedVal = !currentCl[key];
      const updatedCl = { ...currentCl, [key]: updatedVal };
      const passedAll =
        updatedCl.checkEngineOil &&
        updatedCl.checkHydraulicLeaks &&
        updatedCl.checkBrakesAlerts &&
        updatedCl.checkFireExtinguisher &&
        updatedCl.checkEmergencyStop;

      const isDue = item.nextServiceHorometer > 0 && item.currentHorometer >= item.nextServiceHorometer;
      let newStatus: FleetEquipmentItem['status'] = 'OUT_OF_SERVICE';
      if (isDue) {
        newStatus = 'MAINTENANCE_DUE';
      } else if (passedAll && item.maintenanceIntervalHours > 0) {
        newStatus = 'OPERATIONAL';
      }

      return {
        ...item,
        preOpChecklist: { ...updatedCl, passedAll },
        status: newStatus,
      };
    });
    updateEquipment(nextEq);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-slate-100">
              Flota & Maquinaria Pesada (ASME B30 / COVENIN)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Control de Horómetros, Mantenimiento Preventivo e Inspección Pre-operativa
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Maquinaria
          </button>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Container */}
      {equipment.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8">
          <Truck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-ink dark:text-slate-200 mb-1">
            No hay equipos o maquinaria pesada en el parque
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Registre grúas, retroexcavadoras, generadores o tendidoras para llevar el registro de horómetros e inspecciones.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Maquinaria
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Flota Registrada ({equipment.length})
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {equipment.map((item) => {
                const isSelected = selectedEqId === item.id;
                const isOperational = item.status === 'OPERATIONAL';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEqId(item.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/5 border-brand-500/40 shadow-sm'
                        : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold text-ink dark:text-slate-100">
                        {item.tag}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isOperational
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mb-2">
                      {item.name}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Horómetro: <strong>{item.currentHorometer} hrs</strong></span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEquipment(item.id);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment Details & Pre-op Checklist */}
          <div className="lg:col-span-8">
            {selectedItem && (
              <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {selectedItem.type}
                      </span>
                      <h3 className="text-lg font-bold text-ink dark:text-slate-100 font-mono">
                        {selectedItem.tag}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedItem.name} ({selectedItem.brandModel})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Horómetro Actual</span>
                    {isReadOnly ? (
                      <span className="text-lg font-mono font-bold text-ink dark:text-slate-100">
                        {selectedItem.currentHorometer} hrs
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={selectedItem.currentHorometer}
                        onChange={(e) =>
                          handleUpdateHorometer(selectedItem.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-sm bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      />
                    )}
                  </div>
                </div>

                {/* Maintenance Status Bar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Último Mantenimiento</span>
                    <span className="font-mono font-semibold text-ink dark:text-slate-200">{selectedItem.lastServiceHorometer} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Próximo Mantenimiento</span>
                    <span className="font-mono font-semibold text-ink dark:text-slate-200">{selectedItem.nextServiceHorometer} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Intervalo de Servicio</span>
                    <span className="font-mono font-semibold text-ink dark:text-slate-200">Cada {selectedItem.maintenanceIntervalHours} hrs</span>
                  </div>
                </div>

                {/* Pre-Op Checklist */}
                <div>
                  <h4 className="text-sm font-bold text-ink dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-brand-500" />
                    Inspección Pre-operativa Diaria (Checklist de Campo)
                  </h4>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'checkEngineOil', label: 'Nivel de Aceite de Motor / Refrigerante' },
                      { key: 'checkHydraulicLeaks', label: 'Ausencia de Fugas en Sistema Hidráulico' },
                      { key: 'checkBrakesAlerts', label: 'Sistema de Frenos & Luces Alarma Operativas' },
                      { key: 'checkFireExtinguisher', label: 'Extintor Vigente (PQS min 20 lbs)' },
                      { key: 'checkEmergencyStop', label: 'Paro de Emergencia / Set de Corte Probado' },
                    ].map(({ key, label }) => {
                      const currentVal = selectedItem.preOpChecklist?.[key as keyof Omit<PreOpChecklist, 'passedAll'>] ?? false;

                      return (
                        <label
                          key={key}
                          className="flex items-center justify-between p-2.5 bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                          <input
                            type="checkbox"
                            checked={currentVal}
                            disabled={isReadOnly}
                            onChange={() =>
                              handleToggleChecklist(
                                selectedItem.id,
                                key as keyof Omit<PreOpChecklist, 'passedAll'>
                              )
                            }
                            className="w-4 h-4 text-brand-500 rounded border-slate-300 dark:border-slate-700 focus:ring-brand-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Equipment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-ink dark:text-slate-100 text-base">
                Registrar Nueva Maquinaria
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Ficha / Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. GRU-80T-01"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Nombre / Descripción *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Grúa Terex 80T"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Tipo de Equipo</label>
                  <input
                    type="text"
                    placeholder="Grúa, Retroexcavadora..."
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="ej. CAT 320D"
                    value={newBrandModel}
                    onChange={(e) => setNewBrandModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Horómetro Inicial (hrs)</label>
                  <input
                    type="number"
                    value={newCurrentHorometer}
                    onChange={(e) => setNewCurrentHorometer(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Intervalo Mantenimiento (hrs)</label>
                  <input
                    type="number"
                    value={newInterval}
                    onChange={(e) => setNewInterval(parseFloat(e.target.value) || 250)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded font-medium"
                >
                  Guardar Maquinaria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
