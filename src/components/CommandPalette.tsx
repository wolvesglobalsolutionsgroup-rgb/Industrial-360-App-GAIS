import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LayoutDashboard, FolderKanban, CheckSquare, DollarSign, FileCheck2, 
  MapPin, ShieldAlert, Flame, Wrench, FileArchive, BookOpen, Cpu, BrainCircuit, 
  Settings, UserCheck, X, Command, LucideIcon, Crown
} from 'lucide-react';
import { useAuthClaims } from '../hooks/useAuthClaims';
import { UserRole } from '../ProjectContext';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard Principal', category: 'Navegación', path: '/', icon: LayoutDashboard },
  { id: 'proj', title: 'Proyectos & Obras', category: 'Gestión', path: '/projects', icon: FolderKanban },
  { id: 'tasks', title: 'Control de Tareas Kanban', category: 'Gestión', path: '/tasks', icon: CheckSquare },
  { id: 'expenses', title: 'Costos & Compras (Opex/Capex)', category: 'Finanzas', path: '/expenses', icon: DollarSign, allowedRoles: ['superadmin', 'gerente', 'supervisor'] },
  { id: 'valuations', title: 'Valuaciones de Obra', category: 'Finanzas', path: '/valuations', icon: FileCheck2, allowedRoles: ['superadmin', 'gerente'] },
  { id: 'field', title: 'Partes Diarios de Campo', category: 'Operaciones', path: '/field-reports', icon: MapPin },
  { id: 'logistics', title: 'Mapa Logístico GPS & Rutas', category: 'Operaciones', path: '/logistics', icon: MapPin },
  { id: 'ptw', title: 'Permisos de Trabajo SIHO (PTW)', category: 'Seguridad', path: '/siho-ptw', icon: ShieldAlert },
  { id: 'welding', title: 'Control QA/QC Soldadura (Juntas)', category: 'Calidad', path: '/qa-qc-welding', icon: Flame },
  { id: 'ili', title: 'Integridad & Corrida de Porcinos ILI', category: 'Calidad', path: '/modulos/ili-pigging', icon: ShieldAlert },
  { id: 'tools', title: 'Calculadoras de Ingeniería (ASME/API)', category: 'Ingeniería', path: '/tools', icon: Wrench },
  { id: 'hot-tap', title: 'Hot Tap & Stopple (PAMS)', category: 'Ingeniería', path: '/hot-tap', icon: Flame },
  { id: 'docs', title: 'Gestión Documental', category: 'Documentos', path: '/documents', icon: FileArchive },
  { id: 'dossier', title: 'Cierre & Dossier de Calidad', category: 'Documentos', path: '/modulos/cierre', icon: BookOpen },
  { id: 'interop', title: 'Interoperabilidad (Primavera/SAP)', category: 'Sistemas', path: '/modulos/interoperabilidad', icon: Cpu, allowedRoles: ['superadmin', 'gerente'] },
  { id: 'brain', title: 'Project Brain (Asistente IA)', category: 'Inteligencia', path: '/project-brain', icon: BrainCircuit },
  { id: 'portal', title: 'Portal de Clientes', category: 'Configuración', path: '/client-portal-builder', icon: UserCheck, allowedRoles: ['superadmin', 'gerente'] },
  { id: 'settings', title: 'Ajustes del Sistema & Marca', category: 'Configuración', path: '/settings', icon: Settings, allowedRoles: ['superadmin', 'gerente'] },
  { id: 'platform-console', title: 'Consola SaaS Platform Owner', category: 'SuperAdmin', path: '/saas-console', icon: Crown, allowedRoles: ['superadmin'] },
];

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
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered commands by search string AND user JWT role
  const filteredCommands = COMMAND_ITEMS.filter(cmd => {
    const matchesSearch = 
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase());

    const hasRoleAccess = !cmd.allowedRoles || cmd.allowedRoles.includes(userRole);

    return matchesSearch && hasRoleAccess;
  });

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      navigate(filteredCommands[selectedIndex].path);
      setIsOpen(false);
      setSearch('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md transition-all">
      <div 
        className="bg-surface border border-line rounded-3xl shadow-lift w-full max-w-xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-line gap-3">
          <Search size={18} className="text-ink-faint shrink-0" />
          <input 
            type="text" 
            autoFocus
            placeholder="Buscar módulo, herramienta o sección... (ej: 'Hot Tap', 'Dossier')"
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

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-faint font-medium">
              No se encontraron resultados permitidos para "{search}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    navigate(cmd.path);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-accent/15 text-brand-accent font-bold' 
                      : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-brand-accent text-white' : 'bg-surface-2 text-ink-soft'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{cmd.title}</span>
                      <span className="text-[10px] text-ink-faint uppercase font-mono font-semibold">{cmd.category}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint">{cmd.path}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-surface-2 border-t border-line px-4 py-2.5 flex justify-between items-center text-[10px] text-ink-faint font-mono">
          <span>Industrial Control 360 • Búsqueda Rápida ({userRole})</span>
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
