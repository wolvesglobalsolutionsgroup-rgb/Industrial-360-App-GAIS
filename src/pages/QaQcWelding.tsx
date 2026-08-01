import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, Plus, Search, Filter, HardHat, 
  Eye, Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  ZoomIn, ZoomOut, Sliders, Layers, FileCheck, Check,
  UserCheck, Award, Printer, Download, Flame, FileCode2,
  Trash2, RefreshCw, BookmarkCheck
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { weldJointsRepo } from '../lib/repositories';

import IsometricViewer from '../components/engineering/IsometricViewer';
import jsPDF from 'jspdf';
import { drawQualityHeader, drawPhotoEvidences, drawQualityFooter, cleanPdfText } from '../lib/pdfQualityUtils';
import { DualHeader } from '../components/common/DualHeader';
import { DocumentSeal } from '../components/common/DocumentSeal';
import { DocumentSigner } from '../components/common/DocumentSigner';
import { OPERATOR_BRAND_PRESETS } from '../lib/brandKitPresets';

export interface WeldJoint {
  id?: string;
  projectId: string;
  tag: string;             // Joint ID e.g. J-01
  isometric: string;       // Isometric No e.g. ISO-PDVSA-04
  type: 'BUTT' | 'FILLET' | 'SOCKET' | 'BRANCH';
  pipeSize: string;        // e.g. 8"
  wallThicknessMm: number; // e.g. 12.7 mm
  material: string;        // e.g. API 5L X52
  heatNumber: string;      // Colada / MTR
  wpsCode: string;         // Procedure code
  welderStamp: string;     // Welder WPQ ID
  process: 'SMAW' | 'GTAW' | 'GMAW' | 'FCAW' | 'SAW';
  position: '1G' | '2G' | '3G' | '4G' | '5G' | '6G';
  weldDate: string;
  fitupStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  vtStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  ndtMethod: 'RT' | 'UT/PAUT' | 'PT' | 'MT' | 'VT';
  ndtStatus: 'Aprobado' | 'Rechazado' | 'Reparado' | 'Pendiente';
  defectType?: 'Ninguno' | 'Grieta (Crack)' | 'Falta de Penetración (LOP)' | 'Falta de Fusión (IF)' | 'Socavado (EU)' | 'Porosidad (CP)' | 'Inclusión de Escoria (ISI)';
  defectSizeMm?: number;
  notes?: string;
  inspectorName?: string;
  evidencePhotos?: string[];
  createdAt?: any;
}

export interface WpsRecord {
  id: string;
  code: string;
  pqrCode: string;
  process: string;
  baseMetal: string;
  fillerMetal: string;
  thicknessRange: string;
  diameterRange: string;
  position: string;
  preheatC: string;
  pwht: string;
  status: 'Aprobado' | 'Revisión' | 'Inactivo';
}

export interface WelderCert {
  id: string;
  stamp: string;
  name: string;
  idNumber: string;
  process: string;
  qualifiedPositions: string;
  qualifiedThickness: string;
  qualifiedDiameters: string;
  certDate: string;
  expiryDate: string;
  status: 'Vigente' | 'Por Vencer' | 'Vencido';
}

interface DicondeSample {
  id: string;
  title: string;
  jointTag: string;
  method: string;
  status: 'Aprobado' | 'Rechazado';
  defectDetails: string;
  filmImage: string;
  defectCoords?: { x: number; y: number; w: number; h: number; label: string };
}

const mockDicondeSamples: DicondeSample[] = [
  {
    id: 'dcm-1',
    title: 'DICONDE RT Scan - Junta J-01-ISO-104 (Penetración Completa)',
    jointTag: 'J-01-ISO-104',
    method: 'Radiografía Industrial (RT) - ASTM DICONDE',
    status: 'Aprobado',
    defectDetails: 'Pase de raíz y relleno conforme a API 1104 / ASME B31.3. Sin indicaciones inaceptables.',
    filmImage: 'https://images.unsplash.com/photo-1579551381283-29e568403543?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'dcm-2',
    title: 'DICONDE RT Scan - Junta J-03-ISO-104 (Falta de Penetración en Raíz)',
    jointTag: 'J-03-ISO-104',
    method: 'Radiografía Industrial (RT) - ASTM DICONDE',
    status: 'Rechazado',
    defectDetails: 'Indicación discontinua en raíz a 42mm de marca cero. Falta de penetración LOP de 14mm de longitud (Excede norma API 1104 Sec. 8/9).',
    filmImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    defectCoords: { x: 45, y: 38, w: 22, h: 18, label: 'Falta Penetración (LOP 14mm)' }
  }
];

