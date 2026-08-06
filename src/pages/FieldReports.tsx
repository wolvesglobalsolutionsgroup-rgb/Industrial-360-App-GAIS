import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, MapPin, Users, Clock, Save, FileText, CheckCircle2, 
  Mic, Square, Loader2, Sparkles, Image as ImageIcon, Download, 
  Calendar, Eye, AlertTriangle, Shield, Thermometer, Filter, Search, Plus
} from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { 
  collection, query, onSnapshot, where, addDoc, serverTimestamp, orderBy, collectionGroup
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getAuthUser } from '../firebase';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offline/syncEngine';
import { motion } from 'motion/react';
import { createJsPdfInstance } from '../lib/pdfExporter';
import { 
  Card, CardHeader, CardContent, Button, 
  StatusBadge, Dialog, Input, Skeleton, EmptyState,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '../components/ui';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import { fieldReportsRepo, tasksRepo } from '../lib/repositories';

import { GPSPicker, FieldMap } from '../components/field';

import SourceBadge from '../components/states/SourceBadge';
import LastUpdated from '../components/states/LastUpdated';

export interface FieldReportItem {
  id: string;
  projectId: string;
  date: string;
  weather: string;
  personnelCount: number;
  workHours: number;
  notes: string;
  slumpTest?: number | null;
  temperature?: number | null;
  equipmentSerial?: string;
  location?: { lat: number; lng: number; accuracy?: number } | null;
  imagePreview?: string | null;
  aiAnalysis?: string;
  correlatedTaskId?: string;
  correlatedTaskName?: string;
  inspectorName?: string;
  shift?: string;
  createdAt?: string;
}

export default function FieldReports() {
  const { currentProject, currentOrganization } = useProject();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // History reports list
  const [reports, setReports] = useState<FieldReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<FieldReportItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New report form state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('Soleado');
  const [personnelCount, setPersonnelCount] = useState<number>(12);
  const [workHours, setWorkHours] = useState<number>(8);
  const [notes, setNotes] = useState('');
  const [slumpTest, setSlumpTest] = useState('');
  const [temperature, setTemperature] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Features state
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Migrar a jerarquía multi-tenant (/organizations/{orgId}/projects/{projId}/field_reports)
  useEffect(() => {
    // Persistent GPS capture
    captureGPSLocation();

    if (!currentProject) {
      setTasks([]);
      setReports([]);
      setIsLoadingReports(false);
      return;
    }

    setIsLoadingReports(true);

    const isSingle = currentProject.id !== 'all';
    const orgId = currentOrganization?.id || '';
    
    // Fetch WBS tasks for AI correlation via Repo
    const unsubTasks = tasksRepo.subscribe(orgId, currentProject.id, (taskList) => {
      setTasks(taskList);
    });

    // Fetch field reports history via Repo
    const unsubReports = fieldReportsRepo.subscribe(orgId, currentProject.id, (reportList) => {
      const docs = reportList as unknown as FieldReportItem[];
      setReports(docs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
      setIsLoadingReports(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'field_reports');
      setIsLoadingReports(false);
    });

    return () => {
      unsubTasks();
      unsubReports();
    };
  }, [currentProject]);

  const captureGPSLocation = () => {
    if ('geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setGpsLoading(false);
        },
        (err) => {
          console.warn("GPS Location error:", err);
          // Default fallback coordinates if location permission denied (e.g. Faja del Orinoco)
          setLocation({ lat: 8.823412, lng: -63.512948, accuracy: 10 });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await callGeminiProxy({
          model: 'gemini-3.6-flash',
          contents: [
            { text: 'Transcribe este reporte diario de obra dictado por el ingeniero de campo. Devuelve únicamente la transcripción limpia y técnica sin comentarios introductorios.' },
            { inlineData: { data: base64Audio, mimeType: 'audio/webm' } }
          ]
        });
        
        const text = response.text || '';
        setNotes(prev => prev ? `${prev}\n${text}` : text);
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Error al transcribir el audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (evt) => setImagePreview(evt.target?.result as string);
    reader.readAsDataURL(file);

    setIsAnalyzingImage(true);
    try {
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      base64Reader.onloadend = async () => {
        const base64Image = (base64Reader.result as string).split(',')[1];
        
        const tasksContext = tasks.map(t => `- [ID: ${t.id}] ${t.title || t.name} (Planificado: ${t.plannedQuantity || 100} ${t.unit || 'm'})`).join('\n');
        
        const prompt = `Eres un Ingeniero Inspector de Campo experto en proyectos de petróleo, gas e infraestructura industrial.
Analiza detenidamente esta fotografía del sitio de obra:
1. Resumen Técnico: Describe brevemente la actividad de ingeniería o construcción observada.
2. Seguridad SIHO-A: Identifica riesgos o cumplimiento de EPP (casco, arnés, botas, ventilación).
3. Correlación WBS: Identifica cuál de las siguientes partidas del proyecto corresponde a esta imagen:
${tasksContext}

Responde de forma ejecutiva, concisa y profesional.`;

        const response = await callGeminiProxy({
          model: 'gemini-3.6-flash',
          contents: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: file.type } }
          ]
        });
        
        setAiAnalysis(response.text || '');

        // Match first task ID if found in text
        const matchedTask = tasks.find(t => response.text?.toLowerCase().includes(t.title?.toLowerCase() || ''));
        if (matchedTask) {
          setSelectedTaskId(matchedTask.id);
        }
      };
    } catch (error) {
      console.error("Error al analizar imagen con Gemini:", error);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authUser = getAuthUser();
    if (!currentProject || !authUser) {
      alert("Por favor selecciona un proyecto primero.");
      return;
    }

    setIsSubmitting(true);

    const matchedTaskObj = tasks.find(t => t.id === selectedTaskId);

    const reportData: Omit<FieldReportItem, 'id'> = {
      projectId: currentProject.id,
      date: reportDate,
      weather,
      personnelCount: Number(personnelCount) || 0,
      workHours: Number(workHours) || 8,
      notes,
      slumpTest: slumpTest ? Number(slumpTest) : null,
      temperature: temperature ? Number(temperature) : null,
      equipmentSerial: equipmentSerial || '',
      location,
      imagePreview,
      aiAnalysis,
      correlatedTaskId: selectedTaskId || '',
      correlatedTaskName: matchedTaskObj ? (matchedTaskObj.title || matchedTaskObj.name) : '',
      inspectorName: authUser.displayName || authUser.email || 'Ing. Inspector de Campo',
    };

    try {
      const targetOrgId = currentOrganization?.id || '';
      if (!navigator.onLine) {
        await queueOfflineOperation('field_reports', 'create', reportData);
        alert("Guardado Offline: El reporte se sincronizará automáticamente al conectarse a la red.");
      } else {
        try {
          await fieldReportsRepo.create(targetOrgId, currentProject?.id || '', reportData);
        } catch (err) {
          console.warn("Fallo envio online, guardando en cola offline:", err);
          await queueOfflineOperation('field_reports', 'create', reportData);
        }
      }

      setSubmitted(true);
      setNotes('');
      setSlumpTest('');
      setTemperature('');
      setEquipmentSerial('');
      setAiAnalysis('');
      setImagePreview(null);
      setSelectedTaskId('');

      setTimeout(() => {
        setSubmitted(false);
        setActiveTab('history');
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'field_reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF Export Generation for Field Report
  const exportFieldReportPDF = (rep: FieldReportItem) => {
    const pdfDoc = createJsPdfInstance({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdfDoc.internal.pageSize.getWidth();

    // Top Header with Double Header (Contratista / PROINTECA C.A. - Cliente / PDVSA)
    pdfDoc.setFillColor(11, 34, 57);
    pdfDoc.rect(0, 0, pageWidth, 26, 'F');

    // Left Header: Contratista
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(11);
    pdfDoc.setTextColor(255, 255, 255);
    pdfDoc.text((currentOrganization?.name || 'PROINTECA C.A.').toUpperCase(), 14, 10);

    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(200, 210, 225);
    pdfDoc.text('INFORME DIARIO DE INSPECCIÓN Y CONTROL DE CAMPO', 14, 16);
    pdfDoc.text('NORMA PDVSA PIC-01-03-05 ANEXO B', 14, 21);

    // Right Header: Cliente
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(245, 158, 11);
    pdfDoc.text('CLIENTE: PDVSA / PETROCEDEÑO', pageWidth - 14, 10, { align: 'right' });

    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(255, 255, 255);
    pdfDoc.text(`FECHA: ${rep.date}`, pageWidth - 14, 16, { align: 'right' });
    pdfDoc.text(`TURNO: ${rep.shift || 'Diurno'}`, pageWidth - 14, 21, { align: 'right' });

    // Divider Line
    pdfDoc.setDrawColor(245, 158, 11);
    pdfDoc.setLineWidth(1);
    pdfDoc.line(0, 26, pageWidth, 26);

    // Metadata
    pdfDoc.setTextColor(20, 20, 20);
    pdfDoc.setFontSize(11);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text(`PROYECTO: ${currentProject?.name || 'Obra Industrial Petrolera'}`, 14, 32);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(`Organización: ${currentOrganization?.name || 'Industrial Control 360'}`, 14, 38);
    pdfDoc.text(`Inspector en Sitio: ${rep.inspectorName || 'Ing. Campo'}`, 14, 43);
    pdfDoc.text(`Condición Climática: ${rep.weather}`, pageWidth - 14, 38, { align: 'right' });
    pdfDoc.text(`Personal Total: ${rep.personnelCount} trabajadores (${rep.workHours || 8} HHT)`, pageWidth - 14, 43, { align: 'right' });

    if (rep.location) {
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(60, 100, 160);
      pdfDoc.text(`GPS: Lat ${rep.location.lat}, Lng ${rep.location.lng} (Precisión ±${rep.location.accuracy || 5}m)`, 14, 48);
    }

    // Quality Control Box
    pdfDoc.setDrawColor(220, 225, 230);
    pdfDoc.setFillColor(248, 250, 252);
    pdfDoc.roundedRect(14, 54, pageWidth - 28, 28, 2, 2, 'FD');

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(11, 34, 57);
    pdfDoc.text('REGISTROS DE CONTROL DE CALIDAD Y ENSAYOS (NORMAS A-211 / NDT)', 18, 61);

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(50, 50, 50);

    const slumpText = rep.slumpTest ? `${rep.slumpTest} pulg` : 'N/A';
    const tempText = rep.temperature ? `${rep.temperature} °C` : 'N/A';
    const serialText = rep.equipmentSerial ? rep.equipmentSerial : 'N/A';

    pdfDoc.text(`• Slump / Asentamiento: ${slumpText}`, 18, 68);
    pdfDoc.text(`• Temp. Mezcla/Ambiente: ${tempText}`, 80, 68);
    pdfDoc.text(`• Serial Equipo NDT: ${serialText}`, 140, 68);

    if (rep.correlatedTaskName) {
      pdfDoc.text(`• Partida WBS Asociada: ${rep.correlatedTaskName}`, 18, 75);
    }

    // Notes Section
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(11, 34, 57);
    pdfDoc.text('DESCRIPCIÓN DE ACTIVIDADES Y OBSERVACIONES DE CAMPO:', 14, 90);

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8.5);
    pdfDoc.setTextColor(40, 40, 40);
    const splitNotes = pdfDoc.splitTextToSize(rep.notes || 'Sin observaciones registradas.', pageWidth - 28);
    pdfDoc.text(splitNotes, 14, 96);

    let nextY = 96 + splitNotes.length * 4.5 + 8;

    // AI Analysis Section if present
    if (rep.aiAnalysis) {
      pdfDoc.setDrawColor(200, 190, 230);
      pdfDoc.setFillColor(248, 245, 255);
      pdfDoc.roundedRect(14, nextY, pageWidth - 28, 30, 2, 2, 'FD');

      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(9);
      pdfDoc.setTextColor(100, 40, 160);
      pdfDoc.text('DIAGNÓSTICO DE IA (ANALISIS DE FOTOGRAFÍA Y SEGURIDAD SIHO-A):', 18, nextY + 6);

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(60, 30, 100);
      const splitAi = pdfDoc.splitTextToSize(rep.aiAnalysis, pageWidth - 36);
      pdfDoc.text(splitAi, 18, nextY + 12);

      nextY += 36;
    }

    // Footer signature
    pdfDoc.setDrawColor(200, 200, 200);
    pdfDoc.line(14, 250, 80, 250);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(11, 34, 57);
    pdfDoc.text('FIRMA ING. INSPECTOR DE CAMPO', 14, 255);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(rep.inspectorName || 'Ing. Inspector', 14, 260);

    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor(150, 150, 150);
    pdfDoc.text('Generado por Industrial Control 360 · Sistema de Control Técnico para Obras e Inspección Industrial.', pageWidth / 2, 280, { align: 'center' });

    pdfDoc.save(`Reporte_Campo_${rep.date}_${currentProject?.id || 'Obra'}.pdf`);
  };

  // Filtered reports history
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = searchTerm === '' || 
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.weather && r.weather.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.date && r.date.includes(searchTerm));
      return matchSearch;
    });
  }, [reports, searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16"
    >
      {/* Header */}
      <PageHeader
        title="Reportes Diarios de Campo"
        subtitle="Registro operativo, geolocalización, control de calidad y análisis con Gemini IA"
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-brand-500 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Camera size={12} />
              Inspección
            </span>
            <SourceBadge source={currentOrganization?.environment === 'qa' ? 'qa_seed' : 'firestore'} detail="Diario Campo" />
            <LastUpdated timestamp={new Date()} />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'create' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('create')}
              leftIcon={<Plus size={14} />}
            >
              Nuevo Reporte
            </Button>
            <Button
              variant={activeTab === 'history' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('history')}
              leftIcon={<Calendar size={14} />}
            >
              Historial ({reports.length})
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Reportes Registrados"
          value={reports.length}
          sublabel="Sincronizados en Firestore"
          icon={<FileText size={20} />}
          accentColor="brand"
        />
        <StatCard
          title="Personal Promedio"
          value={reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + (r.personnelCount || 0), 0) / reports.length) : 12}
          sublabel="Trabajadores en sitio"
          icon={<Users size={20} />}
          accentColor="indigo"
        />
        <StatCard
          title="Evidencias Fotográficas"
          value={reports.filter(r => !!r.imagePreview).length}
          sublabel="Listas para Valuaciones"
          icon={<ImageIcon size={20} />}
          accentColor="emerald"
        />
        <StatCard
          title="Ensayos Calidad / NDT"
          value={reports.filter(r => !!r.slumpTest || !!r.temperature).length}
          sublabel="Normas A-211 / ASTM"
          icon={<Thermometer size={20} />}
          accentColor="amber"
        />
      </div>

      {/* Tab 1: Create Report Form */}
      {activeTab === 'create' && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink font-display flex items-center gap-2">
                  <FileText size={20} className="text-brand-500" />
                  Formulario de Inspección Diaria de Campo
                </h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  Los datos e imágenes registrados quedan disponibles automáticamente como testigos en Valuaciones.
                </p>
              </div>
              {location && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <MapPin size={12} />
                  GPS: {location.lat}, {location.lng}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 text-ink">
              
              {/* General Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Fecha del Reporte</label>
                  <Input 
                    type="date" 
                    required 
                    value={reportDate} 
                    onChange={e => setReportDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Condición Climática</label>
                  <select 
                    value={weather} 
                    onChange={e => setWeather(e.target.value)} 
                    className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-ink text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="Soleado">Soleado (Operativo 100%)</option>
                    <option value="Nublado">Nublado</option>
                    <option value="Lluvia Ligera">Lluvia Ligera (Precaución)</option>
                    <option value="Lluvia Fuerte">Lluvia Fuerte (Interrupción)</option>
                    <option value="Tormenta">Tormenta Eléctrica (Detenido SIHO)</option>
                  </select>
                </div>
              </div>

              {/* Personnel & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Personal en Campo (Obreros + Staff)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    required 
                    value={personnelCount} 
                    onChange={e => setPersonnelCount(parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">Horas Trabajadas (HHT)</label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    required 
                    value={workHours} 
                    onChange={e => setWorkHours(parseFloat(e.target.value) || 0)} 
                  />
                </div>
              </div>

              {/* Quality Control & NDT */}
              <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wide">
                    <Shield size={14} className="text-brand-500" />
                    Control de Calidad (Norma A-211 / NDT)
                  </h3>
                  <span className="text-[10px] text-ink-faint">Opcional según frente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">Slump / Asentamiento (pulg)</label>
                    <Input 
                      type="number" 
                      step="0.25" 
                      value={slumpTest} 
                      onChange={e => setSlumpTest(e.target.value)} 
                      placeholder="Ej: 4.5" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">Temp. Mezcla/Amb (°C)</label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={temperature} 
                      onChange={e => setTemperature(e.target.value)} 
                      placeholder="Ej: 28.5" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink-soft mb-1">Serial Equipo NDT</label>
                    <Input 
                      type="text" 
                      value={equipmentSerial} 
                      onChange={e => setEquipmentSerial(e.target.value)} 
                      placeholder="Ej: DFX-615-123" 
                    />
                  </div>
                </div>
              </div>

              {/* Voice Notes & Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-ink-soft">Actividades y Observaciones de Inspección</label>
                  <Button
                    type="button"
                    variant={isRecording ? 'danger' : 'outline'}
                    size="sm"
                    className="text-[11px] h-7"
                    onClick={isRecording ? stopRecording : startRecording}
                    leftIcon={isRecording ? <Square size={12} /> : <Mic size={12} />}
                  >
                    {isRecording ? 'Detener Dictado' : 'Dictar Notas con Voz'}
                  </Button>
                </div>

                <div className="relative">
                  <textarea 
                    rows={4} 
                    required 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Describa el avance de las partidas, personal asignado, incidentes o requerimientos técnicos..." 
                    className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-ink text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-none" 
                  />
                  {isTranscribing && (
                    <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 text-brand-500 font-bold text-xs">
                        <Loader2 size={16} className="animate-spin" />
                        Transcribiendo nota de voz con IA Gemini...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Upload & AI Analysis */}
              <div>
                <label className="block text-xs font-bold text-ink mb-2 flex items-center gap-1.5">
                  <Camera size={14} className="text-brand-500" />
                  Evidencia Fotográfica de Campo
                </label>

                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />

                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="border-2 border-dashed border-line hover:border-brand-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface-2"
                  >
                    <Camera size={28} className="mx-auto text-ink-faint mb-2" />
                    <p className="text-xs font-bold text-ink">Haz clic para tomar una foto o subir una imagen</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">Gemini IA analizará la foto para correlacionarla con partidas WBS y seguridad SIHO-A.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-line max-h-56">
                      <img src={imagePreview} alt="Evidencia" className="w-full h-48 object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setImagePreview(null); setAiAnalysis(''); }} 
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-xl hover:bg-black/80 transition-colors text-xs flex items-center gap-1"
                      >
                        Remover
                      </button>
                    </div>

                    {isAnalyzingImage ? (
                      <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center gap-2 text-xs text-brand-500 font-bold">
                        <Loader2 size={16} className="animate-spin" />
                        Gemini IA analizando la imagen y correlacionando con el presupuesto WBS...
                      </div>
                    ) : aiAnalysis ? (
                      <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-brand-500 font-bold text-xs">
                          <Sparkles size={14} />
                          Análisis Técnico de IA (Gemini 2.5)
                        </div>
                        <div className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                          {aiAnalysis}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Task Correlation Dropdown */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1">Vincular a Partida WBS del Proyecto</label>
                <select
                  value={selectedTaskId}
                  onChange={e => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-ink text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="">-- Sin vinculación específica / General --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.wbsCode ? `[${t.wbsCode}] ` : ''}{t.title || t.name} ({t.plannedQuantity || 100} {t.unit || 'm'})
                    </option>
                  ))}
                </select>
              </div>

              {/* GPS Geolocation Capture */}
              <GPSPicker 
                onLocationChange={(loc) => setLocation(loc)} 
                initialLocation={location}
              />

              {/* Submit */}
              <div className="pt-2 border-t border-line">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full font-bold" 
                  isLoading={isSubmitting}
                  disabled={submitted || isTranscribing || isAnalyzingImage}
                  leftIcon={submitted ? <CheckCircle2 size={16} /> : <Save size={16} />}
                >
                  {submitted ? '¡Reporte Diario Guardado Exitosamente!' : 'Guardar Reporte Diario de Campo'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: History List */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar por fecha, clima o palabras clave..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <span className="text-xs text-ink-faint self-center font-mono">
              Mostrando {filteredReports.length} de {reports.length} reportes
            </span>
          </div>

          {isLoadingReports ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState 
                  icon={<FileText size={36} />}
                  title="No hay reportes de campo registrados"
                  description="Registra el primer reporte diario de campo para alimentar la información técnica y de valuaciones."
                  actionLabel="Crear Reporte Diario"
                  onAction={() => setActiveTab('create')}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((rep) => (
                <Card key={rep.id} hoverEffect className="overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-ink font-display flex items-center gap-1.5">
                          <Calendar size={14} className="text-brand-500" />
                          {rep.date}
                        </span>
                        <StatusBadge status="en_campo" customText={rep.weather} size="sm" />
                        <span className="text-xs text-ink-faint font-mono">
                          {rep.personnelCount || 0} Personal · {rep.workHours || 8} HHT
                        </span>
                      </div>

                      <p className="text-xs text-ink font-medium line-clamp-2">
                        {rep.notes}
                      </p>

                      {rep.correlatedTaskName && (
                        <p className="text-[11px] text-brand-500 font-bold">
                          Partida WBS: {rep.correlatedTaskName}
                        </p>
                      )}

                      {rep.location && (
                        <p className="text-[10px] text-ink-faint flex items-center gap-1">
                          <MapPin size={11} className="text-blue-500" />
                          GPS: Lat {rep.location.lat}, Lng {rep.location.lng}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {rep.imagePreview && (
                        <img 
                          src={rep.imagePreview} 
                          alt="Evidencia" 
                          className="w-16 h-16 object-cover rounded-xl border border-line shadow-xs" 
                        />
                      )}

                      <div className="flex flex-col gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          leftIcon={<Eye size={13} />}
                          onClick={() => { setSelectedReport(rep); setDetailOpen(true); }}
                        >
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          leftIcon={<Download size={13} />}
                          onClick={() => exportFieldReportPDF(rep)}
                        >
                          PDF
                        </Button>
                      </div>
                    </div>

                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Modal Detail */}
      {selectedReport && (
        <Dialog
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`Reporte Diario de Campo — ${selectedReport.date}`}
        >
          <div className="space-y-4 text-ink text-xs">
            
            <div className="grid grid-cols-2 gap-2 bg-surface-2 p-3 rounded-xl border border-line">
              <div>
                <p className="text-ink-soft">Clima:</p>
                <p className="font-bold text-ink">{selectedReport.weather}</p>
              </div>
              <div>
                <p className="text-ink-soft">Personal en Sitio:</p>
                <p className="font-bold text-ink">{selectedReport.personnelCount} Obreros ({selectedReport.workHours || 8} HHT)</p>
              </div>
              {selectedReport.inspectorName && (
                <div className="col-span-2 pt-1 border-t border-line">
                  <p className="text-ink-soft">Inspector:</p>
                  <p className="font-bold text-ink">{selectedReport.inspectorName}</p>
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-ink mb-1">Notas y Actividades:</p>
              <div className="p-3 bg-surface-2 rounded-xl border border-line leading-relaxed whitespace-pre-wrap">
                {selectedReport.notes}
              </div>
            </div>

            {selectedReport.imagePreview && (
              <div>
                <p className="font-bold text-ink mb-1">Evidencia Fotográfica:</p>
                <img src={selectedReport.imagePreview} alt="Evidencia" className="w-full h-48 object-cover rounded-xl border border-line" />
              </div>
            )}

            {selectedReport.aiAnalysis && (
              <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl space-y-1">
                <p className="font-bold text-brand-500 flex items-center gap-1">
                  <Sparkles size={14} /> Análisis Gemini IA:
                </p>
                <p className="text-ink leading-relaxed whitespace-pre-wrap">
                  {selectedReport.aiAnalysis}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-line">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
              <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => exportFieldReportPDF(selectedReport)}>
                Exportar PDF de Reporte
              </Button>
            </div>

          </div>
        </Dialog>
      )}

    </motion.div>
  );
}
