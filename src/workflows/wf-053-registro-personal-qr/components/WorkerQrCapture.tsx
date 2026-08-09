import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Trash2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export interface FieldWorker {
  id: string;
  credentialId?: string;
  nationalId: string; // e.g. V-18.492.102
  fullName: string;
  role: string; // e.g. Soldador SMAW 6G
  contractor: string; // e.g. Consorcio Vial C.A.
  bloodType: string; // e.g. O+
  allergies?: string;
  medicalCheckValidUntil: string; // YYYY-MM-DD
  sihoInductionValidUntil: string; // YYYY-MM-DD (PDVSA SI-S-04)
  fitStatus: 'Apto' | 'Apto con Restricciones' | 'No Apto' | 'Vencido';
  totalHhtAccumulated: number;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  nationalId: string;
  role: string;
  checkInTime: string; // ISO string
  gateLocation: string;
  accessStatus: 'Verde - Autorizado' | 'Rojo - Denegado';
}

export interface WorkerQrData {
  workers: FieldWorker[];
  attendanceLogs?: AttendanceRecord[];
  summaryNotes?: string;
}

export function createDefaultFieldWorker(params: {
  nationalId: string;
  fullName: string;
  role?: string;
  contractor?: string;
  bloodType?: string;
  allergies?: string;
  medicalCheckValidUntil?: string;
  sihoInductionValidUntil?: string;
}): FieldWorker {
  return {
    id: `worker_${Date.now()}`,
    credentialId: '',
    nationalId: params.nationalId.trim(),
    fullName: params.fullName.trim(),
    role: (params.role || '').trim(),
    contractor: (params.contractor || '').trim(),
    bloodType: (params.bloodType || '').trim(),
    allergies: (params.allergies || '').trim(),
    medicalCheckValidUntil: (params.medicalCheckValidUntil || '').trim(),
    sihoInductionValidUntil: (params.sihoInductionValidUntil || '').trim(),
    fitStatus: 'Vencido',
    totalHhtAccumulated: 0,
  };
}

export const WorkerQrCapture: React.FC<WorkflowComponentProps<WorkerQrData>> = ({
  data,
  onChange,
  isReadOnly = false,
  errors = [],
}) => {
  const workers = data?.workers || [];
  const attendanceLogs = data?.attendanceLogs || [];
  const summaryNotes = data?.summaryNotes || '';

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(
    workers.length > 0 ? workers[0].id : null
  );

  // New worker modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNationalId, setNewNationalId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [newBloodType, setNewBloodType] = useState('');
  const [newAllergies, setNewAllergies] = useState('');
  const [newMedicalDate, setNewMedicalDate] = useState('');
  const [newSihoDate, setNewSihoDate] = useState('');
  const [newFitStatus, setNewFitStatus] = useState<'Apto' | 'Apto con Restricciones' | 'No Apto' | 'Vencido'>('Vencido');

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0] || null;

  const updateWorkers = (nextWorkers: FieldWorker[]) => {
    onChange({
      workers: nextWorkers,
      attendanceLogs,
      summaryNotes,
    });
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNationalId.trim() || !newFullName.trim()) return;

    const newWorker = createDefaultFieldWorker({
      nationalId: newNationalId,
      fullName: newFullName,
      role: newRole,
      contractor: newContractor,
      bloodType: newBloodType,
      allergies: newAllergies,
      medicalCheckValidUntil: newMedicalDate,
      sihoInductionValidUntil: newSihoDate,
    });

    const next = [...workers, newWorker];
    updateWorkers(next);
    setSelectedWorkerId(newWorker.id);
    setShowAddModal(false);
    setNewNationalId('');
    setNewFullName('');
    setNewRole('');
    setNewContractor('');
    setNewBloodType('');
    setNewAllergies('');
    setNewMedicalDate('');
    setNewSihoDate('');
    setNewFitStatus('Vencido');
  };

  const handleDeleteWorker = (workerId: string) => {
    if (isReadOnly) return;
    const next = workers.filter((w) => w.id !== workerId);
    updateWorkers(next);
    if (selectedWorkerId === workerId) {
      setSelectedWorkerId(next.length > 0 ? next[0].id : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-slate-100">
              Registro de Personal & Verificación QR SIHO-A (PDVSA SI-S-04)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Control de Acreditación Médica, Inducción de Seguridad y Pases de Campo
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
            Registrar Trabajador
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
      {workers.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8">
          <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-ink dark:text-slate-200 mb-1">
            No hay trabajadores registrados en la nómina de obra
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Añada los datos del personal de campo para habilitar las acreditaciones QR, vigencia médica e inducción SIHO-A.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Trabajador
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Personal Registrado ({workers.length})
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {workers.map((worker) => {
                const isSelected = selectedWorker?.id === worker.id;
                const isFit = worker.fitStatus === 'Apto' || worker.fitStatus === 'Apto con Restricciones';

                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/5 border-brand-500/40 shadow-sm'
                        : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-ink dark:text-slate-100">
                        {worker.fullName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isFit
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {worker.fitStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
                      {worker.nationalId} • {worker.role}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>{worker.contractor}</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorker(worker.id);
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

          {/* Details & QR Credential Card */}
          <div className="lg:col-span-8">
            {selectedWorker && (
              <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink dark:text-slate-100">
                      {selectedWorker.fullName}
                    </h3>
                    <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                      Cédula / Pasaporte: <strong>{selectedWorker.nationalId}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-brand-500" />
                    </div>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Cargo / Especialidad</span>
                    <span className="font-bold text-ink dark:text-slate-200 text-sm">{selectedWorker.role}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Empresa Contratista</span>
                    <span className="font-bold text-ink dark:text-slate-200 text-sm">{selectedWorker.contractor}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Vigencia Acreditación Médica</span>
                    <span className="font-mono font-medium text-ink dark:text-slate-200">{selectedWorker.medicalCheckValidUntil}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Inducción SIHO-A (PDVSA SI-S-04)</span>
                    <span className="font-mono font-medium text-ink dark:text-slate-200">{selectedWorker.sihoInductionValidUntil}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Tipo de Sangre & Alergias</span>
                    <span className="font-medium text-ink dark:text-slate-200">
                      {selectedWorker.bloodType} • {selectedWorker.allergies || 'Sin alergias registradas'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Aptitud SIHO</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedWorker.fitStatus}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-ink dark:text-slate-100 text-base">
                Registrar Nuevo Trabajador
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Cédula / RIF *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. V-18.492.102"
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Carlos Mendoza"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Cargo / Especialidad</label>
                  <input
                    type="text"
                    placeholder="ej. Soldador GTAW 6G"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Empresa Contratista</label>
                  <input
                    type="text"
                    placeholder="ej. Consorcio O&G"
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Tipo de Sangre</label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Alergias</label>
                  <input
                    type="text"
                    placeholder="Penicilina / Ninguna"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Vencimiento Médico</label>
                  <input
                    type="date"
                    value={newMedicalDate}
                    onChange={(e) => setNewMedicalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Vencimiento SIHO-A</label>
                  <input
                    type="date"
                    value={newSihoDate}
                    onChange={(e) => setNewSihoDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Aptitud SIHO</label>
                <select
                  value={newFitStatus}
                  onChange={(e) => setNewFitStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                >
                  <option value="Apto">Apto</option>
                  <option value="Apto con Restricciones">Apto con Restricciones</option>
                  <option value="No Apto">No Apto</option>
                  <option value="Vencido">Vencido</option>
                </select>
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
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