const initialWpsRecords: WpsRecord[] = [
  {
    id: 'wps-1',
    code: 'WPS-PDVSA-01',
    pqrCode: 'PQR-01-2023',
    process: 'GTAW (Raíz) + SMAW (Relleno)',
    baseMetal: 'P-No. 1 Gr. 1 / 2 (API 5L X52 / A106 Gr. B)',
    fillerMetal: 'F-No. 6 (ER70S-6) + F-No. 4 (E7018-1)',
    thicknessRange: '3.0 mm a 25.4 mm (0.118" a 1.000")',
    diameterRange: '2" NPS en adelante',
    position: 'Todas (Especial 6G)',
    preheatC: '10°C min / 100°C si t > 19mm',
    pwht: 'No Requerido para t ≤ 19mm',
    status: 'Aprobado'
  },
  {
    id: 'wps-2',
    code: 'WPS-PDVSA-02',
    pqrCode: 'PQR-02-2023',
    process: 'SMAW 100% (Celulósico + Básico)',
    baseMetal: 'P-No. 1 Gr. 2 (API 5L X65)',
    fillerMetal: 'F-No. 3 (E6010 / E7010-P1) + F-No. 4 (E8018-G)',
    thicknessRange: '4.8 mm a 19.0 mm',
    diameterRange: '6" NPS en adelante',
    position: 'Vertical Descendente (5G / 6G)',
    preheatC: '100°C constante',
    pwht: 'No Requerido',
    status: 'Aprobado'
  },
  {
    id: 'wps-3',
    code: 'WPS-PDVSA-03',
    pqrCode: 'PQR-03-2024',
    process: 'GMAW / FCAW Semiautomático',
    baseMetal: 'P-No. 1 Gr. 1 (ASTM A53 Gr. B)',
    fillerMetal: 'F-No. 6 (E71T-1M)',
    thicknessRange: '6.0 mm a 30.0 mm',
    diameterRange: '4" NPS en adelante',
    position: '1G / 2G / 3G',
    preheatC: '50°C',
    pwht: 'No Requerido',
    status: 'Aprobado'
  }
];

const initialWelderCerts: WelderCert[] = [
  {
    id: 'wld-1',
    stamp: 'W-402',
    name: 'José Pérez',
    idNumber: 'V-14.892.102',
    process: 'GTAW + SMAW',
    qualifiedPositions: '6G (Todas las posiciones)',
    qualifiedThickness: 'Hasta Ilimitado (≥ 13mm calificado)',
    qualifiedDiameters: '2" NPS a Ilimitado',
    certDate: '2024-01-15',
    expiryDate: '2025-01-15',
    status: 'Vigente'
  },
  {
    id: 'wld-2',
    stamp: 'W-309',
    name: 'Manuel Rivas',
    idNumber: 'V-16.230.541',
    process: 'SMAW Celulósico',
    qualifiedPositions: '5G / 6G Downhill',
    qualifiedThickness: '4.8 mm a 19.0 mm',
    qualifiedDiameters: '6" NPS a Ilimitado',
    certDate: '2023-11-20',
    expiryDate: '2024-11-20',
    status: 'Vigente'
  },
  {
    id: 'wld-3',
    stamp: 'W-108',
    name: 'Carlos Mendoza',
    idNumber: 'V-12.441.908',
    process: 'FCAW / GMAW',
    qualifiedPositions: '3G / 4G / 6G',
    qualifiedThickness: '3.0 mm a 25.0 mm',
    qualifiedDiameters: '4" NPS a Ilimitado',
    certDate: '2023-06-10',
    expiryDate: '2024-06-10',
    status: 'Por Vencer'
  }
];

