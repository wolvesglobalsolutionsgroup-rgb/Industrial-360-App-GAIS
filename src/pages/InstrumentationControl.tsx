import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Sliders, CheckCircle2, AlertTriangle, Plus, Search, 
  Filter, FileText, Download, RefreshCw, Layers, ShieldCheck, Zap, Gauge, 
  Settings, CheckSquare, XCircle, Wrench, ArrowRight, Camera
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { instrumentLoopsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offline/syncEngine';
import { createJsPdfInstance } from '../lib/pdfExporter';
import { drawQualityHeader, drawPhotoEvidences, drawQualityFooter, cleanPdfText } from '../lib/pdfQualityUtils';

export type InstrumentType = 'PT' | 'TT' | 'FT' | 'LT' | 'PSV' | 'CV'; // Presión, Temp, Flujo, Nivel, Válvula Alivio, Control

export interface CalibrationPoint {
  inputPercent: number; // 0%, 25%, 50%, 75%, 100%
  expectedVal: number;
  measuredVal: number;
  errorPercentFs: number;
  passed: boolean;
}

export interface InstrumentLoop {
  id: string;
  tagNo: string; // e.g., PT-101A
  loopTag: string; // e.g., LOOP-101 (Lazo de Presión Entrada K-101)
  pidNumber: string; // e.g., P&ID-SJ-101-REV2
  instrumentType: InstrumentType;
  description: string;
  location: string; // e.g., Módulo M-01 / Cabezal de Succión
  rangeMin: number; // e.g., 0
  rangeMax: number; // e.g., 1000
  unit: string; // e.g., PSI, °C, GPM, %
  toleranceFsPercent: number; // e.g., 0.5%
  signalType: '4-20mA HART' | 'Fieldbus Foundation' | 'Modbus RTU' | 'Neumático 3-15 PSI';
  calibrationDate: string;
  nextCalibrationDate: string;
  calibratedBy: string;
  status: 'Calibrado & Operativo' | 'Pendiente Calibración' | 'Fuera de Tolerancia';
  calibrationPoints?: CalibrationPoint[];
  evidencePhotos?: string[];
  notes?: string;
}

const SAMPLE_LOOPS: InstrumentLoop[] = [
  {
    id: 'loop_001',
    tagNo: 'PT-101A',
    loopTag: 'LOOP-101 (Presión Succión Compresor K-101)',
    pidNumber: 'P&ID-SJ-101-REV2',
    instrumentType: 'PT',
    description: 'Transmisor de Presión Inteligente HART Succión 16"',
    location: 'Tramo de Entrada Planta San Joaquín',
    rangeMin: 0,
    rangeMax: 1200,
    unit: 'PSI',
    toleranceFsPercent: 0.5,
    signalType: '4-20mA HART',
    calibrationDate: '2026-07-20',
    nextCalibrationDate: '2027-07-20',
    calibratedBy: 'Ing. Instrumentista Luis Silva',
    status: 'Calibrado & Operativo',
    calibrationPoints: [
      { inputPercent: 0, expectedVal: 0, measuredVal: 0.2, errorPercentFs: 0.016, passed: true },
      { inputPercent: 25, expectedVal: 300, measuredVal: 300.8, errorPercentFs: 0.066, passed: true },
      { inputPercent: 50, expectedVal: 600, measuredVal: 601.2, errorPercentFs: 0.1, passed: true },
      { inputPercent: 75, expectedVal: 900, measuredVal: 900.5, errorPercentFs: 0.041, passed: true },
      { inputPercent: 100, expectedVal: 1200, measuredVal: 1201.0, errorPercentFs: 0.083, passed: true },
    ],
    evidencePhotos: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ],
    notes: 'Calibración ejecutada con calibrador de procesos Fluke 754 y bomba neumática de prueba.'
  },
  {
    id: 'loop_002',
    tagNo: 'TT-204B',
    loopTag: 'LOOP-204 (Temperatura Salida Intercambiador E-201)',
    pidNumber: 'P&ID-SJ-204-REV1',
    instrumentType: 'TT',
    description: 'Transmisor de Temperatura RTD Pt100 Dúplex',
    location: 'Línea de Salida Crudo E-201',
    rangeMin: 0,
    rangeMax: 200,
    unit: '°C',
    toleranceFsPercent: 0.25,
    signalType: 'Fieldbus Foundation',
    calibrationDate: '2026-07-15',
    nextCalibrationDate: '2027-07-15',
    calibratedBy: 'Téc. Instrumentista Mario Rivas',
    status: 'Calibrado & Operativo',
    calibrationPoints: [
      { inputPercent: 0, expectedVal: 0, measuredVal: 0.1, errorPercentFs: 0.05, passed: true },
      { inputPercent: 50, expectedVal: 100, measuredVal: 100.2, errorPercentFs: 0.1, passed: true },
      { inputPercent: 100, expectedVal: 200, measuredVal: 200.3, errorPercentFs: 0.15, passed: true },
    ],
    notes: 'Ajuste de Cero y Span verificado en bloque seco calibrado.'
  },
  {
    id: 'loop_003',
    tagNo: 'PSV-301',
    loopTag: 'LOOP-301 (Seguridad Depurador de Gas V-301)',
    pidNumber: 'P&ID-SJ-301-REV3',
    instrumentType: 'PSV',
    description: 'Válvula de Seguridad y Alivio Convencional 3"x4"',
    location: 'Domo Superior Separador V-301',
    rangeMin: 0,
    rangeMax: 1500,
    unit: 'PSI',
    toleranceFsPercent: 1.0,
    signalType: 'Neumático 3-15 PSI',
    calibrationDate: '2026-06-10',
    nextCalibrationDate: '2026-12-10',
    calibratedBy: 'Taller Central de Válvulas O&G',
    status: 'Fuera de Tolerancia',
    calibrationPoints: [
      { inputPercent: 100, expectedVal: 1000, measuredVal: 1025, errorPercentFs: 1.66, passed: false }
    ],
    notes: 'Presión de disparo excedió la tolerancia de norma ASME Sec. VIII (Set Point 1000 PSI).'
  }
];

