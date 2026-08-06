import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, HardHat, ChevronDown, Wifi, WifiOff, RefreshCw, 
  UserCheck, Bell, Palette, Check, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, Tv, Monitor, SunMedium
} from 'lucide-react';
import { useProject, CORPORATE_PORTFOLIO_PROJECT, UserRole } from '../ProjectContext';
import { ROLE_LABELS } from './ProtectedRoute';
import { getPendingOfflineOperations, flushOfflineQueue } from '../lib/offline/syncEngine';
import { useTheme } from '../theme/ThemeContext';
import { THEME_PRESETS, ThemePresetId } from '../theme/themePresets';
import { useDisplayEnvironment, DisplayEnvironment } from '../theme/DisplayEnvironmentContext';
import Breadcrumbs from './navigation/Breadcrumbs';

export default function TopContextBar({ 
  isSidebarOpen, 
  setIsSidebarOpen 
}: { 
  isSidebarOpen: boolean; 
  setIsSidebarOpen: (open: boolean) => void;
}) {
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    currentOrganization, 
    userRole 
  } = useProject();

  const { 
    preset, 
    setPreset, 
    density, 
    setDensity, 
    borderRadius, 
    setBorderRadius, 
    isDarkMode,
    toggleMode,
    activeTheme 
  } = useTheme();

  const {
    displayEnvironment,
    setDisplayEnvironment,
    isCommandWall,
    burnInMitigation,
    toggleBurnInMitigation
  } = useDisplayEnvironment();

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Notifications mock state
  const notificationsList = [
    { id: '1', title: 'Permiso PTW Aprobado', desc: 'Permiso de Trabajo Caliente PTW-2026-089 en área de tanques.', time: 'Hace 10 min', type: 'success' },
    { id: '2', title: 'Alerta de Presupuesto', desc: 'Partida M-04 de tuberías alcanzó el 88% de ejecución.', time: 'Hace 45 min', type: 'warning' },
    { id: '3', title: 'Nuevas Juntas Registradas', desc: '14 Juntas NDT cargadas por Inspector QA/QC.', time: 'Hace 2 horas', type: 'info' }
  ];

  // Sync offline queue counter and network status
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateQueue = async () => {
      const pending = await getPendingOfflineOperations();
      setPendingQueueCount(pending.length);
    };

    updateQueue();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    window.addEventListener('ic360-offline-queue-changed', updateQueue);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('ic360-offline-queue-changed', updateQueue);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await flushOfflineQueue();
    const pending = await getPendingOfflineOperations();
    setPendingQueueCount(pending.length);
    setIsSyncing(false);
  };

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0 shadow-xs z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
          title={isSidebarOpen ? "Colapsar menú" : "Expandir menú"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} className="text-slate-600 dark:text-slate-300" />
          ) : (
            <PanelLeftOpen size={20} className="text-brand-500 dark:text-emerald-400" />
          )}
        </button>
        
        {/* Active Organization & Project Selector */}
        <div className="relative flex items-center gap-2">
          {/* Active Org Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
            <Building size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate max-w-[150px]">{currentOrganization?.name || 'Organización'}</span>
          </div>

          {/* Project Selector Button */}
          <div className="relative">
            <button 
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-colors text-xs font-semibold text-gray-800 dark:text-slate-100 shadow-2xs"
            >
              <HardHat size={15} className="text-emerald-600 shrink-0" />
              <span className="max-w-[140px] sm:max-w-[220px] truncate">
                {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
              </span>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>
            
            {isProjectMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsProjectMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 py-2 max-h-80 overflow-y-auto">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Modo de Vista</div>
                  
                  <button
                    onClick={() => {
                      setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
                      setIsProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 transition-colors ${
                      currentProject?.id === 'all' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' 
                        : 'text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">🏢 PORTAFOLIO CORPORATIVO (CONSOLIDADO)</span>
                  </button>

                  <div className="px-3.5 py-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Proyectos de la Organización</div>
                  {projects.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">No hay proyectos registrados. Crea uno en Gestión de Proyectos.</div>
                  ) : (
                    projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setCurrentProject(project);
                          setIsProjectMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                          currentProject?.id === project.id 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold' 
                            : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))
                  )}
                  <div className="border-t border-gray-100 dark:border-slate-800 mt-2 pt-2">
                    <Link 
                      to="/projects" 
                      onClick={() => setIsProjectMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 font-medium"
                    >
                      + Gestionar Proyectos
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Phase Breadcrumbs Navigation */}
        <div className="hidden md:flex items-center mx-2 flex-1 max-w-xl">
          <Breadcrumbs />
        </div>

        {/* Verified Role Badge */}
        <div className="relative hidden xl:block">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-semibold"
            title="Rol de usuario verificado mediante token JWT"
          >
            <UserCheck size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Rol JWT: {ROLE_LABELS[userRole] || userRole}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Display Environment, Light/Dark Toggle, Theme Selector, Notifications, Online/Offline Sync */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* S20 Display Environment Selector */}
        <div className="relative flex items-center gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-semibold text-gray-800 dark:text-slate-200 shadow-2xs">
          <label htmlFor="display-env-select" className="sr-only">Entorno de Pantalla</label>
          {displayEnvironment === 'command-wall' && <Tv size={15} className="text-sky-400 shrink-0" />}
          {displayEnvironment === 'workstation' && <Monitor size={15} className="text-emerald-500 shrink-0" />}
          {displayEnvironment === 'field-sunlight' && <SunMedium size={15} className="text-amber-500 shrink-0" />}

          <select
            id="display-env-select"
            aria-label="Entorno de Pantalla"
            value={displayEnvironment}
            onChange={(e) => setDisplayEnvironment(e.target.value as DisplayEnvironment)}
            className="bg-transparent text-xs font-bold text-gray-800 dark:text-slate-100 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500 rounded px-1 py-0.5"
          >
            <option value="workstation" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">Workstation 💻</option>
            <option value="command-wall" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">Command Wall 📺</option>
            <option value="field-sunlight" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">Campo al Sol ☀️</option>
          </select>

          {isCommandWall && (
            <button
              onClick={toggleBurnInMitigation}
              className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                burnInMitigation
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600/30 hover:text-slate-200'
              }`}
              title="Mitigación de Burn-In OLED (Pixel-Shift ±2px)"
              aria-label="Mitigación Burn-In OLED"
            >
              {burnInMitigation ? 'Burn-In: ON' : 'Burn-In: OFF'}
            </button>
          )}
        </div>

        {/* Quick Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 transition-all flex items-center justify-center cursor-pointer shadow-xs"
          title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-400 animate-spin-slow" /> : <Moon size={18} className="text-indigo-600" />}
        </button>

        {/* Quick Theme Selector Button */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Selector de Tema y Apariencia"
          >
            <Palette size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold hidden md:inline">{activeTheme.name}</span>
          </button>

          {isThemeMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsThemeMenuOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-84 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl z-30 p-4 space-y-4 text-xs backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                  <span className="font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-500" /> Temas & Paletas de Color
                  </span>
                  <button
                    onClick={toggleMode}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {isDarkMode ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-indigo-600" />}
                    <span>{isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </button>
                </div>

                {/* Presets List categorized */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Paletas de Color Disponibles
                    </label>
                    <div className="space-y-1.5">
                      {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((pKey) => {
                        const presetObj = THEME_PRESETS[pKey];
                        const isSelected = preset === pKey;
                        return (
                          <button
                            key={pKey}
                            onClick={() => {
                              setPreset(pKey);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-gray-900 dark:text-slate-100 shadow-2xs'
                                : 'border-gray-200/80 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Swatch dots */}
                              <div className="flex items-center -space-x-1 shrink-0">
                                <span className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-2xs" style={{ backgroundColor: presetObj.colors.bgApp }}></span>
                                <span className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-2xs" style={{ backgroundColor: presetObj.colors.colorPrimary }}></span>
                                <span className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-2xs" style={{ backgroundColor: presetObj.colors.colorSecondary }}></span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="block font-bold text-xs">{presetObj.name}</span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    presetObj.colors.isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {presetObj.colors.isDark ? 'Oscuro' : 'Claro'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick Density & Radius Controls */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 dark:text-slate-400 uppercase mb-1">Densidad</label>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
                      <button
                        onClick={() => setDensity('compact')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
                          density === 'compact' ? 'bg-white dark:bg-slate-700 shadow-xs text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Compacto
                      </button>
                      <button
                        onClick={() => setDensity('spacious')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
                          density === 'spacious' ? 'bg-white dark:bg-slate-700 shadow-xs text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Holgado
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 dark:text-slate-400 uppercase mb-1">Bordes</label>
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
                      <button
                        onClick={() => setBorderRadius('rounded')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
                          borderRadius === 'rounded' ? 'bg-white dark:bg-slate-700 shadow-xs text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Suaves
                      </button>
                      <button
                        onClick={() => setBorderRadius('sharp')}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-colors cursor-pointer ${
                          borderRadius === 'sharp' ? 'bg-white dark:bg-slate-700 shadow-xs text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Afilados
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Notifications Access */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 transition-colors relative"
            title="Centro de Alertas y Notificaciones"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100">Centro de Notificaciones</h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    {notificationsList.length} activas
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notificationsList.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                          {n.type === 'success' && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                          {n.type === 'warning' && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                          {n.type === 'info' && <ShieldCheck size={13} className="text-blue-500 shrink-0" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Offline / Background Sync Indicator */}
        <div className="flex items-center gap-2">
          <Link
            to="/sync-center"
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isOnline 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 animate-pulse hover:bg-amber-100 dark:hover:bg-amber-900/50'
            }`}
            title="Abrir Centro de Sincronización"
          >
            {isOnline ? (
              <>
                <Wifi size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">En Línea</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Modo Offline</span>
              </>
            )}
            {pendingQueueCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingQueueCount}
              </span>
            )}
          </Link>

          <Link
            to="/sync-center"
            title="Abrir Centro de Sincronización"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-brand-500' : ''} />
            <span className="hidden md:inline">Sync Center</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
