import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  X,
  HardHat,
  ClipboardList,
  Calculator,
  ShieldCheck,
  Receipt,
  BrainCircuit,
  LayoutDashboard,
  Box,
  Flame,
  UserCheck,
  MapPin,
  Truck,
  ArrowLeftRight,
  Globe,
  RefreshCw,
  Settings,
  CircleDollarSign,
  Clock,
  Package,
  FileArchive,
  Database,
  Plug,
  Network,
  MessageSquare,
  Mic,
  Briefcase,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { useAuthClaims } from '../hooks/useAuthClaims';
import { UserRole } from '../ProjectContext';
import {
  PROJECT_PHASES,
  searchNavigation,
  PhaseModule,
  ProjectPhase,
} from './navigation/phaseNavigation';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  HardHat,
  ClipboardList,
  Package,
  Receipt,
  MessageSquare,
  Mic,
  Box,
  Calculator,
  Settings,
  CircleDollarSign,
  Clock,
  PackageSearch: Package,
  ShieldCheck,
  FileArchive,
  Database,
  Plug,
  Network,
  BrainCircuit,
  Briefcase,
  MapPin,
  Truck,
  ArrowLeftRight,
  Globe,
  RefreshCw,
  ShieldAlert,
  Flame,
  UserCheck,
  BookOpen,
  CheckCircle2,
  Crown,
};

interface GroupedCommandItem {
  phase: ProjectPhase;
  module: PhaseModule;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { role: claimRole } = useAuthClaims();

  const userRole = (claimRole as UserRole) || 'campo';

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Derive flat array of searchable items grouped by phase
  const allItems: GroupedCommandItem[] = [];

  if (search.trim()) {
    const results = searchNavigation(search, userRole);
    for (const r of results) {
      allItems.push({
        phase: r.phase,
        module: r.module,
      });
    }
  } else {
    for (const phase of PROJECT_PHASES) {
      for (const mod of phase.modules) {
        if (!mod.allowedRoles || mod.allowedRoles.includes(userRole)) {
          allItems.push({ phase, module: mod });
        }
      }
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      navigate(allItems[selectedIndex].module.path);
      setIsOpen(false);
      setSearch('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/60 backdrop-blur-md transition-all">
      <div
        className="bg-surface border border-line rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-line gap-3 bg-surface-2/40">
          <Search size={18} className="text-ink-faint shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar por fase, módulo o workflow... (ej: 'Fase 4', 'Izaje', 'PTW', 'BIM')"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-ink placeholder:text-ink-faint"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-surface-2 text-ink-soft px-2 py-1 rounded-lg">
            <Command size={10} /> K
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-surface-2 rounded-lg text-ink-faint hover:text-ink cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List Grouped by Phase */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-faint font-medium">
              No se encontraron resultados en ninguna fase para "{search}"
            </div>
          ) : (
            PROJECT_PHASES.map((phase) => {
              const phaseItems = allItems.filter((i) => i.phase.id === phase.id);
              if (phaseItems.length === 0) return null;

              return (
                <div key={phase.id} className="space-y-1">
                  {/* Phase Header */}
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-brand-500 dark:text-emerald-400 bg-brand-500/5 dark:bg-emerald-950/20 rounded-lg">
                    <span>{phase.shortTitle}</span>
                    <span className="font-mono text-[9px] opacity-75">{phase.code}</span>
                  </div>

                  {/* Module List */}
                  <div className="space-y-1">
                    {phaseItems.map((item) => {
                      const globalIdx = allItems.findIndex(
                        (i) => i.module.id === item.module.id
                      );
                      const isSelected = globalIdx === selectedIndex;
                      const IconComp = ICON_MAP[item.module.iconName] || ClipboardList;

                      return (
                        <button
                          key={item.module.id}
                          onClick={() => {
                            navigate(item.module.path);
                            setIsOpen(false);
                            setSearch('');
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-500 text-white font-bold shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                              : 'text-ink hover:bg-surface-2 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                                  : 'bg-surface-2 text-ink-soft'
                              }`}
                            >
                              <IconComp size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate">
                                {item.module.title}
                              </span>
                              {item.module.description && (
                                <span
                                  className={`text-[10px] block truncate ${
                                    isSelected
                                      ? 'text-white/80 dark:text-slate-950/80'
                                      : 'text-ink-faint'
                                  }`}
                                >
                                  {item.module.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {item.module.badge && (
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                                  isSelected
                                    ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                                    : 'bg-surface-2 text-ink-faint'
                                }`}
                              >
                                {item.module.badge}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected
                                  ? 'text-white/80 dark:text-slate-950/80'
                                  : 'text-ink-faint'
                              }`}
                            >
                              {item.module.path}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-surface-2/60 border-t border-line px-4 py-2.5 flex justify-between items-center text-[10px] text-ink-faint font-mono">
          <span>Industrial Control 360 • Búsqueda por Fases Industriales ({userRole})</span>
          <div className="flex items-center gap-2">
            <span>↑↓ navegar</span>
            <span>↵ seleccionar</span>
            <span>ESC cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
