import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  ExternalLink, 
  Copy, 
  Check, 
  Save, 
  Eye, 
  Trash2, 
  Layout, 
  CheckSquare, 
  Palette, 
  FolderCheck, 
  ShieldCheck, 
  FileText, 
  Image, 
  Layers, 
  Plus, 
  Globe,
  Sparkles,
  Key,
  Calendar,
  Lock,
  Send,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { collection, doc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance, handleFirestoreError, OperationType } from '../firebase';
import { clientPortalsRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { sendNotificationEmail, buildPortalInviteHtml } from '../lib/emailService';

export interface ClientPortalConfig {
  id: string;
  name: string;
  clientName: string;
  orgId: string;
  linkedProjectIds: string[];
  tokenHash?: string;
  expiresAt?: string | null;
  isRevoked?: boolean;
  branding: {
    logoUrl: string;
    accentColor: string;
    themePreset: 'mineral' | 'petroleum' | 'corporate_clean' | 'high_contrast';
  };
  visibilityMatrix: {
    showKpis: boolean;
    showScurve: boolean;
    showMilestones: boolean;
    showGallery: boolean;
    showSihoPtw: boolean;
    showNdtWeld: boolean;
    showDossier: boolean;
    showValuations: boolean; // Desactivado por defecto según SPRINT 4.1
  };
  createdAt: string;
  updatedAt: string;
}

export default function ClientPortalBuilder() {
  const { projects, currentOrganization, brandKit } = useProject();
  const orgId = currentOrganization?.id || '';

  // Saved Portals State
  const [portals, setPortals] = useState<ClientPortalConfig[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Portal Form State
  const [portalName, setPortalName] = useState('Portal de Avance - Inspección Técnica');
  const [clientName, setClientName] = useState('Comité de Inspección / Cliente Final');
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);
  const [customLogoUrl, setCustomLogoUrl] = useState(brandKit?.logoUrl || '');
  const [accentColor, setAccentColor] = useState('#0B2239');
  const [themePreset, setThemePreset] = useState<'mineral' | 'petroleum' | 'corporate_clean' | 'high_contrast'>('mineral');
  
  // Security Token (Server-Generated & Plaintext Once View)
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [expiresAtOption, setExpiresAtOption] = useState<'permanent' | '30days' | '90days'>('90days');
  const [isRevoked, setIsRevoked] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRotateToken = async () => {
    if (!selectedPortalId) return;
    if (!window.confirm('¿Deseas rotar el token de este portal? El token anterior quedará invalidado de forma inmediata.')) return;

    setIsRotating(true);
    setStatusMessage(null);

    try {
      const rotateFn = httpsCallable<any, { success: boolean; portalId: string; rawToken: string; expiresAt: string }>(
        functionsInstance,
        'rotateClientPortalToken'
      );

      const result = await rotateFn({
        portalId: selectedPortalId,
        orgId,
        expiresAtOption,
      });

      if (result.data?.success) {
        setCreatedRawToken(result.data.rawToken);
        setIsRevoked(false);
        setStatusMessage('¡Token rotado exitosamente! El token anterior ha sido invalidado.');
      }
    } catch (err: any) {
      console.error('Error rotando token:', err);
      setStatusMessage(`Error rotando token: ${err?.message || 'Error del servidor'}`);
    } finally {
      setIsRotating(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!selectedPortalId) return;
    if (!window.confirm('¿Deseas revocar el acceso a este portal? La URL actual dejará de funcionar.')) return;

    setIsRevoking(true);
    setStatusMessage(null);

    try {
      const revokeFn = httpsCallable<any, { success: boolean; portalId: string; message: string }>(
        functionsInstance,
        'revokeClientPortalToken'
      );

      const result = await revokeFn({
        portalId: selectedPortalId,
        orgId,
        reason: 'Revocado desde el panel de administración',
      });

      if (result.data?.success) {
        setIsRevoked(true);
        setStatusMessage('Acceso al portal revocado exitosamente.');
      }
    } catch (err: any) {
      console.error('Error revocando portal:', err);
      setStatusMessage(`Error revocando portal: ${err?.message || 'Error del servidor'}`);
    } finally {
      setIsRevoking(false);
    }
  };

  // Email Invitation State
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  // Visibility Matrix (showValuations is false by default according to SPRINT 4.1)
  const [visibilityMatrix, setVisibilityMatrix] = useState({
    showKpis: true,
    showScurve: true,
    showMilestones: true,
    showGallery: true,
    showSihoPtw: true,
    showNdtWeld: true,
    showDossier: true,
    showValuations: false,
  });

  // Subscribe to organization portals via Repository (limit(50))
  useEffect(() => {
    const unsub = clientPortalsRepo.subscribe(orgId, 'all', (items) => {
      setPortals(items as unknown as ClientPortalConfig[]);
    }, undefined, { limitCount: 50 });

    return () => unsub();
  }, [orgId]);

  // Set initial project list selection
  useEffect(() => {
    if (projects.length > 0 && linkedProjectIds.length === 0) {
      const validProjects = projects.filter(p => p.id !== 'all');
      if (validProjects.length > 0) {
        setLinkedProjectIds([validProjects[0].id]);
      }
    }
  }, [projects]);

  const toggleProjectSelection = (projId: string) => {
    setLinkedProjectIds(prev => 
      prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]
    );
  };

  const loadPortalConfig = (portal: ClientPortalConfig) => {
    setSelectedPortalId(portal.id);
    setPortalName(portal.name);
    setClientName(portal.clientName || 'Comité de Inspección');
    setLinkedProjectIds(portal.linkedProjectIds || []);
    setCustomLogoUrl(portal.branding?.logoUrl || '');
    setAccentColor(portal.branding?.accentColor || '#0B2239');
    setThemePreset(portal.branding?.themePreset || 'mineral');
    setIsRevoked(!!portal.isRevoked);
    setCreatedRawToken(null);
    if (portal.visibilityMatrix) {
      setVisibilityMatrix({
        ...portal.visibilityMatrix,
        showValuations: portal.visibilityMatrix.showValuations ?? false
      });
    }
  };

  const resetForm = () => {
    setSelectedPortalId(null);
    setPortalName('Nuevo Portal de Avance Cliente');
    setClientName('Comité de Inspección / Cliente');
    setLinkedProjectIds(projects.filter(p => p.id !== 'all').slice(0, 2).map(p => p.id));
    setCustomLogoUrl(brandKit?.logoUrl || '');
    setAccentColor('#0B2239');
    setThemePreset('mineral');
    setCreatedRawToken(null);
    setExpiresAtOption('90days');
    setIsRevoked(false);
    setVisibilityMatrix({
      showKpis: true,
      showScurve: true,
      showMilestones: true,
      showGallery: true,
      showSihoPtw: true,
      showNdtWeld: true,
      showDossier: true,
      showValuations: false,
    });
  };

  const handleSendInviteEmail = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setEmailStatusMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }
    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    const portalId = selectedPortalId || `portal_${Date.now()}`;
    const token = createdRawToken || 'TOKEN_DE_EJEMPLO';
    const portalUrl = `${window.location.origin}/portal/${portalId}?token=${token}`;
    const htmlContent = buildPortalInviteHtml(portalName, clientName, portalUrl);

    const res = await sendNotificationEmail({
      to: inviteEmail,
      subject: `[Acceso Seguro] Portal Cliente de Avance: ${portalName}`,
      html: htmlContent,
      event: 'portal_invite',
      portalLink: portalUrl
    });

    setIsSendingEmail(false);
    if (res.success) {
      setEmailStatusMsg(`Invitación enviada a ${inviteEmail}.`);
      setInviteEmail('');
    } else {
      setEmailStatusMsg(`Error: ${res.message}`);
    }
  };

  const handleSavePortal = async () => {
    if (!portalName.trim()) {
      setStatusMessage('Por favor ingresa un nombre para el portal.');
      return;
    }
    if (linkedProjectIds.length === 0) {
      setStatusMessage('Selecciona al menos un proyecto vinculado.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Sprint 9: Invocar Cloud Function Callable createClientPortal
      const createFn = httpsCallable<any, { success: boolean; portalId: string; rawToken: string; expiresAt: string }>(
        functionsInstance, 
        'createClientPortal'
      );

      const result = await createFn({
        id: selectedPortalId || undefined,
        name: portalName,
        clientName,
        orgId,
        linkedProjectIds,
        branding: {
          logoUrl: customLogoUrl,
          accentColor,
          themePreset,
        },
        visibilityMatrix,
        expiresAtOption,
        isRevoked
      });

      if (result.data?.success) {
        const { portalId, rawToken } = result.data;
        setSelectedPortalId(portalId);
        setCreatedRawToken(rawToken);
        setStatusMessage('¡Portal configurado exitosamente! Se guardó únicamente el hash SHA-256 en Firestore.');
      } else {
        throw new Error('Respuesta no válida del servidor.');
      }
    } catch (err: any) {
      console.warn('Fallback o error invocando Cloud Function createClientPortal:', err?.message || err);
      setStatusMessage(`Error al guardar en servidor: ${err?.message || 'Contacte al administrador'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePortal = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta configuración de portal cliente?')) return;
    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'client_portals', id));
      await deleteDoc(doc(db, 'client_portals', id));
      if (selectedPortalId === id) {
        resetForm();
      }
      setStatusMessage('Portal eliminado.');
    } catch (err) {
      console.error('Error eliminando portal:', err);
    }
  };

  const copyFullShareLink = () => {
    if (!selectedPortalId || !createdRawToken) return;
    const shareUrl = `${window.location.origin}/portal/${selectedPortalId}?token=${createdRawToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(selectedPortalId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-brand-500 dark:text-brand-accent font-mono text-xs uppercase tracking-wider font-bold">
            <Globe size={16} />
            <span>Client Portal Builder • Secure Token Architecture (SHA-256)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            Constructor de Portales Cliente
          </h1>
          <p className="text-ink-soft text-sm max-w-2xl leading-relaxed font-medium">
            Configura un portal seguro y branded. Los tokens de acceso de 32 bytes crypto se guardan en Firestore únicamente como hash SHA-256 y se entregan en texto plano una sola vez.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
              <Building size={20} className="text-brand-500" />
              <span>1. Datos del Portal y Cliente</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Nombre del Portal</label>
                <input 
                  type="text"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="ej. Portal de Avance - Estación de Flujo X"
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl font-medium text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Cliente / Inspectoría de Destino</label>
                <input 
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Comité de Inspección PDVSA"
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl font-medium text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Project Links Selector */}
            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-2">Proyectos Vinculados al Portal</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {projects.filter(p => p.id !== 'all').map((proj) => {
                  const isChecked = linkedProjectIds.includes(proj.id);
                  return (
                    <div 
                      key={proj.id}
                      onClick={() => toggleProjectSelection(proj.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-brand-500 bg-brand-500 text-white shadow-xs' 
                          : 'border-line bg-surface-2 text-ink hover:bg-elevated'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-line bg-surface'
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{proj.name}</p>
                        <p className={`text-[10px] ${isChecked ? 'text-white/80' : 'text-ink-soft'}`}>{proj.status || 'Activo'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Branding Selector */}
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
              <Palette size={20} className="text-brand-500" />
              <span>2. Branding e Identidad Visual</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">URL de Logo Personalizado</label>
                <input 
                  type="text"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="https://servidor.com/logo-cliente.png"
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl font-medium text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-ink-faint mt-1">Opcional. Si se omite, usará el BrandKit corporativo.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Color de Acento Primario</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-line cursor-pointer p-0.5 bg-surface-2"
                  />
                  <input 
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-2 border border-line rounded-xl font-mono text-sm uppercase font-bold text-ink"
                  />
                </div>
              </div>
            </div>

            {/* Preset Selection */}
            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-2">Preset de Tema Independiente</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'mineral', label: 'Mineral Light', bg: 'bg-[#F2F1ED]', text: 'text-slate-900' },
                  { key: 'petroleum', label: 'Petroleum Dark', bg: 'bg-[#0B2239]', text: 'text-white' },
                  { key: 'corporate_clean', label: 'Corporate Clean', bg: 'bg-white', text: 'text-slate-800' },
                  { key: 'high_contrast', label: 'High Contrast', bg: 'bg-slate-950', text: 'text-emerald-400' },
                ].map((preset) => {
                  const isSel = themePreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setThemePreset(preset.key as any)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        preset.bg
                      } ${preset.text} ${
                        isSel ? 'ring-2 ring-brand-500 border-brand-500 shadow-xs scale-[1.02]' : 'border-line opacity-80 hover:opacity-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Security & Token Config */}
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
              <ShieldCheck size={20} className="text-brand-500" />
              <span>3. Generación de Token Criptográfico (Server-Side)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Caducidad del Enlace</label>
                <select 
                  value={expiresAtOption} 
                  onChange={e => setExpiresAtOption(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl font-medium text-xs text-ink outline-none"
                >
                  <option value="90days">Validez 90 Días (Recomendado)</option>
                  <option value="30days">Validez 30 Días</option>
                  <option value="permanent">Sin Expiración (Permanente)</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full p-2.5 bg-surface-2 rounded-xl border border-line text-xs text-ink-soft">
                  <span className="font-bold text-ink">Seguridad Hash SHA-256:</span> Los tokens nunca se persisten en texto plano en la base de datos.
                </div>
              </div>
            </div>

            {/* Banner del Token Plaintext generado una sola vez */}
            {createdRawToken && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                  <AlertTriangle size={16} />
                  <span>Token Criptográfico Generado (Mostrado una sola vez)</span>
                </div>
                <p className="text-xs text-ink-soft">
                  Copia el siguiente token o la URL completa con el token de 64 caracteres hex. No se volverá a mostrar.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="text" 
                    readOnly 
                    value={createdRawToken} 
                    className="flex-1 px-3 py-2 bg-surface border border-line rounded-xl font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold select-all"
                  />
                  <button 
                    type="button" 
                    onClick={copyFullShareLink}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === selectedPortalId ? <Check size={14} /> : <Copy size={14} />}
                    <span>Copiar URL Compartible</span>
                  </button>
                </div>
              </motion.div>
            )}

            {selectedPortalId && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-2 border border-line rounded-xl">
                <div>
                  <p className="text-xs font-bold text-ink">Gestión de Acceso y Token Activo</p>
                  <p className="text-[11px] text-ink-soft">Rota el token criptográfico o revoca el portal inmediatamente.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRotateToken}
                    disabled={isRotating}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Key size={14} />
                    <span>{isRotating ? 'Rotando...' : 'Rotar Token'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleRevokeToken}
                    disabled={isRevoking || isRevoked}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isRevoked ? 'bg-rose-600 text-white opacity-80' : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isRevoking ? 'Revocando...' : (isRevoked ? 'Portal Revocado' : 'Revocar Acceso')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visibility Matrix */}
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
              <CheckSquare size={20} className="text-brand-500" />
              <span>4. Matriz de Visibilidad para Cliente Final</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: 'showKpis', label: 'KPIs de Progreso y Financieros', icon: Layout, desc: 'Porcentaje físico y montos ejecutados' },
                { key: 'showScurve', label: 'Curva S de Avance Físico', icon: Layers, desc: 'Gráfica de avance planificado vs real' },
                { key: 'showMilestones', label: 'Hitos y Cronograma WBS', icon: FolderCheck, desc: 'Fechas de entrega y estatus de tareas' },
                { key: 'showGallery', label: 'Galería de Fotos/Videos Campo', icon: Image, desc: 'Evidencia fotográfica documentada' },
                { key: 'showSihoPtw', label: 'Módulo SIHO PTS (Permisos)', icon: ShieldCheck, desc: 'Permisos de trabajo seguro y HSE' },
                { key: 'showNdtWeld', label: 'Juntas y Soldaduras NDT', icon: Sparkles, desc: 'Ensayos no destructivos y trazabilidad' },
                { key: 'showDossier', label: 'Descarga Dossier de Calidad', icon: FileText, desc: 'Planos As-Built y certificados PDF' },
                { key: 'showValuations', label: 'Valuaciones Financieras ROE', icon: DollarSign, desc: 'Monto y certificados de pago (Desactivado por defecto)' },
              ].map((item) => {
                const IconComponent = item.icon;
                const enabled = (visibilityMatrix as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setVisibilityMatrix(prev => ({ ...prev, [item.key]: !enabled }))}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      enabled 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-ink shadow-xs' 
                        : 'bg-surface-2 border-line text-ink-faint opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${enabled ? 'bg-emerald-500 text-white' : 'bg-surface text-ink-faint'}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-snug">{item.label}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${enabled ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-line bg-surface'}`}>
                      {enabled && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Invitation Box */}
          <div className="bg-surface-2 border border-line rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-brand-500 dark:text-emerald-400">
              <Send size={16} />
              <span>Enviar Invitación Directa por Correo (Resend SDK)</span>
            </h3>
            <p className="text-xs text-ink-soft">
              Envía un correo electrónico formal con el enlace cifrado y credenciales de acceso al cliente o fiscal.
            </p>
            <div className="flex items-center gap-2">
              <input 
                type="email" 
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="cliente.inspector@empresa.com"
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface border border-line text-ink text-xs outline-none focus:border-brand-500"
              />
              <button 
                type="button"
                onClick={handleSendInviteEmail}
                disabled={isSendingEmail}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={14} />
                <span>{isSendingEmail ? 'Enviando...' : 'Enviar Email'}</span>
              </button>
            </div>
            {emailStatusMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                {emailStatusMsg}
              </p>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-line shadow-2xs">
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-line text-ink text-xs font-bold hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Limpiar / Nuevo Portal
            </button>

            <button
              onClick={handleSavePortal}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              <span>{isSaving ? 'Generando Token...' : (selectedPortalId ? 'Generar Nuevo Token & Actualizar' : 'Crear Portal Seguro')}</span>
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs font-bold p-3 bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-500/30">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Right Column: Existing Portals List */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Globe size={18} className="text-brand-500" />
                <span>Portales Configurados</span>
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 bg-surface-2 text-ink rounded-full border border-line">
                {portals.length}
              </span>
            </div>

            {portals.length === 0 ? (
              <p className="text-xs text-ink-faint py-6 text-center italic">
                Aún no has configurado portales para esta organización.
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {portals.map((p) => {
                  const isSel = selectedPortalId === p.id;
                  return (
                    <div 
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isSel ? 'border-brand-500 bg-brand-500 text-white shadow-xs' : 'border-line bg-surface text-ink hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold">{p.name}</p>
                          <p className={`text-[10px] mt-0.5 ${isSel ? 'text-white/80' : 'text-ink-soft'}`}>
                            {p.clientName} • {p.linkedProjectIds?.length || 0} Proyectos
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePortal(p.id)}
                          className={`p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-500 transition-colors ${
                            isSel ? 'text-white/70' : 'text-ink-faint'
                          }`}
                          title="Eliminar portal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-line">
                        <button
                          onClick={() => loadPortalConfig(p)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            isSel 
                              ? 'bg-white text-slate-900 border-white hover:bg-slate-100' 
                              : 'bg-surface-2 text-ink border-line hover:bg-elevated'
                          }`}
                        >
                          Cargar / Editar
                        </button>

                        <a
                          href={`/portal/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSel 
                              ? 'border-white/30 text-white hover:bg-white/10' 
                              : 'border-line text-brand-500 hover:bg-surface-2'
                          }`}
                          title="Abrir Vista Previa Cliente"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
