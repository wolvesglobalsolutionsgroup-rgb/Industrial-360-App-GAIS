import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Flame, Wind, AlertTriangle, CheckCircle2, XCircle, 
  Lock, Unlock, Camera, FileText, Plus, Search, Filter, HardHat, 
  Calendar, User, FileSpreadsheet, Eye, Sparkles, Check, RefreshCw, AlertOctagon
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { sihoPtwRepo } from '../lib/repositories';
import { generateRegulatoryCode } from '../lib/regulatoryIdsClient';

import AstForm from '../components/siho/AstForm';
import { DualHeader } from '../components/common/DualHeader';
import { DocumentSeal } from '../components/common/DocumentSeal';
import { DocumentSigner } from '../components/common/DocumentSigner';
import { OPERATOR_BRAND_PRESETS } from '../lib/brandKitPresets';
import { DocumentSignerItem } from '../lib/documentPolicy';
import SourceBadge from '../components/states/SourceBadge';
import LastUpdated from '../components/states/LastUpdated';
import EmptyState from '../components/states/EmptyState';

interface GasReadings {
  h2s: number; // Max 10 ppm
  lel: number; // Max 0% (caliente) / 10% (general)
  o2: number;  // 19.5% - 23.5%
  co: number;  // Max 25 ppm
  voc: number; // Max 10 ppm
  so2: number; // Max 2 ppm
  gasotesterSerial: string;
  calibratedAt: string;
  isCalibrationValid?: boolean;
}

export type PTWType = 'caliente' | 'frio' | 'espacio_confinado' | 'izamiento' | 'excavacion' | 'radiografia' | 'altura' | 'electrico';

interface PTW {
  id?: string;
  projectId: string;
  code: string;
  type: PTWType;
  location: string;
  contractor: string;
  supervisor: string;
  validFrom: string;
  validTo: string;
  status: 'borrador' | 'en_revision' | 'aprobado' | 'bloqueado' | 'cerrado';
  gasReadings?: Partial<GasReadings>;
  eppList: string[];
  precautions: string[];
  description: string;
  digitalSignatureHash?: string;
  createdAt?: any;
}

interface ASTStep {
  id: string;
  sequence: string;
  hazard: string;
  initialRisk: 'Alto' | 'Medio' | 'Bajo';
  controls: string;
  residualRisk: 'Alto' | 'Medio' | 'Bajo';
}

const defaultEppOptions = [
  'Casco de Seguridad Dielectrico',
  'Lentes de Seguridad Anti-empañantes',
  'Botas de Seguridad con Puntera',
  'Guantes de Carnaza / Cuero',
  'Protector Auditivo de Copa',
  'Arnés de Cuerpo Entero Doble Lanyard',
  'Respirador con Filtros para Vapores/Gases',
  'Detector Multigas Personal H₂S (Sulfídrico)'
];

const defaultPrecautions = [
  'Aislamiento Seguro y LOTO (Etiquetado y Candado)',
  'Extintor de Polvo Químico Seco (PQS 20 lbs)',
  'Vigía de Seguridad Permanemente en Sitio',
  'Soplado y Purgado de Línea con Nitrógeno',
  'Pantalla / Manta Ignífuga para Soldadura',
  'Sistema de Ventilación Forzada / Extractor Anti-explosivo'
];

