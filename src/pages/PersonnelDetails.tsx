import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  HardHat, ArrowLeft, UserCheck, Calendar, Award, ShieldCheck, 
  AlertCircle, RefreshCw, Clock, Filter, UserX, CheckCircle2, XCircle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface WorkerDoc {
  id: string;
  fullName?: string;
  name?: string;
  nombre?: string;
  nationalId?: string;
  cedula?: string;
  role?: string;
  position?: string;
  cargo?: string;
  status?: string;
  active?: boolean;
  fitStatus?: string;
  certifications?: Array<string | { name: string; expiryDate?: string }>;
  certs?: Array<string>;
  photoUrl?: string;
  phone?: string;
  createdAt?: any;
}

interface AttendanceDoc {
  id: string;
  workerId?: string;
  nationalId?: string;
  timestamp?: any;
  checkInTime?: string;
  type?: string;
  status?: string;
  location?: string;
}

export default function PersonnelDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workerIdParam = searchParams.get('workerId') || searchParams.get('id');

  const { currentOrganization, currentProject } = useProject();
  const orgId = currentOrganization?.id;
  const projId = currentProject?.id;

  const [workers, setWorkers] = useState<WorkerDoc[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !projId || projId === 'all') {
      setWorkers([]);
      setAttendance([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const workersPath = `organizations/${orgId}/projects/${projId}/workers`;
    const attendancePath = `organizations/${orgId}/projects/${projId}/worker_attendance`;

    let unsubAttendance: (() => void) | null = null;

    const unsubWorkers = onSnapshot(
      collection(db, workersPath),
      (snapshot) => {
        const docs: WorkerDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setWorkers(docs);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, workersPath);
        setError(`Error al cargar personal (${err.code || err.message})`);
        setLoading(false);
      }
    );

    unsubAttendance = onSnapshot(
      collection(db, attendancePath),
      (snapshot) => {
        const attDocs: AttendanceDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAttendance(attDocs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, attendancePath);
      }
    );

    return () => {
      unsubWorkers();
      if (unsubAttendance) unsubAttendance();
    };
  }, [orgId, projId]);

  // Context Guard
  if (!orgId || !projId || projId === 'all') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Personal</h1>
            <p className="text-xs text-muted">Gestión y control de personal activo en obra</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Contexto Requerido</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Selecciona una organización y un proyecto específico para consultar los detalles de personal.
          </p>
        </div>
      </motion.div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin text-brand-500 mx-auto" />
        <p className="text-sm text-muted font-medium">Cargando registros de personal desde Firestore...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Personal</h1>
            <p className="text-xs text-muted">Gestión y control de personal activo en obra</p>
          </div>
        </header>

        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={20} />
            <span>Error de Acceso o Consulta</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      </motion.div>
    );
  }

  // Empty State if collection is empty
  if (workers.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Personal</h1>
            <p className="text-xs text-muted">Gestión y control de personal activo en obra</p>
          </div>
        </header>

        <div className="bg-surface p-10 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-surface-2 text-muted rounded-2xl flex items-center justify-center mx-auto">
            <UserX size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Sin Personal Registrado</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No se encontraron registros de personal en el proyecto seleccionado ({currentProject?.name || projId}).
          </p>
        </div>
      </motion.div>
    );
  }

  // Find target worker or fallback to first worker doc
  const activeWorker = workerIdParam
    ? workers.find((w) => w.id === workerIdParam || w.nationalId === workerIdParam)
    : workers[0];

  if (workerIdParam && !activeWorker) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <header className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Personal</h1>
            <p className="text-xs text-muted">Gestión y control de personal activo en obra</p>
          </div>
        </header>

        <div className="bg-surface p-8 rounded-2xl border border-line text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-semibold text-ink">Trabajador No Encontrado</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            No existe ningún registro de personal con el identificador "{workerIdParam}".
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600 transition-colors cursor-pointer"
          >
            Ver primer trabajador disponible
          </button>
        </div>
      </motion.div>
    );
  }

  const selectedWorker = activeWorker || workers[0];

  // Defensive field extractions
  const workerName = selectedWorker.fullName || selectedWorker.name || selectedWorker.nombre || 'Trabajador sin nombre';
  const workerRole = selectedWorker.role || selectedWorker.position || selectedWorker.cargo || 'Operador de Campo';
  const workerCedula = selectedWorker.nationalId || selectedWorker.cedula || selectedWorker.id || 'N/A';
  const isWorkerActive = selectedWorker.active !== false && selectedWorker.status !== 'INACTIVE';
  const fitStatus = selectedWorker.fitStatus || 'FIT';
  const rawCerts = selectedWorker.certifications || selectedWorker.certs || [];
  const certsList = Array.isArray(rawCerts) ? rawCerts : [];

  // Filter attendance for this worker (last 5 records)
  const workerAttendance = attendance
    .filter((a) => a.workerId === selectedWorker.id || (a.nationalId && a.nationalId === selectedWorker.nationalId))
    .sort((a, b) => {
      const tA = a.timestamp?.seconds || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const tB = b.timestamp?.seconds || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return tB - tA;
    })
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 text-ink transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">Detalles de Personal</h1>
            <p className="text-xs text-muted">Ficha técnica y control de asistencia individual</p>
          </div>
        </div>

        {/* Worker Selector Dropdown */}
        {workers.length > 1 && (
          <div className="flex items-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl text-xs">
            <Filter size={14} className="text-muted" />
            <select
              value={selectedWorker.id}
              onChange={(e) => setSearchParams({ workerId: e.target.value })}
              className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName || w.name || w.nombre || w.id} ({w.role || w.cargo || 'Personal'})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Worker Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Overview */}
        <div className="bg-surface p-6 rounded-2xl border border-line space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-bold text-2xl shrink-0 border border-brand-100 overflow-hidden">
              {selectedWorker.photoUrl ? (
                <img src={selectedWorker.photoUrl} alt={workerName} className="w-full h-full object-cover" />
              ) : (
                <HardHat size={32} />
              )}
            </div>
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isWorkerActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isWorkerActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {isWorkerActive ? 'Activo' : 'Inactivo'}
              </span>
              <h2 className="text-lg font-bold text-ink leading-tight">{workerName}</h2>
              <p className="text-xs text-muted font-medium">{workerRole}</p>
            </div>
          </div>

          <div className="border-t border-line pt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-line/50">
              <span className="text-muted">Cédula / ID:</span>
              <span className="font-mono font-bold text-ink">{workerCedula}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-line/50">
              <span className="text-muted">Aptitud SIHO-CMA:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                fitStatus === 'FIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {fitStatus}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">Teléfono:</span>
              <span className="font-semibold text-ink">{selectedWorker.phone || 'No registrado'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance & Certifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Attendance */}
          <div className="bg-surface p-6 rounded-2xl border border-line space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-brand-500" />
                <h3 className="text-sm font-bold text-ink">Asistencia Reciente (Últimos 5 registros)</h3>
              </div>
              <span className="text-[11px] text-muted font-mono">{workerAttendance.length} marcajes</span>
            </div>

            {workerAttendance.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted border border-dashed border-line rounded-xl">
                No hay marcajes de asistencia registrados para este trabajador.
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {workerAttendance.map((att) => {
                  const dateStr = att.checkInTime || (att.timestamp?.seconds
                    ? new Date(att.timestamp.seconds * 1000).toLocaleString('es-VE')
                    : 'Fecha no registrada');
                  const attType = att.type || att.status || 'MARCAJE';
                  return (
                    <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-600" />
                        <span className="font-semibold text-ink">{attType}</span>
                        {att.location && <span className="text-[10px] text-muted">({att.location})</span>}
                      </div>
                      <span className="font-mono text-muted">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-surface p-6 rounded-2xl border border-line space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Award size={18} className="text-brand-accent" />
              <h3 className="text-sm font-bold text-ink">Certificaciones y Permisos SIHO</h3>
            </div>

            {certsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted border border-dashed border-line rounded-xl">
                Sin certificaciones cargadas para este registro.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certsList.map((cert, i) => {
                  const certName = typeof cert === 'string' ? cert : cert.name || 'Certificación';
                  const expiry = typeof cert === 'object' && cert.expiryDate ? `Expira: ${cert.expiryDate}` : null;
                  return (
                    <div key={i} className="p-3 bg-surface-2 rounded-xl border border-line/60 flex items-start gap-2 text-xs">
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-ink">{certName}</p>
                        {expiry && <p className="text-[10px] text-muted mt-0.5">{expiry}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

