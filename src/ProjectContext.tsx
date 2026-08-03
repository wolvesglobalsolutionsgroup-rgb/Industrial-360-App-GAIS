import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { seedDemoData } from './lib/seedDemoData';
import { DEMO_AUTH_ENABLED } from './config';
import { useAuthClaims } from './hooks/useAuthClaims';

export type UserRole = 'superadmin' | 'gerente' | 'supervisor' | 'inspector' | 'campo' | 'cliente_readonly';

export type ViewMode = 'single_project' | 'corporate_portfolio';

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  logoUrl?: string;
  description?: string;
  environment?: 'qa' | 'production';
}

export interface BrandKit {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  headerText: string;
  footerText: string;
  digitalSignatureUrl: string;
  authorizedSignerName: string;
  authorizedSignerTitle: string;
}

const defaultBrandKit: BrandKit = {
  companyName: 'CONTRATISTA OPERATIVA C.A.',
  taxId: 'RIF J-00000000-0',
  address: 'Zona Industrial - Edo. Anzoátegui, Venezuela',
  phone: '+58 (283) 000-0000',
  email: 'contacto@organizacion.com',
  website: 'www.organizacion.com',
  logoUrl: '',
  primaryColor: '#0B2239',
  secondaryColor: '#3CB179',
  headerText: 'REPORTES TÉCNICOS Y ENTREGABLES DE CAMPO',
  footerText: 'DOCUMENTO TÉCNICO EMITIDO BAJO ESTÁNDARES PDVSA / COVENIN / ASME.',
  digitalSignatureUrl: '',
  authorizedSignerName: 'Ing. Gerente de Operaciones',
  authorizedSignerTitle: 'Dirección General de Operaciones'
};

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  advancePercent?: number;
  budget?: number;
  orgId?: string;
}

export const CORPORATE_PORTFOLIO_PROJECT: Project = {
  id: 'all',
  name: '🏢 PORTAFOLIO CORPORATIVO',
  description: 'Consolidado ejecutivo, operativo y financiero de todos los proyectos de la organización',
  status: 'Activo',
  ownerId: 'org',
  orgId: ''
};

interface ProjectContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  userRole: UserRole;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isLoading: boolean;
  brandKit: BrandKit;
  updateBrandKit: (updated: Partial<BrandKit>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { role: claimRole, orgId: claimOrgId } = useAuthClaims();

  const userRole: UserRole = (
    ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly'].includes(claimRole || '')
      ? (claimRole as UserRole)
      : 'campo'
  );

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('ic360_organization');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return claimOrgId ? { id: claimOrgId, name: claimOrgId } : null;
  });

  useEffect(() => {
    if (claimOrgId && (!currentOrganization || claimOrgId !== currentOrganization.id)) {
      setCurrentOrganization(prev => ({ id: claimOrgId, name: prev?.name || claimOrgId, taxId: prev?.taxId, environment: prev?.environment }));
    }
  }, [claimOrgId]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(CORPORATE_PORTFOLIO_PROJECT);
  const [viewMode, setViewModeState] = useState<ViewMode>('corporate_portfolio');
  const [isLoading, setIsLoading] = useState(true);

  const [brandKit, setBrandKitState] = useState<BrandKit>(() => {
    const saved = localStorage.getItem('ic360_brandKit');
    if (saved) {
      try { return { ...defaultBrandKit, ...JSON.parse(saved) }; } catch { return defaultBrandKit; }
    }
    return defaultBrandKit;
  });

  const handleSetOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('ic360_organization', JSON.stringify(org));
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (mode === 'corporate_portfolio') {
      setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
      localStorage.setItem('currentProjectId', 'all');
    }
  };

  // Fetch brandKit and org metadata from Firestore
  useEffect(() => {
    const fetchOrgMetadata = async () => {
      if (!currentOrganization?.id) return;
      try {
        const snap = await getDoc(doc(db, 'organizations', currentOrganization.id));
        if (snap.exists()) {
          const rawData = snap.data();
          const env = (rawData?.environment === 'qa' ? 'qa' : 'production') as 'qa' | 'production';
          setCurrentOrganization(prev => prev ? ({
            ...prev,
            environment: env,
            name: rawData?.name || prev.name,
            taxId: rawData?.taxId || prev.taxId,
          }) : null);

          const brandData = rawData as BrandKit;
          const merged = { ...defaultBrandKit, ...brandData };
          setBrandKitState(merged);
          localStorage.setItem('ic360_brandKit', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Could not fetch brandKit/org metadata from Firestore:', err);
      }
    };
    fetchOrgMetadata();
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (!currentOrganization?.id) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    // Escuchar proyectos de la organización actual
    const projectsPath = `organizations/${currentOrganization.id}/projects`;
    const q = query(collection(db, projectsPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId === 'all' || !savedProjectId) {
        setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
        setViewModeState('corporate_portfolio');
      } else {
        const savedProject = projs.find(p => p.id === savedProjectId);
        if (savedProject) {
          setCurrentProject(savedProject);
          setViewModeState('single_project');
        } else {
          setCurrentProject(CORPORATE_PORTFOLIO_PROJECT);
          setViewModeState('corporate_portfolio');
        }
      }
      setIsLoading(false);
    }, (error) => {
      if (error?.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, 'projects');
      } else {
        console.warn('Firestore permission denied for projects collection.');
      }
      setProjects([]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentOrganization?.id]);

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
      if (project.id === 'all') {
        setViewModeState('corporate_portfolio');
      } else {
        setViewModeState('single_project');
      }
    } else {
      localStorage.removeItem('currentProjectId');
      setViewModeState('corporate_portfolio');
    }
  };

  const updateBrandKit = async (updated: Partial<BrandKit>) => {
    const newKit = { ...brandKit, ...updated };
    setBrandKitState(newKit);
    localStorage.setItem('ic360_brandKit', JSON.stringify(newKit));
    if (currentOrganization?.id) {
      try {
        await setDoc(doc(db, 'organizations', currentOrganization.id), newKit, { merge: true });
        await setDoc(doc(db, 'settings', 'brandKit'), newKit, { merge: true });
      } catch (err) {
        console.warn('Could not save brandKit to Firestore:', err);
      }
    }
  };

  return (
    <ProjectContext.Provider value={{
      currentOrganization,
      setCurrentOrganization: handleSetOrganization,
      projects,
      currentProject,
      setCurrentProject: handleSetCurrentProject,
      userRole,
      viewMode,
      setViewMode: handleSetViewMode,
      isLoading,
      brandKit,
      updateBrandKit
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