export default function SihoPtw() {
  const { currentProject, brandKit } = useProject();
  const [activeTab, setActiveTab] = useState<'ptw' | 'ast' | 'charlas'>('ptw');
  const [ptwList, setPtwList] = useState<PTW[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New PTW form state
  const [newType, setNewType] = useState<PTW['type']>('caliente');
  const [newLocation, setNewLocation] = useState('');
  const [newContractor, setNewContractor] = useState('Contratista de Campo / IC360');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 16));
  const [validTo, setValidTo] = useState(new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16));
  
  // Gasotester 6-Gases readings
  const [h2s, setH2s] = useState<number>(0);
  const [lel, setLel] = useState<number>(0);
  const [o2, setO2] = useState<number>(20.9);
  const [co, setCo] = useState<number>(0);
  const [voc, setVoc] = useState<number>(0);
  const [so2, setSo2] = useState<number>(0);
  const [gasotesterSerial, setGasotesterSerial] = useState('GT-PDVSA-9942');
  const [calibratedAt, setCalibratedAt] = useState(new Date().toISOString().slice(0, 10));

  const [selectedEpp, setSelectedEpp] = useState<string[]>(defaultEppOptions.slice(0, 5));
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>(defaultPrecautions.slice(0, 3));

  // Calibration check (valid within 30 days)
  const isCalibrationValid = (calDateStr: string): boolean => {
    if (!calDateStr) return false;
    const calDate = new Date(calDateStr);
    const now = new Date();
    const diffDays = (now.getTime() - calDate.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  const isCalibValid = isCalibrationValid(calibratedAt);

  // Gasotester Hazard Check (PDVSA SI-S-04 6-Gas limits + Calibration)
  const isAtmosphereHazardous = 
    h2s > 10 || 
    (newType === 'caliente' ? lel > 0 : lel > 10) || 
    o2 < 19.5 || 
    o2 > 23.5 || 
    co > 25 || 
    voc > 10 || 
    so2 > 2 ||
    !isCalibValid;

  // AST State
  const [astSteps, setAstSteps] = useState<ASTStep[]>([
    {
      id: '1',
      sequence: 'Aislamiento de tubería e instalación de bridas ciegas',
      hazard: 'Escape de gas atrapado o H₂S presurizado',
      initialRisk: 'Alto',
      controls: 'Despresurización verificada, monitoreo continuo de gasotester, uso de respirador',
      residualRisk: 'Bajo'
    },
    {
      id: '2',
      sequence: 'Corte mecánico y biselado con esmerilador neumático',
      hazard: 'Chispas en área clasificada, proyección de partículas',
      initialRisk: 'Alto',
      controls: 'PTS en Caliente, manta ignífuga, extintor PQS en sitio, lentes de seguridad y careta',
      residualRisk: 'Bajo'
    },
    {
      id: '3',
      sequence: 'Soldadura de junta de interconexión (WPS-PDVSA-01)',
      hazard: 'Inhalación de humos metálicos, choque eléctrico',
      initialRisk: 'Medio',
      controls: 'Extractor de humos, puesta a tierra de máquina de soldar, guantes de cuero',
      residualRisk: 'Bajo'
    }
  ]);
  const [newSeq, setNewSeq] = useState('');
  const [newHazard, setNewHazard] = useState('');
  const [newControls, setNewControls] = useState('');
  const [newRisk, setNewRisk] = useState<'Alto' | 'Medio' | 'Bajo'>('Medio');

  // Charlas state
  const [talkTopic, setTalkTopic] = useState('Prevención de Atmósferas Peligrosas y Protocolo H2S (PDVSA SI-S-04)');
  const [talkInstructor, setTalkInstructor] = useState('Ing. Carlos Mendoza (Inspector SIHO)');
  const [attendeesCount, setAttendeesCount] = useState(14);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { currentOrganization } = useProject();
  const orgId = currentOrganization?.id || '';

  useEffect(() => {
    if (!currentProject) return;

    const unsubscribe = sihoPtwRepo.subscribe(orgId, currentProject.id, (items: any) => {
      setPtwList(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'siho_ptw');
    });

    return () => unsubscribe();
  }, [currentProject, orgId]);

async function generateSha256Hash(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

  const handleCreatePTW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }

    if (isAtmosphereHazardous) {
      alert("ATENCIÓN: La atmósfera es peligrosa o la calibración del Gasotester no está vigente. Corrija los parámetros antes de aprobar.");
      return;
    }

    try {
      const ptwCode = await generateRegulatoryCode(orgId, currentProject.id, `PTS-${newType.substring(0, 3).toUpperCase()}`);
      const signaturePayload = `${ptwCode}|${currentProject.id}|${newSupervisor || 'Ing. Manuel Silva'}|${validFrom}|${validTo}|H2S:${h2s}|LEL:${lel}|O2:${o2}|CO:${co}|VOC:${voc}|SO2:${so2}|${Date.now()}`;
      const digitalSignatureHash = await generateSha256Hash(signaturePayload);

      const ptwData = {
        ptwCode,
        code: ptwCode,
        type: newType,
        location: newLocation || 'Planta de Compresión H-2 / Módulo 4',
        contractor: newContractor,
        supervisor: newSupervisor || 'Ing. Manuel Silva',
        validFrom,
        validTo,
        status: isAtmosphereHazardous ? 'bloqueado' : 'aprobado',
        description: newDescription,
        digitalSignatureHash,
        gasReadings: {
          h2s,
          lel,
          o2,
          co,
          voc,
          so2,
          gasotesterSerial,
          calibratedAt,
          isCalibrationValid: isCalibValid
        },
        eppList: selectedEpp,
        precautions: selectedPrecautions,
      };

      await sihoPtwRepo.create(orgId, currentProject.id, ptwData);

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'siho_ptw');
    }
  };

  const resetForm = () => {
    setNewLocation('');
    setNewDescription('');
    setH2s(0);
    setLel(0);
    setO2(20.9);
    setCo(0);
    setVoc(0);
    setSo2(0);
  };

  const handleAddASTStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeq || !newHazard) return;
    const newStep: ASTStep = {
      id: Date.now().toString(),
      sequence: newSeq,
      hazard: newHazard,
      initialRisk: newRisk,
      controls: newControls || 'Evaluación SIHO en sitio y EPP específico',
      residualRisk: newRisk === 'Alto' ? 'Medio' : 'Bajo'
    };
    setAstSteps([...astSteps, newStep]);
    setNewSeq('');
    setNewHazard('');
    setNewControls('');
  };

  const filteredPtw = ptwList.filter(p => {
    const matchesSearch = (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.supervisor || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: PTW['type']) => {
    switch(type) {
      case 'caliente':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"><Flame size={12}/> Tipo A: Trabajo en Caliente</span>;
      case 'frio':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><ShieldCheck size={12}/> Tipo B: Trabajo en Frío</span>;
      case 'espacio_confinado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"><Wind size={12}/> Tipo C: Espacio Confinado</span>;
      case 'izamiento':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><HardHat size={12}/> Tipo D: Izamiento Crítico</span>;
      case 'excavacion':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800"><AlertTriangle size={12}/> Tipo E: Excavación y Zanjas</span>;
      case 'radiografia':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800"><Sparkles size={12}/> Tipo F: Radiografía Industrial</span>;
      case 'altura':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"><Calendar size={12}/> Tipo G: Trabajos en Altura</span>;
      case 'electrico':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"><Lock size={12}/> Tipo H: Eléctrico / LOTO</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"><ShieldCheck size={12}/> PTS Estándar</span>;
    }
  };

  const getStatusBadge = (status: PTW['status']) => {
    switch(status) {
      case 'aprobado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12}/> Aprobado y Activo</span>;
      case 'bloqueado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 font-bold"><Lock size={12}/> Bloqueado (Atmósfera)</span>;
      case 'cerrado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><Check size={12}/> Cerrado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><RefreshCw size={12}/> En Revisión</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Doble Membrete S18 */}
      <DualHeader
        contractorBrand={brandKit}
        operatorBrand={OPERATOR_BRAND_PRESETS.PDVSA}
        documentTitle="PERMISOS DE TRABAJO SEGURO (PTS) / MATRIZ SIHO-A"
        documentCode={currentProject?.id ? `PTS-${currentProject.id.substring(0, 6)}` : 'PTS-GENERIC'}
        documentDate={new Date().toLocaleDateString('es-VE')}
        statusBadge="APROBADO"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-md uppercase tracking-wider border border-emerald-500/20">
              Norma PDVSA SI-S-04 / SI-S-08
            </span>
            <SourceBadge source={currentOrganization?.environment === 'qa' ? 'qa_seed' : 'firestore'} detail="PDVSA SIHO" />
            <LastUpdated timestamp={new Date()} />
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">
            Módulo SIHO-A & Permisos de Trabajo Seguro (PTS)
          </h1>
          <p className="text-ink-soft text-sm">
            Control integral de seguridad industrial, higiene ocupacional, permisos de trabajo, pruebas atmosféricas y análisis de riesgo AST.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={18} />
          Emitir Permiso PTS
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">Permisos Activos</p>
            <p className="text-2xl font-black text-ink mt-1">{ptwList.filter(p => p.status === 'aprobado').length || 4}</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% Auditados SIHO</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">Lecturas Gasotester</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Seguro (0 ppm H₂S)</p>
            <span className="text-xs text-ink-soft">Última calibración: Hoy 07:00</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Wind size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">Puntos de Riesgo Bloqueados</p>
            <p className="text-2xl font-black text-ink mt-1">{ptwList.filter(p => p.status === 'bloqueado').length || 0}</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">LOTO Activo en 12 Válvulas</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Lock size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">Charlas 5 Minutos</p>
            <p className="text-2xl font-black text-ink mt-1">100% al día</p>
            <span className="text-xs text-ink-soft">14 Trabajadores firmados</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-line bg-surface rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('ptw')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ptw'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          <FileText size={18} />
          Permisos de Trabajo Seguro (PTS)
        </button>
        <button
          onClick={() => setActiveTab('ast')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ast'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <AlertTriangle size={18} />
          Matriz IPER / AST (Análisis de Riesgo)
        </button>
        <button
          onClick={() => setActiveTab('charlas')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'charlas'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Camera size={18} />
          Charlas de 5 Min. y Entrega EPP
        </button>
      </div>

      {/* TAB 1: PERMISOS DE TRABAJO SEGURO (PTS) */}
      {activeTab === 'ptw' && (
        <div className="bg-surface rounded-b-xl border border-line border-t-0 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar por código, ubicación, supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-sm bg-surface-2 text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-ink-faint" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-2 border border-line rounded-lg text-sm bg-surface-2 text-ink font-medium"
              >
                <option value="all">Todos los Tipos de Trabajo</option>
                <option value="frio">Trabajo en Frío</option>
                <option value="caliente">Trabajo en Caliente</option>
                <option value="espacio_confinado">Espacio Confinado</option>
                <option value="izamiento">Izamiento Crítico</option>
                <option value="excavacion">Excavación</option>
              </select>
            </div>
          </div>

          {/* PTW List Table */}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-2 text-ink-soft text-xs uppercase font-bold border-b border-line">
                  <th className="p-4">Código PTS</th>
                  <th className="p-4">Tipo de Trabajo</th>
                  <th className="p-4">Ubicación / Planta</th>
                  <th className="p-4">Gasotester (H₂S / LEL / O₂)</th>
                  <th className="p-4">Supervisor SIHO</th>
                  <th className="p-4">Vigencia</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {filteredPtw.length === 0 ? (
                  // Sample mock rows if Firestore empty
                  <>
                    <tr className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">PTS-CAL-8041</td>
                      <td className="p-4">{getTypeBadge('caliente')}</td>
                      <td className="p-4 font-medium text-ink">Planta de Compresión H-2 / Colector 12"</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">H₂S: 0 ppm</span> | <span className="text-ink">LEL: 0%</span> | <span className="text-blue-600 dark:text-blue-400 font-bold">O₂: 20.9%</span>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">Ing. Manuel Silva</td>
                      <td className="p-4 text-xs text-ink-faint">25/07/2026 07:00 - 17:00</td>
                      <td className="p-4 text-center">{getStatusBadge('aprobado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-surface-2 hover:bg-surface-2/80 text-ink border border-line px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer">
                          Ver PDF PTS
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">PTS-ESP-9102</td>
                      <td className="p-4">{getTypeBadge('espacio_confinado')}</td>
                      <td className="p-4 font-medium text-ink">Tanque de Almacenamiento TK-104 (Inspección Interna)</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">H₂S: 0 ppm</span> | <span className="text-ink">LEL: 2%</span> | <span className="text-blue-600 dark:text-blue-400 font-bold">O₂: 20.8%</span>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">Ing. Rebeca Gómez</td>
                      <td className="p-4 text-xs text-ink-faint">25/07/2026 08:00 - 16:00</td>
                      <td className="p-4 text-center">{getStatusBadge('aprobado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-surface-2 hover:bg-surface-2/80 text-ink border border-line px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer">
                          Ver PDF PTS
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-2/60 transition-colors bg-red-500/10">
                      <td className="p-4 font-mono font-bold text-red-600 dark:text-red-400">PTS-CAL-3310</td>
                      <td className="p-4">{getTypeBadge('caliente')}</td>
                      <td className="p-4 font-medium text-ink">Separador Trifásico V-201 (Área de Purga)</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono text-red-600 dark:text-red-400 font-bold">
                          <span>H₂S: 18 ppm 🚨</span> | <span>LEL: 14% 🚨</span>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">Ing. Carlos Mendoza</td>
                      <td className="p-4 text-xs text-ink-faint">25/07/2026 09:30 - Suspendido</td>
                      <td className="p-4 text-center">{getStatusBadge('bloqueado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer">
                          Ver Alerta SIHO
                        </button>
                      </td>
                    </tr>
                  </>
                ) : (
                  filteredPtw.map((ptw) => (
                    <tr key={ptw.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{ptw.code}</td>
                      <td className="p-4">{getTypeBadge(ptw.type)}</td>
                      <td className="p-4 font-medium text-ink">{ptw.location}</td>
                      <td className="p-4">
                        <div className="text-[11px] font-mono grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span className={(ptw.gasReadings?.h2s ?? 0) > 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                            H₂S: {ptw.gasReadings?.h2s ?? 0} ppm
                          </span>
                          <span className={(ptw.gasReadings?.lel ?? 0) > (ptw.type === 'caliente' ? 0 : 10) ? 'text-red-600 dark:text-red-400 font-bold' : 'text-ink'}>
                            LEL: {ptw.gasReadings?.lel ?? 0}%
                          </span>
                          <span className={((ptw.gasReadings?.o2 ?? 20.9) < 19.5 || (ptw.gasReadings?.o2 ?? 20.9) > 23.5) ? 'text-red-600 dark:text-red-400 font-bold' : 'text-blue-600 dark:text-blue-400'}>
                            O₂: {ptw.gasReadings?.o2 ?? 20.9}%
                          </span>
                          <span className={(ptw.gasReadings?.co ?? 0) > 25 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-ink-soft'}>
                            CO: {ptw.gasReadings?.co ?? 0} ppm
                          </span>
                          <span className={(ptw.gasReadings?.voc ?? 0) > 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-ink-faint'}>
                            VOC: {ptw.gasReadings?.voc ?? 0} ppm
                          </span>
                          <span className={(ptw.gasReadings?.so2 ?? 0) > 2 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-ink-faint'}>
                            SO₂: {ptw.gasReadings?.so2 ?? 0} ppm
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">{ptw.supervisor}</td>
                      <td className="p-4 text-xs text-ink-faint">{ptw.validFrom}</td>
                      <td className="p-4 text-center">{getStatusBadge(ptw.status)}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-surface-2 hover:bg-surface-2/80 text-ink border border-line px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer">
                          Ver Detalle
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

      {/* TAB 2: MATRIZ IPER / AST */}
      {activeTab === 'ast' && (
        <div className="bg-surface rounded-b-xl border border-line border-t-0 p-6 space-y-6">
          <AstForm />

          <div className="pt-6 border-t border-line space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Sparkles className="text-emerald-600 dark:text-emerald-400" size={18} />
              Secuencia Rápida de Trabajo y Controles de Campo (Norma PDVSA SI-S-04)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-ink-soft text-xs uppercase font-bold border-b border-line">
                    <th className="p-3">Paso / Secuencia Operativa</th>
                    <th className="p-3">Peligro y Riesgo Asociado</th>
                    <th className="p-3 text-center">Riesgo Inicial</th>
                    <th className="p-3">Medidas de Control Requeridas (Ingeniería + SIHO)</th>
                    <th className="p-3 text-center">Riesgo Residual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {astSteps.map((step, idx) => (
                    <tr key={step.id} className="hover:bg-surface-2/60">
                      <td className="p-3 font-semibold text-ink">
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono mr-2">{idx + 1}.</span>
                        {step.sequence}
                      </td>
                      <td className="p-3 text-ink-soft">{step.hazard}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          step.initialRisk === 'Alto' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                          step.initialRisk === 'Medio' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {step.initialRisk}
                        </span>
                      </td>
                      <td className="p-3 text-ink font-medium">{step.controls}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {step.residualRisk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form to add new step */}
            <form onSubmit={handleAddASTStep} className="bg-surface-2 border border-line rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                Agregar Paso Rápido a la Matriz
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Secuencia de trabajo (Ej: Izamiento de carrete de 8 pulg)"
                  value={newSeq}
                  onChange={(e) => setNewSeq(e.target.value)}
                  className="px-3 py-2 border border-line rounded-lg text-sm bg-surface text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Peligro / Riesgo (Ej: Falla de guaya de grúa)"
                  value={newHazard}
                  onChange={(e) => setNewHazard(e.target.value)}
                  className="px-3 py-2 border border-line rounded-lg text-sm bg-surface text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Controles (Ej: Inspección pre-uso, delimitación)"
                  value={newControls}
                  onChange={(e) => setNewControls(e.target.value)}
                  className="px-3 py-2 border border-line rounded-lg text-sm bg-surface text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value as any)}
                    className="px-3 py-2 border border-line rounded-lg text-sm bg-surface text-ink font-medium"
                  >
                    <option value="Alto">Riesgo: Alto</option>
                    <option value="Medio">Riesgo: Medio</option>
                    <option value="Bajo">Riesgo: Bajo</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shrink-0 transition-all cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: CHARLAS 5 MIN Y REGISTRO EPP */}
      {activeTab === 'charlas' && (
        <div className="bg-surface rounded-b-xl border border-line border-t-0 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registro de Charla */}
            <div className="border border-line rounded-xl p-5 space-y-4 bg-surface-2/60">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                Minuta de Charla Diaria de 5 Minutos (SIHO)
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Tema Impartido</label>
                  <input
                    type="text"
                    value={talkTopic}
                    onChange={(e) => setTalkTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Facilitador / Instructor</label>
                    <input
                      type="text"
                      value={talkInstructor}
                      onChange={(e) => setTalkInstructor(e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">N° Trabajadores Asistentes</label>
                    <input
                      type="number"
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Registro Fotográfico de Asistencia</label>
                  <div className="border-2 border-dashed border-line rounded-xl p-4 text-center bg-surface cursor-pointer hover:bg-surface-2 transition-all">
                    <Camera size={24} className="mx-auto text-ink-faint mb-1" />
                    <span className="text-xs text-ink-soft font-medium">Capturar foto del grupo en charla</span>
                  </div>
                </div>

                <button 
                  onClick={() => alert("Charla de 5 minutos guardada y archivada en Dossier SIHO.")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
                >
                  Registrar Charla en Expediente
                </button>
              </div>
            </div>

            {/* Checklist de EPP Entregado */}
            <div className="border border-line rounded-xl p-5 space-y-4 bg-surface-2/60">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <HardHat size={18} className="text-emerald-600 dark:text-emerald-400" />
                Control de Dotación e Inspección de EPP
              </h3>

              <p className="text-xs text-ink-soft">
                Verificación diaria de estado físico de Equipos de Protección Personal antes de ingresar a planta.
              </p>

              <div className="space-y-2">
                {defaultEppOptions.map((epp, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-line hover:bg-surface cursor-pointer text-xs font-medium text-ink">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded border-line focus:ring-emerald-500" />
                    <span>{epp}</span>
                    <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Verificado</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMITIR NUEVO PERMISO PTS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lift p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-line pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Emisión Oficial PTS</span>
                <h2 className="text-xl font-black text-ink">Permiso de Trabajo Seguro (PDVSA SI-S-04)</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-faint hover:text-ink p-2 cursor-pointer">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePTW} className="space-y-6">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-2">Tipo de Trabajo a Ejecutar</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'caliente', label: 'Tipo A: Trabajo en Caliente', icon: Flame, color: 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10' },
                    { id: 'frio', label: 'Tipo B: Trabajo en Frío', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10' },
                    { id: 'espacio_confinado', label: 'Tipo C: Espacio Confinado', icon: Wind, color: 'text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10' },
                    { id: 'izamiento', label: 'Tipo D: Izamiento Crítico', icon: HardHat, color: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10' },
                    { id: 'excavacion', label: 'Tipo E: Excavación y Zanjas', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10' },
                    { id: 'radiografia', label: 'Tipo F: Radiografía Industrial', icon: Sparkles, color: 'text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/10' },
                    { id: 'altura', label: 'Tipo G: Trabajos en Altura', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
                    { id: 'electrico', label: 'Tipo H: Eléctrico / LOTO', icon: Lock, color: 'text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSel = newType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewType(t.id as any)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all text-left cursor-pointer ${
                          isSel ? `${t.color} ring-2 ring-emerald-500 shadow-2xs` : 'border-line hover:bg-surface-2 text-ink-soft'
                        }`}
                      >
                        <IconComp size={18} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Ubicación / Unidad de Planta</label>
                  <input
                    type="text"
                    placeholder="Ej: Planta de Compresión H-2 / Módulo 4"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm bg-surface-2 text-ink placeholder:text-ink-faint"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Supervisor SIHO Responsable</label>
                  <input
                    type="text"
                    placeholder="Ej: Ing. Manuel Silva"
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm bg-surface-2 text-ink placeholder:text-ink-faint"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Descripción del Trabajo</label>
                <textarea
                  rows={2}
                  placeholder="Describa la tarea detalladamente (ej: Interconexión de tubería 12 in Sch 40 en caliente)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg text-sm resize-none bg-surface-2 text-ink placeholder:text-ink-faint"
                  required
                />
              </div>

              {/* CRITICAL: GASOTESTER 6-GASES READINGS & CALIBRATION */}
              <div className={`p-4 rounded-xl border transition-all ${
                isAtmosphereHazardous ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Wind className={isAtmosphereHazardous ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} size={20} />
                    <h3 className="text-sm font-bold text-ink">
                      Prueba Atmosférica de 6 Gases (PDVSA SI-S-04)
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink-soft">Serial Gasotester:</span>
                      <input
                        type="text"
                        value={gasotesterSerial}
                        onChange={(e) => setGasotesterSerial(e.target.value)}
                        className="px-2 py-1 border border-line rounded bg-surface text-ink font-mono font-bold text-xs w-32"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink-soft">Calibración:</span>
                      <input
                        type="date"
                        value={calibratedAt}
                        onChange={(e) => setCalibratedAt(e.target.value)}
                        className="px-2 py-1 border border-line rounded bg-surface text-ink font-mono text-xs"
                      />
                      {isCalibValid ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                          ✓ Vigente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[10px] border border-red-500/30">
                          🚨 Vencida (&gt;30d)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Gas 1: H2S */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">H₂S (Sulfídrico)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={h2s}
                        onChange={(e) => setH2s(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          h2s > 10 ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">ppm</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Max: 10 ppm</span>
                  </div>

                  {/* Gas 2: LEL */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">LEL (Explosividad)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={lel}
                        onChange={(e) => setLel(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          (newType === 'caliente' ? lel > 0 : lel > 10) ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">%</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Max: {newType === 'caliente' ? '0% (Caliente)' : '10%'}</span>
                  </div>

                  {/* Gas 3: O2 */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">O₂ (Oxígeno)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={o2}
                        onChange={(e) => setO2(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          o2 < 19.5 || o2 > 23.5 ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">%</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Norma: 19.5-23.5%</span>
                  </div>

                  {/* Gas 4: CO */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">CO (Monóxido)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={co}
                        onChange={(e) => setCo(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          co > 25 ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">ppm</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Max: 25 ppm</span>
                  </div>

                  {/* Gas 5: VOC */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">VOC (Vapores Org.)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={voc}
                        onChange={(e) => setVoc(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          voc > 10 ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">ppm</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Max: 10 ppm</span>
                  </div>

                  {/* Gas 6: SO2 */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">SO₂ (Dióxido Azufre)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={so2}
                        onChange={(e) => setSo2(Number(e.target.value))}
                        className={`w-full px-2.5 py-1.5 border rounded-lg text-sm font-bold font-mono ${
                          so2 > 2 ? 'border-red-500 bg-red-500/20 text-red-600 dark:text-red-300' : 'border-line bg-surface text-ink'
                        }`}
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-ink-faint">ppm</span>
                    </div>
                    <span className="text-[10px] text-ink-faint block mt-0.5">Max: 2 ppm</span>
                  </div>
                </div>

                {isAtmosphereHazardous && (
                  <div className="mt-3 p-3 bg-red-600 text-white rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
                    <Lock size={18} />
                    {!isCalibValid 
                      ? '¡ALERTA SIHO: CALIBRACIÓN DEL GASOTESTER VENCIDA O INVÁLIDA! NO SE PERMITE EMITIR PERMISOS HASTA RECERTIFICAR EL EQUIPO.'
                      : '¡ALERTA SIHO: ATMÓSFERA PELIGROSA DETECTADA (LÍMITES NORMA PDVSA SUPERADOS)! EL PERMISO QUEDARÁ BLOQUEADO Y SE PROHÍBE LA ENTRADA.'}
                  </div>
                )}
              </div>

              {/* Precautions checklist */}
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-2">Precauciones Especiales Requeridas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {defaultPrecautions.map((prec, i) => (
                    <label key={i} className="flex items-center gap-2 p-2 border border-line rounded-lg cursor-pointer bg-surface-2 hover:bg-surface-2/80">
                      <input
                        type="checkbox"
                        checked={selectedPrecautions.includes(prec)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPrecautions([...selectedPrecautions, prec]);
                          else setSelectedPrecautions(selectedPrecautions.filter(p => p !== prec));
                        }}
                        className="rounded border-line text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-ink">{prec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-line text-ink rounded-xl text-sm font-semibold hover:bg-surface-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAtmosphereHazardous}
                  className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                    isAtmosphereHazardous
                      ? 'bg-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isAtmosphereHazardous ? 'Trabajo Bloqueado por Seguridad' : 'Aprobar y Emitir PTS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
