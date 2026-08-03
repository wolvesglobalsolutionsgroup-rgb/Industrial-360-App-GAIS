import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, 
  HardHat, 
  ChevronDown, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Palette, 
  Check, 
  Sparkles, 
  LogOut, 
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Grid3x3
} from 'lucide-react';
import { useProject, CORPORATE_PORTFOLIO_PROJECT, UserRole } from '../../ProjectContext';
import { ROLE_LABELS } from '../ProtectedRoute';
import { useTheme } from '../../theme/ThemeContext';
import { THEME_PRESETS, ThemePresetId } from '../../theme/themePresets';
import { logout, useAppAuthState } from '../../firebase';

export interface TopbarProps {
  onToggleMobileMenu?: () => void;
  onToggleModules?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu, onToggleModules, className = '' }) => {
  const [user] = useAppAuthState();
  const navigate = useNavigate();
  const { projects, currentProject, setCurrentProject, currentOrganization, userRole } = useProject();
  const { preset, setPreset, isDarkMode, toggleMode, activeTheme } = useTheme();

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationsList = [
    { id: '1', title: 'Permiso PTW Aprobado', desc: 'Permiso de Trabajo PTW-2026-089 en área de tanques.', time: '10m', type: 'success' },
    { id: '2', title: 'Alerta Presupuestaria', desc: 'Partida M-04 tubería alcanzó el 88% de costo.', time: '45m', type: 'warning' },
    { id: '3', title: 'Juntas NDT Registradas', desc: '14 Juntas de soldadura cargadas por inspector QA/QC.', time: '2h', type: 'info' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={`h-16 bg-surface/90 border-b border-line backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 transition-colors ${className}`}>
      {/* Left: Mobile Toggle + Org & Project Selector */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Active Organization Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink">
          <Building size={14} className="text-brand-600 dark:text-brand-300 shrink-0" />
          <span className="truncate max-w-[150px]">{currentOrganization?.name || 'Organización'}</span>
        </div>

        {/* Project Selector Button */}
        <div className="relative">
          <button 
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className="flex items-center gap-2 bg-surface-2 hover:bg-surface-2/80 border border-line px-3 py-1.5 rounded-xl transition-all text-xs font-bold text-ink shadow-2xs cursor-pointer"
          >
            <HardHat size={15} className="text-brand-600 dark:text-brand-300 shrink-0" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-display">
              {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
            </span>
            <ChevronDown size={14} className="text-ink-faint shrink-0" />
          </button>
          
          {isProjectMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsProjectMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-80 bg-surface border border-line rounded-2xl shadow-lift z-30 py-2 max-h-80 overflow-y-auto">
                <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-ink-faint uppercase tracking-wider">
                  Modo de Vista
                </div>
                
                <button
                  onClick={() => {
                    setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
                    setIsProjectMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border-b border-line transition-colors cursor-pointer ${
                    currentProject?.id === 'all' 
                      ? 'bg-brand-500/10 text-brand-500' 
                      : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  <Building size={16} className="text-brand-500 shrink-0" />
                  <span className="truncate">🏢 PORTAFOLIO CORPORATIVO (CONSOLIDADO)</span>
                </button>

                <div className="px-3.5 py-2 text-[10px] font-extrabold text-ink-faint uppercase tracking-wider">
                  Proyectos de la Organización
                </div>
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-ink-soft">
                    No hay proyectos registrados.
                  </div>
                ) : (
                  projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setCurrentProject(project);
                        setIsProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                        currentProject?.id === project.id 
                          ? 'bg-brand-500/10 text-brand-500 font-bold' 
                          : 'text-ink hover:bg-surface-2'
                      }`}
                    >
                      {project.name}
                    </button>
                  ))
                )}
                <div className="border-t border-line mt-2 pt-2">
                  <Link 
                    to="/projects" 
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-brand-500 hover:bg-surface-2 font-bold"
                  >
                    + Gestionar Proyectos
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full">
        <Search size={15} className="absolute left-3 text-ink-faint pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar partida WBS, documento, PTW..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-500 transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Catálogo Módulos Button */}
        {onToggleModules && (
          <button
            onClick={onToggleModules}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Ver catálogo con todos los módulos (31)"
          >
            <Grid3x3 size={15} />
            <span className="hidden sm:inline font-display">Módulos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full brand-gradient text-white font-extrabold">31</span>
          </button>
        )}

        {/* Verified JWT Role Badge */}
        <div className="relative hidden xl:block">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold"
            title="Rol verificado por JWT"
          >
            <UserCheck size={14} />
            <span>Rol JWT: {ROLE_LABELS[userRole] || userRole}</span>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-xl bg-surface-2 hover:bg-surface-2/80 border border-line text-ink transition-all cursor-pointer"
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
        </button>

        {/* Palette Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-xl bg-surface-2 hover:bg-surface-2/80 border border-line text-ink transition-all flex items-center gap-1.5 cursor-pointer"
            title="Paleta de Colores"
          >
            <Palette size={17} className="text-brand-500" />
            <span className="text-xs font-bold hidden lg:inline">{activeTheme.name}</span>
          </button>

          {isThemeMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsThemeMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-line rounded-2xl shadow-lift z-30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="font-extrabold text-ink text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Temas y Paletas
                  </span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((pKey) => {
                    const presetObj = THEME_PRESETS[pKey];
                    const isSelected = preset === pKey;
                    return (
                      <button
                        key={pKey}
                        onClick={() => {
                          setPreset(pKey);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 font-bold text-ink'
                            : 'border-line hover:bg-surface-2 text-ink-soft'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center -space-x-1 shrink-0">
                            <span className="w-3.5 h-3.5 rounded-full border border-line" style={{ backgroundColor: presetObj.colors.bgApp }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-line" style={{ backgroundColor: presetObj.colors.colorPrimary }} />
                          </div>
                          <span className="text-xs">{presetObj.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-brand-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl bg-surface-2 hover:bg-surface-2/80 border border-line text-ink transition-all relative cursor-pointer"
            title="Notificaciones"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-line rounded-2xl shadow-lift z-30 p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <h4 className="font-extrabold text-xs text-ink">Alertas del Proyecto</h4>
                  <span className="text-[10px] font-extrabold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    {notificationsList.length}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {notificationsList.map(n => (
                    <div key={n.id} className="p-2 rounded-xl bg-surface-2 border border-line space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink flex items-center gap-1 text-[11px]">
                          {n.type === 'success' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                          {n.type === 'warning' && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                          {n.type === 'info' && <ShieldCheck size={12} className="text-blue-500 shrink-0" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-ink-faint">{n.time}</span>
                      </div>
                      <p className="text-[10px] text-ink-soft">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar / Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-2 transition-all cursor-pointer"
            >
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'User'}`} 
                alt="User" 
                className="w-8 h-8 rounded-full border border-line shrink-0" 
                referrerPolicy="no-referrer" 
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-line rounded-2xl shadow-lift z-30 p-3 space-y-2">
                  <div className="pb-2 border-b border-line">
                    <p className="text-xs font-bold text-ink truncate">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-brand-500 font-extrabold uppercase">{ROLE_LABELS[userRole] || userRole}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block text-xs font-semibold text-ink-soft hover:text-ink px-2 py-1.5 rounded-lg hover:bg-surface-2"
                  >
                    Ajustes de Perfil
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10 px-2 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