export default function QaQcWelding() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const [activeTab, setActiveTab] = useState<'isometric' | 'joints' | 'wps' | 'welders' | 'ndt_reports' | 'diconde'>('isometric');
  const [jointsList, setJointsList] = useState<WeldJoint[]>([]);
  const [wpsList, setWpsList] = useState<WpsRecord[]>(initialWpsRecords);
  const [weldersList, setWeldersList] = useState<WelderCert[]>(initialWelderCerts);

  // Export NDT Report PDF
  const exportNdtReportPdf = (joint: WeldJoint) => {
    const docPdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Corporate Header with BrandKit
    const yHeader = drawQualityHeader({
      docPdf,
      brandKit,
      project: currentProject,
      documentTitle: 'REPORTE DE ENSAYOS NO DESTRUCTIVOS (NDT / END)',
      documentSubtitle: 'NORMA API 1104 §8/§9 & ASME SECCIÓN V - QA/QC TRAZABILIDAD',
      reportCode: `REP-NDT-${cleanPdfText(joint.tag)}`,
      normRef: 'API 1104 Sec. 8/9 / ASME V',
      issueDate: joint.weldDate || new Date().toISOString().split('T')[0],
      inspectorName: joint.inspectorName || 'Ing. Roberto Blanco (Level II ASNT)'
    });

    let y = yHeader + 2;

    // Joint Specs Box
    docPdf.setDrawColor(203, 213, 225);
    docPdf.setFillColor(250, 250, 250);
    docPdf.rect(12, y, 186, 32, 'FD');

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(8.5);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`JUNTA TAG: ${cleanPdfText(joint.tag)}`, 16, y + 6);
    docPdf.text(`N° ISOMÉTRICO: ${cleanPdfText(joint.isometric)}`, 16, y + 12);
    docPdf.text(`DIÁMETRO & ESPESOR: ${cleanPdfText(joint.pipeSize)} (${joint.wallThicknessMm.toFixed(1)}mm)`, 16, y + 18);
    docPdf.text(`MATERIAL BASE: ${cleanPdfText(joint.material)}`, 16, y + 24);
    docPdf.text(`COLADA / MTR: ${cleanPdfText(joint.heatNumber)}`, 16, y + 30);

    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`WPS Aplicada: ${cleanPdfText(joint.wpsCode)}`, 110, y + 6);
    docPdf.text(`Estampa Soldador: ${cleanPdfText(joint.welderStamp)}`, 110, y + 12);
    docPdf.text(`Posición / Proceso: ${cleanPdfText(joint.position)} (${cleanPdfText(joint.process)})`, 110, y + 18);
    docPdf.text(`Fitup / Visual: ${cleanPdfText(joint.fitupStatus)} / ${cleanPdfText(joint.vtStatus)}`, 110, y + 24);
    docPdf.text(`Método NDT: ${cleanPdfText(joint.ndtMethod)}`, 110, y + 30);

    y += 38;

    // Inspection Verdict Box
    const passed = joint.ndtStatus === 'Aprobado';
    docPdf.setDrawColor(passed ? 16 : 220, passed ? 185 : 38, passed ? 129 : 38);
    docPdf.setFillColor(passed ? 240 : 253, passed ? 253 : 242, passed ? 244 : 242);
    docPdf.rect(12, y, 186, 18, 'FD');

    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(passed ? 16 : 220, passed ? 185 : 38, passed ? 129 : 38);
    docPdf.text(`DICTAMEN DE EVALUACIÓN API 1104 §8: ${passed ? 'ACEPTADO / APROBADO' : 'RECHAZADO / REQUIERE REPARACIÓN'}`, 16, y + 7);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(8);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text(`Defecto Identificado: ${cleanPdfText(joint.defectType || 'Ninguno')}${joint.defectSizeMm ? ` (${joint.defectSizeMm.toFixed(1)}mm)` : ''}`, 16, y + 13);

    y += 24;

    if (joint.notes) {
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text('OBSERVACIONES DE CAMPO & TRAZABILIDAD:', 12, y);
      y += 4;
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(7.5);
      docPdf.text(cleanPdfText(joint.notes), 12, y);
      y += 6;
    }

    // Photo Evidences Section
    const yAfterPhotos = drawPhotoEvidences(docPdf, joint.evidencePhotos || [], y);

    // Footer & Dual Signatures
    drawQualityFooter({
      docPdf,
      brandKit,
      reportCode: `REP-NDT-${cleanPdfText(joint.tag)}`,
      normRef: 'API 1104 Sec. 8/9 / ASME V',
      issueDate: joint.weldDate || new Date().toISOString().split('T')[0],
      inspectorName: joint.inspectorName || 'Ing. Roberto Blanco (Niv II ASNT)',
      clientInspectorName: 'Ing. Inspector Fiscal PDVSA'
    }, yAfterPhotos);

    docPdf.save(`Reporte_NDT_${joint.tag.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddJointModal, setIsAddJointModal] = useState(false);
  const [isAddWpsModal, setIsAddWpsModal] = useState(false);
  const [isAddWelderModal, setIsAddWelderModal] = useState(false);

  // New Joint Form State
  const [newTag, setNewTag] = useState('');
  const [newIsometric, setNewIsometric] = useState('');
  const [newType, setNewType] = useState<WeldJoint['type']>('BUTT');
  const [newPipeSize, setNewPipeSize] = useState('8"');
  const [newWallThickness, setNewWallThickness] = useState(12.7);
  const [newMaterial, setNewMaterial] = useState('API 5L X52');
  const [newHeatNumber, setNewHeatNumber] = useState('');
  const [newWpsCode, setNewWpsCode] = useState('WPS-PDVSA-01');
  const [newWelderStamp, setNewWelderStamp] = useState('W-402 (J. Pérez)');
  const [newProcess, setNewProcess] = useState<WeldJoint['process']>('GTAW');
  const [newPosition, setNewPosition] = useState<WeldJoint['position']>('6G');
  const [newNdtMethod, setNewNdtMethod] = useState<WeldJoint['ndtMethod']>('RT');
  const [newNdtStatus, setNewNdtStatus] = useState<WeldJoint['ndtStatus']>('Aprobado');
  const [newDefectType, setNewDefectType] = useState<WeldJoint['defectType']>('Ninguno');
  const [newDefectSize, setNewDefectSize] = useState(0);

  // DICONDE Viewer state
  const [selectedDiconde, setSelectedDiconde] = useState<DicondeSample>(mockDicondeSamples[0]);
  const [isInverted, setIsInverted] = useState(true);
  const [contrast, setContrast] = useState(120);
  const [brightness, setBrightness] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Selected joint for NDT report preview
  const [selectedJointForReport, setSelectedJointForReport] = useState<WeldJoint | null>(null);

  const orgId = currentOrganization?.id || '';

  useEffect(() => {
    if (!currentProject) return;

    const unsubscribe = weldJointsRepo.subscribe(orgId, currentProject.id, (items: any) => {
      setJointsList(items);
      if (items.length > 0 && !selectedJointForReport) {
        setSelectedJointForReport(items[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'weld_joints');
    });

    return () => unsubscribe();
  }, [currentProject, orgId]);

  const handleCreateJoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }

    try {
      const isometric = newIsometric || 'ISO-PDVSA-HC-04';
      const existingForIso = jointsList.filter(j => j.isometric === isometric || j.tag.startsWith(isometric));
      const nextSeq = existingForIso.length + 1;
      const defaultTag = `J-${String(nextSeq).padStart(3, '0')}-${isometric}`;

      const jointData: Omit<WeldJoint, 'id'> = {
        projectId: currentProject.id,
        tag: newTag || defaultTag,
        isometric: isometric,
        type: newType,
        pipeSize: newPipeSize,
        wallThicknessMm: newWallThickness,
        material: newMaterial,
        heatNumber: newHeatNumber || 'COL-99421-A',
        wpsCode: newWpsCode,
        welderStamp: newWelderStamp || 'W-402 (J. Pérez)',
        process: newProcess,
        position: newPosition,
        weldDate: new Date().toISOString().split('T')[0],
        fitupStatus: 'Aprobado',
        vtStatus: 'Aprobado',
        ndtMethod: newNdtMethod,
        ndtStatus: newNdtStatus,
        defectType: newDefectType,
        defectSizeMm: newDefectSize,
        inspectorName: 'Ing. Roberto Blanco (Level II ASNT)',
        createdAt: serverTimestamp()
      };

      await weldJointsRepo.create(orgId, currentProject.id, jointData);
      setIsAddJointModal(false);
      resetJointForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'weld_joints');
    }
  };

  const resetJointForm = () => {
    setNewTag('');
    setNewIsometric('');
    setNewHeatNumber('');
  };

  const filteredJoints = jointsList.filter(j => {
    const matchesSearch = (j.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (j.isometric || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (j.welderStamp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (j.heatNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.ndtStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Doble Membrete S18 */}
      <DualHeader
        contractorBrand={brandKit}
        operatorBrand={OPERATOR_BRAND_PRESETS.PDVSA}
        documentTitle="PROTOCOLO DE CONTROL QA/QC Y ENSAYOS NDT (API 1104 / ASME IX)"
        documentCode={currentProject?.id ? `QAQC-${currentProject.id.substring(0, 6)}` : 'QAQC-GENERIC'}
        documentDate={new Date().toLocaleDateString('es-VE')}
        statusBadge="APROBADO"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-md uppercase tracking-wider">
              API 1104 / ASME IX / ASME V / ASTM DICONDE
            </span>
            <span className="text-xs text-gray-500 font-mono">QA/QC Trazabilidad de Campo v3.5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1">
            Módulo QA/QC Control de Soldadura & Ensayos NDT
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm">
            Trazabilidad inalterable de juntas, catálogo de WPS/PQR, registro de soldadores certificados (WPQ) y evaluación según API 1104 §8/§9.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'joints' && (
            <button 
              onClick={() => setIsAddJointModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              Registrar Junta
            </button>
          )}
          {activeTab === 'wps' && (
            <button 
              onClick={() => setIsAddWpsModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              Nueva WPS
            </button>
          )}
          {activeTab === 'welders' && (
            <button 
              onClick={() => setIsAddWelderModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              Registrar Soldador (WPQ)
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Juntas Registradas</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{jointsList.length || 12} Juntas</p>
            <span className="text-xs text-emerald-600 font-medium">100% Con Trazabilidad MTR</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <FileCheck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aprobación NDT (API 1104)</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {jointsList.length > 0 
                ? `${Math.round((jointsList.filter(j => j.ndtStatus === 'Aprobado').length / jointsList.length) * 100)}%`
                : '96.2%'}
            </p>
            <span className="text-xs text-gray-500">Criterios CITA API 1104 §8</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">WPS Calificadas</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{wpsList.length} Procedimientos</p>
            <span className="text-xs text-blue-600 font-medium">Con PQR ASME IX</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
            <BookmarkCheck size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Soldadores (WPQ)</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{weldersList.length} Estampas</p>
            <span className="text-xs text-purple-600 font-medium">Vigencia 6G Activa</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
            <HardHat size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl px-4 pt-2 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('isometric')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'isometric'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCode2 size={16} />
          📐 Visor Vectorial Isométricos CAD/SVG (IC360-016)
        </button>

        <button
          onClick={() => setActiveTab('joints')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'joints'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          🔬 Matriz de Trazabilidad de Juntas
        </button>

        <button
          onClick={() => setActiveTab('wps')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'wps'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCode2 size={16} />
          📋 Catálogo WPS / PQR (ASME IX)
        </button>

        <button
          onClick={() => setActiveTab('welders')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'welders'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck size={16} />
          👨‍🏭 Soldadores Certificados (WPQ)
        </button>

        <button
          onClick={() => setActiveTab('ndt_reports')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ndt_reports'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={16} />
          📄 Generador de Reporte NDT
        </button>

        <button
          onClick={() => setActiveTab('diconde')}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'diconde'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
          }`}
        >
          <Eye size={16} />
          👁️ Visor ASTM DICONDE (.dcm)
        </button>
      </div>

      {/* TAB 0: VISOR VECTORIAL ISOMÉTRICOS CAD/SVG (IC360-016) */}
      {activeTab === 'isometric' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-gray-200 dark:border-slate-800 border-t-0 p-4 sm:p-6 space-y-6">
          <IsometricViewer />
        </div>
      )}

      {/* TAB 1: MATRIZ DE TRAZABILIDAD DE JUNTAS */}
      {activeTab === 'joints' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-gray-200 dark:border-slate-800 border-t-0 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar junta, isométrico, colada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-gray-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Todos los Estados NDT</option>
                <option value="Aprobado">Aprobados</option>
                <option value="Rechazado">Rechazados</option>
                <option value="Reparado">Reparados</option>
                <option value="Pendiente">Pendientes NDT</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] uppercase font-bold border-b border-gray-200 dark:border-slate-700">
                  <th className="p-3">Junta Tag</th>
                  <th className="p-3">Isométrico</th>
                  <th className="p-3">Geometría & Material</th>
                  <th className="p-3">Colada / MTR</th>
                  <th className="p-3">WPS / Soldador</th>
                  <th className="p-3 text-center">Posición</th>
                  <th className="p-3 text-center">Fitup / VT</th>
                  <th className="p-3 text-center">Resultado NDT</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                {filteredJoints.length === 0 ? (
                  <>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-emerald-600">J-01-ISO-104</td>
                      <td className="p-3 font-mono text-gray-700 dark:text-slate-300">ISO-PDVSA-HC-04</td>
                      <td className="p-3">8" Sch 80 (12.7mm) • API 5L X52</td>
                      <td className="p-3 font-mono text-blue-600">COL-99421-A</td>
                      <td className="p-3">WPS-PDVSA-01 / W-402 (J. Pérez)</td>
                      <td className="p-3 text-center font-bold">6G (GTAW/SMAW)</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Ok / Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12}/> RT Aprobado
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedJointForReport({
                              projectId: currentProject?.id || '',
                              tag: 'J-01-ISO-104',
                              isometric: 'ISO-PDVSA-HC-04',
                              type: 'BUTT',
                              pipeSize: '8"',
                              wallThicknessMm: 12.7,
                              material: 'API 5L X52',
                              heatNumber: 'COL-99421-A',
                              wpsCode: 'WPS-PDVSA-01',
                              welderStamp: 'W-402 (J. Pérez)',
                              process: 'GTAW',
                              position: '6G',
                              weldDate: '2024-05-12',
                              fitupStatus: 'Aprobado',
                              vtStatus: 'Aprobado',
                              ndtMethod: 'RT',
                              ndtStatus: 'Aprobado',
                              inspectorName: 'Ing. Roberto Blanco'
                            });
                            setActiveTab('ndt_reports');
                          }}
                          className="text-emerald-600 hover:underline font-bold"
                        >
                          Ver Reporte
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 bg-amber-50/20 dark:bg-amber-950/20">
                      <td className="p-3 font-mono font-bold text-amber-600">J-03-ISO-104</td>
                      <td className="p-3 font-mono text-gray-700 dark:text-slate-300">ISO-PDVSA-HC-04</td>
                      <td className="p-3">8" Sch 80 (12.7mm) • API 5L X52</td>
                      <td className="p-3 font-mono text-blue-600">COL-99421-B</td>
                      <td className="p-3">WPS-PDVSA-01 / W-309 (M. Rivas)</td>
                      <td className="p-3 text-center font-bold">5G (SMAW)</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Ok / Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => { setSelectedDiconde(mockDicondeSamples[1]); setActiveTab('diconde'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                        >
                          <AlertTriangle size={12}/> RT Rechazado (LOP 14mm)
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => { setSelectedDiconde(mockDicondeSamples[1]); setActiveTab('diconde'); }}
                          className="text-amber-700 hover:underline font-bold"
                        >
                          DICONDE
                        </button>
                      </td>
                    </tr>
                  </>
                ) : (
                  filteredJoints.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-emerald-600">{j.tag}</td>
                      <td className="p-3 font-mono">{j.isometric}</td>
                      <td className="p-3">{j.pipeSize} ({j.wallThicknessMm}mm) • {j.material}</td>
                      <td className="p-3 font-mono text-blue-600">{j.heatNumber}</td>
                      <td className="p-3">{j.wpsCode} / {j.welderStamp}</td>
                      <td className="p-3 text-center font-bold">{j.position} ({j.process})</td>
                      <td className="p-3 text-center font-bold">{j.fitupStatus} / {j.vtStatus}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          j.ndtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {j.ndtStatus === 'Aprobado' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                          {j.ndtMethod} {j.ndtStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedJointForReport(j);
                            setActiveTab('ndt_reports');
                          }}
                          className="text-emerald-600 hover:underline font-bold"
                        >
                          Reporte
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

      {/* TAB 2: CATÁLOGO WPS / PQR */}
      {activeTab === 'wps' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-gray-200 dark:border-slate-800 border-t-0 p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Catálogo de Especificaciones de Procedimiento de Soldadura (WPS) & PQR (ASME Secc. IX)
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-0.5">
                Variables esenciales, no esenciales y suplementarias según ASME Section IX y API 1104 §5. Requerido para liberar juntas en campo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wpsList.map((wps) => (
              <div key={wps.id} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 bg-gray-50/50 dark:bg-slate-800/50 hover:shadow-md transition-all">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-600">{wps.code}</span>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{wps.process}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {wps.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">PQR Soporte</span>
                    <span className="font-mono font-bold text-blue-600">{wps.pqrCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Metal Base (P-No.)</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{wps.baseMetal}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Metal de Aporte (F-No. / AWS)</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{wps.fillerMetal}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200 dark:border-slate-700">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Rango Espesor</span>
                      <span className="font-mono text-gray-900 dark:text-slate-100">{wps.thicknessRange}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Posición</span>
                      <span className="font-mono text-gray-900 dark:text-slate-100">{wps.position}</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] text-gray-500">
                    Precalentamiento: <strong className="text-gray-700 dark:text-slate-300">{wps.preheatC}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOLDADORES CERTIFICADOS (WPQ) */}
      {activeTab === 'welders' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-gray-200 dark:border-slate-800 border-t-0 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Registro de Calificación de Desempeño de Soldadores (WPQ - ASME IX)</h3>
            <span className="text-xs font-mono font-bold text-emerald-600">{weldersList.length} Registros Activos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weldersList.map((wld) => (
              <div key={wld.id} className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-800/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-2">
                  <span className="text-lg font-black text-purple-700 dark:text-purple-400 font-mono">{wld.stamp}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    wld.status === 'Vigente' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {wld.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white">{wld.name}</h4>
                  <span className="text-xs text-gray-500 font-mono">{wld.idNumber}</span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300">
                  <p><strong>Proceso:</strong> {wld.process}</p>
                  <p><strong>Posición Calificada:</strong> <span className="text-emerald-600 font-bold">{wld.qualifiedPositions}</span></p>
                  <p><strong>Espesores:</strong> {wld.qualifiedThickness}</p>
                  <p><strong>Diámetros:</strong> {wld.qualifiedDiameters}</p>
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between text-[11px] text-gray-500">
                    <span>Emisión: {wld.certDate}</span>
                    <span>Vence: <strong className="text-gray-900 dark:text-slate-100">{wld.expiryDate}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GENERADOR DE REPORTE NDT */}
      {activeTab === 'ndt_reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-gray-200 dark:border-slate-800 border-t-0 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Reporte Técnico Oficial de Inspección NDT / END (API 1104 §8/§9)</h3>
              <p className="text-xs text-gray-500">Visualización de documento listo para firma e impresión.</p>
            </div>
            <button 
              onClick={() => {
                if (selectedJointForReport) {
                  exportNdtReportPdf(selectedJointForReport);
                } else {
                  window.print();
                }
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-soft"
            >
              <Download size={14} /> Descargar Reporte PDF
            </button>
          </div>

          {selectedJointForReport ? (
            <div className="max-w-3xl mx-auto border-2 border-gray-800 dark:border-slate-700 p-8 rounded-xl bg-white text-gray-900 space-y-6 shadow-xl">
              {/* Report Header */}
              <div className="border-b-2 border-gray-800 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Reporte de Ensayos No Destructivos (NDT)</h2>
                  <p className="text-xs font-bold text-gray-600">Conforme a API 1104 §8/§9 / ASME Sección V</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold">N° REP: REP-NDT-2024-089</p>
                  <p className="text-gray-500">Fecha: {selectedJointForReport.weldDate || '2024-05-12'}</p>
                </div>
              </div>

              {/* Joint Specs Table */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-gray-50 p-3 rounded border border-gray-300 space-y-1">
                  <p><strong>Junta Tag:</strong> {selectedJointForReport.tag}</p>
                  <p><strong>Isométrico:</strong> {selectedJointForReport.isometric}</p>
                  <p><strong>Geometría:</strong> {selectedJointForReport.pipeSize} ({selectedJointForReport.wallThicknessMm}mm)</p>
                  <p><strong>Material:</strong> {selectedJointForReport.material}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-300 space-y-1">
                  <p><strong>Colada MTR:</strong> {selectedJointForReport.heatNumber}</p>
                  <p><strong>WPS Aplicada:</strong> {selectedJointForReport.wpsCode}</p>
                  <p><strong>Estampa Soldador:</strong> {selectedJointForReport.welderStamp}</p>
                  <p><strong>Posición / Proceso:</strong> {selectedJointForReport.position} ({selectedJointForReport.process})</p>
                </div>
              </div>

              {/* Inspection Verdict */}
              <div className="border-2 border-gray-800 p-4 rounded text-center space-y-2">
                <p className="text-xs uppercase font-bold text-gray-500">Dictamen de Evaluación API 1104 §8</p>
                <div className="text-2xl font-black tracking-widest text-emerald-700">
                  {selectedJointForReport.ndtStatus === 'Aprobado' ? '✅ ACEPTADO / APROBADO' : '❌ RECHAZADO / REQUIERE REPARACIÓN'}
                </div>
                <p className="text-xs text-gray-600 font-mono">
                  Método de Ensayo: {selectedJointForReport.ndtMethod} | Defectos: {selectedJointForReport.defectType || 'Ninguno'}
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-mono border-t border-gray-300">
                <div>
                  <div className="border-b border-gray-800 mb-1 h-8"></div>
                  <p className="font-bold">Inspector NDT Niv. II ASNT</p>
                  <p className="text-gray-500">{selectedJointForReport.inspectorName || 'Ing. Roberto Blanco'}</p>
                </div>
                <div>
                  <div className="border-b border-gray-800 mb-1 h-8"></div>
                  <p className="font-bold">Aprobado por Cliente / Fiscalía</p>
                  <p className="text-gray-500">Representante PDVSA SIHO-A</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Selecciona una junta de la tabla para ver y generar su reporte NDT oficial.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VISOR DICONDE */}
      {activeTab === 'diconde' && (
        <div className="bg-gray-900 text-white rounded-b-xl border border-gray-800 border-t-0 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded uppercase">
                  ASTM DICONDE Viewer Standard
                </span>
                <span className="text-xs text-gray-400 font-mono">24-bit Grayscale Digital Radiography</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{selectedDiconde.title}</h2>
              <p className="text-xs text-gray-400">{selectedDiconde.defectDetails}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Junta:</span>
              <select
                value={selectedDiconde.id}
                onChange={(e) => {
                  const s = mockDicondeSamples.find(x => x.id === e.target.value);
                  if (s) setSelectedDiconde(s);
                }}
                className="bg-gray-800 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-lg font-mono font-bold"
              >
                {mockDicondeSamples.map(sample => (
                  <option key={sample.id} value={sample.id}>{sample.jointTag} ({sample.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsInverted(!isInverted)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  isInverted ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                <Sliders size={14} /> Invertir Película (X-Ray Look)
              </button>

              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showAnnotations ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                <Layers size={14} /> Capa de Mediciones / Defectos
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Contraste:</span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-24 accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Brillo:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 20))} className="p-1 hover:bg-gray-600 rounded">
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 font-mono text-[11px] font-bold">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 20))} className="p-1 hover:bg-gray-600 rounded">
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[380px]">
            <div 
              className="relative transition-all duration-200"
              style={{
                filter: `${isInverted ? 'invert(100%)' : 'invert(0%)'} contrast(${contrast}%) brightness(${brightness}%)`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center'
              }}
            >
              <img 
                src={selectedDiconde.filmImage} 
                alt="Radiografía DICONDE" 
                className="max-h-[360px] w-auto object-cover opacity-90"
              />
            </div>

            {showAnnotations && selectedDiconde.defectCoords && (
              <div 
                className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none animate-pulse flex items-start p-1"
                style={{
                  left: `${selectedDiconde.defectCoords.x}%`,
                  top: `${selectedDiconde.defectCoords.y}%`,
                  width: `${selectedDiconde.defectCoords.w}%`,
                  height: `${selectedDiconde.defectCoords.h}%`,
                }}
              >
                <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                  🚨 {selectedDiconde.defectCoords.label}
                </span>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs p-2.5 rounded-lg border border-gray-800 text-[11px] font-mono space-y-0.5">
              <p className="text-emerald-400 font-bold">ASTM DICONDE DCM HEADER</p>
              <p className="text-gray-300">Junta: {selectedDiconde.jointTag}</p>
              <p className="text-gray-400">Espesor: 0.500 in | Material: A106 Gr. B</p>
              <p className="text-gray-400">Técnica: RT X-Ray | Norm: API 1104 Sec 8/9</p>
            </div>

            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs px-3 py-1 rounded-lg border border-gray-800 text-[11px] font-mono">
              <span className={selectedDiconde.status === 'Aprobado' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                DIAGNOSTICO NDT: {selectedDiconde.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA JUNTA */}
      {isAddJointModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Control de Soldadura</span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Registrar Junta de Soldadura</h2>
              </div>
              <button onClick={() => setIsAddJointModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateJoint} className="space-y-4 text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Tag de Junta</label>
                  <input
                    type="text"
                    placeholder="Ej: J-05-ISO-104"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">N° Isométrico</label>
                  <input
                    type="text"
                    placeholder="Ej: ISO-PDVSA-HC-04"
                    value={newIsometric}
                    onChange={(e) => setNewIsometric(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Diámetro</label>
                  <input
                    type="text"
                    value={newPipeSize}
                    onChange={(e) => setNewPipeSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Espesor (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWallThickness}
                    onChange={(e) => setNewWallThickness(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Material</label>
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Colada / MTR</label>
                  <input
                    type="text"
                    placeholder="COL-99421-A"
                    value={newHeatNumber}
                    onChange={(e) => setNewHeatNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Procedimiento WPS</label>
                  <input
                    type="text"
                    value={newWpsCode}
                    onChange={(e) => setNewWpsCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Estampa Soldador (WPQ)</label>
                  <input
                    type="text"
                    value={newWelderStamp}
                    onChange={(e) => setNewWelderStamp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Método Ensayo NDT</label>
                  <select
                    value={newNdtMethod}
                    onChange={(e) => setNewNdtMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm font-medium"
                  >
                    <option value="RT">Radiografía Industrial (RT)</option>
                    <option value="UT/PAUT">Ultrasonido Phased Array (UT/PAUT)</option>
                    <option value="PT">Tintes Penetrantes (PT)</option>
                    <option value="MT">Partículas Magnéticas (MT)</option>
                    <option value="VT">Inspección Visual Solo (VT)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddJointModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md cursor-pointer"
                >
                  Guardar Junta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
