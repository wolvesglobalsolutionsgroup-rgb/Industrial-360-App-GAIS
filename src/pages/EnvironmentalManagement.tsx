import React, { useState, useEffect } from 'react';
import { 
  Trees, ShieldAlert, FileText, Truck, Droplets, Plus, Search, 
  Download, CheckCircle2, XCircle, AlertTriangle, Calendar, Printer, 
  Building2, Sparkles, ClipboardCheck, Activity, Trash2, Filter, RefreshCw
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { environmentalAspectsRepo, rasdaManifestsRepo, environmentalInspectionsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { useRequiredProject } from '../hooks/useRequiredProject';
import { generateRegulatoryCode } from '../lib/regulatoryIdsClient';

import { queueOfflineOperation } from '../lib/offline/syncEngine';
import jsPDF from 'jspdf';

export interface EnvironmentalAspect {
  id: string;
  activity: string; // e.g. Mantenimiento de Maquinaria Pesada / Soldadura de Tubería
  aspect: string; // e.g. Generación de aceite usado y filtros contaminados
  environmentalImpact: string; // e.g. Contaminación de suelo y acuíferos
  significance: 'Alto' | 'Medio' | 'Bajo';
  mitigationMeasure: string; // e.g. Almacenamiento en tambores con trampa y fosa RASDA
  normRef: string; // e.g. PDVSA MA-01-02-12 / Ley de Sustancias Peligrosas
  responsible: string;
  status: 'Implementado' | 'En Proceso' | 'Pendiente';
}

export interface RasdaManifest {
  id: string;
  manifestNumber: string; // e.g. MAN-RASDA-2026-089
  wasteType: 'Aceite Usado' | 'Lodos de Perforación / Trampa' | 'Aguas de Producción' | 'Trapos/Filtros Impregnados' | 'Desechos Sólidos Industriales';
  volumeAmount: number;
  unit: 'Litros' | 'm³' | 'Tambores (208L)' | 'Kg';
  rasdaGenerator: string; // e.g. RASDA-G-2026-9041
  transporterName: string; // e.g. Transporte Yaguare C.A.
  rasdaTransporter: string;
  disposalSite: string; // e.g. Planta de Tratamiento Relleno Sanitario Jusepín
  disposalCertificateNo: string;
  dispatchDate: string;
  status: 'Emitido' | 'En Tránsito' | 'Dispuesto y Certificado';
}

export interface EquipmentInspection {
  id: string;
  equipmentTag: string; // e.g. GEN-04 / EXCAV-02
  equipmentType: string; // e.g. Generador Diesel 250 kVA
  greaseTrapOk: boolean; // Trampa de grasa / separador API limpio
  spillTrayOk: boolean; // Bandeja de contención secundaria 110%
  oilLeaksOk: boolean; // Fugas de hidrocarburos/refrigerante
  extinguisherOk: boolean;
  inspectorName: string;
  date: string;
  comments: string;
}

const SAMPLE_PGA_ASPECTS: EnvironmentalAspect[] = [
  {
    id: 'pga_1',
    activity: 'Limpieza e Inspección de Trampas de Grasa en Taller',
    aspect: 'Generación de lodos de hidrocarburo retenidos',
    environmentalImpact: 'Riesgo de infiltración en subsuelo y freático',
    significance: 'Alto',
    mitigationMeasure: 'Extracción programada con camión vacum y retención temporal en tanques cónicos RASDA',
    normRef: 'PDVSA MA-01-02-12 Secc 4.2',
    responsible: 'Ing. Gustavo Alarcón (Ambiente)',
    status: 'Implementado'
  },
  {
    id: 'pga_2',
    activity: 'Drenaje de Condensados en Motocompresor Diesel',
    aspect: 'Efluentes de agua con trazas de aceite mineral',
    environmentalImpact: 'Alteración de calidad de agua superficial',
    significance: 'Medio',
    mitigationMeasure: 'Instalación de skimmer y trampa coalescente antes de descarga autorizada',
    normRef: 'PDVSA MA-02-01-12 Anexo A',
    responsible: 'Sup. Técnico Medina',
    status: 'Implementado'
  },
  {
    id: 'pga_3',
    activity: 'Cambio de Lubricante y Filtros en Flota Pesada',
    aspect: 'Generación de filtros usados y estopas impregnadas',
    environmentalImpact: 'Contaminación por residuos peligrosos sólidos',
    significance: 'Alto',
    mitigationMeasure: 'Segregación en tambores identificados con código de color y despacho a gestor RASDA',
    normRef: 'Ley de Sustancias, Materiales y Desechos Peligrosos Art. 45',
    responsible: 'Mecánico Jefe Ramos',
    status: 'Implementado'
  }
];

const SAMPLE_RASDA_MANIFESTS: RasdaManifest[] = [
  {
    id: 'rasda_101',
    manifestNumber: 'RASDA-2026-0041',
    wasteType: 'Aceite Usado',
    volumeAmount: 2400,
    unit: 'Litros',
    rasdaGenerator: 'RASDA-G-MONAGAS-9812',
    transporterName: 'EcoServicios Industriales C.A.',
    rasdaTransporter: 'RASDA-T-2025-4412',
    disposalSite: 'Planta Recicladora de Lubricantes Maturín',
    disposalCertificateNo: 'CERT-DISP-88219',
    dispatchDate: '2026-07-28',
    status: 'Dispuesto y Certificado'
  },
  {
    id: 'rasda_102',
    manifestNumber: 'RASDA-2026-0042',
    wasteType: 'Lodos de Perforación / Trampa',
    volumeAmount: 18,
    unit: 'm³',
    rasdaGenerator: 'RASDA-G-MONAGAS-9812',
    transporterName: 'Vacum O&G Servicios PLC',
    rasdaTransporter: 'RASDA-T-2026-0122',
    disposalSite: 'Centro de Tratamiento Landfarming San Tomé',
    disposalCertificateNo: 'EN-TRAMITE-002',
    dispatchDate: '2026-07-29',
    status: 'En Tránsito'
  }
];

const SAMPLE_INSPECTIONS: EquipmentInspection[] = [
  {
    id: 'insp_1',
    equipmentTag: 'GEN-CAT-3512',
    equipmentType: 'Generador Diesel 500 kVA',
    greaseTrapOk: true,
    spillTrayOk: true,
    oilLeaksOk: true,
    extinguisherOk: true,
    inspectorName: 'Ing. Carlos Mendoza',
    date: '2026-07-29',
    comments: 'Bandeja de contención limpia. Capacidad al 110% de tanque operativo.'
  },
  {
    id: 'insp_2',
    equipmentTag: 'GRUA-GROVE-50T',
    equipmentType: 'Grúa Telescópica 50 Ton',
    greaseTrapOk: true,
    spillTrayOk: false,
    oilLeaksOk: false,
    extinguisherOk: true,
    inspectorName: 'Ing. Carlos Mendoza',
    date: '2026-07-29',
    comments: 'Goteo leve en manguera hidráulica de pluma. Requiere corrección antes de continuar maniobra.'
  }
];

export default function EnvironmentalManagement() {
  const { currentProject, currentOrganization } = useProject();
  const { orgId, projectId: projId } = useRequiredProject();

  const [activeTab, setActiveTab] = useState<'pga' | 'rasda' | 'equipment'>('pga');
  const [aspects, setAspects] = useState<EnvironmentalAspect[]>(SAMPLE_PGA_ASPECTS);
  const [manifests, setManifests] = useState<RasdaManifest[]>(SAMPLE_RASDA_MANIFESTS);
  const [inspections, setInspections] = useState<EquipmentInspection[]>(SAMPLE_INSPECTIONS);

  // Modals
  const [showAspectModal, setShowAspectModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Form States - Aspect
  const [newActivity, setNewActivity] = useState('');
  const [newAspect, setNewAspect] = useState('');
  const [newImpact, setNewImpact] = useState('');
  const [newSignificance, setNewSignificance] = useState<'Alto' | 'Medio' | 'Bajo'>('Medio');
  const [newMitigation, setNewMitigation] = useState('');

  // Form States - Manifest
  const [newManifestNo, setNewManifestNo] = useState(`RASDA-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);

  const [newWasteType, setNewWasteType] = useState<RasdaManifest['wasteType']>('Aceite Usado');
  const [newVolume, setNewVolume] = useState<number>(208);
  const [newUnit, setNewUnit] = useState<RasdaManifest['unit']>('Litros');
  const [newTransporter, setNewTransporter] = useState('EcoServicios C.A.');
  const [newRasdaTransporter, setNewRasdaTransporter] = useState('RASDA-T-2026-092');

  // Form States - Inspection
  const [newEquipTag, setNewEquipTag] = useState('');
  const [newEquipType, setNewEquipType] = useState('Generador Diesel');
  const [greaseTrapOk, setGreaseTrapOk] = useState(true);
  const [spillTrayOk, setSpillTrayOk] = useState(true);
  const [oilLeaksOk, setOilLeaksOk] = useState(true);

  // Fetch Firestore Data via Repositories (limit(50))
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const unsubAspects = environmentalAspectsRepo.subscribe(orgId, currentProject.id, (items) => {
      setAspects(items as unknown as EnvironmentalAspect[]);
    }, undefined, { limitCount: 50 });

    const unsubManifests = rasdaManifestsRepo.subscribe(orgId, currentProject.id, (items) => {
      setManifests(items as unknown as RasdaManifest[]);
    }, undefined, { limitCount: 50 });

    const unsubInspections = environmentalInspectionsRepo.subscribe(orgId, currentProject.id, (items) => {
      setInspections(items as unknown as EquipmentInspection[]);
    }, undefined, { limitCount: 50 });

    return () => {
      unsubAspects();
      unsubManifests();
      unsubInspections();
    };
  }, [currentProject, orgId]);

  // Create Environmental Aspect
  const handleCreateAspect = async (e: React.FormEvent) => {
    e.preventDefault();
    const aspectData: Omit<EnvironmentalAspect, 'id'> = {
      activity: newActivity,
      aspect: newAspect,
      environmentalImpact: newImpact,
      significance: newSignificance,
      mitigationMeasure: newMitigation,
      normRef: 'PDVSA MA-01-02-12 / MA-02-01-12',
      responsible: 'Coordinador SIAHO Ambientista',
      status: 'Implementado'
    };

    if (currentProject && currentProject.id !== 'all') {
      const envPath = `organizations/${orgId}/projects/${currentProject.id}/environmental_aspects`;
      try {
        const docRef = await addDoc(collection(db, envPath), {
          ...aspectData,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setAspects(prev => [...prev, { id: docRef.id, ...aspectData }]);
      } catch (err) {
        await queueOfflineOperation('environmental_aspects', 'create', { ...aspectData, orgId, projectId: currentProject.id });
        setAspects(prev => [...prev, { id: `env_off_${Date.now()}`, ...aspectData }]);
      }
    } else {
      setAspects(prev => [...prev, { id: `env_local_${Date.now()}`, ...aspectData }]);
    }

    setShowAspectModal(false);
    setNewActivity('');
    setNewAspect('');
    setNewImpact('');
    setNewMitigation('');
  };

  // Create RASDA Manifest
  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    const manifestData: Omit<RasdaManifest, 'id'> = {
      manifestNumber: newManifestNo,
      wasteType: newWasteType,
      volumeAmount: Number(newVolume),
      unit: newUnit,
      rasdaGenerator: `RASDA-G-${orgId.toUpperCase()}-001`,
      transporterName: newTransporter,
      rasdaTransporter: newRasdaTransporter,
      disposalSite: 'Planta de Tratamiento & Disposición Autorizada PDVSA',
      disposalCertificateNo: `CERT-RASDA-${Date.now().toString().slice(-5)}`,
      dispatchDate: new Date().toISOString().split('T')[0],
      status: 'En Tránsito'
    };

    if (currentProject && currentProject.id !== 'all') {
      const rasdaPath = `organizations/${orgId}/projects/${currentProject.id}/rasda_manifests`;
      try {
        const docRef = await addDoc(collection(db, rasdaPath), {
          ...manifestData,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setManifests(prev => [...prev, { id: docRef.id, ...manifestData }]);
      } catch (err) {
        await queueOfflineOperation('rasda_manifests', 'create', { ...manifestData, orgId, projectId: currentProject.id });
        setManifests(prev => [...prev, { id: `rasda_off_${Date.now()}`, ...manifestData }]);
      }
    } else {
      setManifests(prev => [...prev, { id: `rasda_local_${Date.now()}`, ...manifestData }]);
    }

    setShowManifestModal(false);
  };

  // Export RASDA Manifest PDF
  const exportManifestPdf = (m: RasdaManifest) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MANIFIESTO DE TRAZA DE DESECHOS PELIGROSOS', 14, 12);
    doc.setFontSize(9);
    doc.text(`REGISTRO DE ACTIVIDADES CAPACES DE DEGRADAR EL AMBIENTE (RASDA) - PDVSA MA-01-02-12`, 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`N° Manifiesto: ${m.manifestNumber}`, 14, 35);
    doc.text(`Fecha Despacho: ${m.dispatchDate}`, 130, 35);

    doc.setLineWidth(0.5);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 38, 196, 38);

    // Section 1: Generator
    doc.setFontSize(11);
    doc.text('1. DATOS DEL GENERADOR DE DESECHOS', 14, 46);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Organización: ${currentOrganization?.name || 'Consorcio O&G Campo Sur'}`, 14, 53);
    doc.text(`Proyecto: ${currentProject?.name || 'Mantenimiento de Tuberías y Estaciones'}`, 14, 59);
    doc.text(`Registro RASDA Generador: ${m.rasdaGenerator}`, 14, 65);

    // Section 2: Waste Description
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. CARACTERIZACIÓN DEL DESECHO Y VOLUMEN', 14, 76);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo de Desecho: ${m.wasteType}`, 14, 83);
    doc.text(`Volumen / Cantidad: ${m.volumeAmount} ${m.unit}`, 14, 89);
    doc.text(`Clasificación Peligrosidad: Inflamable / Tóxico / Contaminante Hidrocarburo`, 14, 95);

    // Section 3: Transporter & Disposal
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. EMPRESA TRANSPORTISTA Y SITIO DE DISPOSICIÓN', 14, 106);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa Transportista: ${m.transporterName}`, 14, 113);
    doc.text(`RASDA Transportista: ${m.rasdaTransporter}`, 14, 119);
    doc.text(`Lugar de Disposición Final: ${m.disposalSite}`, 14, 125);
    doc.text(`Certificado Disposición: ${m.disposalCertificateNo}`, 14, 131);

    // Signatures
    doc.line(14, 160, 196, 160);
    doc.text('_______________________', 20, 180);
    doc.text('Firma Inspectora Ambientista', 20, 186);
    doc.text('_______________________', 130, 180);
    doc.text('Firma Transportista RASDA', 130, 186);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Industrial Control 360 - Documento generado bajo estricto cumplimiento PDVSA MA-01-02-12 y Anexo A.', 14, 280);

    doc.save(`Manifiesto_RASDA_${m.manifestNumber}.pdf`);
  };

  // Metrics
  const totalAspects = aspects.length;
  const totalVolumeLitros = manifests
    .filter(m => m.unit === 'Litros' || m.unit === 'Tambores (208L)')
    .reduce((acc, m) => acc + (m.unit === 'Litros' ? m.volumeAmount : m.volumeAmount * 208), 0);
  const totalVolumeM3 = manifests
    .filter(m => m.unit === 'm³')
    .reduce((acc, m) => acc + m.volumeAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Trees size={22} />
            </span>
            <h1 className="text-xl font-extrabold text-ink font-display">
              Gestión Ambiental & Desechos Peligrosos (PGA / RASDA)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              PDVSA MA-01-02-12
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Matriz de Aspectos e Impactos Ambientales (Anexo A), Manifiestos de Traza RASDA y Control de Trampas de Grasa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pga' && (
            <button
              onClick={() => setShowAspectModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Nuevo Aspecto Ambiental
            </button>
          )}

          {activeTab === 'rasda' && (
            <button
              onClick={() => setShowManifestModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Emitir Manifiesto RASDA
            </button>
          )}
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Aspectos Matriz PGA</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{totalAspects}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Medidas de mitigación activas</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ClipboardCheck size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Aceites / Líquidos Dispuestos</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{totalVolumeLitros.toLocaleString()} L</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">Trazabilidad en manifiestos</p>
          </div>
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Droplets size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Lodos & Aguas (Volumen)</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{totalVolumeM3} m³</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Retenidos e inoculados</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Truck size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Cumplimiento Normativo</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">100%</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Auditoría SIHO-A Aprobada</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setActiveTab('pga')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'pga'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Plan de Gestión Ambiental (PGA - Matriz Anexo A)
        </button>

        <button
          onClick={() => setActiveTab('rasda')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'rasda'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Manifiestos de Traza RASDA (Desechos Peligrosos)
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'equipment'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Checklist Trampas de Grasa & Maquinaria
        </button>
      </div>

      {/* TAB 1: PGA MATRIX */}
      {activeTab === 'pga' && (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Trees size={18} className="text-emerald-500" />
              Matriz de Aspectos e Impactos Ambientales (PDVSA MA-01-02-12)
            </h2>
            <span className="text-xs text-ink-soft font-mono">
              {aspects.length} aspectos registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-ink-soft font-bold border-b border-line uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Actividad / Proceso</th>
                  <th className="p-3">Aspecto Ambiental</th>
                  <th className="p-3">Impacto Ambiental</th>
                  <th className="p-3 text-center">Significancia</th>
                  <th className="p-3">Medidas de Control / Mitigación</th>
                  <th className="p-3">Norma Aplicable</th>
                  <th className="p-3">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {aspects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink-soft italic">
                      No hay aspectos ambientales registrados en la matriz. Pulse "Nuevo Aspecto Ambiental" para agregar uno.
                    </td>
                  </tr>
                ) : (
                  aspects.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{a.activity}</td>
                      <td className="p-3 text-ink-soft">{a.aspect}</td>
                      <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">{a.environmentalImpact}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.significance === 'Alto' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                          a.significance === 'Medio' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {a.significance}
                        </span>
                      </td>
                      <td className="p-3 text-ink-soft">{a.mitigationMeasure}</td>
                      <td className="p-3 font-mono text-[11px] text-ink-soft">{a.normRef}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANIFIESTOS RASDA */}
      {activeTab === 'rasda' && (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText size={18} className="text-brand-500" />
              Trazabilidad de Desechos Peligrosos (Manifiestos RASDA)
            </h2>
            <span className="text-xs text-ink-soft font-mono">
              {manifests.length} manifiestos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-ink-soft font-bold border-b border-line uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">N° Manifiesto</th>
                  <th className="p-3">Tipo de Desecho</th>
                  <th className="p-3 text-center">Volumen</th>
                  <th className="p-3">Transportista / RASDA</th>
                  <th className="p-3">Sitio de Disposición</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {manifests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink-soft italic">
                      No hay manifiestos RASDA registrados. Pulse "Emitir Manifiesto RASDA" para agregar uno.
                    </td>
                  </tr>
                ) : (
                  manifests.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">{m.manifestNumber}</td>
                      <td className="p-3 font-bold text-ink">{m.wasteType}</td>
                      <td className="p-3 text-center font-mono font-bold text-ink">{m.volumeAmount} {m.unit}</td>
                      <td className="p-3">
                        <p className="text-ink">{m.transporterName}</p>
                        <p className="text-[10px] font-mono text-ink-soft">{m.rasdaTransporter}</p>
                      </td>
                      <td className="p-3 text-ink-soft">{m.disposalSite}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.status === 'Dispuesto y Certificado'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => exportManifestPdf(m)}
                          className="px-2.5 py-1 border border-line rounded-lg text-[11px] font-bold hover:bg-surface-2 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Printer size={12} />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EQUIPMENT & GREASE TRAPS */}
      {activeTab === 'equipment' && (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-500" />
              Checklist Inspección Ambiental de Maquinaria y Trampas de Grasa
            </h2>
            <span className="text-xs text-ink-soft font-mono">
              {inspections.length} inspecciones hoy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspections.map((insp) => (
              <div key={insp.id} className="p-4 rounded-2xl border border-line bg-surface-2 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{insp.equipmentTag}</h3>
                    <p className="text-xs text-ink-soft">{insp.equipmentType}</p>
                  </div>
                  <span className="text-xs font-mono text-ink-soft">{insp.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line">
                    {insp.greaseTrapOk ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
                    <span>Trampa de Grasa Limpia</span>
                  </div>

                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line">
                    {insp.spillTrayOk ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
                    <span>Bandeja Antirrame 110%</span>
                  </div>

                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line">
                    {insp.oilLeaksOk ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
                    <span>Sin Fugas de Aceite</span>
                  </div>

                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line">
                    {insp.extinguisherOk ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
                    <span>Extintor PQS Vigente</span>
                  </div>
                </div>

                <p className="text-xs text-ink-soft bg-surface p-2.5 rounded-xl border border-line italic">
                  "{insp.comments}"
                </p>
                <p className="text-[11px] font-mono text-ink-soft text-right">
                  Inspector: {insp.inspectorName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASPECT MODAL */}
      {showAspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Trees size={18} className="text-emerald-500" />
                Registrar Aspecto en Matriz PGA
              </h3>
              <button onClick={() => setShowAspectModal(false)} className="p-1 rounded-lg text-ink-soft hover:bg-surface-2 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAspect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Actividad / Proceso *</label>
                <input
                  type="text"
                  required
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Ej. Limpieza e Inspección de Tanques"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Aspecto Ambiental *</label>
                <input
                  type="text"
                  required
                  value={newAspect}
                  onChange={(e) => setNewAspect(e.target.value)}
                  placeholder="Ej. Generación de efluentes grasos"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Impacto Ambiental *</label>
                <input
                  type="text"
                  required
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  placeholder="Ej. Potencial contaminación de agua superficial"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Significancia</label>
                  <select
                    value={newSignificance}
                    onChange={(e) => setNewSignificance(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Medida de Mitigación *</label>
                  <input
                    type="text"
                    required
                    value={newMitigation}
                    onChange={(e) => setNewMitigation(e.target.value)}
                    placeholder="Ej. Trampa API y skimmer"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setShowAspectModal(false)} className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer">Guardar Aspecto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANIFEST MODAL */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FileText size={18} className="text-brand-500" />
                Emitir Manifiesto RASDA Desechos
              </h3>
              <button onClick={() => setShowManifestModal(false)} className="p-1 rounded-lg text-ink-soft hover:bg-surface-2 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateManifest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">N° Manifiesto *</label>
                  <input
                    type="text"
                    required
                    value={newManifestNo}
                    onChange={(e) => setNewManifestNo(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Tipo de Desecho *</label>
                  <select
                    value={newWasteType}
                    onChange={(e) => setNewWasteType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Aceite Usado">Aceite Usado</option>
                    <option value="Lodos de Perforación / Trampa">Lodos de Perforación / Trampa</option>
                    <option value="Aguas de Producción">Aguas de Producción</option>
                    <option value="Trapos/Filtros Impregnados">Trapos/Filtros Impregnados</option>
                    <option value="Desechos Sólidos Industriales">Desechos Sólidos Industriales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Volumen / Cantidad *</label>
                  <input
                    type="number"
                    required
                    value={newVolume}
                    onChange={(e) => setNewVolume(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Unidad de Medida</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Litros">Litros</option>
                    <option value="m³">m³</option>
                    <option value="Tambores (208L)">Tambores (208L)</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Empresa Transportista *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter}
                    onChange={(e) => setNewTransporter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">RASDA Transportista *</label>
                  <input
                    type="text"
                    required
                    value={newRasdaTransporter}
                    onChange={(e) => setNewRasdaTransporter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setShowManifestModal(false)} className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer">Emitir Manifiesto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
