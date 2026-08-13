import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command as CommandIcon,
  X,
  ShieldCheck,
  FlaskConical,
  HardHat,
  Compass,
  Package,
  BrainCircuit,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuthClaims } from '../hooks/useAuthClaims';
import { UserRole } from '../ProjectContext';

export interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CommandPalette({ isOpen: externalOpen, onClose: externalClose }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [registeredWfs, setRegisteredWfs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { role: claimRole } = useAuthClaims();

  const isPaletteOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  useEffect(() => {
    if (isPaletteOpen) {
      import('../lib/workflows/registry').then(({ listWorkflows }) => {
        setRegisteredWfs(listWorkflows());
      }).catch(() => {});
    }
  }, [isPaletteOpen]);

  const handleClose = () => {
    if (externalClose) {
      externalClose();
    } else {
      setInternalOpen(false);
    }
    setSearch('');
    setNotice(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (externalClose && isPaletteOpen) {
          externalClose();
        } else {
          setInternalOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape' && isPaletteOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, externalClose]);

  if (!isPaletteOpen) return null;

  const userRole = (claimRole as UserRole) || 'campo';

  // Available routes mapped to domains
  const DOMAIN_ROUTES = [
    { domain: 'Permisos & SIHO-A', icon: ShieldCheck, title: 'Módulo SIHO-A & Permisos PTW', path: '/siho-ptw' },
    { domain: 'Permisos & SIHO-A', icon: ShieldCheck, title: 'LOTO & Control de Energía', path: '/loto-isolation' },
    { domain: 'Permisos & SIHO-A', icon: ShieldCheck, title: 'Gestión Ambiental', path: '/environmental-management' },
    { domain: 'Permisos & SIHO-A', icon: ShieldCheck, title: 'Registro Personal QR & SIHO', path: '/worker-qr-registry' },
    { domain: 'Permisos & SIHO-A', icon: ShieldCheck, title: 'Alertas SIHO & Incidentes', path: '/alerts-details' },

    { domain: 'QA/QC & Integridad', icon: FlaskConical, title: 'Control de Calidad & Soldaduras', path: '/qa-qc-welding' },
    { domain: 'QA/QC & Integridad', icon: FlaskConical, title: 'Integridad Pipeline / ILI Pigging', path: '/modulos/ili-pigging' },
    { domain: 'QA/QC & Integridad', icon: FlaskConical, title: 'Hot Tap & Esquemas de Presión', path: '/hot-tap' },
    { domain: 'QA/QC & Integridad', icon: FlaskConical, title: 'Instrumentación & Lazos P&ID', path: '/instrumentation-control' },
    { domain: 'QA/QC & Integridad', icon: FlaskConical, title: 'Ensayos Civiles & Suelos', path: '/civil-engineering' },

    { domain: 'Construcción & Campo', icon: HardHat, title: 'Planificación WBS / Kanban', path: '/tasks' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Reportes Diarios de Campo', path: '/field-reports' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Detalle de Avance Físico', path: '/progress-details' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Personal & Cuadrillas', path: '/personnel-details' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Flota & Equipos Pesados', path: '/modulos/flota' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Logística & Rutas', path: '/logistics' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Procura & Inventarios', path: '/inventory' },
    { domain: 'Construcción & Campo', icon: HardHat, title: 'Centro Sincronización Offline', path: '/sync-center' },

    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Visor BIM 3D', path: '/bim' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Herramientas de Cálculo', path: '/tools' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Estimación APU & Cómputos', path: '/apu-estimation' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Detalles Presupuestarios', path: '/budget-details' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Costos & Gastos', path: '/expenses' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Valuaciones ROE', path: '/valuations' },
    { domain: 'Ingeniería & GIS', icon: Compass, title: 'Centro Documental', path: '/documents' },

    { domain: 'Precomisionado & Databook', icon: Package, title: 'Compilador Dossier & Cierre', path: '/modulos/cierre' },
    { domain: 'Precomisionado & Databook', icon: Package, title: 'Standby & Gestión de Cambio MOC', path: '/modulos/standby-moc' },
    { domain: 'Precomisionado & Databook', icon: Package, title: 'Interoperabilidad Primavera/SAP', path: '/modulos/interoperabilidad' },
    { domain: 'Precomisionado & Databook', icon: Package, title: 'Portal Clientes', path: '/client-portal-builder' },

    { domain: 'Project Brain', icon: BrainCircuit, title: 'Dashboard Ejecutivo', path: '/' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Consultor IA Project Brain', path: '/project-brain' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Analítica Predictiva RAG', path: '/intelligence' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Chatbot Asistente', path: '/chat' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Asistente de Voz', path: '/voice' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Portafolio de Obras', path: '/projects' },
    { domain: 'Project Brain', icon: BrainCircuit, title: 'Ajustes & BrandKit', path: '/settings' },
  ];

  // Handle Special Syntax
  const cleanSearch = search.trim().toLowerCase();

  let filteredRoutes = DOMAIN_ROUTES;
  let filteredWfs = registeredWfs;

  if (cleanSearch.startsWith('wbs:')) {
    const code = cleanSearch.replace('wbs:', '').trim();
    if (code) {
      navigate(`/tasks?wbs=${encodeURIComponent(code)}`);
      handleClose();
      return null;
    }
  }

  if (cleanSearch.startsWith('tag:')) {
    const tag = cleanSearch.replace('tag:', '').trim();
    if (tag) {
      navigate(`/documents?tag=${encodeURIComponent(tag)}`);
      handleClose();
      return null;
    }
  }

  if (cleanSearch.startsWith('wf:')) {
    const wfCode = cleanSearch.replace('wf:', '').trim();
    filteredWfs = registeredWfs.filter((w) => w.id.toLowerCase().includes(wfCode) || w.title.toLowerCase().includes(wfCode));
    filteredRoutes = [];
  } else if (cleanSearch) {
    filteredRoutes = DOMAIN_ROUTES.filter(
      (r) => r.title.toLowerCase().includes(cleanSearch) || r.domain.toLowerCase().includes(cleanSearch) || r.path.toLowerCase().includes(cleanSearch)
    );
    filteredWfs = registeredWfs.filter(
      (w) => w.id.toLowerCase().includes(cleanSearch) || w.title.toLowerCase().includes(cleanSearch)
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/70 backdrop-blur-xs transition-all">
      <div className="bg-[var(--bg-surface-1)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-[var(--text-primary)]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] gap-3 bg-[var(--bg-surface-2)]/60">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar por módulo, dominio o workflow... (Sintaxis: 'wf:043', 'wbs:1.2', 'tag:PIPING')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-[var(--bg-surface-3)] text-[var(--text-secondary)] px-2 py-1 rounded-md">
            <CommandIcon size={10} /> K
          </span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[var(--bg-surface-3)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div className="px-4 py-2 bg-[var(--status-neutral-bg)] border-b border-[var(--border-subtle)] text-[11px] font-medium text-[var(--status-neutral-text)] flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {filteredRoutes.length === 0 && filteredWfs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] font-medium">
              No se encontraron resultados para "{search}"
            </div>
          ) : (
            <>
              {/* Workflows */}
              {filteredWfs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-500)]">
                    Workflows Kernel Registrados ({filteredWfs.length})
                  </div>
                  <div className="space-y-1">
                    {filteredWfs.map((wf) => (
                      <button
                        key={wf.id}
                        onClick={() => {
                          navigate(`/siho-ptw?wf=${encodeURIComponent(wf.id)}`);
                          handleClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)] text-left transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">{wf.title}</div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">ID: {wf.id} • Fase {wf.phase}</div>
                        </div>
                        <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Routes */}
              {filteredRoutes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Módulos & Dominios
                  </div>
                  <div className="space-y-1">
                    {filteredRoutes.map((route) => {
                      const IconComp = route.icon;
                      return (
                        <button
                          key={route.path + route.title}
                          onClick={() => {
                            navigate(route.path);
                            handleClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-surface-2)] text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--bg-surface-2)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0">
                              <IconComp size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[var(--text-primary)]">{route.title}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{route.domain}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{route.path}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[var(--bg-surface-2)] border-t border-[var(--border-subtle)] px-4 py-2 flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
          <span>Industrial Control 360 • Shell V2</span>
          <div className="flex items-center gap-3">
            <span>'wf:043' para workflows</span>
            <span>'wbs:1.2' para WBS</span>
            <span>ESC cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
