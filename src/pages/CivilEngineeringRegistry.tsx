import React, { useState, useEffect } from 'react';
import { 
  Building2, HardHat, CheckCircle2, AlertTriangle, Plus, Search, 
  Filter, FileText, Download, RefreshCw, Scale, ShieldCheck, Layers, 
  Ruler, Activity, XCircle, Droplets, Calendar, Camera, Image
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { civilStructuresRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offline/syncEngine';
import { createJsPdfInstance } from '../lib/pdfExporter';
import { drawQualityHeader, drawPhotoEvidences, drawQualityFooter, cleanPdfText } from '../lib/pdfQualityUtils';

export type CivilTestType = 'Densidad_Campo_Cono_Arena' | 'Compresion_Probetas_Concreto';

export interface SandConeTest {
  location: string; // e.g. Macolla M-01 / Fundación Bomba B-101
  layerDepthCm: number; // e.g. 30 cm
  moisturePercent: number; // e.g. 8.5%
  wetDensityGcm3: number; // e.g. 2.15 g/cm3
  dryDensityGcm3: number; // e.g. 1.98 g/cm3
  proctorMaxDryDensityGcm3: number; // e.g. 2.05 g/cm3
  compactionPercent: number; // (dryDensity / proctorMax) * 100
  requiredCompactionPercent: number; // 95% or 98%
  passed: boolean;
}

export interface ConcreteCylinderTest {
  structureName: string; // e.g. Pedestal de Turbocompresor K-101
  batchNumber: string; // e.g. MEZCLA-2026-089
  fcDesignKgcm2: number; // e.g. 280 kg/cm2
  ageDays: 7 | 14 | 28;
  measuredStrengthKgcm2: number; // e.g. 205 kg/cm2 at 7 days
  expectedPercentAtAge: number; // 7d: 65%, 14d: 88%, 28d: 100%
  attainedPercentOfFc: number; // (measured / fcDesign) * 100
  passed: boolean;
}

export interface CivilTestRecord {
  id: string;
  testCode: string; // e.g. ENS-CIV-2026-012
  testType: CivilTestType;
  testDate: string;
  normRef: string; // COVENIN 2000-92 / ASTM D1556 or ACI 318 / COVENIN 1753
  inspectorName: string;
  laboratoryName: string;
  status: 'Aprobado' | 'Rechazado' | 'En Proceso (7-14 días)';
  sandConeData?: SandConeTest;
  concreteData?: ConcreteCylinderTest;
  evidencePhotos?: string[];
  notes?: string;
}

const SAMPLE_CIVIL_RECORDS: CivilTestRecord[] = [
  {
    id: 'civ_001',
    testCode: 'ENS-SUELO-2026-041',
    testType: 'Densidad_Campo_Cono_Arena',
    testDate: '2026-07-22',
    normRef: 'COVENIN 2000-92 / ASTM D1556 (Cono de Arena)',
    inspectorName: 'Ing. Civil Rodolfo Gómez',
    laboratoryName: 'Geotecnia & Suelos Oriente C.A.',
    status: 'Aprobado',
    sandConeData: {
      location: 'Fundación de Macolla B-01 / Sub-base',
      layerDepthCm: 30,
      moisturePercent: 8.2,
      wetDensityGcm3: 2.18,
      dryDensityGcm3: 2.015,
      proctorMaxDryDensityGcm3: 2.08,
      compactionPercent: 96.87,
      requiredCompactionPercent: 95.0,
      passed: true
    },
    evidencePhotos: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
    ],
    notes: 'Compacación aprobada para colocación de losa de soporte.'
  },
  {
    id: 'civ_002',
    testCode: 'ENS-CONC-2026-018',
    testType: 'Compresion_Probetas_Concreto',
    testDate: '2026-07-25',
    normRef: 'ACI 318 / COVENIN 1753 (Rotura de Cilindros)',
    inspectorName: 'Ing. Inspector Francisco Rivas',
    laboratoryName: 'Lab Civiles PDVSA San Joaquín',
    status: 'Aprobado',
    concreteData: {
      structureName: 'Pedestales de Soporte Depurador V-101',
      batchNumber: 'MEZCLA-SJ-2026-014',
      fcDesignKgcm2: 280,
      ageDays: 7,
      measuredStrengthKgcm2: 202,
      expectedPercentAtAge: 65,
      attainedPercentOfFc: 72.14,
      passed: true
    },
    evidencePhotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
    ],
    notes: 'Resistencia a 7 días supera el 65% requerido de f`c.'
  },
  {
    id: 'civ_003',
    testCode: 'ENS-SUELO-2026-042',
    testType: 'Densidad_Campo_Cono_Arena',
    testDate: '2026-07-26',
    normRef: 'COVENIN 2000-92 / ASTM D1556',
    inspectorName: 'Ing. Civil Rodolfo Gómez',
    laboratoryName: 'Geotecnia & Suelos Oriente C.A.',
    status: 'Rechazado',
    sandConeData: {
      location: 'Relleno de Zanja para Tubería 12" Tramo A-2',
      layerDepthCm: 25,
      moisturePercent: 12.4,
      wetDensityGcm3: 1.95,
      dryDensityGcm3: 1.735,
      proctorMaxDryDensityGcm3: 2.05,
      compactionPercent: 84.63,
      requiredCompactionPercent: 95.0,
      passed: false
    },
    notes: 'Exceso de humedad y falta de rodillado. Se requiere re-escarificar y re-compactar.'
  }
];

