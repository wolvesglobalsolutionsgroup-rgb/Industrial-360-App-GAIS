import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, HardHat, ClipboardList, Package, Receipt, 
  MessageSquare, Mic, Box, LogOut, Calculator, Settings as SettingsIcon,
  CircleDollarSign, Clock, PackageSearch, ShieldCheck, FileArchive, 
  Database, Plug, Network, BrainCircuit, Briefcase, X, MapPin, Truck, ArrowLeftRight, Globe, RefreshCw
} from 'lucide-react';
import { logout, useAppAuthState } from '../firebase';
import { useProject } from '../ProjectContext';
import { ROLE_LABELS } from './ProtectedRoute';
import TopContextBar from './TopContextBar';

const coreOperativoItems = [
  { path: '/', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
  { path: '/projects', label: 'Gestión de Proyectos', icon: HardHat },
  { path: '/sync-center', label: 'Centro de Sincronización', icon: RefreshCw },
  { path: '/tasks', label: 'Control de Partidas', icon: ClipboardList },
  { path: '/field-reports', label: 'Reportes de Campo', icon: ClipboardList },
  { path: '/modulos/flota', label: 'Flota & Equipos Críticos', icon: Truck },
  { path: '/logistics', label: 'Logística y Mapa', icon: MapPin },
  { path: '/documents', label: 'Gestión Documental', icon: FileArchive },
  { path: '/valuations', label: 'Valuaciones ROE', icon: Receipt },
  { path: '/inventory', label: 'Inventario Base', icon: Package },
];

const ingenieriaQaqcItems = [
  { path: '/siho-ptw', label: 'Módulo SIHO-A & PTW', icon: ShieldCheck },
  { path: '/qa-qc-welding', label: 'QA/QC Juntas & NDT', icon: ShieldCheck },
  { path: '/modulos/ili-pigging', label: 'Integridad ILI Pigging', icon: Database },
  { path: '/modulos/interoperabilidad', label: 'Motor Interoperabilidad P6/BC3', icon: ArrowLeftRight },
  { path: '/bim', label: 'Visor BIM 3D', icon: Box },
  { path: '/tools', label: 'Herramientas Ing.', icon: Calculator },
  { path: '/modulos/tiempos', label: 'Mod 2: Tiempos y Recursos', icon: Clock },
  { path: '/modulos/qa-qc', label: 'Mod 4: QA/QC & Riesgos', icon: ShieldCheck },
];

const financieroLegalItems = [
  { path: '/expenses', label: 'Mod 1: Costos y Tesorería', icon: CircleDollarSign },
  { path: '/client-portal-builder', label: 'Portales Cliente B2B', icon: Globe },
  { path: '/modulos/procura', label: 'Mod 3: Procura & Salvamento', icon: PackageSearch },
  { path: '/modulos/standby-moc', label: 'Gestión Standby & MOC', icon: Clock },
  { path: '/modulos/cierre', label: 'Mod 5: Dossier As-Built', icon: FileArchive },
  { path: '/modulos/auditoria', label: 'Mod 6: Auditoría Blockchain', icon: Database },
];

const inteligenciaConectividadItems = [
  { path: '/project-brain', label: 'Cerebro del Proyecto (MCP)', icon: BrainCircuit },
  { path: '/intelligence', label: 'Mod 7: Inteligencia & RAG', icon: BrainCircuit },
  { path: '/chat', label: 'Asistente IA (RAG)', icon: MessageSquare },
  { path: '/voice', label: 'Chat de Voz Live', icon: Mic },
  { path: '/modulos/conectores', label: 'Mod 8: Conectores ERP', icon: Plug },
  { path: '/modulos/escalamiento', label: 'Mod 9: Escalamiento SLA', icon: Network },
  { path: '/modulos/benchmarking', label: 'Mod 10: Benchmarking', icon: BrainCircuit },
  { path: '/modulos/bi-ofertas', label: 'Mod 11: BI y Ofertas', icon: Briefcase },
  { path: '/settings', label: 'Configuración & Temas', icon: SettingsIcon },
];

export default function Layout() {
  const [user] = useAppAuthState();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { currentOrganization, userRole } = useProject();

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

  const renderNavGroup = (title: string, items: any[]) => (
    <div className="mb-5">
      {isSidebarOpen ? (
        <h3 className="px-4 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 transition-all font-display">
          {title}
        </h3>
      ) : (
        <div className="h-px bg-slate-200 dark:bg-slate-800 my-3 mx-3" />
      )}
      <div className="space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              title={!isSidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs ${
                isSidebarOpen ? '' : 'justify-center px-0'
              } ${
                isActive 
                  ? 'bg-brand-500/10 text-brand-500 dark:bg-emerald-500/15 dark:text-emerald-300 font-extrabold shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <Icon size={19} className={`shrink-0 ${isActive ? 'text-brand-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );

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
            ? `w-72 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isSidebarOpen ? 'w-72' : 'w-[72px]'}`
        }`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Organization Header */}
          <div className={`p-4 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} border-b border-gray-100 dark:border-slate-800 shrink-0`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-brand-500 text-white font-black rounded-xl flex items-center justify-center shrink-0 shadow-sm text-sm">
                IC
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-xs font-bold tracking-tight text-gray-900 dark:text-slate-100 truncate font-display">
                    {currentOrganization.name}
                  </h1>
                  <p className="text-[10px] text-brand-accent font-bold uppercase tracking-widest truncate">
                    {currentOrganization.taxId || 'CONTRATISTA REGISTRADA'}
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
          
          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            {renderNavGroup('Core Operativo', coreOperativoItems)}
            {renderNavGroup('Ingeniería & QA/QC', ingenieriaQaqcItems)}
            {renderNavGroup('Control Financiero & Legal', financieroLegalItems)}
            {renderNavGroup('Inteligencia & Conectividad', inteligenciaConectividadItems)}
          </nav>

          {/* User Profile Info Footer */}
          {user && (
            <div className="p-3 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
              <div className={`flex items-center gap-3 ${isSidebarOpen ? 'mb-2.5' : 'justify-center'}`}>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'User'}`} 
                  alt="User" 
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700 shrink-0" 
                  referrerPolicy="no-referrer" 
                />
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">{ROLE_LABELS[userRole] || userRole}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={logout}
                title={!isSidebarOpen ? "Cerrar Sesión" : undefined}
                className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2 px-3 py-2 text-xs' : 'justify-center p-2'} font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors`}
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
