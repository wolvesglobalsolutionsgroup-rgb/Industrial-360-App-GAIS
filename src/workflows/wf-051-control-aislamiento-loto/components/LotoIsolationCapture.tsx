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

export type EnergyType = 'Eléctrica' | 'Mecánica' | 'Hidráulica' | 'Neumática' | 'Química';

export type LockColor = 'Rojo - Personal' | 'Amarillo - Grupo' | 'Azul - Operaciones';

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
  status: 'Aislado & Bloqueado' | 'Prueba Cero Realizada' | 'Desbloqueado / Normalizado';
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
  const lotoPoints = data?.lotoPoints || [
    {
      id: 'loto_001',
      tagEquipment: 'K-101B Turbocompresor de Gas',
      systemName: 'Línea de Succión 16" Planta San Joaquín',
      energyType: 'Química',
      isolationMethod: 'Cierre de Válvula XV-1012, Purgado de Tramo y Colocación de Disco Ciego 600#',
      lockTagId: 'LOCK-QUI-014',
      lockColor: 'Rojo - Personal',
      ptwNumber: 'PTW-2026-0891',
      responsibleSupervisor: 'Ing. Carlos Mendoza (SIHO-A)',
      isolationDate: '2026-07-28',
      status: 'Prueba Cero Realizada',
      chkDeenergized: true,
      chkPhysicalLock: true,
      chkTagPlaced: true,
      chkZeroEnergyVerified: true,
      chkSignaturesApproved: true,
      zeroEnergyTestDetails: 'Presión verificada en manómetro PI-1012: 0.0 PSI tras purgado a antorcha. H2S 0 ppm.',
      notes: 'Aislamiento crítico previo a reemplazo de empaque de brida principal.',
    },
    {
      id: 'loto_002',
      tagEquipment: 'Bomba B-101A (Motor Eléctrico 480V)',
      systemName: 'Sistema de Inyección de Agua de Formación',
      energyType: 'Eléctrica',
      isolationMethod: 'Apertura e interrupción física de Breaker en CCMD Celda 04 con Candado y Pinza',
      lockTagId: 'LOCK-ELE-088',
      lockColor: 'Rojo - Personal',
      ptwNumber: 'PTW-2026-0892',
      responsibleSupervisor: 'Elec. Jefe Luis Rivas',
      isolationDate: '2026-07-28',
      status: 'Prueba Cero Realizada',
      chkDeenergized: true,
      chkPhysicalLock: true,
      chkTagPlaced: true,
      chkZeroEnergyVerified: true,
      chkSignaturesApproved: true,
      zeroEnergyTestDetails: 'Medición de voltaje con multímetro Fluke calibrated en Bornes L1-L2-L3: 0.0 VAC.',
      notes: 'Verificado arranque fallido en botonera local.',
    },
  ];

  const updatePoints = (newPoints: LotoPoint[]) => {
    onChange({ lotoPoints: newPoints, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddPoint = () => {
    const newPt: LotoPoint = {
      id: `loto_${Date.now()}`,
      tagEquipment: 'Nuevo Equipo / Válvula / Breaker',
      systemName: 'Sistema de Proceso',
      energyType: 'Eléctrica',
      isolationMethod: 'Aislamiento e interrupción de energía física',
      lockTagId: `LOCK-${Math.floor(100 + Math.random() * 900)}`,
      lockColor: 'Rojo - Personal',
      ptwNumber: 'PTW-2026-0000',
      responsibleSupervisor: context.user.email,
      isolationDate: new Date().toISOString().split('T')[0],
      status: 'Aislado & Bloqueado',
      chkDeenergized: true,
      chkPhysicalLock: true,
      chkTagPlaced: true,
      chkZeroEnergyVerified: true,
      chkSignaturesApproved: true,
      zeroEnergyTestDetails: 'Prueba de Energía Cero (0.0 V / 0.0 PSI).',
      notes: 'Punto de aislamiento LOTO.',
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

      {/* List of LOTO Points */}
      <div className="space-y-4">
        {lotoPoints.map((pt, idx) => (
          <div
            key={pt.id}
            className="p-4 bg-surface border border-line rounded-xl space-y-3 relative"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  #{idx + 1} [{pt.lockTagId}]
                </span>
                <span className="text-xs font-bold text-ink">{pt.tagEquipment}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  pt.status === 'Prueba Cero Realizada'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                }`}
              >
                {pt.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-ink-faint block">Sistema & Energía:</span>
                <span className="font-bold text-ink">
                  {pt.systemName} ({pt.energyType})
                </span>
              </div>
              <div>
                <span className="text-ink-faint block">Método de Aislamiento:</span>
                <span className="font-medium text-ink">{pt.isolationMethod}</span>
              </div>
              <div>
                <span className="text-ink-faint block">Permiso & Candado:</span>
                <span className="font-medium text-ink">
                  {pt.ptwNumber} | Candado: {pt.lockColor}
                </span>
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
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