export default function CivilEngineeringRegistry() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || '';

  const [records, setRecords] = useState<CivilTestRecord[]>(SAMPLE_CIVIL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<CivilTestRecord | null>(SAMPLE_CIVIL_RECORDS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [testType, setTestType] = useState<CivilTestType>('Densidad_Campo_Cono_Arena');

  // Sand Cone Form
  const [location, setLocation] = useState('');
  const [layerDepthCm, setLayerDepthCm] = useState(30);
  const [moisturePercent, setMoisturePercent] = useState(8.5);
  const [wetDensityGcm3, setWetDensityGcm3] = useState(2.15);
  const [proctorMaxGcm3, setProctorMaxGcm3] = useState(2.05);

  // Concrete Cylinder Form
  const [structureName, setStructureName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [fcDesignKgcm2, setFcDesignKgcm2] = useState(280);
  const [ageDays, setAgeDays] = useState<7 | 14 | 28>(7);
  const [measuredStrengthKgcm2, setMeasuredStrengthKgcm2] = useState(200);

  const [inspectorName, setInspectorName] = useState('');
  const [laboratoryName, setLaboratoryName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo1, setPhoto1] = useState('');
  const [photo2, setPhoto2] = useState('');

  // Handle image upload to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (photoNum === 1) setPhoto1(reader.result as string);
        else setPhoto2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Firestore Listen via Repository (limit(50))
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const unsubscribe = civilStructuresRepo.subscribe(orgId, currentProject.id, (items) => {
      if (items.length > 0) {
        const loaded = items as unknown as CivilTestRecord[];
        setRecords(loaded);
        if (loaded.length > 0) setSelectedRecord(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    return () => unsubscribe();
  }, [currentProject, orgId]);

  // Create Civil Test Record
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    let recordStatus: 'Aprobado' | 'Rechazado' | 'En Proceso (7-14 días)' = 'Aprobado';
    let sandConeData: SandConeTest | undefined = undefined;
    let concreteData: ConcreteCylinderTest | undefined = undefined;

    if (testType === 'Densidad_Campo_Cono_Arena') {
      const dryDensity = Number((wetDensityGcm3 / (1 + (moisturePercent / 100))).toFixed(3));
      const compactionPct = Number(((dryDensity / proctorMaxGcm3) * 100).toFixed(2));
      const passed = compactionPct >= 95.0;
      recordStatus = passed ? 'Aprobado' : 'Rechazado';

      sandConeData = {
        location: location || 'Área de Macolla B-01',
        layerDepthCm: Number(layerDepthCm),
        moisturePercent: Number(moisturePercent),
        wetDensityGcm3: Number(wetDensityGcm3),
        dryDensityGcm3: dryDensity,
        proctorMaxDryDensityGcm3: Number(proctorMaxGcm3),
        compactionPercent: compactionPct,
        requiredCompactionPercent: 95.0,
        passed
      };
    } else {
      const attainedPct = Number(((measuredStrengthKgcm2 / fcDesignKgcm2) * 100).toFixed(2));
      const minRequiredPct = ageDays === 7 ? 65 : ageDays === 14 ? 85 : 100;
      const passed = attainedPct >= minRequiredPct;
      recordStatus = passed ? (ageDays === 28 ? 'Aprobado' : 'En Proceso (7-14 días)') : 'Rechazado';

      concreteData = {
        structureName: structureName || 'Fundaciones de Equipos',
        batchNumber: batchNumber || `MEZCLA-${Date.now().toString().slice(-4)}`,
        fcDesignKgcm2: Number(fcDesignKgcm2),
        ageDays,
        measuredStrengthKgcm2: Number(measuredStrengthKgcm2),
        expectedPercentAtAge: minRequiredPct,
        attainedPercentOfFc: attainedPct,
        passed
      };
    }

    const evidencePhotos = [photo1, photo2].filter(p => p.trim().length > 0);

    const newObj: Omit<CivilTestRecord, 'id'> = {
      testCode: `ENS-CIV-${Date.now().toString().slice(-4)}`,
      testType,
      testDate: new Date().toISOString().split('T')[0],
      normRef: testType === 'Densidad_Campo_Cono_Arena' 
        ? 'COVENIN 2000-92 / ASTM D1556 (Cono de Arena)' 
        : 'ACI 318 / COVENIN 1753 (Ensayos de Concreto)',
      inspectorName: inspectorName || 'Ing. Inspector Geotecnia',
      laboratoryName: laboratoryName || 'Laboratorio de Control de Calidad O&G',
      status: recordStatus,
      sandConeData,
      concreteData,
      evidencePhotos: evidencePhotos.length > 0 ? evidencePhotos : undefined,
      notes
    };

    if (currentProject && currentProject.id !== 'all') {
      const path = `organizations/${orgId}/projects/${currentProject.id}/civil_tests`;
      try {
        const docRef = await addDoc(collection(db, path), {
          ...newObj,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        const created = { id: docRef.id, ...newObj };
        setRecords(prev => [created, ...prev]);
        setSelectedRecord(created);
      } catch {
        await queueOfflineOperation('civil_tests', 'create', { ...newObj, orgId, projectId: currentProject.id });
        const created = { id: `civ_off_${Date.now()}`, ...newObj };
        setRecords(prev => [created, ...prev]);
        setSelectedRecord(created);
      }
    } else {
      const created = { id: `civ_local_${Date.now()}`, ...newObj };
      setRecords(prev => [created, ...prev]);
      setSelectedRecord(created);
    }

    setPhoto1('');
    setPhoto2('');
    setShowAddModal(false);
  };

  // Export Protocol PDF with BrandKit header, clean text, photos, and SHA-256 footer
  const exportProtocolPdf = (rec: CivilTestRecord) => {
    const docPdf = createJsPdfInstance({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Corporate Header
    const yHeader = drawQualityHeader({
      docPdf,
      brandKit,
      project: currentProject,
      documentTitle: 'PROTOCOLO DE ENSAYO CIVIL & CALIDAD DE CAMPO',
      documentSubtitle: rec.testType === 'Densidad_Campo_Cono_Arena' 
        ? 'DENSIDAD DE CAMPO / COVENIN 2000-92 / ASTM D1556' 
        : "RESISTENCIA DE CONCRETO / ACI 318 / COVENIN 1753",
      reportCode: rec.testCode,
      normRef: rec.normRef,
      issueDate: rec.testDate,
      inspectorName: rec.inspectorName
    });

    let y = yHeader + 2;

    // Box Summary
    docPdf.setDrawColor(203, 213, 225);
    docPdf.setFillColor(250, 250, 250);
    docPdf.rect(12, y, 186, 26, 'FD');

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(8.5);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`CÓDIGO PROTOCOLO: ${cleanPdfText(rec.testCode)}`, 16, y + 6);
    docPdf.text(`TIPO DE ENSAYO: ${rec.testType === 'Densidad_Campo_Cono_Arena' ? 'Densidad de Campo (Cono de Arena)' : 'Rotura Probetas de Concreto'}`, 16, y + 12);
    docPdf.text(`FECHA ENSAYO: ${cleanPdfText(rec.testDate)}`, 16, y + 18);
    docPdf.text(`ESTADO DICTAMEN: ${cleanPdfText(rec.status).toUpperCase()}`, 16, y + 24);

    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Laboratorio: ${cleanPdfText(rec.laboratoryName)}`, 110, y + 6);
    docPdf.text(`Inspector Campo: ${cleanPdfText(rec.inspectorName)}`, 110, y + 12);
    if (currentProject?.name) {
      const projStr = cleanPdfText(currentProject.name);
      docPdf.text(`Proyecto: ${projStr.length > 30 ? projStr.substring(0, 28) + '...' : projStr}`, 110, y + 18);
    }

    y += 32;

    // Table Header
    docPdf.setFillColor(11, 34, 57);
    docPdf.rect(12, y, 186, 7, 'F');
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8);

    if (rec.testType === 'Densidad_Campo_Cono_Arena' && rec.sandConeData) {
      const sc = rec.sandConeData;
      docPdf.text('PARÁMETRO DE COMPACTACIÓN DE SUELOS', 16, y + 5);
      docPdf.text('VALOR MEDIDO / RESULTADO', 135, y + 5);

      y += 10;
      docPdf.setTextColor(15, 23, 42);
      docPdf.setFontSize(8);

      const rows = [
        ['Ubicación del Ensayo / Capa:', cleanPdfText(sc.location)],
        ['Profundidad de Capa (cm):', `${sc.layerDepthCm} cm`],
        ['Humedad de Campo (%):', `${sc.moisturePercent.toFixed(2)}%`],
        ['Densidad Seca Obtenida (g/cm³):', `${sc.dryDensityGcm3.toFixed(3)} g/cm³`],
        ['Máxima Densidad Seca Proctor (g/cm³):', `${sc.proctorMaxDryDensityGcm3.toFixed(3)} g/cm³`],
        ['Grado de Compactación Logrado (%):', `${sc.compactionPercent.toFixed(2)}% (Requerido: >=${sc.requiredCompactionPercent.toFixed(1)}%)`]
      ];

      rows.forEach(([label, val], idx) => {
        docPdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        docPdf.rect(12, y - 4, 186, 7, 'F');
        docPdf.setFont('helvetica', 'normal');
        docPdf.text(label, 16, y);
        docPdf.setFont('helvetica', 'bold');
        if (idx === 5) {
          docPdf.setTextColor(sc.passed ? 16 : 220, sc.passed ? 185 : 38, sc.passed ? 129 : 38);
        } else {
          docPdf.setTextColor(15, 23, 42);
        }
        docPdf.text(val, 135, y);
        y += 7;
      });
    } else if (rec.concreteData) {
      const cd = rec.concreteData;
      docPdf.text("PARÁMETRO DE RESISTENCIA DE CONCRETO (f'c)", 16, y + 5);
      docPdf.text('VALOR MEDIDO / RESULTADO', 135, y + 5);

      y += 10;
      docPdf.setTextColor(15, 23, 42);
      docPdf.setFontSize(8);

      const rows = [
        ['Estructura Vaciada:', cleanPdfText(cd.structureName)],
        ['Lote de Mezcla / Batch:', cleanPdfText(cd.batchNumber)],
        ["Resistencia Diseño f'c (kg/cm²):", `${cd.fcDesignKgcm2.toFixed(1)} kg/cm²`],
        ['Edad del Ensayo de Rotura (Días):', `${cd.ageDays} Días`],
        ['Resistencia Medida a la Rotura (kg/cm²):', `${cd.measuredStrengthKgcm2.toFixed(1)} kg/cm²`],
        ["Porcentaje Alcanzado de f'c (%):", `${cd.attainedPercentOfFc.toFixed(2)}% (Esperado a ${cd.ageDays}d: >=${cd.expectedPercentAtAge}%)`]
      ];

      rows.forEach(([label, val], idx) => {
        docPdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        docPdf.rect(12, y - 4, 186, 7, 'F');
        docPdf.setFont('helvetica', 'normal');
        docPdf.text(label, 16, y);
        docPdf.setFont('helvetica', 'bold');
        if (idx === 5) {
          docPdf.setTextColor(cd.passed ? 16 : 220, cd.passed ? 185 : 38, cd.passed ? 129 : 38);
        } else {
          docPdf.setTextColor(15, 23, 42);
        }
        docPdf.text(val, 135, y);
        y += 7;
      });
    }

    if (rec.notes) {
      y += 2;
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text('OBSERVACIONES DE CAMPO:', 12, y);
      y += 4;
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(7.5);
      docPdf.text(cleanPdfText(rec.notes), 12, y);
      y += 6;
    } else {
      y += 4;
    }

    // Photo Evidences Section
    const yAfterPhotos = drawPhotoEvidences(docPdf, rec.evidencePhotos || [], y);

    // Footer & Dual Signatures
    drawQualityFooter({
      docPdf,
      brandKit,
      reportCode: rec.testCode,
      normRef: rec.normRef,
      issueDate: rec.testDate,
      inspectorName: rec.inspectorName,
      clientInspectorName: 'Ing. Inspector Fiscal PDVSA'
    }, yAfterPhotos);

    docPdf.save(`Protocolo_Civil_${rec.testCode}.pdf`);
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.testCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.sandConeData?.location || r.concreteData?.structureName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || r.testType === filterType;
    const matchesStatus = filterStatus === 'todos' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Ensayos Civiles & Densidad de Campo</h1>
              <p className="text-sm text-muted">Control de Compactación de Suelos (COVENIN 2000-92 / ASTM D1556) y Concreto (ACI 318)</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" /> Nuevo Protocolo de Ensayo
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Total Ensayos</p>
            <p className="text-2xl font-bold text-ink tabular">{records.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Aprobados (&gt;95% Compact / f'c)</p>
            <p className="text-2xl font-bold text-ink tabular">{records.filter(r => r.status === 'Aprobado').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Rechazados</p>
            <p className="text-2xl font-bold text-ink tabular">{records.filter(r => r.status === 'Rechazado').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">En Curado (7-14 Días)</p>
            <p className="text-2xl font-bold text-ink tabular">{records.filter(r => r.status === 'En Proceso (7-14 días)').length}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-surface border border-line">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por código, inspector o ubicación..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-2 border border-line text-ink placeholder:text-muted focus:outline-none focus-ring text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-2 border border-line text-ink text-sm focus:outline-none focus-ring"
            >
              <option value="todos">Todos los Ensayos</option>
              <option value="Densidad_Campo_Cono_Arena">Densidad (Cono de Arena)</option>
              <option value="Compresion_Probetas_Concreto">Rotura Concreto (Cilindros)</option>
            </select>
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-line text-ink text-sm focus:outline-none focus-ring"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Aprobado">✅ Aprobado</option>
            <option value="Rechazado">❌ Rechazado</option>
            <option value="En Proceso (7-14 días)">⏳ En Curado (7-14d)</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record List */}
        <div className="lg:col-span-1 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredRecords.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface border border-line text-center space-y-2">
              <Building2 className="w-8 h-8 text-muted mx-auto" />
              <p className="text-sm font-medium text-ink">No hay ensayos registrados</p>
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div 
                key={rec.id}
                onClick={() => setSelectedRecord(rec)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  selectedRecord?.id === rec.id 
                    ? 'bg-surface border-brand-500 shadow-soft' 
                    : 'bg-surface/60 hover:bg-surface border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-orange-500 tracking-wider">{rec.testCode}</span>
                    <h3 className="text-sm font-bold text-ink line-clamp-1">
                      {rec.testType === 'Densidad_Campo_Cono_Arena' 
                        ? (rec.sandConeData?.location || 'Densidad de Suelo') 
                        : (rec.concreteData?.structureName || 'Probetas de Concreto')}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    rec.status === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-500' :
                    rec.status === 'Rechazado' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {rec.status}
                  </span>
                </div>

                <p className="text-xs text-muted line-clamp-1">Norma: <strong className="text-ink">{rec.normRef}</strong></p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
                  <span className="text-muted">{rec.testDate}</span>
                  <span className="font-semibold text-ink">
                    {rec.testType === 'Densidad_Campo_Cono_Arena' 
                      ? `${rec.sandConeData?.compactionPercent}% Compact.` 
                      : `${rec.concreteData?.attainedPercentOfFc}% de f'c`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Protocol & Results Panel */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20">
                      CÓDIGO: {selectedRecord.testCode}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-surface-2 text-ink text-xs font-medium border border-line">
                      FECHA: {selectedRecord.testDate}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-ink mt-2">
                    {selectedRecord.testType === 'Densidad_Campo_Cono_Arena' 
                      ? 'Ensayo de Compactación de Campo (Cono de Arena)' 
                      : 'Ensayo de Resistividad / Compresión de Concreto'}
                  </h2>
                  <p className="text-xs text-muted">{selectedRecord.normRef}</p>
                </div>

                <button 
                  onClick={() => exportProtocolPdf(selectedRecord)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-2 hover:bg-elevated border border-line text-xs font-medium text-ink transition-colors shadow-soft"
                >
                  <Download className="w-4 h-4 text-brand-500" /> Exportar Protocolo PDF
                </button>
              </div>

              {/* Technical Detail Cards */}
              {selectedRecord.testType === 'Densidad_Campo_Cono_Arena' && selectedRecord.sandConeData && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-surface-2 border border-line space-y-3">
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      <Scale className="w-4 h-4 text-orange-500" /> Parámetros Geotécnicos de Compactación (COVENIN 2000-92)
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Humedad de Campo</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.sandConeData.moisturePercent}%</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Densidad Seca (γd)</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.sandConeData.dryDensityGcm3} g/cm³</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Proctor Máx (γd máx)</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.sandConeData.proctorMaxDryDensityGcm3} g/cm³</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Requerido Mínimo</span>
                        <strong className="text-base text-ink tabular">≥{selectedRecord.sandConeData.requiredCompactionPercent}%</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Grado de Compactación de Campo Calculado</span>
                        <span className="text-2xl font-bold font-mono text-orange-400">{selectedRecord.sandConeData.compactionPercent}%</span>
                      </div>

                      {selectedRecord.sandConeData.passed ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> APROBADO (&ge;95%)
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> RECHAZADO (&lt;95%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedRecord.testType === 'Compresion_Probetas_Concreto' && selectedRecord.concreteData && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-surface-2 border border-line space-y-3">
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-orange-500" /> Ensayos de Resistencia a la Compresión f'c (ACI 318)
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Estructura</span>
                        <strong className="text-sm text-ink">{selectedRecord.concreteData.structureName}</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Diseño f'c</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.concreteData.fcDesignKgcm2} kg/cm²</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Edad del Cilindro</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.concreteData.ageDays} Días</strong>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-line">
                        <span className="text-muted block text-[11px]">Resistencia Medida</span>
                        <strong className="text-base text-ink tabular">{selectedRecord.concreteData.measuredStrengthKgcm2} kg/cm²</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Porcentaje Obtenido sobre f'c Diseño</span>
                        <span className="text-2xl font-bold font-mono text-orange-400">{selectedRecord.concreteData.attainedPercentOfFc}% de f'c</span>
                      </div>

                      {selectedRecord.concreteData.passed ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> CONFORME
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> NO CONFORME
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inspector & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
                  <span className="text-muted font-medium">Laboratorio Certificado:</span>
                  <p className="font-bold text-ink">{selectedRecord.laboratoryName}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
                  <span className="text-muted font-medium">Inspector Geotécnico / Civil:</span>
                  <p className="font-bold text-ink">{selectedRecord.inspectorName}</p>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-ink space-y-1">
                  <strong className="text-amber-500 font-bold block">Observaciones Técnicas de Campo:</strong>
                  <p>{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
              <Building2 className="w-12 h-12 text-muted mx-auto" />
              <p className="text-base font-bold text-ink">Selecciona un registro de ensayo</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Civil Test Record */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-surface border border-line shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" /> Registrar Ensayo Civil (COVENIN / ASTM / ACI)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-ink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Tipo de Ensayo *</label>
                <select 
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as CivilTestType)}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                >
                  <option value="Densidad_Campo_Cono_Arena">Densidad de Campo (Cono de Arena - COVENIN 2000-92)</option>
                  <option value="Compresion_Probetas_Concreto">Rotura de Probetas de Concreto (ACI 318)</option>
                </select>
              </div>

              {testType === 'Densidad_Campo_Cono_Arena' ? (
                <>
                  <div>
                    <label className="block text-muted font-medium mb-1">Ubicación / Área del Ensayo *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Macolla B-01 / Sub-base de soporte"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted font-medium mb-1">Humedad de Campo (%)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={moisturePercent}
                        onChange={(e) => setMoisturePercent(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-muted font-medium mb-1">Densidad Húmeda Medida (g/cm³)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={wetDensityGcm3}
                        onChange={(e) => setWetDensityGcm3(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted font-medium mb-1">Máxima Densidad Seca Proctor Modificado (g/cm³)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={proctorMaxGcm3}
                      onChange={(e) => setProctorMaxGcm3(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-muted font-medium mb-1">Estructura / Elemento Vaciado *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej. Pedestal de Turbocompresor K-101"
                      value={structureName}
                      onChange={(e) => setStructureName(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-muted font-medium mb-1">Lote / Batch</label>
                      <input 
                        type="text" 
                        placeholder="Ej. MEZCLA-SJ-2026-01"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-muted font-medium mb-1">Diseño f'c (kg/cm²)</label>
                      <input 
                        type="number" 
                        value={fcDesignKgcm2}
                        onChange={(e) => setFcDesignKgcm2(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-muted font-medium mb-1">Edad Rotura</label>
                      <select 
                        value={ageDays}
                        onChange={(e) => setAgeDays(Number(e.target.value) as any)}
                        className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                      >
                        <option value={7}>7 Días (Min 65%)</option>
                        <option value={14}>14 Días (Min 85%)</option>
                        <option value={28}>28 Días (Min 100%)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted font-medium mb-1">Resistencia Medida a la Compresión (kg/cm²)</label>
                    <input 
                      type="number" 
                      value={measuredStrengthKgcm2}
                      onChange={(e) => setMeasuredStrengthKgcm2(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Inspector Responsable</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Ing. Rodolfo Gómez"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Laboratorio Certificado</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Geotecnia Oriente C.A."
                    value={laboratoryName}
                    onChange={(e) => setLaboratoryName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Observaciones</label>
                <textarea 
                  rows={2}
                  placeholder="Detalles adicionales del ensayo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                />
              </div>

              {/* Photo Evidence Attachments */}
              <div className="space-y-2 border-t border-line pt-3">
                <label className="block text-xs font-bold uppercase text-muted flex items-center gap-2">
                  <Camera className="w-4 h-4 text-brand-500" />
                  Evidencia Fotográfica de Campo (Máx 2 Fotos)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-line text-xs">
                    <span className="block font-semibold mb-1 text-ink">Foto 1 (En sitio / Zanja / Probeta)</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 1)}
                      className="w-full text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white hover:file:bg-brand-600 cursor-pointer"
                    />
                    {photo1 && <span className="text-[10px] text-emerald-500 mt-1 block">✓ Foto 1 Adjuntada</span>}
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-2 border border-line text-xs">
                    <span className="block font-semibold mb-1 text-ink">Foto 2 (Equipo / Calibración)</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 2)}
                      className="w-full text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-white hover:file:bg-brand-600 cursor-pointer"
                    />
                    {photo2 && <span className="text-[10px] text-emerald-500 mt-1 block">✓ Foto 2 Adjuntada</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-2 text-ink hover:bg-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors shadow-soft"
                >
                  Registrar Ensayo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