export default function InstrumentationControl() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || '';
  const projId = currentProject?.id || 'all';

  const [loops, setLoops] = useState<InstrumentLoop[]>(SAMPLE_LOOPS);
  const [selectedLoop, setSelectedLoop] = useState<InstrumentLoop | null>(SAMPLE_LOOPS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalibModal, setShowCalibModal] = useState(false);

  // New Loop Form State
  const [tagNo, setTagNo] = useState('');
  const [loopTag, setLoopTag] = useState('');
  const [pidNumber, setPidNumber] = useState('');
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('PT');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(1000);
  const [unit, setUnit] = useState('PSI');
  const [toleranceFsPercent, setToleranceFsPercent] = useState(0.5);
  const [signalType, setSignalType] = useState<'4-20mA HART' | 'Fieldbus Foundation' | 'Modbus RTU' | 'Neumático 3-15 PSI'>('4-20mA HART');
  const [calibratedBy, setCalibratedBy] = useState('');

  // Calibration Form State
  const [p0, setP0] = useState(0);
  const [p25, setP25] = useState(250);
  const [p50, setP50] = useState(500);
  const [p75, setP75] = useState(750);
  const [p100, setP100] = useState(1000);

  // Firestore Listen via Repository (limit(50))
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const unsubscribe = instrumentLoopsRepo.subscribe(orgId, currentProject.id, (items) => {
      if (items.length > 0) {
        const loaded = items as unknown as InstrumentLoop[];
        setLoops(loaded);
        if (loaded.length > 0) setSelectedLoop(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    return () => unsubscribe();
  }, [currentProject, orgId]);

  // Create Instrument Loop
  const handleCreateLoop = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newObj: Omit<InstrumentLoop, 'id'> = {
      tagNo: tagNo || `${instrumentType}-10${Date.now().toString().slice(-2)}`,
      loopTag: loopTag || `LOOP-10${Date.now().toString().slice(-2)} (${description || 'Lazo de Control'})`,
      pidNumber: pidNumber || 'P&ID-SJ-101-REV1',
      instrumentType,
      description,
      location,
      rangeMin: Number(rangeMin),
      rangeMax: Number(rangeMax),
      unit,
      toleranceFsPercent: Number(toleranceFsPercent),
      signalType,
      calibrationDate: today,
      nextCalibrationDate: nextYear,
      calibratedBy: calibratedBy || 'Inspector Instrumentación SIHO-A',
      status: 'Pendiente Calibración',
      calibrationPoints: []
    };

    if (currentProject && currentProject.id !== 'all') {
      const path = `organizations/${orgId}/projects/${currentProject.id}/instrument_loops`;
      try {
        const docRef = await addDoc(collection(db, path), {
          ...newObj,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        const created = { id: docRef.id, ...newObj };
        setLoops(prev => [created, ...prev]);
        setSelectedLoop(created);
      } catch {
        await queueOfflineOperation('instrument_loops', 'create', { ...newObj, orgId, projectId: currentProject.id });
        const created = { id: `inst_off_${Date.now()}`, ...newObj };
        setLoops(prev => [created, ...prev]);
        setSelectedLoop(created);
      }
    } else {
      const created = { id: `inst_local_${Date.now()}`, ...newObj };
      setLoops(prev => [created, ...prev]);
      setSelectedLoop(created);
    }

    setShowAddModal(false);
    setTagNo('');
    setLoopTag('');
    setPidNumber('');
    setDescription('');
    setLocation('');
  };

  // Submit Calibration Points
  const handleSaveCalibration = async () => {
    if (!selectedLoop) return;

    const span = selectedLoop.rangeMax - selectedLoop.rangeMin;
    const tolFs = selectedLoop.toleranceFsPercent;

    const testPoints = [
      { pct: 0, measured: Number(p0) },
      { pct: 25, measured: Number(p25) },
      { pct: 50, measured: Number(p50) },
      { pct: 75, measured: Number(p75) },
      { pct: 100, measured: Number(p100) },
    ];

    let allPassed = true;
    const computedPoints: CalibrationPoint[] = testPoints.map(pt => {
      const expected = selectedLoop.rangeMin + (span * pt.pct / 100);
      const errFs = Math.abs((pt.measured - expected) / span) * 100;
      const passed = errFs <= tolFs;
      if (!passed) allPassed = false;
      return {
        inputPercent: pt.pct,
        expectedVal: Number(expected.toFixed(2)),
        measuredVal: pt.measured,
        errorPercentFs: Number(errFs.toFixed(3)),
        passed
      };
    });

    const updatedData: Partial<InstrumentLoop> = {
      calibrationPoints: computedPoints,
      status: allPassed ? 'Calibrado & Operativo' : 'Fuera de Tolerancia',
      calibrationDate: new Date().toISOString().split('T')[0]
    };

    if (currentProject && currentProject.id !== 'all' && !selectedLoop.id.startsWith('inst_')) {
      const docPath = `organizations/${orgId}/projects/${currentProject.id}/instrument_loops/${selectedLoop.id}`;
      try {
        await updateDoc(doc(db, docPath), updatedData);
      } catch {
        await queueOfflineOperation('instrument_loops', 'update', { id: selectedLoop.id, ...updatedData });
      }
    }

    const newLoop = { ...selectedLoop, ...updatedData };
    setLoops(prev => prev.map(l => l.id === selectedLoop.id ? newLoop : l));
    setSelectedLoop(newLoop);
    setShowCalibModal(false);
  };

  // Export Calibration Certificate PDF
  const exportCalibrationPdf = (loop: InstrumentLoop) => {
    const docPdf = createJsPdfInstance({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Header with BrandKit
    const yHeader = drawQualityHeader({
      docPdf,
      brandKit,
      project: currentProject,
      documentTitle: 'CERTIFICADO DE CALIBRACIÓN DE INSTRUMENTACIÓN & LAZOS',
      documentSubtitle: 'NORMA PDVSA K-301 & ISA 5.1 - PRUEBAS PRE-COMISIONAMIENTO',
      reportCode: `CAL-${cleanPdfText(loop.tagNo)}`,
      normRef: 'PDVSA K-301 / ISA 5.1',
      issueDate: loop.calibrationDate,
      inspectorName: loop.calibratedBy || 'Ing. Instrumentista QA/QC'
    });

    let y = yHeader + 2;

    // Instrument Info Box
    docPdf.setDrawColor(203, 213, 225);
    docPdf.setFillColor(250, 250, 250);
    docPdf.rect(12, y, 186, 26, 'FD');

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(8.5);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`TAG INSTRUMENTO: ${cleanPdfText(loop.tagNo)}`, 16, y + 6);
    docPdf.text(`LAZO DE CONTROL: ${cleanPdfText(loop.loopTag)}`, 16, y + 12);
    docPdf.text(`PLANO P&ID: ${cleanPdfText(loop.pidNumber)}`, 16, y + 18);
    docPdf.text(`ESTADO DICTAMEN: ${cleanPdfText(loop.status).toUpperCase()}`, 16, y + 24);

    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Rango: ${loop.rangeMin} a ${loop.rangeMax} ${cleanPdfText(loop.unit)}`, 110, y + 6);
    docPdf.text(`Tolerancia: ±${loop.toleranceFsPercent.toFixed(2)}% FS`, 110, y + 12);
    docPdf.text(`Señal: ${cleanPdfText(loop.signalType)}`, 110, y + 18);
    docPdf.text(`Ubicación: ${cleanPdfText(loop.location)}`, 110, y + 24);

    y += 32;

    // Calibration Points Table Header
    docPdf.setFillColor(11, 34, 57);
    docPdf.rect(12, y, 186, 7, 'F');
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8);
    docPdf.text('PUNTO (%)', 16, y + 5);
    docPdf.text('PATRÓN ESPERADO', 50, y + 5);
    docPdf.text('MEDIDA CAMPO', 95, y + 5);
    docPdf.text('ERROR % FS', 135, y + 5);
    docPdf.text('DIAGNOSTICO', 170, y + 5);

    y += 10;
    if (loop.calibrationPoints && loop.calibrationPoints.length > 0) {
      loop.calibrationPoints.forEach((pt, idx) => {
        docPdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        docPdf.rect(12, y - 4, 186, 7, 'F');

        docPdf.setFont('helvetica', 'normal');
        docPdf.setTextColor(15, 23, 42);
        docPdf.setFontSize(8);
        docPdf.text(`${pt.inputPercent}%`, 16, y);
        docPdf.text(`${pt.expectedVal.toFixed(2)} ${cleanPdfText(loop.unit)}`, 50, y);
        docPdf.text(`${pt.measuredVal.toFixed(2)} ${cleanPdfText(loop.unit)}`, 95, y);
        docPdf.text(`${pt.errorPercentFs.toFixed(3)}%`, 135, y);

        docPdf.setFont('helvetica', 'bold');
        docPdf.setTextColor(pt.passed ? 16 : 220, pt.passed ? 185 : 38, pt.passed ? 129 : 38);
        docPdf.text(pt.passed ? 'PASÓ (OK)' : 'FALLÓ', 170, y);
        docPdf.setTextColor(15, 23, 42);
        y += 7;
      });
    } else {
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(8);
      docPdf.setTextColor(100, 116, 139);
      docPdf.text('Sin lecturas de calibración registradas aún en el sistema.', 16, y);
      y += 8;
    }

    if (loop.notes) {
      y += 2;
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text('OBSERVACIONES DE CALIBRACIÓN:', 12, y);
      y += 4;
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(7.5);
      docPdf.text(cleanPdfText(loop.notes), 12, y);
      y += 6;
    } else {
      y += 4;
    }

    // Photo Evidences Section
    const yAfterPhotos = drawPhotoEvidences(docPdf, loop.evidencePhotos || [], y);

    // Footer & Dual Signatures
    drawQualityFooter({
      docPdf,
      brandKit,
      reportCode: `CAL-${cleanPdfText(loop.tagNo)}`,
      normRef: 'PDVSA K-301 / ISA 5.1',
      issueDate: loop.calibrationDate,
      inspectorName: loop.calibratedBy || 'Ing. Instrumentista QA/QC',
      clientInspectorName: 'Ing. Inspector Fiscal PDVSA'
    }, yAfterPhotos);

    docPdf.save(`Calibracion_${loop.tagNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const filteredLoops = loops.filter(l => {
    const matchesSearch = l.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.loopTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.pidNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || l.instrumentType === filterType;
    const matchesStatus = filterStatus === 'todos' || l.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Instrumentación & Lazos P&ID</h1>
              <p className="text-sm text-muted">Gestión de Lazos de Control, Transmisores y PSV - Norma PDVSA K-301 & ISA 5.1</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" /> Nuevo Instrumento / Lazo
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-500">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Instrumentos Registrados</p>
            <p className="text-2xl font-bold text-ink tabular">{loops.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Calibrados & Operativos</p>
            <p className="text-2xl font-bold text-ink tabular">{loops.filter(l => l.status === 'Calibrado & Operativo').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Pendiente Calibración</p>
            <p className="text-2xl font-bold text-ink tabular">{loops.filter(l => l.status === 'Pendiente Calibración').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Fuera de Tolerancia</p>
            <p className="text-2xl font-bold text-ink tabular">{loops.filter(l => l.status === 'Fuera de Tolerancia').length}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-surface border border-line">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por TAG, Lazo o P&ID..." 
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
              <option value="todos">Todos los Tipos</option>
              <option value="PT">PT - Presión</option>
              <option value="TT">TT - Temperatura</option>
              <option value="FT">FT - Flujo</option>
              <option value="LT">LT - Nivel</option>
              <option value="PSV">PSV - Válvula Alivio</option>
            </select>
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-line text-ink text-sm focus:outline-none focus-ring"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Calibrado & Operativo">✅ Calibrado & Operativo</option>
            <option value="Pendiente Calibración">🛠️ Pendiente Calibración</option>
            <option value="Fuera de Tolerancia">⚠️ Fuera de Tolerancia</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instrument List */}
        <div className="lg:col-span-1 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredLoops.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface border border-line text-center space-y-2">
              <Cpu className="w-8 h-8 text-muted mx-auto" />
              <p className="text-sm font-medium text-ink">No hay instrumentos registrados</p>
            </div>
          ) : (
            filteredLoops.map((loop) => (
              <div 
                key={loop.id}
                onClick={() => setSelectedLoop(loop)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  selectedLoop?.id === loop.id 
                    ? 'bg-surface border-brand-500 shadow-soft' 
                    : 'bg-surface/60 hover:bg-surface border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-cyan-500 tracking-wider">{loop.tagNo}</span>
                    <h3 className="text-sm font-bold text-ink line-clamp-1">{loop.loopTag}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-2 text-ink border border-line">
                    {loop.instrumentType}
                  </span>
                </div>

                <div className="text-xs text-muted line-clamp-1">
                  P&ID: <strong className="text-ink">{loop.pidNumber}</strong> | Rango: {loop.rangeMin}-{loop.rangeMax} {loop.unit}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
                  <span className="text-muted">{loop.signalType}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    loop.status === 'Calibrado & Operativo' ? 'bg-emerald-500/10 text-emerald-500' :
                    loop.status === 'Fuera de Tolerancia' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {loop.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel & Interactive ISA Loop Diagram */}
        <div className="lg:col-span-2">
          {selectedLoop ? (
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-500 text-xs font-bold border border-cyan-500/20">
                      TAG: {selectedLoop.tagNo}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-surface-2 text-ink text-xs font-medium border border-line">
                      PLANO {selectedLoop.pidNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-ink mt-2">{selectedLoop.loopTag}</h2>
                  <p className="text-xs text-muted">{selectedLoop.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => exportCalibrationPdf(selectedLoop)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-elevated border border-line text-xs font-medium text-ink transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-500" /> Certificado PDF
                  </button>

                  <button 
                    onClick={() => {
                      setP0(selectedLoop.rangeMin);
                      setP25(selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin) * 0.25);
                      setP50(selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin) * 0.50);
                      setP75(selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin) * 0.75);
                      setP100(selectedLoop.rangeMax);
                      setShowCalibModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-semibold text-cyan-500 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Registrar Calibración
                  </button>
                </div>
              </div>

              {/* ISA 5.1 Interactive Loop Topology View */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Esquema de Lazo de Control (Diagrama ISA 5.1)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Tolerancia Error: ±{selectedLoop.toleranceFsPercent}% FS</span>
                </div>

                {/* Topology Blocks */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                  {/* Field Instrument Block */}
                  <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-center w-full md:w-36 space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold block uppercase">Elemento Campo</span>
                    <div className="w-10 h-10 rounded-full border-2 border-cyan-400 flex items-center justify-center mx-auto font-bold text-white bg-slate-900">
                      {selectedLoop.instrumentType}
                    </div>
                    <span className="font-mono text-[11px] text-slate-300 block">{selectedLoop.tagNo}</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />

                  {/* Signal Transmission Block */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center w-full md:w-44 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Transmisión Señal</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] block">
                      {selectedLoop.signalType}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{selectedLoop.rangeMin} - {selectedLoop.rangeMax} {selectedLoop.unit}</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />

                  {/* Controller / DCS PLC Block */}
                  <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-center w-full md:w-40 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase">Sistema DCS / PLC</span>
                    <span className="font-bold text-white block">PIC-101 / SCADA</span>
                    <span className="text-[10px] text-slate-400 block">Planta San Joaquín</span>
                  </div>
                </div>
              </div>

              {/* Calibration Points Table */}
              <div className="p-5 rounded-xl bg-surface-2 border border-line space-y-3">
                <h3 className="text-sm font-bold text-ink">Puntos de Calibración de Campo (% FS Error)</h3>

                {selectedLoop.calibrationPoints && selectedLoop.calibrationPoints.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-line text-muted">
                          <th className="p-2">Punto (%)</th>
                          <th className="p-2">Patrón Esperado</th>
                          <th className="p-2">Lectura Campo</th>
                          <th className="p-2">% Error FS</th>
                          <th className="p-2 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {selectedLoop.calibrationPoints.map((pt, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-ink">{pt.inputPercent}%</td>
                            <td className="p-2 text-ink">{pt.expectedVal} {selectedLoop.unit}</td>
                            <td className="p-2 font-mono text-ink">{pt.measuredVal} {selectedLoop.unit}</td>
                            <td className="p-2 font-mono text-ink">{pt.errorPercentFs}%</td>
                            <td className="p-2 text-right">
                              {pt.passed ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">PASÓ (OK)</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-semibold">FALLÓ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Sin lecturas de calibración. Haz clic en "Registrar Calibración" para ingresar pruebas.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
              <Cpu className="w-12 h-12 text-muted mx-auto" />
              <p className="text-base font-bold text-ink">Selecciona un instrumento</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Instrument Loop */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-surface border border-line shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-500" /> Registrar Instrumento / Lazo (PDVSA K-301)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-ink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoop} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">TAG Instrumento *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. PT-101A"
                    value={tagNo}
                    onChange={(e) => setTagNo(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Nombre del Lazo (Loop Tag) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. LOOP-101 (Presión Succión K-101)"
                    value={loopTag}
                    onChange={(e) => setLoopTag(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Tipo de Instrumento *</label>
                  <select 
                    value={instrumentType}
                    onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  >
                    <option value="PT">PT - Presión</option>
                    <option value="TT">TT - Temperatura</option>
                    <option value="FT">FT - Flujo</option>
                    <option value="LT">LT - Nivel</option>
                    <option value="PSV">PSV - Válvula Alivio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Plano P&ID *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. P&ID-SJ-101-REV2"
                    value={pidNumber}
                    onChange={(e) => setPidNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Tipo Señal *</label>
                  <select 
                    value={signalType}
                    onChange={(e) => setSignalType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  >
                    <option value="4-20mA HART">4-20mA HART</option>
                    <option value="Fieldbus Foundation">Fieldbus Foundation</option>
                    <option value="Modbus RTU">Modbus RTU</option>
                    <option value="Neumático 3-15 PSI">Neumático 3-15 PSI</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Rango Mínimo</label>
                  <input 
                    type="number" 
                    value={rangeMin}
                    onChange={(e) => setRangeMin(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Rango Máximo</label>
                  <input 
                    type="number" 
                    value={rangeMax}
                    onChange={(e) => setRangeMax(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Unidad (Un)</label>
                  <input 
                    type="text" 
                    placeholder="PSI, °C, GPM"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Descripción Técnica del Instrumento</label>
                <input 
                  type="text" 
                  placeholder="Ej. Transmisor inteligente de presión diferencial HART"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                />
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
                  Registrar Instrumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Calibration Readings */}
      {showCalibModal && selectedLoop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-line shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-500" /> Cargar Lecturas Calibración ({selectedLoop.tagNo})
              </h3>
              <button onClick={() => setShowCalibModal(false)} className="text-muted hover:text-ink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted">Ingresa los valores medidos en campo ({selectedLoop.unit}) para calcular el % error FS:</p>

              <div className="space-y-2">
                <div>
                  <label className="block text-muted mb-0.5">0% FS (Esperado: {selectedLoop.rangeMin} {selectedLoop.unit})</label>
                  <input type="number" step="any" value={p0} onChange={(e) => setP0(Number(e.target.value))} className="w-full p-2 rounded bg-surface-2 border border-line text-ink" />
                </div>

                <div>
                  <label className="block text-muted mb-0.5">25% FS (Esperado: {selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin)*0.25} {selectedLoop.unit})</label>
                  <input type="number" step="any" value={p25} onChange={(e) => setP25(Number(e.target.value))} className="w-full p-2 rounded bg-surface-2 border border-line text-ink" />
                </div>

                <div>
                  <label className="block text-muted mb-0.5">50% FS (Esperado: {selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin)*0.50} {selectedLoop.unit})</label>
                  <input type="number" step="any" value={p50} onChange={(e) => setP50(Number(e.target.value))} className="w-full p-2 rounded bg-surface-2 border border-line text-ink" />
                </div>

                <div>
                  <label className="block text-muted mb-0.5">75% FS (Esperado: {selectedLoop.rangeMin + (selectedLoop.rangeMax - selectedLoop.rangeMin)*0.75} {selectedLoop.unit})</label>
                  <input type="number" step="any" value={p75} onChange={(e) => setP75(Number(e.target.value))} className="w-full p-2 rounded bg-surface-2 border border-line text-ink" />
                </div>

                <div>
                  <label className="block text-muted mb-0.5">100% FS (Esperado: {selectedLoop.rangeMax} {selectedLoop.unit})</label>
                  <input type="number" step="any" value={p100} onChange={(e) => setP100(Number(e.target.value))} className="w-full p-2 rounded bg-surface-2 border border-line text-ink" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <button onClick={() => setShowCalibModal(false)} className="px-4 py-2 rounded-xl bg-surface-2 text-ink text-xs">
                Cancelar
              </button>
              <button onClick={handleSaveCalibration} className="px-5 py-2 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 text-xs shadow-soft">
                Guardar y Validar Calibración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
