import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import IconRail from './IconRail';
import Topbar from './Topbar';
import ModulePanel from './ModulePanel';
import OfflineBanner from '../ui/OfflineBanner';
import DemoBanner from '../ui/DemoBanner';
import QaBanner from '../states/QaBanner';
import { useProject } from '../../ProjectContext';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModulePanelOpen, setIsModulePanelOpen] = useState(false);
  const { currentOrganization } = useProject();

  // Deferred background registration of kernel workflows
  React.useEffect(() => {
    import('../../workflows').then(({ ensureWorkflowsRegistered }) => {
      ensureWorkflowsRegistered();
    });
  }, []);

  const toggleModules = () => setIsModulePanelOpen(prev => !prev);

  return (
    <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden transition-colors duration-200">
      {/* Mobile IconRail Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* IconRail Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-30 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <IconRail onToggleModules={toggleModules} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* QA Environment Banner */}
        <QaBanner
          orgId={currentOrganization?.id}
          environment={currentOrganization?.environment}
        />

        {/* Topbar */}
        <Topbar 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onToggleModules={toggleModules}
        />

        {/* Demo Mode Persistent Banner */}
        <DemoBanner />

        {/* PWA Offline Banner */}
        <OfflineBanner />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Module Catalog Slide-Over Panel */}
      <ModulePanel 
        isOpen={isModulePanelOpen} 
        onClose={() => setIsModulePanelOpen(false)} 
      />
    </div>
  );
};

export default AppLayout;

