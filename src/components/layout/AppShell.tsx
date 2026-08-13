import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  FlaskConical,
  HardHat,
  Compass,
  Package,
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Building2,
  ChevronDown,
  Wifi,
  WifiOff,
  UserCheck,
  Menu,
  X,
  Layers,
  LayoutDashboard,
  Home,
} from 'lucide-react';
import { useProject, CORPORATE_PORTFOLIO_PROJECT, UserRole } from '../../ProjectContext';
import { ROLE_LABELS } from '../ProtectedRoute';
import { useTheme } from '../../theme/ThemeContext';
import { logout, useAppAuthState } from '../../firebase';
import OfflineBanner from '../ui/OfflineBanner';
import DemoBanner from '../ui/DemoBanner';
import QaBanner from '../states/QaBanner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { CommandPalette } from '../CommandPalette';

// 6 Functional Domains Mapping
export interface DomainConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  modules: {
    title: string;
    path: string;
    badge?: string;
  }[];
}

export const DOMAINS: DomainConfig[] = [
  {
    id: 'domain-siho',
    title: 'Permisos & SIHO-A',
    icon: ShieldCheck,
    modules: [
      { title: 'Permisos PTW & SIHO', path: '/siho-ptw' },
      { title: 'LOTO & Control Energía', path: '/loto-isolation' },
      { title: 'Gestión Ambiental', path: '/environmental-management' },
      { title: 'Registro Personal QR', path: '/worker-qr-registry' },
      { title: 'Alertas & Incidentes', path: '/alerts-details' },
    ],
  },
  {
    id: 'domain-qaqc',
    title: 'QA/QC & Integridad',
    icon: FlaskConical,
    modules: [
      { title: 'Calidad & Soldaduras', path: '/qa-qc-welding' },
      { title: 'Integridad & ILI Pigging', path: '/modulos/ili-pigging' },
      { title: 'Hot Tap & Presión', path: '/hot-tap' },
      { title: 'Instrumentación & Lazos', path: '/instrumentation-control' },
      { title: 'Ensayos Civiles & Suelos', path: '/civil-engineering' },
    ],
  },
  {
    id: 'domain-field',
    title: 'Construcción & Campo',
    icon: HardHat,
    modules: [
      { title: 'Planificación & WBS', path: '/tasks' },
      { title: 'Reportes Diarios Campo', path: '/field-reports' },
      { title: 'Avance Físico Detalle', path: '/progress-details' },
      { title: 'Personal & Cuadrillas', path: '/personnel-details' },
      { title: 'Flota & Equipos Pesados', path: '/modulos/flota' },
      { title: 'Logística & Rutas', path: '/logistics' },
      { title: 'Procura & Inventarios', path: '/inventory' },
      { title: 'Centro Sincronización', path: '/sync-center' },
    ],
  },
  {
    id: 'domain-engineering',
    title: 'Ingeniería & GIS',
    icon: Compass,
    modules: [
      { title: 'Visor BIM 3D', path: '/bim' },
      { title: 'Herramientas Cálculo', path: '/tools' },
      { title: 'Estimación APU & Cómputos', path: '/apu-estimation' },
      { title: 'Detalle Presupuestario', path: '/budget-details' },
      { title: 'Costos & Gastos', path: '/expenses' },
      { title: 'Valuaciones ROE', path: '/valuations' },
      { title: 'Centro Documental', path: '/documents' },
    ],
  },
  {
    id: 'domain-databook',
    title: 'Precomisionado & Databook',
    icon: Package,
    modules: [
      { title: 'Compilador Dossier Cierre', path: '/modulos/cierre' },
      { title: 'Standby & MOC', path: '/modulos/standby-moc' },
      { title: 'Interoperabilidad SAP/Primavera', path: '/modulos/interoperabilidad' },
      { title: 'Portal Clientes', path: '/client-portal-builder' },
    ],
  },
  {
    id: 'domain-brain',
    title: 'Project Brain',
    icon: BrainCircuit,
    modules: [
      { title: 'Dashboard Ejecutivo', path: '/' },
      { title: 'Consultor IA Brain', path: '/project-brain' },
      { title: 'Analítica Predictiva', path: '/intelligence' },
      { title: 'Chatbot Asistente', path: '/chat' },
      { title: 'Asistente de Voz', path: '/voice' },
      { title: 'Portafolio Obras', path: '/projects' },
      { title: 'Ajustes & System', path: '/settings' },
      { title: 'Consola SaaS Master', path: '/saas-console' },
    ],
  },
];

