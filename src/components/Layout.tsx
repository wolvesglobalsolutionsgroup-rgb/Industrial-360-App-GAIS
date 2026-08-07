import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  HardHat,
  ClipboardList,
  Package,
  Receipt,
  MessageSquare,
  Mic,
  Box,
  LogOut,
  Calculator,
  Settings as SettingsIcon,
  CircleDollarSign,
  Clock,
  PackageSearch,
  ShieldCheck,
  FileArchive,
  Database,
  Plug,
  Network,
  BrainCircuit,
  Briefcase,
  X,
  MapPin,
  Truck,
  ArrowLeftRight,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Flame,
  UserCheck,
  BookOpen,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { logout, useAppAuthState } from '../firebase';
import { useProject, UserRole } from '../ProjectContext';
import { ROLE_LABELS } from './ProtectedRoute';
import TopContextBar from './TopContextBar';
import { PROJECT_PHASES, getPhaseForPath } from './navigation/phaseNavigation';

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
  Settings: SettingsIcon,
  CircleDollarSign,
  Clock,
  PackageSearch,
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

export default function Layout() {
  const [user] = useAppAuthState();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { currentOrganization, userRole } = useProject();

  // Expanded state for each phase (defaulting to expanding the active phase)
  const activePhaseInfo = getPhaseForPath(location.pathname);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    [activePhaseInfo.phase.id]: true,
  });

  // Deferred background registration of kernel workflows
  useEffect(() => {
    import('./navigation/phaseNavigation').then(({ ensureWorkflowsRegisteredAsync }) => {
      ensureWorkflowsRegisteredAsync();
    });
  }, []);

  // Auto expand phase accordion when active route changes
  useEffect(() => {
    if (activePhaseInfo.phase?.id) {
      setExpandedPhases((prev) => ({
        ...prev,
        [activePhaseInfo.phase.id]: true,
      }));
    }
  }, [location.pathname]);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  return (
    <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden transition-colors duration-200">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 transition-opacity backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full bg-white dark:bg-slate-900 flex flex-col shadow-xl md:shadow-xs z-30 transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200/80 dark:border-slate-800 ${
          isMobile
            ? `w-80 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isSidebarOpen ? 'w-80' : 'w-[72px]'}`
        }`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Organization Header */}
          <div
            className={`p-4 flex items-center ${
              isSidebarOpen ? 'justify-between' : 'justify-center'
            } border-b border-gray-100 dark:border-slate-800 shrink-0`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-brand-500 text-white font-black rounded-xl flex items-center justify-center shrink-0 shadow-sm text-sm">
                IC
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-xs font-bold tracking-tight text-gray-900 dark:text-slate-100 truncate font-display">
                    {currentOrganization?.name || 'Industrial Control 360'}
                  </h1>
                  <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest truncate">
                    {currentOrganization?.taxId || 'CONTRATISTA REGISTRADA'}
                  </p>
                </div>
              )}
            </div>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl shrink-0"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Hierarchical Phase Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3 custom-scrollbar">
            {PROJECT_PHASES.map((phase) => {
              const PhaseIcon = ICON_MAP[phase.iconName] || HardHat;
              const isPhaseActive = activePhaseInfo.phase.id === phase.id;
              const isExpanded = expandedPhases[phase.id] ?? isPhaseActive;

              // Filter modules by role
              const visibleModules = phase.modules.filter((m) => {
                if (!m.allowedRoles || !userRole) return true;
                return m.allowedRoles.includes(userRole as UserRole);
              });

              if (visibleModules.length === 0) return null;

              return (
                <div
                  key={phase.id}
                  className={`rounded-2xl transition-all border ${
                    isPhaseActive
                      ? 'border-brand-500/30 bg-brand-500/5 dark:border-emerald-500/30 dark:bg-emerald-950/20'
                      : 'border-transparent'
                  }`}
                >
                  {/* Phase Accordion Header */}
                  {isSidebarOpen ? (
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        isPhaseActive
                          ? 'text-brand-500 dark:text-emerald-300 font-extrabold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                            isPhaseActive
                              ? 'bg-brand-500 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {phase.phaseNumber}
                        </div>
                        <div className="truncate min-w-0">
                          <span className="text-xs block truncate">{phase.shortTitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {visibleModules.length}
                        </span>
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </button>
                  ) : (
                    <div className="flex justify-center py-2" title={phase.title}>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-500 dark:text-emerald-400 font-black flex items-center justify-center text-xs">
                        P{phase.phaseNumber}
                      </div>
                    </div>
                  )}

                  {/* Modules inside Phase */}
                  {(isExpanded || !isSidebarOpen) && (
                    <div className={`mt-1 space-y-1 ${isSidebarOpen ? 'pl-2 pr-1 pb-2' : ''}`}>
                      {visibleModules.map((item) => {
                        const ItemIcon = ICON_MAP[item.iconName] || ClipboardList;
                        const isActive =
                          location.pathname === item.path ||
                          (item.workflowId && activePhaseInfo.workflowId === item.workflowId);

                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={handleLinkClick}
                            title={!isSidebarOpen ? item.title : undefined}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-xs ${
                              isSidebarOpen ? '' : 'justify-center px-0'
                            } ${
                              isActive
                                ? 'bg-brand-500 text-white font-black shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                            }`}
                          >
                            <ItemIcon
                              size={17}
                              className={`shrink-0 ${
                                isActive
                                  ? 'text-white dark:text-slate-950'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            {isSidebarOpen && (
                              <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shrink-0 ${
                                      isActive
                                        ? 'bg-white/20 text-white dark:bg-slate-950/30 dark:text-slate-950'
                                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile Info Footer */}
          {user && (
            <div className="p-3 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
              <div
                className={`flex items-center gap-3 ${
                  isSidebarOpen ? 'mb-2.5' : 'justify-center'
                }`}
              >
                <img
                  src={
                    user.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${
                      user.displayName || 'User'
                    }`
                  }
                  alt="User"
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                      {ROLE_LABELS[userRole] || userRole}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                title={!isSidebarOpen ? 'Cerrar Sesión' : undefined}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'justify-center gap-2 px-3 py-2 text-xs' : 'justify-center p-2'
                } font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors`}
              >
                <LogOut size={16} className="shrink-0" />
                {isSidebarOpen && <span>Cerrar Sesión</span>}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative h-full overflow-hidden">
        {/* Top Context Bar */}
        <header className="glass sticky top-0 z-20 border-b border-line">
          <TopContextBar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </header>

        {/* Router Outlet Container */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
