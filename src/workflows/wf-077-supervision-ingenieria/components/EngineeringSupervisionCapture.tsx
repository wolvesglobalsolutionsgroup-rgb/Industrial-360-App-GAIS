import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { EngineeringSupervisionData } from '../definition';
import { FileCheck2, ShieldCheck, CheckSquare, Layers } from 'lucide-react';

export const EngineeringSupervisionCapture: React.FC<WorkflowComponentProps<EngineeringSupervisionData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-brand-500" />
          Supervisión de Ingeniería de Detalle y Certificación ORC (GPG Fase 2)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código Paquete de Ingeniería
            </label>
            <input
              type="text"
              value={data.packageCode || ''}
              onChange={(e) => onChange({ packageCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="PKG-ING-DET-04"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Disciplina de Ingeniería
            </label>
            <select
              value={data.discipline || 'mecanica'}
              onChange={(e) => onChange({ discipline: e.target.value as any })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink capitalize"
            >
              <option value="procesos">Procesos</option>
              <option value="mecanica">Mecánica / Equipos</option>
              <option value="tuberias">Tuberías / Stress</option>
              <option value="civil">Civil / Estructuras</option>
              <option value="electricidad">Electricidad</option>
              <option value="instrumentacion">Instrumentación y Control</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Número de Revisión (Rev)
            </label>
            <input
              type="text"
              value={data.revisionNumber || 'REV-0'}
              onChange={(e) => onChange({ revisionNumber: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono font-bold"
              placeholder="REV-0"
            />
          </div>
        </div>

        {/* ORC Hard Gate Section */}
        <div className="p-4 border border-border rounded-lg bg-surface-subtle space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            Oficina de Revisión y Control de Ingeniería (ORC)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface">
              <input
                type="checkbox"
                checked={data.orcCertificateIssued || false}
                onChange={(e) => onChange({ orcCertificateIssued: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Certificado de Calidad ORC Emitido y Aprobado
              </span>
            </label>

            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
                Nº Certificado ORC
              </label>
              <input
                type="text"
                value={data.orcCertificateCode || ''}
                onChange={(e) => onChange({ orcCertificateCode: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-border rounded bg-surface text-ink font-mono"
                placeholder="ORC-CERT-2026-99"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface-subtle">
            <input
              type="checkbox"
              checked={data.calculationsApproved || false}
              onChange={(e) => onChange({ calculationsApproved: e.target.checked })}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-brand-500" />
              Memorias de Cálculo y Hojas de Datos Verificadas por Supervisión
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Dictamen Técnico de Supervisión de Ingeniería
          </label>
          <textarea
            rows={3}
            value={data.supervisorNotes || ''}
            onChange={(e) => onChange({ supervisorNotes: e.target.value })}
            disabled={isReadOnly}
            placeholder="Evaluación de constructibilidad, estándares de ingeniería PDVSA y normas ASME/API aplicables..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
