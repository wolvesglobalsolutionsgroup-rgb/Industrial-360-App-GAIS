import React from 'react';
import { HardHat, Activity, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeroCardProps {
  projectName?: string;
  wbsProgress?: number;
  executedValuation?: number;
  totalBudget?: number;
  hhtCount?: number;
  activeFronts?: number;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  projectName = 'Proyecto Seleccionado',
  wbsProgress,
  executedValuation,
  totalBudget,
  hhtCount,
  activeFronts,
}) => {
  const hasWbs = typeof wbsProgress === 'number';
  const hasExecuted = typeof executedValuation === 'number';
  const hasBudget = typeof totalBudget === 'number';
  const hasHht = typeof hhtCount === 'number';
  const hasFronts = typeof activeFronts === 'number';

  return (
    <div className="relative overflow-hidden rounded-2xl brand-gradient p-6 sm:p-8 text-white shadow-brand transition-all duration-300">
      {/* Decorative background glow circle */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-48 h-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} className="text-amber-300" />
            <span>Estado de Obra Consolidado</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight leading-tight">
            {projectName}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
            Supervisión operativa, avance físico ponderado de partidas WBS, control SIHO-A de permisos de trabajo y valuaciones ROE en tiempo real.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/90">
            <div className="flex items-center gap-1.5">
              <HardHat size={16} className="text-amber-300 shrink-0" />
              <span>{hasFronts ? `${activeFronts} Frentes Activos` : 'Sin frentes registrados'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-300 shrink-0" />
              <span className="tabular">{hasHht ? `${hhtCount.toLocaleString()} HHT Sin Accidentes` : 'Sin HHT registradas'}</span>
            </div>
          </div>
        </div>

        {/* Metric gauge box */}
        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-bold text-white/80">
            <span>Avance Físico Global</span>
            <span className="tabular font-black text-amber-300 text-sm">
              {hasWbs ? `${wbsProgress.toFixed(1)}%` : 'Sin dato'}
            </span>
          </div>

          <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${hasWbs ? Math.min(Math.max(wbsProgress, 0), 100) : 0}%` }}
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-mono tabular">
            <span className="text-white/70">Ejecutado:</span>
            <span className="font-bold text-white">
              {hasExecuted ? `$${executedValuation.toLocaleString('en-US')}` : 'Sin dato'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono tabular text-white/60">
            <span>Presupuesto Total:</span>
            <span>
              {hasBudget ? `$${totalBudget.toLocaleString('en-US')}` : 'Sin dato'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <Link
              to="/tasks"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
            >
              <span>Ver Kanban de Partidas</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
