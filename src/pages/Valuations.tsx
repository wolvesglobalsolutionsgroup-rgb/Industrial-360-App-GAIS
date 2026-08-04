import { useState, useEffect, useMemo } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, where, getDocs, orderBy, collectionGroup
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getAuthUser } from '../firebase';
import { 
  FileSignature, Plus, Download, Eye, CheckCircle2, Camera, 
  Image as ImageIcon, Calculator, DollarSign, ShieldCheck, 
  Check, Send, Clock, UserCheck, AlertCircle, FileText, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import { useProject } from '../ProjectContext';
import { 
  Card, CardHeader, CardContent, Button, 
  StatusBadge, Dialog, Input, Skeleton, EmptyState,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../components/ui';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import { valuationsRepo, fieldReportsRepo } from '../lib/repositories';
import { DualHeader } from '../components/common/DualHeader';
import { DocumentSeal } from '../components/common/DocumentSeal';
import { DocumentSigner } from '../components/common/DocumentSigner';
import { OPERATOR_BRAND_PRESETS } from '../lib/brandKitPresets';


import SourceBadge from '../components/states/SourceBadge';
import LastUpdated from '../components/states/LastUpdated';

export interface SignatureInfo {
  signedBy: string;
  role: string;
  date: string;
  comment?: string;
}

export interface ValuationItem {
  id: string;
  projectId: string;
  orgId?: string;
  number: number;
  periodStart: string;
  periodEnd: string;
  description: string;
  grossAmount: number;
  retentionFCPercent: number;
  retentionFielCumplimiento: number;
  retentionLaboralPercent: number;
  retentionLaboral: number;
  advancePercent: number;
  amortizationAnticipo: number;
  otherDeductions: number;
  netAmount: number;
  status: 'Borrador' | 'En Revisión' | 'Aprobada' | 'Pagada';
  photos: string[];
  ownerId: string;
  date?: string;
  createdAt: string;
  signatures?: {
    inspector?: SignatureInfo;
    supervisor?: SignatureInfo;
    gerente?: SignatureInfo;
  };
}

export default function Valuations() {
  const { currentProject, currentOrganization, brandKit } = useProject();
  const [valuations, setValuations] = useState<ValuationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState<ValuationItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // New Valuation Form state
  const [newValuation, setNewValuation] = useState({
    periodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    description: '',
    grossAmount: '',
    retentionFCPercent: 10,
    retentionLaboralPercent: 5,
    advancePercent: 30,
    otherDeductions: '0.00'
  });

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [availablePhotos, setAvailablePhotos] = useState<{ url: string; date?: string; note?: string }[]>([]);

  const orgId = currentOrganization?.id || '';

  useEffect(() => {
    if (!currentProject) {
      setValuations([]);
      setAvailablePhotos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = valuationsRepo.subscribe(orgId, currentProject.id, (vals) => {
      setValuations((vals as unknown as ValuationItem[]).sort((a, b) => b.number - a.number));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'valuations');
      setIsLoading(false);
    });

    // Fetch photos from field reports of this project
    const unsubReports = fieldReportsRepo.subscribe(orgId, currentProject.id, (reports) => {
      const photosList: { url: string; date?: string; note?: string }[] = [];
      reports.forEach(data => {
        if (data.imagePreview) {
          photosList.push({
            url: data.imagePreview,
            date: data.date || '',
            note: data.notes ? data.notes.substring(0, 40) + '...' : ''
          });
        }
      });
      // Filter unique URLs
      const unique = Array.from(new Map(photosList.map(item => [item.url, item])).values());
      setAvailablePhotos(unique);
    });

    return () => {
      unsubscribe();
      unsubReports();
    };
  }, [currentProject]);

  // Sync project advancePercent into new valuation defaults
  useEffect(() => {
    if (currentProject && currentProject.advancePercent !== undefined) {
      setNewValuation(prev => ({
        ...prev,
        advancePercent: currentProject.advancePercent || 30
      }));
    }
  }, [currentProject]);

  // Calculated Values for Form
  const formGross = Number(newValuation.grossAmount) || 0;
  const formRetentionFC = formGross * (newValuation.retentionFCPercent / 100);
  const formRetentionLaboral = formGross * (newValuation.retentionLaboralPercent / 100);
  const formAmortization = formGross * (newValuation.advancePercent / 100);
  const formOtherDeductions = Number(newValuation.otherDeductions) || 0;
  const formNet = Math.max(0, formGross - formRetentionFC - formRetentionLaboral - formAmortization - formOtherDeductions);

  // Calculate gross amount automatically from Tasks WBS
  const calculateFromTasks = async () => {
    if (!currentProject) return;
    setIsCalculating(true);
    try {
      const q = query(collection(db, 'tasks'), where('projectId', '==', currentProject.id));
      const snap = await getDocs(q);
      let calculatedGross = 0;
      let countPartidas = 0;

      snap.docs.forEach(docSnap => {
        const t = docSnap.data();
        const execVal = Number(t.executedQuantity || 0) * Number(t.unitCost || 0);
        calculatedGross += execVal;
        if (Number(t.executedQuantity || 0) > 0) {
          countPartidas++;
        }
      });

      // Subtract previously accumulated valuations gross amount
      const prevGrossTotal = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);
      const periodValuation = Math.max(0, calculatedGross - prevGrossTotal);

      setNewValuation(prev => ({
        ...prev,
        grossAmount: periodValuation > 0 ? periodValuation.toFixed(2) : '15000.00',
        description: prev.description || `Valuación ROE correspondiente al Avance Físico del Período (${countPartidas > 0 ? countPartidas : snap.docs.length} partidas de obra ejecutadas)`
      }));
    } catch (err) {
      console.error("Error al calcular monto bruto desde partidas:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const togglePhotoSelection = (photoUrl: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoUrl) 
        ? prev.filter(url => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  const handleCreateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    const authUser = getAuthUser();
    if (!currentProject || !authUser) return;

    setIsSubmitting(true);
    try {
      const grossAmount = Number(newValuation.grossAmount) || 0;
      const retentionFielCumplimiento = grossAmount * (newValuation.retentionFCPercent / 100);
      const retentionLaboral = grossAmount * (newValuation.retentionLaboralPercent / 100);
      const amortizationAnticipo = grossAmount * (newValuation.advancePercent / 100);
      const otherDeductions = Number(newValuation.otherDeductions) || 0;
      const netAmount = Math.max(0, grossAmount - retentionFielCumplimiento - retentionLaboral - amortizationAnticipo - otherDeductions);

      const valuationNumber = valuations.length + 1;

      const newDocData: Omit<ValuationItem, 'id'> = {
        projectId: currentProject.id,
        orgId,
        number: valuationNumber,
        periodStart: newValuation.periodStart,
        periodEnd: newValuation.periodEnd,
        description: newValuation.description,
        grossAmount,
        retentionFCPercent: newValuation.retentionFCPercent,
        retentionFielCumplimiento,
        retentionLaboralPercent: newValuation.retentionLaboralPercent,
        retentionLaboral,
        advancePercent: newValuation.advancePercent,
        amortizationAnticipo,
        otherDeductions,
        netAmount,
        status: 'Borrador',
        photos: selectedPhotos,
        ownerId: authUser.uid,
        createdAt: new Date().toISOString(),
        signatures: {
          inspector: {
            signedBy: authUser.displayName || authUser.email || 'Ing. Inspector de Obra',
            role: 'Inspector de Obra / Residente',
            date: new Date().toLocaleDateString('es-VE')
          }
        }
      };

      await valuationsRepo.create(orgId, currentProject.id, newDocData);

      
      setIsModalOpen(false);
      setNewValuation({
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        description: '',
        grossAmount: '',
        retentionFCPercent: 10,
        retentionLaboralPercent: 5,
        advancePercent: currentProject.advancePercent || 30,
        otherDeductions: '0.00'
      });
      setSelectedPhotos([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'valuations');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Signature workflow progression (3 firmas)
  const handleAdvanceStatus = async (valuation: ValuationItem) => {
    const authUser = getAuthUser();
    if (!authUser) return;

    setIsSubmitting(true);
    try {
      const targetOrgId = valuation.orgId || orgId;
      let nextStatus: ValuationItem['status'] = valuation.status;
      const updatedSignatures = { ...(valuation.signatures || {}) };

      if (valuation.status === 'Borrador') {
        nextStatus = 'En Revisión';
        updatedSignatures.inspector = {
          signedBy: authUser.displayName || authUser.email || 'Ing. Inspector',
          role: 'Inspector de Obra',
          date: new Date().toLocaleDateString('es-VE')
        };
      } else if (valuation.status === 'En Revisión') {
        nextStatus = 'Aprobada';
        updatedSignatures.supervisor = {
          signedBy: authUser.displayName || authUser.email || 'Ing. Supervisor de Contrato',
          role: 'Supervisor de Contrato / Revisor',
          date: new Date().toLocaleDateString('es-VE')
        };
      } else if (valuation.status === 'Aprobada') {
        nextStatus = 'Pagada';
        updatedSignatures.gerente = {
          signedBy: authUser.displayName || authUser.email || 'Gerente de Proyecto / Finanzas',
          role: 'Gerente de Proyecto / Pagador',
          date: new Date().toLocaleDateString('es-VE')
        };
      }

      await valuationsRepo.update(targetOrgId, valuation.projectId, valuation.id, {
        status: nextStatus,
        signatures: updatedSignatures
      });

      if (selectedValuation && selectedValuation.id === valuation.id) {
        setSelectedValuation({
          ...selectedValuation,
          status: nextStatus,
          signatures: updatedSignatures
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'valuations');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF Export Generation for Valuaciones ROE PDVSA
  const exportPDF = (val: ValuationItem) => {
    const docPdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = docPdf.internal.pageSize.getWidth();
    
    // Primary header bar with Double Header (Contratista / PROINTECA C.A. - Cliente / PDVSA)
    docPdf.setFillColor(11, 34, 57); // #0B2239
    docPdf.rect(0, 0, pageWidth, 28, 'F');

    // Left Header: Contratista
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text((currentOrganization?.name || 'PROINTECA C.A.').toUpperCase(), 14, 10);

    docPdf.setFontSize(8);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(200, 210, 225);
    docPdf.text('CERTIFICADO DE VALUACIÓN DE OBRA (FORMATO ROE PDVSA PIC-01-03-05)', 14, 16);
    docPdf.text(`CÓDIGO INTEGRADO: ROE-${val.projectId || 'PROJ'}-${val.number || 1}`, 14, 22);

    // Right Header: Cliente Final
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(9);
    docPdf.setTextColor(245, 158, 11); // Amber
    docPdf.text('CLIENTE: PDVSA / PETROCEDEÑO', pageWidth - 14, 10, { align: 'right' });

    docPdf.setFontSize(10);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text(`VALUACIÓN N° ${val.number}`, pageWidth - 14, 16, { align: 'right' });

    docPdf.setFontSize(8);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(200, 210, 225);
    docPdf.text(`FECHA: ${val.date || new Date().toISOString().split('T')[0]}`, pageWidth - 14, 22, { align: 'right' });

    // Divider Line
    docPdf.setDrawColor(245, 158, 11);
    docPdf.setLineWidth(1);
    docPdf.line(0, 28, pageWidth, 28);

    // Document Metadata
    docPdf.setTextColor(20, 20, 20);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.text(`PROYECTO: ${currentProject?.name || 'Obra Industrial Petrolera'}`, 14, 34);

    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`Organización: ${currentOrganization?.name || 'Industrial Control 360'}`, 14, 40);
    docPdf.text(`Período de Ejecución: ${val.periodStart} al ${val.periodEnd}`, 14, 45);
    docPdf.text(`Estado Contractual: ${val.status}`, pageWidth - 14, 45, { align: 'right' });

    // Financial Table Box
    docPdf.setDrawColor(220, 225, 230);
    docPdf.setFillColor(248, 250, 252);
    docPdf.roundedRect(14, 52, pageWidth - 28, 75, 3, 3, 'FD');

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.setTextColor(11, 34, 57);
    docPdf.text('RESUMEN DE LIQUIDACIÓN FINANCIERA DE OBRAS', 20, 60);

    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(50, 50, 50);

    const startY = 68;
    const lineSpacing = 7;

    docPdf.text('(+) Monto Bruto de Ejecución del Período:', 20, startY);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`$ ${(val.grossAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY, { align: 'right' });

    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`(-) Retención Fiel Cumplimiento (${val.retentionFCPercent || 10}%):`, 20, startY + lineSpacing);
    docPdf.text(`-$ ${(val.retentionFielCumplimiento || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY + lineSpacing, { align: 'right' });

    docPdf.text(`(-) Retención Laboral LOTT (${val.retentionLaboralPercent || 5}%):`, 20, startY + lineSpacing * 2);
    docPdf.text(`-$ ${(val.retentionLaboral || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY + lineSpacing * 2, { align: 'right' });

    docPdf.text(`(-) Amortización de Anticipo Contractual (${val.advancePercent || 30}%):`, 20, startY + lineSpacing * 3);
    docPdf.text(`-$ ${(val.amortizationAnticipo || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY + lineSpacing * 3, { align: 'right' });

    if (val.otherDeductions && val.otherDeductions > 0) {
      docPdf.text('(-) Otras Deducciones / Impuestos:', 20, startY + lineSpacing * 4);
      docPdf.text(`-$ ${val.otherDeductions.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY + lineSpacing * 4, { align: 'right' });
    }

    // Divider Line
    docPdf.setDrawColor(180, 190, 200);
    docPdf.line(20, startY + lineSpacing * 5 - 2, pageWidth - 20, startY + lineSpacing * 5 - 2);

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.setTextColor(16, 110, 60);
    docPdf.text('(=) MONTO NETO A COBRAR / PAGAR:', 20, startY + lineSpacing * 5 + 3);
    docPdf.text(`$ ${(val.netAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, pageWidth - 20, startY + lineSpacing * 5 + 3, { align: 'right' });

    // Description Section
    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(11, 34, 57);
    docPdf.text('CONCEPTO / DESCRIPCIÓN DE TRABAJOS:', 14, 136);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(50, 50, 50);
    const splitDesc = docPdf.splitTextToSize(val.description || 'Avance físico de partidas ejecutadas en el período.', pageWidth - 28);
    docPdf.text(splitDesc, 14, 142);

    // Testigos Fotográficos note
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`TESTIGOS FOTOGRÁFICOS ADJUNTOS: ${val.photos ? val.photos.length : 0} Evidencias`, 14, 162);

    // Signatures Section Box (3 Firmas)
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.setTextColor(11, 34, 57);
    docPdf.text('CERTIFICACIÓN Y CONTROL DE FIRMAS APROBATORIAS (3 PASOS)', 14, 178);

    const boxW = (pageWidth - 36) / 3;
    const boxH = 45;
    const sigY = 184;

    // Signature Box 1: Inspector
    docPdf.setDrawColor(200, 205, 210);
    docPdf.setFillColor(255, 255, 255);
    docPdf.roundedRect(14, sigY, boxW, boxH, 2, 2, 'FD');
    docPdf.setFontSize(8);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('1. INSPECTOR DE OBRA', 18, sigY + 6);
    docPdf.setFont('helvetica', 'normal');
    if (val.signatures?.inspector) {
      docPdf.setTextColor(16, 110, 60);
      docPdf.text('[FIRMADO]', 18, sigY + 12);
      docPdf.setTextColor(50, 50, 50);
      docPdf.text(val.signatures.inspector.signedBy, 18, sigY + 18);
      docPdf.text(`Fecha: ${val.signatures.inspector.date}`, 18, sigY + 24);
      docPdf.text('Rol: Residente / Inspector', 18, sigY + 30);
    } else {
      docPdf.setTextColor(150, 150, 150);
      docPdf.text('Pendiente de firma', 18, sigY + 20);
    }

    // Signature Box 2: Supervisor
    docPdf.setDrawColor(200, 205, 210);
    docPdf.roundedRect(14 + boxW + 4, sigY, boxW, boxH, 2, 2, 'FD');
    docPdf.setFontSize(8);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(11, 34, 57);
    docPdf.text('2. SUPERVISOR DE CONTRATO', 18 + boxW + 4, sigY + 6);
    docPdf.setFont('helvetica', 'normal');
    if (val.signatures?.supervisor) {
      docPdf.setTextColor(16, 110, 60);
      docPdf.text('[FIRMADO]', 18 + boxW + 4, sigY + 12);
      docPdf.setTextColor(50, 50, 50);
      docPdf.text(val.signatures.supervisor.signedBy, 18 + boxW + 4, sigY + 18);
      docPdf.text(`Fecha: ${val.signatures.supervisor.date}`, 18 + boxW + 4, sigY + 24);
      docPdf.text('Rol: Revisor Contrato', 18 + boxW + 4, sigY + 30);
    } else {
      docPdf.setTextColor(150, 150, 150);
      docPdf.text('Pendiente de revisión', 18 + boxW + 4, sigY + 20);
    }

    // Signature Box 3: Gerente
    docPdf.setDrawColor(200, 205, 210);
    docPdf.roundedRect(14 + (boxW + 4) * 2, sigY, boxW, boxH, 2, 2, 'FD');
    docPdf.setFontSize(8);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setTextColor(11, 34, 57);
    docPdf.text('3. GERENTE DE PROYECTO', 18 + (boxW + 4) * 2, sigY + 6);
    docPdf.setFont('helvetica', 'normal');
    if (val.signatures?.gerente) {
      docPdf.setTextColor(16, 110, 60);
      docPdf.text('[A APROBADO / PAGADO]', 18 + (boxW + 4) * 2, sigY + 12);
      docPdf.setTextColor(50, 50, 50);
      docPdf.text(val.signatures.gerente.signedBy, 18 + (boxW + 4) * 2, sigY + 18);
      docPdf.text(`Fecha: ${val.signatures.gerente.date}`, 18 + (boxW + 4) * 2, sigY + 24);
      docPdf.text('Rol: Gerente Finanzas', 18 + (boxW + 4) * 2, sigY + 30);
    } else {
      docPdf.setTextColor(150, 150, 150);
      docPdf.text('Pendiente de aprobación', 18 + (boxW + 4) * 2, sigY + 20);
    }

    // Footer
    docPdf.setFontSize(8);
    docPdf.setTextColor(140, 140, 140);
    docPdf.text('Documento auditado por el sistema Industrial Control 360 · Cumplimiento de especificaciones PDVSA y normas internacionales de construcción.', pageWidth / 2, 280, { align: 'center' });

    docPdf.save(`Valuacion_ROE_N${val.number}_${currentProject?.id || 'Proyecto'}.pdf`);
  };

  // Metrics computed
  const totalGrossSum = useMemo(() => valuations.reduce((sum, v) => sum + (v.grossAmount || 0), 0), [valuations]);
  const totalRetentionsSum = useMemo(() => valuations.reduce((sum, v) => sum + (v.retentionFielCumplimiento || 0) + (v.retentionLaboral || 0), 0), [valuations]);
  const totalAmortizationSum = useMemo(() => valuations.reduce((sum, v) => sum + (v.amortizationAnticipo || 0), 0), [valuations]);
  const totalNetPaidSum = useMemo(() => valuations.filter(v => v.status === 'Pagada' || v.status === 'Aprobada').reduce((sum, v) => sum + (v.netAmount || 0), 0), [valuations]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-12"
    >
      {/* Doble Membrete S18 */}
      <DualHeader
        contractorBrand={brandKit}
        operatorBrand={OPERATOR_BRAND_PRESETS.PDVSA}
        documentTitle="RELACIÓN DE OBRAS EXECUTADAS (ROE) / CERTIFICADO DE VALUACIÓN"
        documentCode={currentProject?.id ? `ROE-${currentProject.id.substring(0, 6)}` : 'ROE-GENERIC'}
        documentDate={new Date().toLocaleDateString('es-VE')}
        statusBadge="APROBADO"
      />

      {/* Header */}
      <PageHeader
        title="Valuaciones de Obra (ROE PDVSA)"
        subtitle="Certificados de pago, retenciones contractuales y flujo de firmas de aprobación"
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <FileSignature size={12} />
              Formato ROE
            </span>
            <SourceBadge source={currentOrganization?.environment === 'qa' ? 'qa_seed' : 'firestore'} detail="ROE PDVSA" />
            <LastUpdated timestamp={new Date()} />
          </div>
        }
        actions={
          <Button 
            variant="primary" 
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Generar Valuación ROE
          </Button>
        }
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monto Bruto Acumulado"
          value={`$ ${totalGrossSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel={`${valuations.length} Valuaciones registradas`}
          icon={<DollarSign size={20} />}
          accentColor="brand"
        />
        <StatCard
          title="Retenciones PDVSA"
          value={`$ ${totalRetentionsSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel="FC 10% + Laboral 5%"
          icon={<ShieldCheck size={20} />}
          accentColor="amber"
        />
        <StatCard
          title="Amortización Anticipo"
          value={`$ ${totalAmortizationSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel={`Anticipo ${currentProject?.advancePercent || 30}%`}
          icon={<Calculator size={20} />}
          accentColor="indigo"
        />
        <StatCard
          title="Neto Aprobado / Pagado"
          value={`$ ${totalNetPaidSum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sublabel={`${valuations.filter(v => v.status === 'Pagada').length} Liquidadas`}
          icon={<CheckCircle2 size={20} />}
          accentColor="emerald"
        />
      </div>

      {/* Valuations List / Cards */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Cargando valuaciones de obra ROE...</p>
          </CardContent>
        </Card>
      ) : valuations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState 
              icon={<FileSignature size={36} />}
              title="No hay valuaciones de obra registradas"
              description="Genera la primera valuación ROE calculando el avance acumulado de las partidas ejecutadas en el período."
              actionLabel="Generar Valuación ROE"
              onAction={() => setIsModalOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {valuations.map((val) => (
            <Card key={val.id} hoverEffect className="overflow-hidden">
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Main Left Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-extrabold text-ink font-display">
                      Valuación N° {val.number}
                    </h3>
                    <StatusBadge status={val.status} />
                    <span className="text-xs text-ink-faint font-mono">
                      Ref: VAL-00{val.number}
                    </span>
                  </div>

                  <p className="text-xs text-ink-soft flex items-center gap-2">
                    <Clock size={14} className="text-brand-500" />
                    <span>Período Contractual: <strong>{val.periodStart}</strong> al <strong>{val.periodEnd}</strong></span>
                  </p>

                  <p className="text-sm text-ink font-medium leading-relaxed max-w-2xl">
                    {val.description || 'Sin descripción detallada.'}
                  </p>

                  {/* Photographs Evidence preview */}
                  {val.photos && val.photos.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-ink-soft mb-2 flex items-center gap-1.5">
                        <Camera size={14} className="text-brand-500" />
                        Testigos Fotográficos Vinculados ({val.photos.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {val.photos.map((photoUrl, idx) => (
                          <img 
                            key={idx} 
                            src={photoUrl} 
                            alt={`Testigo ${idx + 1}`} 
                            className="w-16 h-16 object-cover rounded-xl border border-line shrink-0 shadow-xs hover:scale-105 transition-transform" 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3-Signature Progress Indicator */}
                  <div className="pt-3 border-t border-line/60 flex flex-wrap items-center gap-4 text-xs">
                    <span className="text-ink-faint font-bold uppercase text-[10px]">Estatus de Firmas:</span>
                    
                    <span className={`inline-flex items-center gap-1 font-semibold ${val.signatures?.inspector ? 'text-emerald-600' : 'text-ink-faint'}`}>
                      {val.signatures?.inspector ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      1. Inspector
                    </span>

                    <span className={`inline-flex items-center gap-1 font-semibold ${val.signatures?.supervisor ? 'text-emerald-600' : 'text-ink-faint'}`}>
                      {val.signatures?.supervisor ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      2. Supervisor
                    </span>

                    <span className={`inline-flex items-center gap-1 font-semibold ${val.signatures?.gerente ? 'text-emerald-600' : 'text-ink-faint'}`}>
                      {val.signatures?.gerente ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      3. Gerente
                    </span>
                  </div>
                </div>

                {/* Right Breakdown Panel */}
                <div className="bg-surface-2 p-5 rounded-2xl border border-line min-w-[280px] shrink-0 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-ink-soft">
                      <span>Monto Bruto Exec:</span>
                      <span className="font-mono font-bold text-ink">$ {(val.grossAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>Ret. Fiel C. ({val.retentionFCPercent || 10}%):</span>
                      <span className="font-mono">-$ {(val.retentionFielCumplimiento || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>Ret. Laboral ({val.retentionLaboralPercent || 5}%):</span>
                      <span className="font-mono">-$ {(val.retentionLaboral || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
                      <span>Amort. Anticipo ({val.advancePercent || 30}%):</span>
                      <span className="font-mono">-$ {(val.amortizationAnticipo || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {val.otherDeductions > 0 && (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                        <span>Otras Deducciones:</span>
                        <span className="font-mono">-$ {val.otherDeductions.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-line flex justify-between items-center font-extrabold text-sm">
                      <span className="text-ink">Neto a Cobrar:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">$ {(val.netAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs" 
                        leftIcon={<Eye size={14} />}
                        onClick={() => { setSelectedValuation(val); setDetailModalOpen(true); }}
                      >
                        Detalle / Firmas
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs" 
                        leftIcon={<Download size={14} />}
                        onClick={() => exportPDF(val)}
                      >
                        PDF ROE
                      </Button>
                    </div>

                    {val.status !== 'Pagada' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold"
                        isLoading={isSubmitting}
                        leftIcon={
                          val.status === 'Borrador' ? <Send size={14} /> :
                          val.status === 'En Revisión' ? <UserCheck size={14} /> :
                          <CheckCircle2 size={14} />
                        }
                        onClick={() => handleAdvanceStatus(val)}
                      >
                        {val.status === 'Borrador' && 'Firmar y Enviar a Revisión'}
                        {val.status === 'En Revisión' && 'Aprobar (Firma Supervisor)'}
                        {val.status === 'Aprobada' && 'Registrar Pago (Firma Gerente)'}
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Valuation */}
      <Dialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Generar Nueva Valuación ROE PDVSA"
      >
        <form onSubmit={handleCreateValuation} className="space-y-5 text-slate-900 dark:text-slate-100">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Fecha Inicio Período</label>
              <Input 
                type="date" 
                required 
                value={newValuation.periodStart} 
                onChange={e => setNewValuation({ ...newValuation, periodStart: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Fecha Fin Período</label>
              <Input 
                type="date" 
                required 
                value={newValuation.periodEnd} 
                onChange={e => setNewValuation({ ...newValuation, periodEnd: e.target.value })} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">Monto Bruto Ejecutado ($)</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] h-7 px-2.5"
                isLoading={isCalculating}
                leftIcon={<Calculator size={12} />}
                onClick={calculateFromTasks}
              >
                Calcular desde Partidas WBS
              </Button>
            </div>
            <Input 
              type="number" 
              step="0.01" 
              required 
              value={newValuation.grossAmount} 
              onChange={e => setNewValuation({ ...newValuation, grossAmount: e.target.value })} 
              placeholder="0.00" 
            />
          </div>

          {/* Configurable Retentions & Amortization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/70">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">% Ret. Fiel Cumplimiento</label>
              <Input 
                type="number" 
                value={newValuation.retentionFCPercent} 
                onChange={e => setNewValuation({ ...newValuation, retentionFCPercent: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">% Retención Laboral</label>
              <Input 
                type="number" 
                value={newValuation.retentionLaboralPercent} 
                onChange={e => setNewValuation({ ...newValuation, retentionLaboralPercent: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">% Amortiz. Anticipo</label>
              <Input 
                type="number" 
                value={newValuation.advancePercent} 
                onChange={e => setNewValuation({ ...newValuation, advancePercent: Number(e.target.value) })} 
              />
            </div>
          </div>

          {/* Realtime calculation box */}
          <div className="bg-slate-100/80 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
              <span>Monto Bruto:</span>
              <span className="font-bold">$ {formGross.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
              <span>(-) Ret. FC ({newValuation.retentionFCPercent}%):</span>
              <span>-$ {formRetentionFC.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
              <span>(-) Ret. Laboral ({newValuation.retentionLaboralPercent}%):</span>
              <span>-$ {formRetentionLaboral.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-medium">
              <span>(-) Amortización Anticipo ({newValuation.advancePercent}%):</span>
              <span>-$ {formAmortization.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400">
              <span>(=) NETO ESTIMADO A COBRAR:</span>
              <span>$ {formNet.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Descripción / Concepto Contractual</label>
            <textarea 
              required 
              rows={3} 
              value={newValuation.description} 
              onChange={e => setNewValuation({ ...newValuation, description: e.target.value })} 
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-medium placeholder-slate-400 dark:placeholder-slate-500" 
              placeholder="Ej: Valuación N° 1 correspondiente a trabajos de movimiento de tierra, fundaciones y montaje..." 
            />
          </div>

          {/* Photo Selection from Field Reports */}
          <div>
            <label className="block text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-brand-500" />
              Seleccionar Testigos Fotográficos (De Reportes de Campo)
            </label>

            {availablePhotos.length === 0 ? (
              <p className="text-xs text-ink-faint italic bg-surface-2 p-3 rounded-xl">
                No hay fotos subidas en los reportes de campo de este proyecto. Puedes agregar reportes de campo primero.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {availablePhotos.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => togglePhotoSelection(item.url)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedPhotos.includes(item.url) 
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                        : 'border-line hover:border-ink-faint'
                    }`}
                  >
                    <img src={item.url} alt={`Evidencia ${idx}`} className="w-full h-20 object-cover" />
                    {selectedPhotos.includes(item.url) && (
                      <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="text-white drop-shadow-md" size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-faint mt-1">
              Selecciona las imágenes registradas en campo para respaldar este cobro ante la inspección.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Crear Valuación ROE
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: View Detail & Signatures */}
      {selectedValuation && (
        <Dialog
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Detalle Valuación N° ${selectedValuation.number}`}
        >
          <div className="space-y-5 text-ink">
            
            <div className="flex items-center justify-between bg-surface-2 p-3 rounded-xl border border-line">
              <div>
                <p className="text-xs text-ink-soft">Estatus Contractual</p>
                <div className="mt-1">
                  <StatusBadge status={selectedValuation.status} />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={14} />}
                onClick={() => exportPDF(selectedValuation)}
              >
                Exportar PDF ROE
              </Button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-surface-2 p-4 rounded-xl border border-line">
              <div className="flex justify-between">
                <span className="text-ink-soft">Monto Bruto:</span>
                <span className="font-bold">$ {(selectedValuation.grossAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Retención Fiel Cumplimiento (10%):</span>
                <span>-$ {(selectedValuation.retentionFielCumplimiento || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Retención Laboral (5%):</span>
                <span>-$ {(selectedValuation.retentionLaboral || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                <span>Amortización Anticipo ({selectedValuation.advancePercent || 30}%):</span>
                <span>-$ {(selectedValuation.amortizationAnticipo || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t border-line flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                <span>NETO A LIQUIDAR:</span>
                <span>$ {(selectedValuation.netAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft mb-1">Concepto:</p>
              <p className="text-xs text-ink bg-surface-2 p-3 rounded-xl border border-line">
                {selectedValuation.description}
              </p>
            </div>

            {/* 3 Signatures Cards */}
            <div>
              <p className="text-xs font-bold text-ink mb-2">Cuadro de Firmas de Certificación (ROE):</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div className="bg-surface-2 p-3 rounded-xl border border-line space-y-1">
                  <p className="text-[11px] font-bold text-brand-500">1. Inspector de Obra</p>
                  {selectedValuation.signatures?.inspector ? (
                    <div className="text-[11px] text-ink-soft">
                      <p className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Firmado</p>
                      <p>{selectedValuation.signatures.inspector.signedBy}</p>
                      <p className="text-[10px] text-ink-faint">{selectedValuation.signatures.inspector.date}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-faint italic">Pendiente de firma</p>
                  )}
                </div>

                <div className="bg-surface-2 p-3 rounded-xl border border-line space-y-1">
                  <p className="text-[11px] font-bold text-brand-500">2. Supervisor de Contrato</p>
                  {selectedValuation.signatures?.supervisor ? (
                    <div className="text-[11px] text-ink-soft">
                      <p className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Revisado</p>
                      <p>{selectedValuation.signatures.supervisor.signedBy}</p>
                      <p className="text-[10px] text-ink-faint">{selectedValuation.signatures.supervisor.date}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-faint italic">Pendiente de revisión</p>
                  )}
                </div>

                <div className="bg-surface-2 p-3 rounded-xl border border-line space-y-1">
                  <p className="text-[11px] font-bold text-brand-500">3. Gerente de Proyecto</p>
                  {selectedValuation.signatures?.gerente ? (
                    <div className="text-[11px] text-ink-soft">
                      <p className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Aprobado / Pagado</p>
                      <p>{selectedValuation.signatures.gerente.signedBy}</p>
                      <p className="text-[10px] text-ink-faint">{selectedValuation.signatures.gerente.date}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-faint italic">Pendiente de aprobación</p>
                  )}
                </div>

              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-line">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Cerrar
              </Button>

              {selectedValuation.status !== 'Pagada' && (
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={() => handleAdvanceStatus(selectedValuation)}
                >
                  {selectedValuation.status === 'Borrador' && 'Avanzar a En Revisión'}
                  {selectedValuation.status === 'En Revisión' && 'Aprobar Valuación'}
                  {selectedValuation.status === 'Aprobada' && 'Registrar Pago'}
                </Button>
              )}
            </div>

          </div>
        </Dialog>
      )}

    </motion.div>
  );
}
