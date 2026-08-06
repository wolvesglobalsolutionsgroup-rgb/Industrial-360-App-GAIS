import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Zap, Flame, Droplets, Wind, AlertTriangle, CheckCircle2, 
  XCircle, Plus, Search, Filter, FileText, Download, UserCheck, Key, 
  RefreshCw, CheckSquare, Clock, ShieldAlert, Cpu, Activity
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { lotoIsolationsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offline/syncEngine';
import { createJsPdfInstance } from '../lib/pdfExporter';

export type EnergyType = 'Eléctrica' | 'Mecánica' | 'Hidráulica' | 'Neumática' | 'Química';

export type LockColor = 'Rojo - Personal' | 'Amarillo - Grupo' | 'Azul - Operaciones';

export interface LotoPoint {
  id: string;
  tagEquipment: string; // e.g. K-101 Turbocompresor / P-201
  systemName: string; // e.g. Sistema de Gas de Alimentación
  energyType: EnergyType;
  isolationMethod: string; // e.g. Desconexión de Breaker 480V / Cierre Válvula de Entrada & Ciega
  lockTagId: string; // e.g. LOCK-ELE-104 / TAG-SIHO-089
  lockColor: LockColor;
  ptwNumber: string; // e.g. PTW-2026-0481
  responsibleSupervisor: string;
  isolationDate: string;
  status: 'Aislado & Bloqueado' | 'Prueba Cero Realizada' | 'Desbloqueado / Normalizado';
  
  // Pre-lockout checklist (PDVSA SI-S-28)
  chkDeenergized: boolean; // Desenergizado / Purgado
  chkPhysicalLock: boolean; // Candado y Pinza Múltiple instalados
  chkTagPlaced: boolean; // Tarjeta LOTO colocada
  chkZeroEnergyVerified: boolean; // Prueba de Energía Cero (0 PSI / 0 V)
  chkSignaturesApproved: boolean; // Firma de Autoridad de Área y Executante
  zeroEnergyTestDetails?: string; // e.g. Voltaje 0.0V con multímetro Fluke #401 / Manómetro 0 PSI
  notes?: string;
}

const SAMPLE_LOTO_POINTS: LotoPoint[] = [
  {
    id: 'loto_001',
    tagEquipment: 'K-101B Turbocompresor de Gas',
    systemName: 'Línea de Succión 16" Planta San Joaquín',
    energyType: 'Química',
    isolationMethod: 'Cierre de Válvula XV-1012, Purgado de Tramo y Colocación de Disco Ciego 600#',
    lockTagId: 'LOCK-QUI-014',
    lockColor: 'Rojo - Personal',
    ptwNumber: 'PTW-2026-0891',
    responsibleSupervisor: 'Ing. Carlos Mendoza (SIHO-A)',
    isolationDate: '2026-07-28',
    status: 'Prueba Cero Realizada',
    chkDeenergized: true,
    chkPhysicalLock: true,
    chkTagPlaced: true,
    chkZeroEnergyVerified: true,
    chkSignaturesApproved: true,
    zeroEnergyTestDetails: 'Presión verificada en manómetro PI-1012: 0.0 PSI tras purgado a antorcha. H2S 0 ppm.',
    notes: 'Aislamiento crítico previo a reemplazo de empaque de brida principal.'
  },
  {
    id: 'loto_002',
    tagEquipment: 'P-204A Bomba de Inyección de Agua',
    systemName: 'Centro de Control de Motores (CCM-02)',
    energyType: 'Eléctrica',
    isolationMethod: 'Apertura de Breaker Principal 480V en Cubículo B-04 y Bloqueo con Cerrojo',
    lockTagId: 'LOCK-ELE-042',
    lockColor: 'Amarillo - Grupo',
    ptwNumber: 'PTW-2026-0895',
    responsibleSupervisor: 'Téc. Electricista Roberto Rivas',
    isolationDate: '2026-07-29',
    status: 'Aislado & Bloqueado',
    chkDeenergized: true,
    chkPhysicalLock: true,
    chkTagPlaced: true,
    chkZeroEnergyVerified: false,
    chkSignaturesApproved: false,
    zeroEnergyTestDetails: 'Pendiente verificación de voltaje cero con multímetro calibrado.',
    notes: 'Mantenimiento preventivo quinquenal motor eléctrico 150 HP.'
  },
  {
    id: 'loto_003',
    tagEquipment: 'V-301 Separador Bifásico de Pruebas',
    systemName: 'Sistema Neumático de Instrumentación',
    energyType: 'Neumática',
    isolationMethod: 'Cierre Válvula de Inyección Aire Instrumento 100 PSI y Despresurización',
    lockTagId: 'LOCK-NEU-011',
    lockColor: 'Azul - Operaciones',
    ptwNumber: 'PTW-2026-0902',
    responsibleSupervisor: 'Ing. Elena Torres',
    isolationDate: '2026-07-25',
    status: 'Desbloqueado / Normalizado',
    chkDeenergized: true,
    chkPhysicalLock: true,
    chkTagPlaced: true,
    chkZeroEnergyVerified: true,
    chkSignaturesApproved: true,
    zeroEnergyTestDetails: 'Presión neumática en cero. Trabajos concluidos exitosamente.',
    notes: 'Reemplazo de transmisor de nivel Rosemount completado.'
  }
];

export default function LotoIsolation() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || '';
  const projId = currentProject?.id || 'all';

  const [lotoPoints, setLotoPoints] = useState<LotoPoint[]>(SAMPLE_LOTO_POINTS);
  const [selectedPoint, setSelectedPoint] = useState<LotoPoint | null>(SAMPLE_LOTO_POINTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnergy, setFilterEnergy] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showZeroTestModal, setShowZeroTestModal] = useState(false);

  // New LOTO Form State
  const [tagEquipment, setTagEquipment] = useState('');
  const [systemName, setSystemName] = useState('');
  const [energyType, setEnergyType] = useState<EnergyType>('Eléctrica');
  const [isolationMethod, setIsolationMethod] = useState('');
  const [lockTagId, setLockTagId] = useState('');
  const [lockColor, setLockColor] = useState<LockColor>('Rojo - Personal');
  const [ptwNumber, setPtwNumber] = useState('');
  const [responsibleSupervisor, setResponsibleSupervisor] = useState('');
  const [notes, setNotes] = useState('');

  // Zero Energy Test Form State
  const [testDetails, setTestDetails] = useState('');
  const [chkDeenergized, setChkDeenergized] = useState(true);
  const [chkPhysicalLock, setChkPhysicalLock] = useState(true);
  const [chkTagPlaced, setChkTagPlaced] = useState(true);
  const [chkZeroEnergyVerified, setChkZeroEnergyVerified] = useState(false);
  const [chkSignaturesApproved, setChkSignaturesApproved] = useState(false);

  // Firestore Sync via Repository (limit(50))
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const unsubscribe = lotoIsolationsRepo.subscribe(orgId, currentProject.id, (items) => {
      if (items.length > 0) {
        const loaded = items as unknown as LotoPoint[];
        setLotoPoints(loaded);
        if (loaded.length > 0) setSelectedPoint(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    return () => unsubscribe();
  }, [currentProject, orgId]);

  // Create LOTO Point
  const handleCreateLotoPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    const newPointObj: Omit<LotoPoint, 'id'> = {
      tagEquipment,
      systemName,
      energyType,
      isolationMethod,
      lockTagId: lockTagId || `LOCK-${energyType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      lockColor,
      ptwNumber: ptwNumber || `PTW-2026-${Date.now().toString().slice(-5)}`,
      responsibleSupervisor: responsibleSupervisor || 'Inspector SIHO-A / Supervisor de Guardia',
      isolationDate: today,
      status: 'Aislado & Bloqueado',
      chkDeenergized: true,
      chkPhysicalLock: true,
      chkTagPlaced: true,
      chkZeroEnergyVerified: false,
      chkSignaturesApproved: false,
      zeroEnergyTestDetails: 'Aislamiento físico instalado. Pendiente prueba de energía cero.',
      notes
    };

    if (currentProject && currentProject.id !== 'all') {
      const path = `organizations/${orgId}/projects/${currentProject.id}/loto_isolations`;
      try {
        const docRef = await addDoc(collection(db, path), {
          ...newPointObj,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        const created = { id: docRef.id, ...newPointObj };
        setLotoPoints(prev => [created, ...prev]);
        setSelectedPoint(created);
      } catch {
        await queueOfflineOperation('loto_isolations', 'create', { ...newPointObj, orgId, projectId: currentProject.id });
        const created = { id: `loto_off_${Date.now()}`, ...newPointObj };
        setLotoPoints(prev => [created, ...prev]);
        setSelectedPoint(created);
      }
    } else {
      const created = { id: `loto_local_${Date.now()}`, ...newPointObj };
      setLotoPoints(prev => [created, ...prev]);
      setSelectedPoint(created);
    }

    setShowAddModal(false);
    setTagEquipment('');
    setSystemName('');
    setIsolationMethod('');
    setLockTagId('');
    setPtwNumber('');
    setResponsibleSupervisor('');
    setNotes('');
  };

  // Submit Zero Energy Test
  const handleVerifyZeroEnergy = async () => {
    if (!selectedPoint) return;

    const updatedData: Partial<LotoPoint> = {
      chkDeenergized,
      chkPhysicalLock,
      chkTagPlaced,
      chkZeroEnergyVerified,
      chkSignaturesApproved,
      zeroEnergyTestDetails: testDetails || 'Verificación de Energía Cero completada en campo de acuerdo a PDVSA SI-S-28.',
      status: (chkZeroEnergyVerified && chkSignaturesApproved) ? 'Prueba Cero Realizada' : 'Aislado & Bloqueado'
    };

    if (currentProject && currentProject.id !== 'all' && !selectedPoint.id.startsWith('loto_')) {
      const docPath = `organizations/${orgId}/projects/${currentProject.id}/loto_isolations/${selectedPoint.id}`;
      try {
        await updateDoc(doc(db, docPath), updatedData);
      } catch {
        await queueOfflineOperation('loto_isolations', 'update', { id: selectedPoint.id, ...updatedData });
      }
    }

    const newPoint = { ...selectedPoint, ...updatedData };
    setLotoPoints(prev => prev.map(p => p.id === selectedPoint.id ? newPoint : p));
    setSelectedPoint(newPoint);
    setShowZeroTestModal(false);
  };

  // Unlock / Normalize Equipment
  const handleNormalizeIsolation = async (point: LotoPoint) => {
    if (!confirm(`¿Confirmar desaislamiento y normalización de ${point.tagEquipment}? Se liberarán los candados LOTO.`)) return;

    const updatedData: Partial<LotoPoint> = {
      status: 'Desbloqueado / Normalizado'
    };

    if (currentProject && currentProject.id !== 'all' && !point.id.startsWith('loto_')) {
      const docPath = `organizations/${orgId}/projects/${currentProject.id}/loto_isolations/${point.id}`;
      try {
        await updateDoc(doc(db, docPath), updatedData);
      } catch {
        await queueOfflineOperation('loto_isolations', 'update', { id: point.id, ...updatedData });
      }
    }

    const newPoint = { ...point, ...updatedData };
    setLotoPoints(prev => prev.map(p => p.id === point.id ? newPoint : p));
    if (selectedPoint?.id === point.id) setSelectedPoint(newPoint);
  };

  // Generate PDVSA SI-S-28 LOTO Certificate PDF
  const exportLotoCertificatePdf = (point: LotoPoint) => {
    const docPdf = createJsPdfInstance({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Company Header
    docPdf.setFillColor(11, 34, 57); // Primary Brand
    docPdf.rect(0, 0, 210, 22, 'F');

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(14);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(brandKit?.companyName || 'CONTRATISTA OPERATIVA C.A.', 14, 11);

    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('CERTIFICADO DE AISLAMIENTO Y BLOQUEO LOTO (PDVSA SI-S-28)', 14, 17);

    // Document Metadata Box
    docPdf.setDrawColor(203, 213, 225);
    docPdf.rect(14, 28, 182, 28);

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`CÓDIGO CANDADO / TARJETA: ${point.lockTagId}`, 18, 35);
    docPdf.text(`PERMISO DE TRABAJO (PTW): ${point.ptwNumber}`, 18, 42);
    docPdf.text(`ESTADO ACTUAL: ${point.status.toUpperCase()}`, 18, 49);

    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Fecha Aislamiento: ${point.isolationDate}`, 120, 35);
    docPdf.text(`Tipo Energía: ${point.energyType}`, 120, 42);
    docPdf.text(`Color Candado: ${point.lockColor}`, 120, 49);

    // Section 1: Equipment & System
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(14, 62, 182, 8, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('1. IDENTIFICACIÓN DEL EQUIPO Y FUENTE DE ENERGÍA PELIGROSA', 18, 67.5);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Equipo / Tag: ${point.tagEquipment}`, 18, 76);
    docPdf.text(`Sistema / Planta: ${point.systemName}`, 18, 82);
    docPdf.text(`Método de Aislamiento: ${point.isolationMethod}`, 18, 88);
    docPdf.text(`Responsable SIHO-A: ${point.responsibleSupervisor}`, 18, 94);

    // Section 2: Zero Energy Test Checklist
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(14, 102, 182, 8, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.text('2. VERIFICACIÓN Y PRUEBA DE ENERGÍA CERO (PDVSA SI-S-28)', 18, 107.5);

    const items = [
      { name: '1. Desenergización y Purga Física completada', ok: point.chkDeenergized },
      { name: '2. Colocación de Candado Principal y Pinza Múltiple', ok: point.chkPhysicalLock },
      { name: '3. Tarjeta de Advertencia LOTO en punto de bloqueo', ok: point.chkTagPlaced },
      { name: '4. Prueba de Energía Cero Verificada (0 PSI / 0 V)', ok: point.chkZeroEnergyVerified },
      { name: '5. Aprobación y Firma por Autoridad de Área y Executante', ok: point.chkSignaturesApproved },
    ];

    let y = 116;
    items.forEach(it => {
      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(9.5);
      docPdf.text(it.name, 18, y);
      docPdf.setFont('helvetica', 'bold');
      docPdf.setTextColor(it.ok ? 16 : 220, it.ok ? 185 : 38, it.ok ? 129 : 38);
      docPdf.text(it.ok ? '[ CUMPLIDO - OK ]' : '[ PENDIENTE / NO APLICA ]', 150, y);
      docPdf.setTextColor(15, 23, 42);
      y += 8;
    });

    // Zero Energy Test Details Box
    docPdf.setDrawColor(203, 213, 225);
    docPdf.setFillColor(250, 250, 250);
    docPdf.rect(14, 160, 182, 22, 'DF');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8.5);
    docPdf.text('DETALLES Y LECTURA DE PRUEBA DE ENERGÍA CERO:', 18, 166);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(point.zeroEnergyTestDetails || 'Sin lecturas registradas.', 18, 172, { maxWidth: 174 });

    // Signatures
    docPdf.setDrawColor(148, 163, 184);
    docPdf.line(25, 220, 85, 220);
    docPdf.line(125, 220, 185, 220);

    docPdf.setFontSize(8);
    docPdf.text('AUTORIDAD DE ÁREA / OPERACIONES', 30, 225);
    docPdf.text('EJECUTANTE DE TRABAJO / SIHO-A', 130, 225);

    // Footer
    docPdf.setFontSize(7);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('DOCUMENTO TÉCNICO OFICIAL DE CONTROL DE ENERGÍAS PELIGROSAS - PDVSA SI-S-28', 14, 280);

    docPdf.save(`Certificado_LOTO_${point.lockTagId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const filteredPoints = lotoPoints.filter(p => {
    const matchesSearch = p.tagEquipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.lockTagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ptwNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnergy = filterEnergy === 'todas' || p.energyType === filterEnergy;
    const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;
    return matchesSearch && matchesEnergy && matchesStatus;
  });

  const getEnergyBadge = (type: EnergyType) => {
    switch (type) {
      case 'Eléctrica':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Zap className="w-3.5 h-3.5" /> Eléctrica (⚡)</span>;
      case 'Mecánica':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20"><Cpu className="w-3.5 h-3.5" /> Mecánica (⚙️)</span>;
      case 'Hidráulica':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Droplets className="w-3.5 h-3.5" /> Hidráulica (💧)</span>;
      case 'Neumática':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20"><Wind className="w-3.5 h-3.5" /> Neumática (💨)</span>;
      case 'Química':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><Flame className="w-3.5 h-3.5" /> Química (🧪)</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Control de Fuentes de Energía & LOTO</h1>
              <p className="text-sm text-muted">Aislamiento Seguro de Energías Peligrosas - Norma PDVSA SI-S-28 & OSHA 1910.147</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors shadow-soft"
          >
            <Plus className="w-4 h-4" /> Nuevo Aislamiento LOTO
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Aislamientos Activos</p>
            <p className="text-2xl font-bold text-ink tabular">{lotoPoints.filter(p => p.status !== 'Desbloqueado / Normalizado').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Prueba Cero Verificada</p>
            <p className="text-2xl font-bold text-ink tabular">{lotoPoints.filter(p => p.status === 'Prueba Cero Realizada').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Prueba Pendiente</p>
            <p className="text-2xl font-bold text-ink tabular">{lotoPoints.filter(p => p.status === 'Aislado & Bloqueado').length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-line flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Candados / Tags Digitales</p>
            <p className="text-2xl font-bold text-ink tabular">{lotoPoints.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-surface border border-line">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por Equipo, Candado, PTW o Sistema..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-2 border border-line text-ink placeholder:text-muted focus:outline-none focus-ring text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <select 
              value={filterEnergy}
              onChange={(e) => setFilterEnergy(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-2 border border-line text-ink text-sm focus:outline-none focus-ring"
            >
              <option value="todas">Todas las Energías</option>
              <option value="Eléctrica">⚡ Eléctrica</option>
              <option value="Mecánica">⚙️ Mecánica</option>
              <option value="Hidráulica">💧 Hidráulica</option>
              <option value="Neumática">💨 Neumática</option>
              <option value="Química">🧪 Química</option>
            </select>
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-line text-ink text-sm focus:outline-none focus-ring"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Aislado & Bloqueado">🔒 Aislado & Bloqueado</option>
            <option value="Prueba Cero Realizada">✅ Prueba Cero Realizada</option>
            <option value="Desbloqueado / Normalizado">🔓 Desbloqueado / Normalizado</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LOTO Points List */}
        <div className="lg:col-span-1 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredPoints.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface border border-line text-center space-y-2">
              <Lock className="w-8 h-8 text-muted mx-auto" />
              <p className="text-sm font-medium text-ink">No hay puntos LOTO registrados</p>
              <p className="text-xs text-muted">Crea un nuevo aislamiento para comenzar el control de energía cero.</p>
            </div>
          ) : (
            filteredPoints.map((point) => (
              <div 
                key={point.id}
                onClick={() => setSelectedPoint(point)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  selectedPoint?.id === point.id 
                    ? 'bg-surface border-brand-500 shadow-soft' 
                    : 'bg-surface/60 hover:bg-surface border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-brand-500 tracking-wider uppercase">{point.lockTagId}</span>
                    <h3 className="text-sm font-bold text-ink line-clamp-1">{point.tagEquipment}</h3>
                  </div>
                  {getEnergyBadge(point.energyType)}
                </div>

                <div className="text-xs text-muted line-clamp-2">
                  <span className="font-medium text-ink">Punto:</span> {point.isolationMethod}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
                  <span className="text-muted">PTW: <strong className="text-ink">{point.ptwNumber}</strong></span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    point.status === 'Prueba Cero Realizada' ? 'bg-emerald-500/10 text-emerald-500' :
                    point.status === 'Aislado & Bloqueado' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-muted'
                  }`}>
                    {point.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected LOTO Detail Panel */}
        <div className="lg:col-span-2">
          {selectedPoint ? (
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-card space-y-6">
              {/* Top Banner */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                      TAG CANDADO: {selectedPoint.lockTagId}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                      CANDADO: {selectedPoint.lockColor}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-ink mt-2">{selectedPoint.tagEquipment}</h2>
                  <p className="text-xs text-muted">{selectedPoint.systemName}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => exportLotoCertificatePdf(selectedPoint)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-elevated border border-line text-xs font-medium text-ink transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-500" /> PDF SI-S-28
                  </button>

                  {selectedPoint.status !== 'Desbloqueado / Normalizado' && (
                    <button 
                      onClick={() => handleNormalizeIsolation(selectedPoint)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-500 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" /> Desbloquear / Normalizar
                    </button>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <span className="text-muted font-medium">Método de Aislamiento:</span>
                  <p className="text-ink font-semibold">{selectedPoint.isolationMethod}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <span className="text-muted font-medium">Permiso de Trabajo (PTW):</span>
                  <p className="text-ink font-semibold">{selectedPoint.ptwNumber}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <span className="text-muted font-medium">Supervisor SIHO-A / Operaciones:</span>
                  <p className="text-ink font-semibold">{selectedPoint.responsibleSupervisor}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <span className="text-muted font-medium">Fecha de Aislamiento:</span>
                  <p className="text-ink font-semibold">{selectedPoint.isolationDate}</p>
                </div>
              </div>

              {/* Zero Energy Checklist Section (PDVSA SI-S-28) */}
              <div className="p-5 rounded-xl bg-surface-2 border border-line space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-ink">Checklist Pre-Bloqueo & Prueba de Energía Cero</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setTestDetails(selectedPoint.zeroEnergyTestDetails || '');
                      setChkDeenergized(selectedPoint.chkDeenergized);
                      setChkPhysicalLock(selectedPoint.chkPhysicalLock);
                      setChkTagPlaced(selectedPoint.chkTagPlaced);
                      setChkZeroEnergyVerified(selectedPoint.chkZeroEnergyVerified);
                      setChkSignaturesApproved(selectedPoint.chkSignaturesApproved);
                      setShowZeroTestModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold border border-amber-500/20 transition-colors"
                  >
                    Evaluar / Registrar Prueba
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { label: '1. Desenergización y Purga de Líneas o Circuitos', status: selectedPoint.chkDeenergized },
                    { label: '2. Colocación Físico de Candado LOTO y Pinza Múltiple', status: selectedPoint.chkPhysicalLock },
                    { label: '3. Tarjeta de Advertencia LOTO con ID de Trabajo', status: selectedPoint.chkTagPlaced },
                    { label: '4. Verificación de Presión Cero / Voltaje Cero (0.0 V / 0.0 PSI)', status: selectedPoint.chkZeroEnergyVerified },
                    { label: '5. Validación y Firmas por Supervisor SIHO-A y Operaciones', status: selectedPoint.chkSignaturesApproved }
                  ].map((chk, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-line">
                      <span className="text-ink">{chk.label}</span>
                      {chk.status ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold"><CheckCircle2 className="w-4 h-4" /> Verificado</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold"><Clock className="w-4 h-4" /> Pendiente</span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedPoint.zeroEnergyTestDetails && (
                  <div className="p-3 rounded-lg bg-surface border border-line space-y-1">
                    <span className="text-muted text-[11px] font-medium">Registro de Lectura Cero:</span>
                    <p className="text-xs text-ink font-mono">{selectedPoint.zeroEnergyTestDetails}</p>
                  </div>
                )}
              </div>

              {selectedPoint.notes && (
                <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-1">
                  <span className="text-xs text-muted font-medium">Notas Adicionales de Seguridad:</span>
                  <p className="text-xs text-ink">{selectedPoint.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
              <Lock className="w-12 h-12 text-muted mx-auto" />
              <p className="text-base font-bold text-ink">Selecciona un punto LOTO</p>
              <p className="text-xs text-muted">Haz clic en cualquier aislamiento de la lista lateral para inspeccionar sus detalles.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New LOTO Point */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-surface border border-line shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" /> Registrar Aislamiento LOTO (PDVSA SI-S-28)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-ink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLotoPoint} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Tag del Equipo / Válvula *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. K-101 Turbocompresor"
                    value={tagEquipment}
                    onChange={(e) => setTagEquipment(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Sistema / Planta *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Planta Compresora San Joaquín"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Tipo de Energía *</label>
                  <select 
                    value={energyType}
                    onChange={(e) => setEnergyType(e.target.value as EnergyType)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  >
                    <option value="Eléctrica">⚡ Eléctrica</option>
                    <option value="Mecánica">⚙️ Mecánica</option>
                    <option value="Hidráulica">💧 Hidráulica</option>
                    <option value="Neumática">💨 Neumática</option>
                    <option value="Química">🧪 Química</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Color Candado *</label>
                  <select 
                    value={lockColor}
                    onChange={(e) => setLockColor(e.target.value as LockColor)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  >
                    <option value="Rojo - Personal">🔴 Rojo - Personal</option>
                    <option value="Amarillo - Grupo">🟡 Amarillo - Grupo</option>
                    <option value="Azul - Operaciones">🔵 Azul - Operaciones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">ID Tag Candado</label>
                  <input 
                    type="text" 
                    placeholder="Ej. LOCK-QUI-014"
                    value={lockTagId}
                    onChange={(e) => setLockTagId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Método de Aislamiento Físico *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Ej. Cierre de válvula XV-1012, despresurización a antorcha y colocación de ciego."
                  value={isolationMethod}
                  onChange={(e) => setIsolationMethod(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-medium mb-1">Permiso de Trabajo (PTW)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. PTW-2026-0891"
                    value={ptwNumber}
                    onChange={(e) => setPtwNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-muted font-medium mb-1">Supervisor Responsable SIHO-A</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={responsibleSupervisor}
                    onChange={(e) => setResponsibleSupervisor(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Notas Adicionales</label>
                <input 
                  type="text" 
                  placeholder="Observaciones de campo sobre el punto LOTO"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Crear Aislamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Verify Zero Energy Test */}
      {showZeroTestModal && selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-surface border border-line shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" /> Prueba de Energía Cero (PDVSA SI-S-28)
              </h3>
              <button onClick={() => setShowZeroTestModal(false)} className="text-muted hover:text-ink">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted">Marca los puntos verificados en campo para autorizar el trabajo sobre <strong className="text-ink">{selectedPoint.tagEquipment}</strong>:</p>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-line cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chkDeenergized} 
                    onChange={(e) => setChkDeenergized(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0"
                  />
                  <span className="text-ink">1. Desenergización y Purga Física</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-line cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chkPhysicalLock} 
                    onChange={(e) => setChkPhysicalLock(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0"
                  />
                  <span className="text-ink">2. Candado Físico y Pinza Múltiple Colocados</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-line cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chkTagPlaced} 
                    onChange={(e) => setChkTagPlaced(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0"
                  />
                  <span className="text-ink">3. Tarjeta de Advertencia LOTO Vigente</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-line cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chkZeroEnergyVerified} 
                    onChange={(e) => setChkZeroEnergyVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0"
                  />
                  <span className="text-ink">4. Presión / Voltaje Cero Medido en Manómetro o Multímetro</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-line cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chkSignaturesApproved} 
                    onChange={(e) => setChkSignaturesApproved(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0"
                  />
                  <span className="text-ink">5. Firmas de Validación por Supervisor SIHO-A y Ejecutante</span>
                </label>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Detalle de Lectura de Campo (Medidor / Instrumento)</label>
                <textarea 
                  rows={2}
                  placeholder="Ej. Multímetro Fluke #401: 0.0V CA/CC en fases L1-L2-L3. Manómetro: 0.0 PSI."
                  value={testDetails}
                  onChange={(e) => setTestDetails(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line text-ink focus:outline-none focus-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <button 
                type="button" 
                onClick={() => setShowZeroTestModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-2 text-ink hover:bg-elevated transition-colors text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleVerifyZeroEnergy}
                className="px-5 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shadow-soft text-xs"
              >
                Guardar Prueba Cero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