export const AppShell: React.FC = () => {
  const [user] = useAppAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrganization, projects, currentProject, setCurrentProject, userRole } = useProject();
  const { isDarkMode, toggleMode } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Background registration of kernel workflows
  useEffect(() => {
    import('../../workflows').then(({ ensureWorkflowsRegistered }) => {
      ensureWorkflowsRegistered();
    });
  }, []);

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Expand domain based on active route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeDomain = DOMAINS.find((d) =>
      d.modules.some((m) => m.path === currentPath || (m.path !== '/' && currentPath.startsWith(m.path)))
    );
    if (activeDomain) {
      setExpandedDomain(activeDomain.id);
    }
  }, [location.pathname]);

  // Compute Active Domain & Module for Breadcrumbs
  const currentPath = location.pathname;
  let activeDomainName = 'Project Brain';
  let activeModuleName = 'Dashboard Ejecutivo';

  for (const domain of DOMAINS) {
    const foundMod = domain.modules.find(
      (m) => m.path === currentPath || (m.path !== '/' && currentPath.startsWith(m.path))
    );
    if (foundMod) {
      activeDomainName = domain.title;
      activeModuleName = foundMod.title;
      break;
    }
  }

  const toggleDomain = (domainId: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedDomain(domainId);
    } else {
      setExpandedDomain((prev) => (prev === domainId ? null : domainId));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased transition-colors">
      {/* ===== HEADER FIJO (60px) ===== */}
      <header className="fixed top-0 inset-x-0 h-[60px] z-40 bg-[var(--bg-surface-1)] border-b border-[var(--border-default)] flex items-center justify-between px-2.5 sm:px-4 gap-1.5 sm:gap-3 shadow-xs">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo IC360-NEXUS */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 font-mono font-bold text-sm tracking-tight text-[var(--text-primary)] shrink-0 group"
            title="Ir al Panel Principal (Dashboard)"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-500)] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Layers size={16} />
            </div>
            <span className="font-extrabold text-sm sm:text-base">IC360-NEXUS</span>
          </Link>

          <span className="hidden lg:block text-[var(--border-default)] h-5 w-px" />

          {/* Organization & Project Selectors */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Org Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--text-primary)]">
              <Building2 size={14} className="text-[var(--color-brand-500)] shrink-0" />
              <span className="truncate max-w-[130px]">{currentOrganization?.name || 'Organización'}</span>
            </div>

            {/* Project Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded-lg text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer">
                <HardHat size={14} className="text-[var(--color-brand-500)] shrink-0" />
                <span className="truncate max-w-[160px] font-mono">
                  {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
                </span>
                <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Selección de Obra</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCurrentProject(CORPORATE_PORTFOLIO_PROJECT)}>
                  🏢 Portafolio Corporativo Consolidado
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {projects.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => setCurrentProject(p)}>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Section: Command Bar Trigger */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 min-w-0">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-muted)] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
              <Search size={14} className="text-[var(--text-muted)] shrink-0" />
              <span className="hidden sm:inline truncate">Buscar módulo, dominio o 'wf:043'...</span>
              <span className="sm:hidden text-[11px] truncate">Buscar...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Online/Offline Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border ${
              isOnline
                ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]'
                : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger-border)]'
            }`}
            title={isOnline ? 'Conectado a red' : 'Modo fuera de línea'}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="font-mono">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Verified Role Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg text-xs font-semibold text-[var(--text-secondary)]">
            <UserCheck size={13} className="text-[var(--color-brand-500)]" />
            <span className="font-mono text-[11px]">{ROLE_LABELS[userRole] || userRole}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleMode}
            className="p-1.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
          </button>

          {/* Notifications Bell */}
          <button
            className="p-1.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors relative cursor-pointer"
            title="Alertas & Notificaciones"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--status-warning-text)] rounded-full animate-pulse" />
          </button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'User'}`}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-[var(--border-default)] shrink-0"
                  referrerPolicy="no-referrer"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                <div className="px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  {userRole}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Ajustes de Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-[var(--status-danger-text)]">
                  <LogOut size={14} className="mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Command Bar Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* ===== BODY (SIDEBAR + MAIN) ===== */}
      <div className="flex flex-1 w-full pt-[60px] overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* SIDEBAR (220px / 64px) */}
        <aside
          className={`fixed md:static inset-y-[60px] left-0 z-30 bg-[var(--bg-surface-1)] border-r border-[var(--border-default)] flex flex-col transition-all duration-200 select-none ${
            mobileMenuOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full md:translate-x-0'
          } ${sidebarCollapsed ? 'md:w-[64px]' : 'md:w-[220px]'}`}
        >
          {/* Domains Accordion */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
            {/* Direct Home / Dashboard Link */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                currentPath === '/'
                  ? 'bg-[var(--color-brand-500)] text-white shadow-xs'
                  : 'bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)]'
              }`}
              title={sidebarCollapsed ? 'Panel Principal (Dashboard)' : undefined}
            >
              <div className="p-1 rounded-lg shrink-0">
                <LayoutDashboard size={18} />
              </div>
              {!sidebarCollapsed && (
                <span className="truncate">Panel Principal</span>
              )}
            </Link>

            <div className="my-1.5 border-b border-[var(--border-subtle)]" />

            {DOMAINS.map((domain) => {
              const DomainIcon = domain.icon;
              const isExpanded = expandedDomain === domain.id;
              const hasActiveModule = domain.modules.some(
                (m) => m.path === currentPath || (m.path !== '/' && currentPath.startsWith(m.path))
              );

              return (
                <div key={domain.id} className="space-y-0.5">
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      hasActiveModule
                        ? 'bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                    }`}
                    title={sidebarCollapsed ? domain.title : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg shrink-0">
                        <DomainIcon size={18} />
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate text-xs font-bold">{domain.title}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronRight
                        size={14}
                        className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Domain Submodules (if expanded) */}
                  {!sidebarCollapsed && isExpanded && (
                    <div className="pl-8 pr-1 py-1 space-y-0.5 border-l border-[var(--border-subtle)] ml-4">
                      {domain.modules.map((mod) => {
                        const isModActive =
                          mod.path === currentPath || (mod.path !== '/' && currentPath.startsWith(mod.path));

                        return (
                          <Link
                            key={mod.path}
                            to={mod.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors truncate ${
                              isModActive
                                ? 'bg-[var(--color-brand-500)] text-white font-bold shadow-xs'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]'
                            }`}
                          >
                            {mod.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Collapse Footer Toggle */}
          <div className="p-2 border-t border-[var(--border-subtle)] hidden md:block">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expandir Sidebar' : 'Colapsar Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </aside>

        {/* ===== MAIN CONTENT AREA WITH BREADCRUMBS ===== */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* QA & Environment Banners */}
          <QaBanner orgId={currentOrganization?.id} environment={currentOrganization?.environment} />
          <DemoBanner />
          <OfflineBanner />

          {/* BREADCRUMBS HEADER */}
          <div className="px-3 sm:px-4 md:px-6 py-2 bg-[var(--bg-surface-1)]/80 border-b border-[var(--border-subtle)] flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[var(--text-muted)] shrink-0 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className="flex items-center gap-1 font-bold text-[var(--color-brand-500)] hover:underline shrink-0"
              title="Ir al Panel Principal"
            >
              <Home size={13} />
              <span>Inicio</span>
            </Link>
            <ChevronRight size={12} className="shrink-0 text-[var(--border-default)]" />
            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[100px] sm:max-w-[140px]">
              {currentProject?.name || 'Proyecto'}
            </span>
            <ChevronRight size={12} className="shrink-0 text-[var(--border-default)]" />
            <span className="text-[var(--text-secondary)] truncate max-w-[100px] sm:max-w-none">{activeDomainName}</span>
            <ChevronRight size={12} className="shrink-0 text-[var(--border-default)]" />
            <span className="font-bold text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-none">{activeModuleName}</span>
          </div>

          {/* SCROLLABLE PAGE ROUTE OUTLET */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full space-y-6 w-full min-w-0 overflow-x-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
