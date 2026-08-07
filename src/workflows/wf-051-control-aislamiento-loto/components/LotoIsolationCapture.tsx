import React from 'react';
import {
  Lock,
  Shield,
  ShieldCheck,
  Zap,
  Flame,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Key,
  CheckSquare,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export const LOTO_ENERGY_TYPES = [
  'Eléctrica',
  'Neumática',
  'Hidráulica',
  'Mecánica',
  'Térmica',
  'Química',
  'Presión Almacenada',
] as const;

export type EnergyType = typeof LOTO_ENERGY_TYPES[number];

export const LOTO_LOCK_COLORS = [
  'Rojo - Personal',
  'Amarillo - Grupo',
  'Azul - Operaciones',
] as const;

export type LockColor = typeof LOTO_LOCK_COLORS[number];

export const LOTO_STATUS_TYPES = [
  'Aislado & Bloqueado',
  'Prueba Cero Realizada',
  'Desbloqueado / Normalizado',
] as const;

export type LotoStatus = typeof LOTO_STATUS_TYPES[number];

export interface LotoPoint {
  id: string;
  tagEquipment: string;
  systemName: string;
  energyType: EnergyType;
  isolationMethod: string;
  lockTagId: string;
  lockColor: LockColor;
  ptwNumber: string;
  responsibleSupervisor: string;
  isolationDate: string;
  status: LotoStatus;
  chkDeenergized: boolean;
  chkPhysicalLock: boolean;
  chkTagPlaced: boolean;
  chkZeroEnergyVerified: boolean;
  chkSignaturesApproved: boolean;
  zeroEnergyTestDetails?: string;
  notes?: string;
}

export interface LotoIsolationData {
  lotoPoints: LotoPoint[];
  summaryNotes?: string;
}

export function LotoIsolationCapture({
  definition,
  context,
  data,
  onChange,
  isReadOnly = false,
}: WorkflowComponentProps<LotoIsolationData>) {
  const lotoPoints = data?.lotoPoints ?? [];

  const updatePoints = (newPoints: LotoPoint[]) => {
    onChange({ lotoPoints: newPoints, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddPoint = () => {
    const newPt: LotoPoint = {
      id: `loto_${Date.now()}`,
      tagEquipment: '',
      systemName: '',
      energyType: 'Eléctrica',
      isolationMethod: '',
      lockTagId: '',
      lockColor: 'Rojo - Personal',
      ptwNumber: '',
      responsibleSupervisor: context.user.email,
      isolationDate: new Date().toISOString().split('T')[0],
      status: 'Aislado & Bloqueado',
      chkDeenergized: false,
      chkPhysicalLock: false,
      chkTagPlaced: false,
      chkZeroEnergyVerified: false,
      chkSignaturesApproved: false,
      zeroEnergyTestDetails: '',
      notes: '',
    };
    updatePoints([...lotoPoints, newPt]);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-surface-2 border border-line rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-lg">
            <Lock size={22} />
          </div>
          <div>
            <h3 className="font-bold text-ink">{definition.title}</h3>
            <p className="text-xs text-ink-soft">
              Proyecto: {context.projectId} | Norma de Seguridad PDVSA SI-S-28
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleAddPoint}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            + Punto LOTO
          </button>
        )}
      </div>

      {/* List of LOTO Points / EmptyState */}
      {lotoPoints.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-dashed border-line rounded-xl space-y-3">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-full w-fit mx-auto">
            <Lock size={32} />
          </div>
          <h4 className="font-bold text-ink text-sm">Sin puntos de aislamiento LOTO registrados</h4>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            No se han registrado puntos de bloqueo y etiquetado (LOTO) para energías peligrosas según PDVSA SI-S-28.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddPoint}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} />
              Crear punto LOTO
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {lotoPoints.map((pt, idx) => (
            <div
              key={pt.id}
              className="p-4 bg-surface border border-line rounded-xl space-y-3 relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-line pb-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Tag / Equipo:</label>
                  <input
                    type="text"
                    value={pt.tagEquipment}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].tagEquipment = e.target.value;
                      updatePoints(updated);
                    }}
                    placeholder="Ej: K-101B Turbocompresor"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">ID Candado / Tarjeta:</label>
                  <input
                    type="text"
                    value={pt.lockTagId}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].lockTagId = e.target.value;
                      updatePoints(updated);
                    }}
                    placeholder="LOCK-QUI-001"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Estado LOTO:</label>
                  <select
                    value={pt.status}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].status = e.target.value as LotoStatus;
                      updatePoints(updated);
                    }}
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-bold"
                  >
                    {LOTO_STATUS_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Tipo de Energía:</label>
                  <select
                    value={pt.energyType}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].energyType = e.target.value as EnergyType;
                      updatePoints(updated);
                    }}
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                  >
                    {LOTO_ENERGY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Nº Permiso Trabajo (PTW):</label>
                  <input
                    type="text"
                    value={pt.ptwNumber}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].ptwNumber = e.target.value;
                      updatePoints(updated);
                    }}
                    placeholder="PTW-2026-XXXX"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Prueba Energía Cero:</label>
                  <input
                    type="text"
                    value={pt.zeroEnergyTestDetails}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...lotoPoints];
                      updated[idx].zeroEnergyTestDetails = e.target.value;
                      updatePoints(updated);
                    }}
                    placeholder="0.0 PSI / 0.0 VAC verificado"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="p-3 bg-surface-2/60 rounded-lg space-y-2 text-xs">
                <span className="font-bold text-ink flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Lista de Verificación de Energía Cero (PDVSA SI-S-28)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pt.chkDeenergized}
                      onChange={(e) => {
                        const updated = [...lotoPoints];
                        updated[idx].chkDeenergized = e.target.checked;
                        updatePoints(updated);
                      }}
                      disabled={isReadOnly}
                      className="rounded text-rose-600"
                    />
                    <span>Desenergizado</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pt.chkPhysicalLock}
                      onChange={(e) => {
                        const updated = [...lotoPoints];
                        updated[idx].chkPhysicalLock = e.target.checked;
                        updatePoints(updated);
                      }}
                      disabled={isReadOnly}
                      className="rounded text-rose-600"
                    />
                    <span>Candado Instalado</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pt.chkTagPlaced}
                      onChange={(e) => {
                        const updated = [...lotoPoints];
                        updated[idx].chkTagPlaced = e.target.checked;
                        updatePoints(updated);
                      }}
                      disabled={isReadOnly}
                      className="rounded text-rose-600"
                    />
                    <span>Tarjeta Colocada</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pt.chkZeroEnergyVerified}
                      onChange={(e) => {
                        const updated = [...lotoPoints];
                        updated[idx].chkZeroEnergyVerified = e.target.checked;
                        updatePoints(updated);
                      }}
                      disabled={isReadOnly}
                      className="rounded text-rose-600"
                    />
                    <span>Prueba Cero Ok</span>
                  </label>
                </div>

                {pt.zeroEnergyTestDetails && (
                  <p className="text-[11px] text-ink-soft italic pt-1 border-t border-line/30">
                    Prueba de Energía Cero: {pt.zeroEnergyTestDetails}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-ink-faint pt-1">
                <span>
                  Resp: {pt.responsibleSupervisor} | Fecha Aislamiento: {pt.isolationDate}
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => updatePoints(lotoPoints.filter((p) => p.id !== pt.id))}
                    className="text-ink-faint hover:text-rose-500 transition-colors p-1"
                    title="Eliminar punto LOTO"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-ink block">
          Observaciones de Aislamiento y Normalización:
        </label>
        <textarea
          rows={3}
          value={data?.summaryNotes || ''}
          onChange={(e) =>
            onChange({
              lotoPoints,
              summaryNotes: e.target.value,
            })
          }
          disabled={isReadOnly}
          placeholder="Ingrese notas de coordinación con el ejecutor del trabajo o procedimiento de desaislamiento..."
          className="w-full p-3 bg-surface border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>
    </div>
  );
}
