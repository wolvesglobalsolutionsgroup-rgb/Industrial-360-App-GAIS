import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Building,
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
import { useProject } from '../../ProjectContext';
import { getBreadcrumbsForPath } from './phaseNavigation';

// Icon Map for dynamic lookup
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Building,
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
};

interface BreadcrumbsProps {
  workflowState?: string;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ workflowState, className = '' }) => {
  const location = useLocation();
  const { currentProject } = useProject();

  const projectName = currentProject?.name || 'Proyecto Corporativo';
  const breadcrumbs = getBreadcrumbsForPath(location.pathname, projectName, workflowState);

  return (
    <nav
      aria-label="Navegación jerárquica por Fases"
      className={`flex items-center gap-1.5 overflow-x-auto py-1 text-xs custom-scrollbar ${className}`}
    >
      {breadcrumbs.map((item, idx) => {
        const IconComponent = item.iconName ? ICON_MAP[item.iconName] || HardHat : HardHat;
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight size={13} className="text-slate-400 dark:text-slate-600 shrink-0 mx-0.5" />
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <IconComponent size={14} className="text-brand-500 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-[220px]">{item.label}</span>
                </Link>
              ) : (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black ${
                    isLast
                      ? 'bg-brand-500/10 border-brand-500/20 text-brand-500 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <IconComponent size={14} className="shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{item.label}</span>

                  {item.badge && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-500 dark:bg-emerald-500/30 dark:text-emerald-300 ml-1">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
