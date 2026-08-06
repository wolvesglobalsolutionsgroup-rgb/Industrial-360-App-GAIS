import React, { useState, useEffect } from 'react';
import { 
  QrCode, UserCheck, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Search, Plus, Clock, Users, FileSpreadsheet, 
  Calendar, Award, Camera, RefreshCw, Printer, ShieldAlert, Filter,
  Upload, Image as ImageIcon, RotateCw, AlertOctagon, FileText, KeyRound
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { workersRepo, workerAttendanceRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offline/syncEngine';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import {
  generateOpaqueCredentialId,
  generateRotativeQrToken,
  verifyRotativeQrToken,
  evaluateSihoFitStatus,
  generateAttendanceIdempotencyKey,
  createAuditedAttendanceCorrection,
  createSihoIncidentWorkflow,
  VersionedLaborPolicy,
  QrVerificationResult,
  AttendanceCorrection
} from '../lib/engineering/workerQrEngine';

export interface FieldWorker {
  id: string;
  credentialId?: string; // Opaque ID (CRD_...)
  nationalId: string; // Cédula e.g. V-18.492.102
  fullName: string;
  role: string; // e.g. Soldador SMAW/GTAW 6G ASME IX
  contractor: string; // e.g. Consorcio Vial & Tubos C.A.
  welderStamp?: string; // e.g. W-402
  bloodType: string; // e.g. O+
  allergies?: string; // e.g. Penicilina / Ninguna
  photoUrl?: string; // Base64 or Image URL
  medicalCheckValidUntil: string; // YYYY-MM-DD
  sihoInductionValidUntil: string; // YYYY-MM-DD (PDVSA SI-S-04)
  wpqCertValidUntil?: string; // YYYY-MM-DD (ASME IX / API 1104)
  fitStatus: 'Apto' | 'Apto con Restricciones' | 'No Apto' | 'Apto con Restricción' | 'Vencido';
  activePermitId?: string;
  totalHhtAccumulated: number;
}

export interface AttendanceRecord {
  id: string;
  idempotencyKey: string;
  workerId: string;
  workerName: string;
  nationalId: string;
  role: string;
  contractor: string;
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  hoursWorked: number;
  gateLocation: string; // e.g. Portón Principal Refinería PLC
  accessStatus: 'Verde - Autorizado' | 'Rojo - Denegado';
  denialReason?: string;
  date: string; // YYYY-MM-DD
  syncState?: 'PENDING_OFFLINE' | 'SYNCED' | 'CORRECTED';
  correctionAudit?: AttendanceCorrection;
}

const DEFAULT_LABOR_POLICY: VersionedLaborPolicy = {
  policyId: 'POL_LABOR_2026_01',
  version: '1.2.0',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  approvedBy: 'Ing. Gustavo Mendoza (Gerente SIHO-A & RRHH)',
  approvedAt: '2026-01-02T10:00:00Z',
  sourceDocument: 'Convención Colectiva Petrolera CCP-2026 / LOTTT Art. 173',
  timezone: 'America/Caracas',
  standardHoursPerDay: 8,
  workDaysPerWeek: 5,
  shiftType: 'DAY',
  restBreakMinutes: 60,
  surcharges: {
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.3,
    nightOvertimeMultiplier: 1.8
  }
};

const SAMPLE_WORKERS: FieldWorker[] = [
  {
    id: 'w_101',
    credentialId: 'CRD_8f9a2b1c4d3e5f6a7b8c9d0e1f2a3b4c',
    nationalId: 'V-18.492.102',
    fullName: 'José Manuel Pérez',
    role: 'Soldador ASME IX 6G (GTAW/SMAW)',
    contractor: 'Consorcio O&G Campo Sur',
    welderStamp: 'W-402',
    bloodType: 'O+',
    allergies: 'Ninguna',
    medicalCheckValidUntil: '2026-11-15',
    sihoInductionValidUntil: '2026-10-30',
    wpqCertValidUntil: '2026-12-01',
    fitStatus: 'Apto',
    totalHhtAccumulated: 1240,
  },
  {
    id: 'w_102',
    credentialId: 'CRD_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    nationalId: 'V-15.829.301',
    fullName: 'Carlos Alberto Rodríguez',
    role: 'Capataz Pipefitter / Tubero Especializado',
    contractor: 'Consorcio O&G Campo Sur',
    bloodType: 'A+',
    allergies: 'Penicilina',
    medicalCheckValidUntil: '2026-09-20',
    sihoInductionValidUntil: '2026-08-10',
    fitStatus: 'Apto',
    totalHhtAccumulated: 2100,
  },
  {
    id: 'w_103',
    credentialId: 'CRD_7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    nationalId: 'V-22.104.982',
    fullName: 'Marcos Silva',
    role: 'Inspector NDT / ASNT Nivel II (PAUT/RT)',
    contractor: 'SGS Inspecciones Industriales',
    bloodType: 'O-',
    allergies: 'Polvo / Humos',
    medicalCheckValidUntil: '2026-12-31',
    sihoInductionValidUntil: '2026-11-20',
    fitStatus: 'Apto',
    totalHhtAccumulated: 980,
  },
  {
    id: 'w_104',
    credentialId: 'CRD_3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
    nationalId: 'V-19.401.229',
    fullName: 'Jesús Eduardo Blanco',
    role: 'Ayudante de Tubero / Rigger',
    contractor: 'Servicios Industriales Monagas',
    bloodType: 'B+',
    allergies: 'Aspirina',
    medicalCheckValidUntil: '2026-01-15',
    sihoInductionValidUntil: '2026-02-01',
    fitStatus: 'No Apto',
    totalHhtAccumulated: 620,
  },
];

export default function WorkerQrRegistry() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || '';

  const [workers, setWorkers] = useState<FieldWorker[]>(SAMPLE_WORKERS);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<FieldWorker>(SAMPLE_WORKERS[0]);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // HMAC Secret for rotative QR (default derived or customizable)
  const hmacSecret = currentOrganization?.id || 'IC360_O&G_ROTATIVE_QR_SECRET_2026';

  // Live Rotative QR code state
  const [rotativeQrToken, setRotativeQrToken] = useState<string>('');
  const [rotativeQrDataUrl, setRotativeQrDataUrl] = useState<string>('');
  const [rotativeTimer, setRotativeTimer] = useState<number>(30);

  // Scanner Simulator
  const [scanResult, setScanResult] = useState<{
    worker?: FieldWorker;
    status: 'Verde' | 'Rojo';
    reasons: string[];
    verificationDetails?: QrVerificationResult;
  } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLaborPolicyModal, setShowLaborPolicyModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AttendanceRecord | null>(null);

  // New Worker Form
  const [newFullName, setNewFullName] = useState('');
  const [newNationalId, setNewNationalId] = useState('');
  const [newRole, setNewRole] = useState('Soldador ASME IX 6G');
  const [newContractor, setNewContractor] = useState('Consorcio O&G Campo Sur');
  const [newWelderStamp, setNewWelderStamp] = useState('');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newAllergies, setNewAllergies] = useState('Ninguna');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');

  // Incident Form
  const [incidentType, setIncidentType] = useState<'FIRST_AID' | 'MEDICAL_TREATMENT' | 'RESTRICTED_WORK' | 'LOST_TIME' | 'NEAR_MISS'>('NEAR_MISS');
  const [incidentSeverity, setIncidentSeverity] = useState<'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('MEDIA');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('Frente A - Tramo 12 Kp 4+200');
  const [incidentNotice, setIncidentNotice] = useState<string | null>(null);

  // Correction Form
  const [corrReason, setCorrReason] = useState<AttendanceCorrection['reasonCode']>('MISSED_PUNCH');
  const [corrNote, setCorrNote] = useState('');

  // Revoked credentials
  const [revokedCredentialIds, setRevokedCredentialIds] = useState<string[]>([]);

  // Generate & auto-refresh live rotative QR token for selected worker
  useEffect(() => {
    if (!selectedWorker) return;

    let credId = selectedWorker.credentialId;
    if (!credId || !credId.startsWith('CRD_')) {
      credId = generateOpaqueCredentialId();
      setSelectedWorker(prev => ({ ...prev, credentialId: credId }));
    }

    const updateQr = async () => {
      try {
        const token = generateRotativeQrToken({
          credentialId: credId,
          hmacSecret,
          ttlSeconds: 30
        });
        setRotativeQrToken(token);
        const dataUrl = await QRCode.toDataURL(token, { margin: 1, width: 280 });
        setRotativeQrDataUrl(dataUrl);
        setRotativeTimer(30);
      } catch (err) {
        console.error('Error updating rotative QR:', err);
      }
    };

    updateQr();
    const interval = setInterval(() => {
      setRotativeTimer(prev => {
        if (prev <= 1) {
          updateQr();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedWorker?.id, hmacSecret]);

  // Fetch Workers & Attendance from Firestore
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
    const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;

    const unsubWorkers = workersRepo.subscribe(orgId, currentProject.id, (items) => {
      const loaded = items as unknown as FieldWorker[];
      if (loaded.length > 0) {
        setWorkers(loaded);
        setSelectedWorker(loaded[0]);
      }
    }, undefined, { limitCount: 50 });

    const unsubAttendance = workerAttendanceRepo.subscribe(orgId, currentProject.id, (items) => {
      const loaded = items as unknown as AttendanceRecord[];
      setAttendanceLogs(loaded);
    }, undefined, { limitCount: 50 });

    return () => {
      unsubWorkers();
      unsubAttendance();
    };
  }, [currentProject, orgId]);

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetWorkerId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (targetWorkerId) {
        setWorkers(prev => prev.map(w => w.id === targetWorkerId ? { ...w, photoUrl: base64String } : w));
        if (selectedWorker?.id === targetWorkerId) {
          setSelectedWorker(prev => ({ ...prev, photoUrl: base64String }));
        }
        if (currentProject && currentProject.id !== 'all') {
          const workerDocPath = `organizations/${orgId}/projects/${currentProject.id}/workers/${targetWorkerId}`;
          updateDoc(doc(db, workerDocPath), { photoUrl: base64String }).catch(() => {
            queueOfflineOperation(`organizations/${orgId}/projects/${currentProject.id}/workers`, 'update', { photoUrl: base64String }, targetWorkerId);
          });
        }
      } else {
        setNewPhotoUrl(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Gate Scanner Verification Engine (SIHO Fit + Rotative QR Token Verification)
  const verifyWorkerAccess = (worker: FieldWorker, tokenToTest?: string) => {
    const reasons: string[] = [];
    let verificationRes: QrVerificationResult | undefined;

    // 1. Verify Rotative QR Token
    if (tokenToTest) {
      verificationRes = verifyRotativeQrToken({
        token: tokenToTest,
        hmacSecret,
        revokedCredentialIds
      });

      if (verificationRes.status === 'EXPIRED') {
        reasons.push('🔴 TOKEN QR ROTATIVO EXPIRADO (TTL 30s) — Re-generar carnet en pantalla.');
      } else if (verificationRes.status === 'REVOKED') {
        reasons.push(`🔴 CREDENCIAL REVOCADA: ${verificationRes.revocationReason}`);
      } else if (verificationRes.status === 'TAMPERED') {
        reasons.push(`🚨 ADVERTENCIA: QR ALTERADO O FALSIFICADO (${verificationRes.reason})`);
      } else if (verificationRes.status === 'LEGACY_DEPRECATED') {
        reasons.push('⚠️ QR ESTÁTICO LEGADO DETECTADO: Se recomienda migrar a carnet rotativo.');
      }
    }

    // 2. Evaluate SIHO Fit Status
    const sihoEval = evaluateSihoFitStatus({
      medicalExpiry: worker.medicalCheckValidUntil,
      sihoInductionExpiry: worker.sihoInductionValidUntil,
      wpqExpiry: worker.wpqCertValidUntil,
      fitStatusOverride: worker.fitStatus === 'Vencido' ? undefined : worker.fitStatus
    });

    if (sihoEval.blocking) {
      reasons.push(`🔴 ESTATUS SIHO INHABILITANTE (${sihoEval.status}): ${sihoEval.requiredAction}`);
    } else if (sihoEval.requiredAction) {
      reasons.push(`⚠️ ALERTA PREVENTIVA: ${sihoEval.requiredAction}`);
    }

    const isAuthorized = reasons.filter(r => r.startsWith('🔴') || r.startsWith('🚨')).length === 0;
    const status: 'Verde' | 'Rojo' = isAuthorized ? 'Verde' : 'Rojo';

    setScanResult({ worker, status, reasons, verificationDetails: verificationRes });

    // Record check-in automatically with idempotency key
    recordCheckIn(worker, status, reasons.join(' | '));
  };

  const handleScanWorker = (worker: FieldWorker) => {
    setSelectedWorker(worker);
    // Generate fresh token for simulation scan
    const credId = worker.credentialId || generateOpaqueCredentialId();
    const token = generateRotativeQrToken({ credentialId: credId, hmacSecret, ttlSeconds: 30 });
    verifyWorkerAccess(worker, token);
  };

  // Record Check-in to Firestore / Offline Store with Idempotency Key
  const recordCheckIn = async (worker: FieldWorker, status: 'Verde' | 'Rojo', denialReason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const gateLocation = 'Portón Principal Refinería PLC';

    // Generate canonical idempotency key
    const idempotencyKey = generateAttendanceIdempotencyKey(worker.id, today, gateLocation);

    // Prevent duplicate attendance logs on same day at same gate
    const existing = attendanceLogs.find(a => a.idempotencyKey === idempotencyKey);
    if (existing) {
      console.warn(`Idempotent check-in skip: ${idempotencyKey} already recorded today.`);
      return;
    }

    const newRecord: Record<string, any> = {
      idempotencyKey,
      workerId: worker.id,
      workerName: worker.fullName,
      nationalId: worker.nationalId,
      role: worker.role,
      contractor: worker.contractor,
      checkInTime: new Date().toISOString(),
      hoursWorked: status === 'Verde' ? DEFAULT_LABOR_POLICY.standardHoursPerDay : 0,
      gateLocation,
      accessStatus: status === 'Verde' ? 'Verde - Autorizado' : 'Rojo - Denegado',
      date: today,
      syncState: 'SYNCED'
    };
    if (denialReason) {
      newRecord.denialReason = denialReason;
    }

    if (currentProject && currentProject.id !== 'all') {
      const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;
      try {
        const docRef = await addDoc(collection(db, attendancePath), {
          ...newRecord,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setAttendanceLogs(prev => [{ id: docRef.id, ...newRecord } as AttendanceRecord, ...prev]);
      } catch (err) {
        await queueOfflineOperation('worker_attendance', 'create', { ...newRecord, orgId, projectId: currentProject.id });
        setAttendanceLogs(prev => [{ id: `att_off_${Date.now()}`, ...newRecord, syncState: 'PENDING_OFFLINE' } as AttendanceRecord, ...prev]);
      }
    } else {
      setAttendanceLogs(prev => [{ id: `att_local_${Date.now()}`, ...newRecord } as AttendanceRecord, ...prev]);
    }
  };

  // Revoke Credential
  const handleRevokeCredential = (credId?: string) => {
    if (!credId) return;
    setRevokedCredentialIds(prev => [...prev, credId]);
    alert(`Credencial ${credId} revocada exitosamente. Se impedirá el acceso por lectura de este token.`);
  };

  // Create Worker
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];
    const credentialId = generateOpaqueCredentialId();

    const workerObj: Record<string, any> = {
      credentialId,
      nationalId: newNationalId,
      fullName: newFullName,
      role: newRole,
      contractor: newContractor,
      bloodType: newBloodType,
      allergies: newAllergies || 'Ninguna',
      photoUrl: newPhotoUrl || undefined,
      medicalCheckValidUntil: nextYear,
      sihoInductionValidUntil: nextYear,
      fitStatus: 'Apto',
      totalHhtAccumulated: 0
    };
    if (newWelderStamp) {
      workerObj.welderStamp = newWelderStamp;
    }

    const newWorkerItem = { id: '', ...workerObj } as FieldWorker;

    if (currentProject && currentProject.id !== 'all') {
      const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
      try {
        const docRef = await addDoc(collection(db, workersPath), {
          ...workerObj,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setWorkers(prev => [...prev, { ...newWorkerItem, id: docRef.id }]);
      } catch (err) {
        await queueOfflineOperation('workers', 'create', { ...workerObj, orgId, projectId: currentProject.id });
        setWorkers(prev => [...prev, { ...newWorkerItem, id: `w_off_${Date.now()}` }]);
      }
    } else {
      setWorkers(prev => [...prev, { ...newWorkerItem, id: `w_local_${Date.now()}` }]);
    }

    setShowAddModal(false);
    setNewFullName('');
    setNewNationalId('');
    setNewWelderStamp('');
    setNewPhotoUrl('');
  };

  // Audited Correction Handler
  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCorrectionModal) return;

    const { updatedRecord, auditLogEntry } = createAuditedAttendanceCorrection({
      originalRecord: {
        idempotencyKey: showCorrectionModal.idempotencyKey,
        workerId: showCorrectionModal.workerId,
        gateLocation: showCorrectionModal.gateLocation,
        date: showCorrectionModal.date,
        checkInLocalTime: showCorrectionModal.checkInTime,
        checkOutLocalTime: showCorrectionModal.checkOutTime,
        userId: 'supervisor_uid_01',
        deviceId: 'PORTON_TAB_01',
        workfront: 'Portón Principal PLC',
        syncState: 'SYNCED',
        accessGranted: true
      },
      supervisorUid: 'SUP_SIHO_001',
      reasonCode: corrReason,
      note: corrNote || 'Corrección manual por supervisor en bitácora.',
      newCheckIn: showCorrectionModal.checkInTime,
      newCheckOut: new Date().toISOString()
    });

    setAttendanceLogs(prev => prev.map(a => a.id === showCorrectionModal.id ? {
      ...a,
      checkOutTime: updatedRecord.checkOutLocalTime,
      hoursWorked: 8,
      syncState: 'CORRECTED',
      correctionAudit: auditLogEntry
    } : a));

    setShowCorrectionModal(null);
    setCorrNote('');
  };

  // Create Incident Handler
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const incidentRecord = createSihoIncidentWorkflow({
      orgId: orgId || 'org_demo',
      projectId: currentProject?.id || 'proj_demo',
      incidentType,
      severity: incidentSeverity,
      title: incidentTitle || 'Incidente en frente de obra',
      description: incidentDesc || 'Detalles registrados por supervisor SIHO-A.',
      location: incidentLocation,
      reporterUid: 'SUP_SIHO_001',
      incidentDate: new Date()
    });

    setIncidentNotice(incidentRecord.regulatoryNoticeDisclaimer);
    setTimeout(() => {
      setShowIncidentModal(false);
      setIncidentNotice(null);
      setIncidentTitle('');
      setIncidentDesc('');
    }, 4000);
  };

  // Helper for hex to RGB
  const hexToRgb = (hex: string) => {
    if (!hex) return { r: 11, g: 34, b: 57 };
    const clean = hex.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    if (isNaN(num)) return { r: 11, g: 34, b: 57 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  // Generate PVC ID Card PDF with Dynamic Rotative QR
  const printWorkerCardPdf = async (worker: FieldWorker) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54] // Standard PVC ID card format (CR80)
    });

    const primaryRgb = hexToRgb(brandKit?.primaryColor || '#0B2239');
    const compName = (brandKit?.companyName || currentOrganization?.name || 'CONTRATISTA OPERATIVA C.A.').toUpperCase();

    // FRONT SIDE
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 85.6, 54, 'F');

    // Header Band
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 85.6, 9.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(compName.substring(0, 32), 4, 6);
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.text('PDVSA SI-S-04 COMPLIANT', 54, 6);

    // Photo Box
    doc.setFillColor(30, 41, 59);
    doc.rect(4, 12, 22, 26, 'F');
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setLineWidth(0.3);
    doc.rect(4, 12, 22, 26, 'S');

    if (worker.photoUrl) {
      try {
        doc.addImage(worker.photoUrl, 'JPEG', 4.5, 12.5, 21, 25);
      } catch {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(12);
        doc.text(worker.fullName.charAt(0), 12, 27);
      }
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(12);
      doc.text(worker.fullName.charAt(0), 12, 27);
    }

    // Details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(worker.fullName.substring(0, 24), 29, 15);

    doc.setTextColor(45, 212, 191);
    doc.setFontSize(7.5);
    doc.text(`C.I.: ${worker.nationalId}`, 29, 20);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo: ${worker.role.substring(0, 26)}`, 29, 24.5);
    doc.text(`Empresa: ${worker.contractor.substring(0, 26)}`, 29, 28.5);

    // SIHO Traffic Light Badge
    const isApto = worker.fitStatus === 'Apto';
    doc.setFillColor(isApto ? 16 : 220, isApto ? 185 : 38, isApto ? 129 : 38);
    doc.rect(29, 34.5, 52, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(isApto ? 'ESTADO SIHO-A: APTO EN PORTON' : 'ESTADO SIHO-A: NO APTO EN PORTON', 31, 38);

    // Footer Info
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 42.5, 85.6, 11.5, 'F');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Med: ${worker.medicalCheckValidUntil}`, 4, 46.5);
    doc.text(`SIHO: ${worker.sihoInductionValidUntil}`, 28, 46.5);
    doc.text(`Sangre: ${worker.bloodType}`, 52, 46.5);
    doc.text(`Alergias: ${worker.allergies || 'Ninguna'}`, 4, 50.5);

    // BACK SIDE (Page 2)
    doc.addPage([85.6, 54], 'landscape');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 85.6, 54, 'F');

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 85.6, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('REVERSO - CONTROL DE ACCESO EN PORTON Y QR ROTATIVO', 4, 5.5);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('1. Portar en lugar visible en casco o chaleco.', 4, 13);
    doc.text('2. Token QR Rotativo firmado HMAC-SHA256 (30s TTL).', 4, 17);
    doc.text('3. Cumple norma PDVSA SI-S-04 y COVENIN 2260.', 4, 21);
    doc.text(`4. Certificacion WPQ: ${worker.wpqCertValidUntil || 'N/A'}`, 4, 25);
    doc.text(`5. HHT Acumuladas: ${worker.totalHhtAccumulated} Horas Hombre`, 4, 29);
    doc.text(`6. Emergencias O&G: 0800-PDVSA-911`, 4, 33);

    // Render Real QR Code on Back Side
    try {
      const credId = worker.credentialId || generateOpaqueCredentialId();
      const token = generateRotativeQrToken({ credentialId: credId, hmacSecret, ttlSeconds: 30 });
      const qrDataUrl = await QRCode.toDataURL(token, { margin: 1, width: 250 });
      doc.setFillColor(255, 255, 255);
      doc.rect(56, 11, 24, 24, 'F');
      doc.addImage(qrDataUrl, 'PNG', 56.5, 11.5, 23, 23);
    } catch (qrErr) {
      console.error('Error generating QR Data URL:', qrErr);
    }

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 48, 85.6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4.8);
    doc.text(`Propiedad de ${compName} - Devolucion obligatoria al culminar obra`, 4, 52);

    doc.save(`Carnet_PVC_${worker.nationalId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // CSV Export for Attendance & HHT
  const exportHhtCsv = () => {
    const headers = ['IdempotencyKey', 'Cédula', 'Trabajador', 'Especialidad', 'Contratista', 'Fecha', 'Hora Entrada', 'HHT', 'Acceso', 'SyncState'];
    const rows = attendanceLogs.map(log => [
      log.idempotencyKey,
      log.nationalId,
      `"${log.workerName}"`,
      `"${log.role}"`,
      `"${log.contractor}"`,
      log.date,
      new Date(log.checkInTime).toLocaleTimeString('es-VE'),
      log.hoursWorked,
      log.accessStatus,
      log.syncState || 'SYNCED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Asistencia_HHT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Workers
  const filteredWorkers = workers.filter(w => {
    const matchSearch = w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        w.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        w.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'todos' || w.role.toLowerCase().includes(filterRole.toLowerCase());
    return matchSearch && matchRole;
  });

  // Calculate HHT Totals
  const totalHhtAllTime = workers.reduce((acc, w) => acc + w.totalHhtAccumulated, 0) + 
                          attendanceLogs.reduce((acc, a) => acc + a.hoursWorked, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <QrCode size={22} />
            </span>
            <h1 className="text-xl font-extrabold text-ink font-display">
              Carnet QR Rotativo, Política Laboral & Control HHT / SIHO-A
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              S16 — PDVSA SI-S-04
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Token QR rotativo HMAC (30s TTL), semáforo SIHO inhabilitante, eventos de asistencia idempotentes y flujo de incidentes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLaborPolicyModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition-all cursor-pointer shadow-2xs"
          >
            <FileText size={16} className="text-brand-500" />
            Política Laboral v{DEFAULT_LABOR_POLICY.version}
          </button>

          <button
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <AlertOctagon size={16} className="text-amber-600" />
            Reportar Incidente SIHO
          </button>

          <button
            onClick={exportHhtCsv}
            className="flex items-center gap-1.5 px-3 py-2 border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Exportar HHT (CSV)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            Registrar Personal
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Personal Registrado</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{workers.length}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Estatus SIHO auditado</p>
          </div>
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">HHT Acumuladas</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{totalHhtAllTime.toLocaleString()} hrs</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">Horas Hombre Trabajadas</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">HHT Sin Accidentes</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{totalHhtAllTime.toLocaleString()} hrs</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Cero incapacitantes</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Ingresos Hoy (Idempotentes)</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{attendanceLogs.length}</h3>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Verificados con QR Rotativo</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GATE SCANNER PANEL */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <Camera size={18} className="text-brand-500" />
                Escáner Portón & Validación QR Rotativo
              </h2>
              <span className="text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20">
                HMAC-SHA256
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-ink-soft">
                Seleccione un trabajador para simular la lectura del Token QR Rotativo en portón:
              </label>

              <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {workers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleScanWorker(w)}
                    className="p-3 rounded-xl border border-line bg-surface-2 hover:bg-surface hover:border-brand-500 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink">{w.fullName}</p>
                      <p className="text-[11px] text-ink-soft font-mono">{w.nationalId} | {w.role}</p>
                      {w.credentialId && (
                        <p className="text-[9px] font-mono text-brand-500 truncate mt-0.5">{w.credentialId}</p>
                      )}
                    </div>
                    <QrCode size={18} className="text-brand-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TRAFFIC LIGHT BANNER */}
          {scanResult ? (
            <div className={`p-4 rounded-2xl border ${
              scanResult.status === 'Verde' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            } animate-in fade-in duration-200`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${scanResult.status === 'Verde' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {scanResult.status === 'Verde' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider font-display">
                    {scanResult.status === 'Verde' ? '🟢 ACCESO AUTORIZADO' : '🔴 ACCESO DENEGADO'}
                  </h3>
                  <p className="text-xs font-medium mt-0.5">
                    {scanResult.worker?.fullName} ({scanResult.worker?.nationalId})
                  </p>
                </div>
              </div>

              {scanResult.reasons.length > 0 && (
                <div className="mt-3 pt-2 border-t border-red-500/20 text-xs space-y-1">
                  <p className="font-bold">Observaciones de Seguridad & QR:</p>
                  {scanResult.reasons.map((r, i) => (
                    <p key={i} className="flex items-center gap-1.5 font-mono text-[11px]">
                      • {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface-2 border border-line text-center text-xs text-ink-soft">
              Presione sobre un trabajador arriba para simular la lectura QR en puerta.
            </div>
          )}
        </div>

        {/* ROTATIVE CARNET BADGE PREVIEW */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              Carnet QR Rotativo en Vivo
            </h2>
            
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line">
              <button
                onClick={() => setCardSide('front')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cardSide === 'front' ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Frontal
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cardSide === 'back' ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Reverso (QR)
              </button>
            </div>
          </div>

          {selectedWorker && (
            <div className="space-y-4">
              
              {/* PVC CARD PREVIEW BOX */}
              {cardSide === 'front' ? (
                <div className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-slate-700 space-y-3 font-sans">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center font-black text-xs text-white shadow-md">
                        IC
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-100 font-display">INDUSTRIAL CONTROL 360</h4>
                        <p className="text-[8px] text-slate-400 font-mono">PDVSA SI-S-04 COMPLIANT</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      selectedWorker.fitStatus === 'Apto' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {selectedWorker.fitStatus === 'Apto' ? '🟢 APTO OBRA' : '🔴 NO APTO'}
                    </span>
                  </div>

                  {/* Worker Main Details & Photo */}
                  <div className="flex items-center gap-3">
                    <div className="relative group w-20 h-24 rounded-xl bg-slate-800 border-2 border-brand-500 overflow-hidden flex flex-col items-center justify-center text-slate-400 shadow-inner">
                      {selectedWorker.photoUrl ? (
                        <img src={selectedWorker.photoUrl} alt={selectedWorker.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-2xl text-slate-300">{selectedWorker.fullName.charAt(0)}</span>
                      )}

                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold text-white cursor-pointer p-1 text-center">
                        <Upload size={14} />
                        <span>Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, selectedWorker.id)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h3 className="text-sm font-black text-white truncate font-display">{selectedWorker.fullName}</h3>
                      <p className="text-xs text-brand-400 font-mono font-bold">{selectedWorker.nationalId}</p>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{selectedWorker.role}</p>
                      <p className="text-[10px] text-slate-400 truncate">{selectedWorker.contractor}</p>
                      {selectedWorker.credentialId && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[8px] truncate max-w-full">
                          {selectedWorker.credentialId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical & Allergies */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-700/80">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Examen Médico:</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedWorker.medicalCheckValidUntil}</span>
                    </div>

                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Inducción SIHO-A:</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedWorker.sihoInductionValidUntil}</span>
                    </div>
                  </div>

                </div>
              ) : (
                /* REVERSO CARNET - ROTATIVE QR LIVE CODE */
                <div className="relative w-full max-w-sm mx-auto bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-slate-700 space-y-3 font-sans text-[10px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                        <KeyRound size={14} />
                        TOKEN QR ROTATIVO EN VIVO
                      </h4>
                      <p className="text-[8px] text-slate-400 font-mono">FIRMADO HMAC-SHA256 • DYNAMIC TTL</p>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[10px] font-bold border border-brand-500/30">
                      <RotateCw size={11} className="animate-spin text-brand-400" />
                      {rotativeTimer}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1.5 text-slate-300 text-[9.5px]">
                      <p>• Validez de token: <strong className="text-emerald-400 font-mono">30 segundos</strong></p>
                      <p>• CredentialId O paco: <br /><span className="text-brand-300 font-mono text-[8px]">{selectedWorker.credentialId}</span></p>
                      <p>• Sin cédula ni datos personales en el código de barras.</p>
                      <button
                        onClick={() => handleRevokeCredential(selectedWorker.credentialId)}
                        className="mt-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-[9px] font-bold cursor-pointer transition-all"
                      >
                        Revocar Credencial
                      </button>
                    </div>

                    <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center shrink-0">
                      {rotativeQrDataUrl ? (
                        <img src={rotativeQrDataUrl} alt="QR Rotativo" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode size={40} className="text-slate-800" />
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[8px] font-mono text-slate-500 truncate">
                    Token: {rotativeQrToken}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS FOR CARNET */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 cursor-pointer">
                  <Upload size={14} className="text-brand-500" />
                  <span>Subir Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, selectedWorker.id)}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => printWorkerCardPdf(selectedWorker)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  Imprimir Carnet PVC (PDF)
                </button>
              </div>

            </div>
          )}
        </div>

        {/* WORKER DIRECTORY */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users size={18} className="text-brand-500" />
              Directorio de Cuadrillas SIHO
            </h2>
            <span className="text-xs text-ink-soft font-mono font-bold">
              {filteredWorkers.length} registros
            </span>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar por cédula, nombre o estampa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredWorkers.map(w => (
              <div
                key={w.id}
                onClick={() => setSelectedWorker(w)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedWorker?.id === w.id 
                    ? 'bg-brand-500/10 border-brand-500 shadow-2xs' 
                    : 'bg-surface border-line hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-line overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-ink-soft">
                    {w.photoUrl ? <img src={w.photoUrl} alt="" className="w-full h-full object-cover" /> : w.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink">{w.fullName}</p>
                    <p className="text-[11px] text-ink-soft font-mono">{w.nationalId} • {w.role}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  w.fitStatus === 'Apto' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {w.fitStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ATTENDANCE & HHT LOGS TABLE */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-500" />
            <h2 className="text-sm font-bold text-ink">
              Bitácora de Asistencia y Control HHT en Sitio (Eventos Append-Only Idempotentes)
            </h2>
          </div>
          <span className="text-xs text-ink-soft font-mono">
            Mostrando {attendanceLogs.length} marcajes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-ink-soft font-bold border-b border-line uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">IdempotencyKey / Trabajador</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3">Contratista</th>
                <th className="p-3">Hora Ingreso</th>
                <th className="p-3 text-center">HHT</th>
                <th className="p-3">Estatus Permiso</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink">
              {attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-ink-soft italic">
                    Sin registros de marcaje en esta jornada. Utilice el escáner para registrar accesos.
                  </td>
                </tr>
              ) : (
                attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-ink">{log.workerName}</p>
                      <p className="text-[10px] font-mono text-brand-500 truncate max-w-[220px]">{log.idempotencyKey}</p>
                      <p className="text-[11px] font-mono text-ink-soft">{log.nationalId}</p>
                    </td>
                    <td className="p-3 text-ink-soft">{log.role}</td>
                    <td className="p-3 text-ink-soft">{log.contractor}</td>
                    <td className="p-3 font-mono">{new Date(log.checkInTime).toLocaleTimeString('es-VE')}</td>
                    <td className="p-3 text-center font-mono font-bold text-brand-600 dark:text-brand-400">{log.hoursWorked} hrs</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.accessStatus.includes('Verde') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {log.accessStatus}
                      </span>
                      {log.syncState === 'CORRECTED' && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                          Corregido
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setShowCorrectionModal(log)}
                        className="px-2.5 py-1 text-[11px] font-bold border border-line rounded-lg text-ink hover:bg-surface-2 cursor-pointer"
                      >
                        Corregir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LABOR POLICY MODAL */}
      {showLaborPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FileText size={18} className="text-brand-500" />
                Política Laboral Versionada & Recargos HHT
              </h3>
              <button onClick={() => setShowLaborPolicyModal(false)} className="p-1 text-ink-soft hover:bg-surface-2 rounded-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs text-ink space-y-2">
              <div className="p-3 bg-surface-2 rounded-xl border border-line space-y-1">
                <p><strong>Identificador:</strong> <span className="font-mono">{DEFAULT_LABOR_POLICY.policyId}</span> (v{DEFAULT_LABOR_POLICY.version})</p>
                <p><strong>Aprobado por:</strong> {DEFAULT_LABOR_POLICY.approvedBy}</p>
                <p><strong>Fuente Normativa:</strong> {DEFAULT_LABOR_POLICY.sourceDocument}</p>
                <p><strong>Zona Horaria:</strong> {DEFAULT_LABOR_POLICY.timezone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-2 rounded-xl border border-line space-y-1">
                  <p className="font-bold text-brand-600">Jornada Ordinaria:</p>
                  <p>• {DEFAULT_LABOR_POLICY.standardHoursPerDay} horas/día</p>
                  <p>• {DEFAULT_LABOR_POLICY.workDaysPerWeek} días/semana</p>
                  <p>• Descanso: {DEFAULT_LABOR_POLICY.restBreakMinutes} mins</p>
                </div>

                <div className="p-3 bg-surface-2 rounded-xl border border-line space-y-1">
                  <p className="font-bold text-amber-600">Recargos y Factor HHT:</p>
                  <p>• Horas Extras: <strong>{DEFAULT_LABOR_POLICY.surcharges.overtimeMultiplier}x</strong></p>
                  <p>• Bono Nocturno: <strong>{DEFAULT_LABOR_POLICY.surcharges.nightShiftMultiplier}x</strong></p>
                  <p>• Extra Nocturna: <strong>{DEFAULT_LABOR_POLICY.surcharges.nightOvertimeMultiplier}x</strong></p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-line">
              <button onClick={() => setShowLaborPolicyModal(false)} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT REPORT MODAL (C6) */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertOctagon size={18} />
                Reportar Incidente SIHO-A en Sitio
              </h3>
              <button onClick={() => setShowIncidentModal(false)} className="p-1 text-ink-soft hover:bg-surface-2 rounded-lg cursor-pointer">✕</button>
            </div>

            {incidentNotice ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-bold">✓ Registro Interno Creado Exitosamente</p>
                <p className="italic">{incidentNotice}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateIncident} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Tipo de Incidente</label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                    >
                      <option value="NEAR_MISS">Casi Accidente (Near Miss)</option>
                      <option value="FIRST_AID">Primeros Auxilios</option>
                      <option value="MEDICAL_TREATMENT">Tratamiento Médico</option>
                      <option value="RESTRICTED_WORK">Trabajo Restringido</option>
                      <option value="LOST_TIME">Tiempo Perdido (LTI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Severidad</label>
                    <select
                      value={incidentSeverity}
                      onChange={(e) => setIncidentSeverity(e.target.value as any)}
                      className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                    >
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Título del Reporte *</label>
                  <input
                    type="text"
                    required
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="Ej. Resbalón sin caída en zanja de tubería Kp 4+200"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Ubicación / Frente *</label>
                  <input
                    type="text"
                    required
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Descripción de los hechos</label>
                  <textarea
                    rows={3}
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Describa circunstancias, equipos involucrados y acciones tomadas..."
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                  />
                </div>

                <div className="p-3 bg-surface-2 rounded-xl border border-line text-[10px] text-ink-soft">
                  <strong>AVISO NORMATIVO (INPSASEL / LOPCYMAT):</strong> Este registro es exclusivo de uso interno para la gestión del departamento SIHO-A. No constituye declaración formal ante entes regulatorios.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer">
                    Registrar Incidente Interno
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Corregir Marcaje Auditado</h3>
              <button onClick={() => setShowCorrectionModal(null)} className="p-1 text-ink-soft hover:bg-surface-2 rounded-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs">
              <p><strong>Trabajador:</strong> {showCorrectionModal.workerName} ({showCorrectionModal.nationalId})</p>
              
              <div>
                <label className="block font-semibold text-ink-soft mb-1">Causa de la Corrección *</label>
                <select
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                >
                  <option value="MISSED_PUNCH">Olvido de marcaje en portón</option>
                  <option value="DEVICE_MALFUNCTION">Falla de dispositivo / escáner</option>
                  <option value="APPROVED_OVERTIME">Horas extras autorizadas por supervisor</option>
                  <option value="OTHER">Otra razón justificada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-soft mb-1">Justificación del Supervisor *</label>
                <textarea
                  required
                  rows={2}
                  value={corrNote}
                  onChange={(e) => setCorrNote(e.target.value)}
                  placeholder="Escriba motivo para la auditoría..."
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setShowCorrectionModal(null)} className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-xs cursor-pointer">
                  Guardar Corrección Auditada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW WORKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <UserCheck size={18} className="text-brand-500" />
                Registrar Nuevo Trabajador en Sistema
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-ink-soft hover:bg-surface-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              {/* Photo Upload Input */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-2 border border-line">
                <div className="w-14 h-14 rounded-xl bg-surface border border-line overflow-hidden flex items-center justify-center font-bold text-xl text-ink-soft shrink-0">
                  {newPhotoUrl ? <img src={newPhotoUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={22} />}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Foto de Perfil / Cédula</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line hover:bg-surface-2 text-ink rounded-xl text-xs font-bold cursor-pointer transition-all">
                    <Upload size={14} className="text-brand-500" />
                    Cargar Imagen
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Ej. Pedro Infante"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Cédula / Pasaporte *</label>
                  <input
                    type="text"
                    required
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    placeholder="Ej. V-19.402.102"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Especialidad / Rol *</label>
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Contratista / Empresa *</label>
                  <input
                    type="text"
                    required
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Estampa (Opcional)</label>
                  <input
                    type="text"
                    value={newWelderStamp}
                    onChange={(e) => setNewWelderStamp(e.target.value)}
                    placeholder="W-501"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Grupo Sanguíneo</label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Alergias</label>
                  <input
                    type="text"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    placeholder="Ninguna"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
