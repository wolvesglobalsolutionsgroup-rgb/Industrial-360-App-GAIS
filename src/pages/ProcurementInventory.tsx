import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  collectionGroup,
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { procurementRepo, inventoryRepo } from '../lib/repositories';
import { useProject } from '../ProjectContext';
import { useRequiredProject } from '../hooks/useRequiredProject';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  Truck, 
  ShieldCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Tag, 
  Layers, 
  X, 
  Filter,
  Check,
  FileCheck,
  Flame,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Interfaces for Procurement & Inventory
export interface MaterialRFQ {
  id?: string;
  rfqCode: string;
  projectId: string;
  orgId: string;
  weldTaskId?: string;
  wbsCode: string;
  itemDescription: string;
  specStandard: string; // e.g. API 5L Gr. X52 PSL2, ASTM A105
  quantityRequired: number;
  unit: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  requestedBy: string;
  requestDate: string;
  status: 'Borrador' | 'En Cotización' | 'Aprobado' | 'OC Emitida';
  notes?: string;
}

export interface PurchaseOrder {
  id?: string;
  poCode: string;
  projectId: string;
  orgId: string;
  rfqId?: string;
  supplierName: string;
  supplierRif: string;
  itemDescription: string;
  quantityOrdered: number;
  unit: string;
  unitPriceUsd: number;
  totalPriceUsd: number;
  issueDate: string;
  estimatedDeliveryDate: string;
  status: 'Emitida' | 'En Tránsito' | 'Recibida Parcial' | 'Recibida Total' | 'Cancelada';
  paymentTerms: string;
}

export interface InventoryItemMTR {
  id?: string;
  itemCode: string;
  projectId: string;
  orgId: string;
  poId?: string;
  description: string;
  category: 'Tubería' | 'Accesorios / Válvulas' | 'Consumibles Soldadura' | 'Estructural' | 'Revestimiento';
  specStandard: string;
  heatNumber: string; // N° de Colada MTR (Obligatorio)
  mtrCertificateNo: string; // N° Certificado MTR ASTM/API
  millManufacturer: string; // Fabricante / Molino
  quantityReceived: number;
  quantityAvailable: number;
  unit: string;
  warehouseLocation: string; // e.g. Patio P-1, Estante A-02
  entryDate: string;
  verifiedByInspector: string;
  mtrStatus: 'Verificado' | 'Pendiente Aprobación QA/QC' | 'Rechazado';
}

export interface MaterialDispatch {
  id?: string;
  dispatchCode: string;
  projectId: string;
  orgId: string;
  inventoryItemId: string;
  heatNumber: string;
  weldJointId?: string; // Trazabilidad a Junta de Soldadura
  targetFront: string; // Frente de trabajo / Capataz
  quantityDispatched: number;
  unit: string;
  dispatchedBy: string;
  dispatchDate: string;
  notes?: string;
}

// Fallback seed data if Firestore collection is empty
const INITIAL_DEMO_RFQS: MaterialRFQ[] = [
  {
    id: 'rfq-01',
    rfqCode: 'RFQ-2026-001',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    wbsCode: '1.2.1-TUB',
    itemDescription: 'Tubería de Acero Carbono 6" Sch 40 Sin Costura',
    specStandard: 'API 5L Gr. X52 PSL2',
    quantityRequired: 450,
    unit: 'm',
    priority: 'Alta',
    requestedBy: 'Ing. Carlos Mendoza (Jefe de Obra)',
    requestDate: '2026-07-20',
    status: 'OC Emitida',
    notes: 'Requerido para reemplazo de tramo K-04 a K-06 Cardón-Amuay'
  },
  {
    id: 'rfq-02',
    rfqCode: 'RFQ-2026-002',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    wbsCode: '1.2.4-VAL',
    itemDescription: 'Válvula Tapón Lub. 6" Class 600 Bridadas RF',
    specStandard: 'API 6D / ASME B16.34',
    quantityRequired: 4,
    unit: 'und',
    priority: 'Urgente',
    requestedBy: 'Ing. María Rivas (QA/QC)',
    requestDate: '2026-07-22',
    status: 'En Cotización',
    notes: 'Aislamiento trampa de recibo Amuay'
  },
  {
    id: 'rfq-03',
    rfqCode: 'RFQ-2026-003',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    wbsCode: '1.3.1-SOL',
    itemDescription: 'Electrodo Celulósico E7010-P1 5/32" para Pases de Relleno',
    specStandard: 'AWS A5.5',
    quantityRequired: 250,
    unit: 'kg',
    priority: 'Media',
    requestedBy: 'Téc. Roberto Gómez (Capataz)',
    requestDate: '2026-07-25',
    status: 'Aprobado',
    notes: 'Consumibles de soldadura calificada WPS-PRO-01'
  }
];

const INITIAL_DEMO_POS: PurchaseOrder[] = [
  {
    id: 'po-01',
    poCode: 'OC-2026-088',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    rfqId: 'rfq-01',
    supplierName: 'Tubos de Acero de Venezuela C.A. (TUBOCARB)',
    supplierRif: 'J-30491823-1',
    itemDescription: 'Tubería API 5L Gr. X52 PSL2 6" Sch 40 ERW/Seamless',
    quantityOrdered: 450,
    unit: 'm',
    unitPriceUsd: 185.00,
    totalPriceUsd: 83250.00,
    issueDate: '2026-07-21',
    estimatedDeliveryDate: '2026-07-28',
    status: 'Recibida Total',
    paymentTerms: '30 días crédito'
  },
  {
    id: 'po-02',
    poCode: 'OC-2026-089',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    rfqId: 'rfq-03',
    supplierName: 'Electrodos Nacionales y Soldadura S.A.',
    supplierRif: 'J-00129482-9',
    itemDescription: 'Electrodos E7010-P1 5/32" Lincoln Electric',
    quantityOrdered: 250,
    unit: 'kg',
    unitPriceUsd: 14.50,
    totalPriceUsd: 3625.00,
    issueDate: '2026-07-26',
    estimatedDeliveryDate: '2026-07-30',
    status: 'En Tránsito',
    paymentTerms: 'Contado anticipado'
  }
];

const INITIAL_DEMO_INVENTORY: InventoryItemMTR[] = [
  {
    id: 'inv-01',
    itemCode: 'MAT-TUB-6X52-01',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    poId: 'po-01',
    description: 'Tubería API 5L Gr. X52 PSL2 6" Sch 40 Seamless (Long. 12m)',
    category: 'Tubería',
    specStandard: 'API 5L PSL2 / ASME B36.10M',
    heatNumber: 'HEAT-88492-X52',
    mtrCertificateNo: 'MTR-TENARIS-2026-9041',
    millManufacturer: 'Tenaris Tamsa (México)',
    quantityReceived: 450,
    quantityAvailable: 310,
    unit: 'm',
    warehouseLocation: 'Patio Tuberías P-1 (Rack 03)',
    entryDate: '2026-07-28',
    verifiedByInspector: 'Ing. Luis Valero (Inspector QA/QC)',
    mtrStatus: 'Verificado'
  },
  {
    id: 'inv-02',
    itemCode: 'MAT-CAM-6TIPO-B',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    description: 'Camisas Envolventes Tipo B 6" Gr. X65 para Reparación de Anomalías ILI',
    category: 'Accesorios / Válvulas',
    specStandard: 'ASME B31.4 / NACE MR0175',
    heatNumber: 'HEAT-77301-A105',
    mtrCertificateNo: 'MTR-VALV-2026-4412',
    millManufacturer: 'Metalúrgica del Zulia C.A.',
    quantityReceived: 12,
    quantityAvailable: 9,
    unit: 'und',
    warehouseLocation: 'Almacén Central A-01',
    entryDate: '2026-07-15',
    verifiedByInspector: 'Ing. Luis Valero (Inspector QA/QC)',
    mtrStatus: 'Verificado'
  },
  {
    id: 'inv-03',
    itemCode: 'MAT-SOL-7018-01',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    description: 'Electrodo Bajo Hidrógeno AWS E7018 1/8" Lincoln 7018-1',
    category: 'Consumibles Soldadura',
    specStandard: 'AWS A5.1 / ASME SFA 5.1',
    heatNumber: 'HEAT-E7018-88301',
    mtrCertificateNo: 'MTR-LINCOLN-99120',
    millManufacturer: 'Lincoln Electric',
    quantityReceived: 150,
    quantityAvailable: 85,
    unit: 'kg',
    warehouseLocation: 'Depósito Secado Soldadura D-02',
    entryDate: '2026-07-18',
    verifiedByInspector: 'Ing. María Rivas (QA/QC)',
    mtrStatus: 'Verificado'
  }
];

const INITIAL_DEMO_DISPATCHES: MaterialDispatch[] = [
  {
    id: 'disp-01',
    dispatchCode: 'DESP-2026-015',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    inventoryItemId: 'inv-01',
    heatNumber: 'HEAT-88492-X52',
    weldJointId: 'J-01',
    targetFront: 'Frente 1 - Reemplazo Tramo K-04',
    quantityDispatched: 140,
    unit: 'm',
    dispatchedBy: 'Almacenista José Torrealba',
    dispatchDate: '2026-07-29',
    notes: 'Asignado a tubería A y B para Soldaduras de Campo J-01 a J-08'
  },
  {
    id: 'disp-02',
    dispatchCode: 'DESP-2026-016',
    projectId: 'PROJ-CARDON-AMUAY',
    orgId: 'prointeca',
    inventoryItemId: 'inv-02',
    heatNumber: 'HEAT-77301-A105',
    weldJointId: 'J-CAM-01',
    targetFront: 'Frente 2 - Camisa Tipo B Anomalía D001',
    quantityDispatched: 3,
    unit: 'und',
    dispatchedBy: 'Almacenista José Torrealba',
    dispatchDate: '2026-07-29',
    notes: 'Instalación sobre defecto D001 (ASME B31G 42% profundidad)'
  }
];

const getDemoRfqs = (targetOrgId: string, targetProjId: string): MaterialRFQ[] =>
  INITIAL_DEMO_RFQS.map(item => ({ ...item, orgId: targetOrgId, projectId: targetProjId }));

const getDemoPos = (targetOrgId: string, targetProjId: string): PurchaseOrder[] =>
  INITIAL_DEMO_POS.map(item => ({ ...item, orgId: targetOrgId, projectId: targetProjId }));

const getDemoInventory = (targetOrgId: string, targetProjId: string): InventoryItemMTR[] =>
  INITIAL_DEMO_INVENTORY.map(item => ({ ...item, orgId: targetOrgId, projectId: targetProjId }));

const getDemoDispatches = (targetOrgId: string, targetProjId: string): MaterialDispatch[] =>
  INITIAL_DEMO_DISPATCHES.map(item => ({ ...item, orgId: targetOrgId, projectId: targetProjId }));

export default function ProcurementInventory() {
  const { currentOrganization, currentProject, projects } = useProject();
  const { orgId, projectId: projId } = useRequiredProject();

  const [activeTab, setActiveTab] = useState<'rfq' | 'po' | 'inventory' | 'traceability'>('inventory');
  
  // States for live data
  const [rfqs, setRfqs] = useState<MaterialRFQ[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemMTR[]>([]);
  const [dispatches, setDispatches] = useState<MaterialDispatch[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterHeatNumber, setFilterHeatNumber] = useState('');

  // Modals
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Form states
  const [newRfq, setNewRfq] = useState({
    wbsCode: '1.2.1-TUB',
    itemDescription: '',
    specStandard: 'API 5L Gr. X52 PSL2',
    quantityRequired: '',
    unit: 'm',
    priority: 'Alta' as const,
    notes: ''
  });

  const [newPo, setNewPo] = useState({
    rfqId: '',
    supplierName: '',
    supplierRif: '',
    itemDescription: '',
    quantityOrdered: '',
    unit: 'm',
    unitPriceUsd: '',
    paymentTerms: '30 días crédito'
  });

  const [newReceipt, setNewReceipt] = useState({
    itemCode: `MAT-${Date.now().toString().slice(-4)}`,
    poId: '',
    description: '',
    category: 'Tubería' as const,
    specStandard: 'API 5L PSL2',
    heatNumber: '',
    mtrCertificateNo: '',
    millManufacturer: '',
    quantityReceived: '',
    unit: 'm',
    warehouseLocation: 'Patio P-1'
  });

  const [newDispatch, setNewDispatch] = useState({
    inventoryItemId: '',
    weldJointId: 'J-01',
    targetFront: 'Frente 1 - Tramo Cardón',
    quantityDispatched: '',
    notes: ''
  });

  // Listen to Firestore procurement & inventory collections via Repositories (limit(50))
  useEffect(() => {
    // 1. RFQs
    const unsubRfq = procurementRepo.subscribe(orgId, projId, (items) => {
      const all = items as unknown as MaterialRFQ[];
      setRfqs(all.length > 0 ? all : getDemoRfqs(orgId, projId));
    }, () => {
      setRfqs(getDemoRfqs(orgId, projId));
    }, { limitCount: 50 });

    // 2. Inventory / Materials
    const unsubInv = inventoryRepo.subscribe(orgId, projId, (items) => {
      const all = items as unknown as InventoryItemMTR[];
      setInventoryItems(all.length > 0 ? all : getDemoInventory(orgId, projId));
    }, () => {
      setInventoryItems(getDemoInventory(orgId, projId));
    }, { limitCount: 50 });

    // POs and Dispatches fallback to state initialized with demo items if not present
    setPos(getDemoPos(orgId, projId));
    setDispatches(getDemoDispatches(orgId, projId));

    return () => {
      unsubRfq();
      unsubInv();
    };
  }, [orgId, projId]);

  const getSafeProjectId = () => {
    if (projId && projId !== 'all') return projId;
    if (currentProject?.id && currentProject.id !== 'all') return currentProject.id;
    const realP = projects.find(p => p.id !== 'all');
    return realP ? realP.id : 'PROJ-CARDON-AMUAY';
  };

  // Handle RFQ Creation
  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjId = getSafeProjectId();
    const item: MaterialRFQ = {
      rfqCode: `RFQ-2026-00${rfqs.length + 1}`,
      projectId: targetProjId,
      orgId,
      wbsCode: newRfq.wbsCode,
      itemDescription: newRfq.itemDescription,
      specStandard: newRfq.specStandard,
      quantityRequired: Number(newRfq.quantityRequired),
      unit: newRfq.unit,
      priority: newRfq.priority,
      requestedBy: 'Ing. Inspector de Campo (PROINTECA)',
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Aprobado',
      notes: newRfq.notes
    };

    try {
      await addDoc(collection(db, `organizations/${orgId}/projects/${item.projectId}/procurement`), item);
    } catch (err) {
      console.warn('Saving to local state fallback:', err);
      setRfqs(prev => [item, ...prev]);
    }

    setIsRfqModalOpen(false);
    setNewRfq({
      wbsCode: '1.2.1-TUB',
      itemDescription: '',
      specStandard: 'API 5L Gr. X52 PSL2',
      quantityRequired: '',
      unit: 'm',
      priority: 'Alta',
      notes: ''
    });
  };

  // Handle PO Creation
  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjId = getSafeProjectId();
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poCode: `OC-2026-0${pos.length + 90}`,
      projectId: targetProjId,
      orgId,
      rfqId: newPo.rfqId,
      supplierName: newPo.supplierName,
      supplierRif: newPo.supplierRif || 'J-99887766-0',
      itemDescription: newPo.itemDescription,
      quantityOrdered: Number(newPo.quantityOrdered),
      unit: newPo.unit,
      unitPriceUsd: Number(newPo.unitPriceUsd),
      totalPriceUsd: Number(newPo.quantityOrdered) * Number(newPo.unitPriceUsd),
      issueDate: new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'En Tránsito',
      paymentTerms: newPo.paymentTerms
    };

    setPos(prev => [po, ...prev]);
    setIsPoModalOpen(false);
  };

  // Handle Inventory Receipt (with Mandatory Heat Number MTR)
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = getSafeProjectId();
    const invItem: InventoryItemMTR = {
      itemCode: newReceipt.itemCode,
      projectId: targetProject,
      orgId,
      poId: newReceipt.poId,
      description: newReceipt.description,
      category: newReceipt.category,
      specStandard: newReceipt.specStandard,
      heatNumber: newReceipt.heatNumber, // MANDATORY MTR
      mtrCertificateNo: newReceipt.mtrCertificateNo,
      millManufacturer: newReceipt.millManufacturer || 'Tenaris Tamsa',
      quantityReceived: Number(newReceipt.quantityReceived),
      quantityAvailable: Number(newReceipt.quantityReceived),
      unit: newReceipt.unit,
      warehouseLocation: newReceipt.warehouseLocation,
      entryDate: new Date().toISOString().split('T')[0],
      verifiedByInspector: 'Ing. Inspector QA/QC (PROINTECA)',
      mtrStatus: 'Verificado'
    };

    try {
      await addDoc(collection(db, `organizations/${orgId}/projects/${targetProject}/inventory`), invItem);
    } catch (err) {
      console.warn('Saving to local state fallback:', err);
      setInventoryItems(prev => [invItem, ...prev]);
    }

    setIsReceiptModalOpen(false);
    setNewReceipt({
      itemCode: `MAT-${Date.now().toString().slice(-4)}`,
      poId: '',
      description: '',
      category: 'Tubería',
      specStandard: 'API 5L PSL2',
      heatNumber: '',
      mtrCertificateNo: '',
      millManufacturer: '',
      quantityReceived: '',
      unit: 'm',
      warehouseLocation: 'Patio P-1'
    });
  };

  // Handle Dispatch to Field & Weld Joint
  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventoryItems.find(i => i.id === newDispatch.inventoryItemId);
    if (!item) return;

    const dispatchQty = Number(newDispatch.quantityDispatched);
    if (dispatchQty > item.quantityAvailable) {
      alert('La cantidad a despachar excede la disponibilidad en almacén.');
      return;
    }

    const disp: MaterialDispatch = {
      id: `disp-${Date.now()}`,
      dispatchCode: `DESP-2026-0${dispatches.length + 17}`,
      projectId: getSafeProjectId(),
      orgId,
      inventoryItemId: item.id || '',
      heatNumber: item.heatNumber,
      weldJointId: newDispatch.weldJointId,
      targetFront: newDispatch.targetFront,
      quantityDispatched: dispatchQty,
      unit: item.unit,
      dispatchedBy: 'Almacenista Principal PROINTECA',
      dispatchDate: new Date().toISOString().split('T')[0],
      notes: newDispatch.notes
    };

    // Deduct stock
    setInventoryItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return { ...i, quantityAvailable: i.quantityAvailable - dispatchQty };
      }
      return i;
    }));

    setDispatches(prev => [disp, ...prev]);
    setIsDispatchModalOpen(false);
  };

  // KPI Calculations
  const totalStockItems = inventoryItems.length;
  const verifiedMtrPercent = Math.round((inventoryItems.filter(i => i.mtrStatus === 'Verificado').length / (totalStockItems || 1)) * 100);
  const pendingRfqsCount = rfqs.filter(r => r.status !== 'OC Emitida').length;
  const inTransitPoCount = pos.filter(p => p.status === 'En Tránsito' || p.status === 'Emitida').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-line shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
              Procure-to-Pay • ASTM / API MTR Traceability
            </span>
            <span className="text-xs font-mono font-bold text-ink-soft">
              {currentOrganization?.name || 'PROINTECA C.A.'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-ink font-display mt-1">
            Procura, Almacén e Inventario MTR
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Gestión de solicitudes (RFQ), órdenes de compra, kardex con coladas (Heat Numbers) y trazabilidad a juntas de soldadura.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRfqModalOpen(true)}
            className="px-4 py-2.5 bg-surface-2 hover:bg-surface border border-line text-ink rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Nueva RFQ
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-4 py-2.5 brand-gradient text-white rounded-2xl text-xs font-bold shadow-brand hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowDownLeft size={16} />
            Entrada Almacén (MTR)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-3xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-medium">Ítems en Stock</p>
            <h3 className="text-2xl font-black text-ink tabular font-display mt-1">{totalStockItems} Insumos</h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} /> Stock Operativo
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-medium">Verificación MTR (Coladas)</p>
            <h3 className="text-2xl font-black text-ink tabular font-display mt-1">{verifiedMtrPercent}%</h3>
            <span className="text-[11px] text-brand-600 dark:text-brand-300 font-bold flex items-center gap-1 mt-1">
              <ShieldCheck size={12} /> Certificado ASTM/API
            </span>
          </div>
          <div className="w-12 h-12 bg-brand-500/10 text-brand-600 dark:text-brand-300 rounded-2xl flex items-center justify-center font-bold">
            <FileCheck size={24} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-medium">RFQs Pendientes</p>
            <h3 className="text-2xl font-black text-ink tabular font-display mt-1">{pendingRfqsCount} Solicitudes</h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-1">
              <Clock size={12} /> En Proceso / Cotización
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-3xl border border-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-medium">Órdenes de Compra (OC)</p>
            <h3 className="text-2xl font-black text-ink tabular font-display mt-1">{inTransitPoCount} Activas</h3>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 mt-1">
              <Truck size={12} /> En Tránsito / Proveedor
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold">
            <ShoppingCart size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search */}
      <div className="bg-surface rounded-3xl border border-line p-2 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory' 
                ? 'brand-gradient text-white shadow-brand' 
                : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`}
          >
            <Package size={16} />
            Stock & Kardex MTR ({inventoryItems.length})
          </button>

          <button
            onClick={() => setActiveTab('rfq')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rfq' 
                ? 'brand-gradient text-white shadow-brand' 
                : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`}
          >
            <FileText size={16} />
            Solicitudes RFQ ({rfqs.length})
          </button>

          <button
            onClick={() => setActiveTab('po')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'po' 
                ? 'brand-gradient text-white shadow-brand' 
                : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`}
          >
            <ShoppingCart size={16} />
            Órdenes de Compra ({pos.length})
          </button>

          <button
            onClick={() => setActiveTab('traceability')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'traceability' 
                ? 'brand-gradient text-white shadow-brand' 
                : 'text-ink-soft hover:text-ink hover:bg-surface-2'
            }`}
          >
            <Flame size={16} />
            Trazabilidad A Juntas ({dispatches.length})
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por colada, material, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-line rounded-2xl text-xs text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* TAB 1: INVENTARIO & KARDEX MTR */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-extrabold text-ink font-display flex items-center gap-2">
              Kardex de Materiales con Certificados MTR / Heat Numbers
            </h2>
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="px-3.5 py-1.5 bg-surface-2 hover:bg-surface border border-line text-ink text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight size={14} />
              Despachar a Campo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems
              .filter(item => 
                (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.heatNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.specStandard || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(item => (
                <div key={item.id || item.itemCode} className="bg-surface rounded-3xl border border-line p-5 shadow-card hover:border-brand-500/50 transition-all space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md">
                        {item.itemCode}
                      </span>
                      <h3 className="font-bold text-ink text-sm mt-1">{item.description}</h3>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      {item.mtrStatus}
                    </span>
                  </div>

                  {/* Heat Number MTR Badge */}
                  <div className="bg-surface-2 p-3 rounded-2xl border border-line space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-soft font-medium flex items-center gap-1">
                        <Flame size={14} className="text-amber-500" />
                        N° Colada / Heat Number:
                      </span>
                      <span className="font-mono font-black text-ink text-xs bg-surface px-2 py-0.5 rounded-lg border border-line">
                        {item.heatNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Certificado MTR:</span>
                      <span className="font-mono text-ink font-semibold">{item.mtrCertificateNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Molino/Fabricante:</span>
                      <span className="font-semibold text-ink">{item.millManufacturer}</span>
                    </div>
                  </div>

                  {/* Stock Levels */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-surface-2/60 rounded-xl border border-line">
                      <span className="text-ink-soft text-[10px] block">Disponibles:</span>
                      <span className="text-lg font-black text-ink tabular">{item.quantityAvailable} {item.unit}</span>
                    </div>
                    <div className="p-2.5 bg-surface-2/60 rounded-xl border border-line">
                      <span className="text-ink-soft text-[10px] block">Recibidos Totales:</span>
                      <span className="text-lg font-black text-ink-soft tabular">{item.quantityReceived} {item.unit}</span>
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="text-[11px] text-ink-soft flex items-center justify-between pt-2 border-t border-line">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {item.warehouseLocation}
                    </span>
                    <span className="font-mono text-[10px]">Norma: {item.specStandard}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: SOLICITUDES RFQ */}
      {activeTab === 'rfq' && (
        <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-card">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink font-display">Solicitudes de Material (RFQ) Vinculadas a WBS</h2>
            <button
              onClick={() => setIsRfqModalOpen(true)}
              className="px-3.5 py-1.5 brand-gradient text-white text-xs font-bold rounded-xl shadow-brand hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Nueva RFQ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/60 text-ink-soft font-mono uppercase text-[10px] border-b border-line">
                <tr>
                  <th className="p-3.5">Código RFQ</th>
                  <th className="p-3.5">WBS Task</th>
                  <th className="p-3.5">Insumo / Especificación</th>
                  <th className="p-3.5 text-right">Cant. Requerida</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Solicitante</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id || rfq.rfqCode} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-brand-600 dark:text-brand-300">{rfq.rfqCode}</td>
                    <td className="p-3.5 font-mono text-ink-soft">{rfq.wbsCode}</td>
                    <td className="p-3.5">
                      <div className="font-bold">{rfq.itemDescription}</div>
                      <div className="text-[10px] text-ink-soft font-mono">{rfq.specStandard}</div>
                    </td>
                    <td className="p-3.5 text-right font-bold tabular">{rfq.quantityRequired} {rfq.unit}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rfq.priority === 'Urgente' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                        rfq.priority === 'Alta' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-surface-2 text-ink-soft'
                      }`}>
                        {rfq.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {rfq.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-ink-soft text-[11px]">{rfq.requestedBy}</td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => {
                          setNewPo({
                            rfqId: rfq.id || rfq.rfqCode,
                            supplierName: 'Tubos de Acero C.A.',
                            supplierRif: 'J-30491823-1',
                            itemDescription: rfq.itemDescription,
                            quantityOrdered: String(rfq.quantityRequired),
                            unit: rfq.unit,
                            unitPriceUsd: '185',
                            paymentTerms: '30 días crédito'
                          });
                          setIsPoModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-surface-2 hover:bg-surface border border-line text-ink font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Generar OC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ÓRDENES DE COMPRA (OC) */}
      {activeTab === 'po' && (
        <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-card">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink font-display">Órdenes de Compra (OC) y Gestión de Proveedores</h2>
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="px-3.5 py-1.5 brand-gradient text-white text-xs font-bold rounded-xl shadow-brand hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Emitir Nueva OC
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/60 text-ink-soft font-mono uppercase text-[10px] border-b border-line">
                <tr>
                  <th className="p-3.5">N° Orden</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5">Insumo Contratado</th>
                  <th className="p-3.5 text-right">Cantidad</th>
                  <th className="p-3.5 text-right">Monto Total USD</th>
                  <th className="p-3.5">Entrega Est.</th>
                  <th className="p-3.5">Estado OC</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {pos.map((po) => (
                  <tr key={po.id || po.poCode} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-brand-600 dark:text-brand-300">{po.poCode}</td>
                    <td className="p-3.5">
                      <div className="font-bold">{po.supplierName}</div>
                      <div className="text-[10px] text-ink-soft font-mono">{po.supplierRif}</div>
                    </td>
                    <td className="p-3.5">{po.itemDescription}</td>
                    <td className="p-3.5 text-right font-bold tabular">{po.quantityOrdered} {po.unit}</td>
                    <td className="p-3.5 text-right font-mono font-black text-ink tabular">${po.totalPriceUsd.toLocaleString()} USD</td>
                    <td className="p-3.5 font-mono text-ink-soft">{po.estimatedDeliveryDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'Recibida Total' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        po.status === 'En Tránsito' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        'bg-surface-2 text-ink-soft'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setNewReceipt({
                            itemCode: `MAT-${Date.now().toString().slice(-4)}`,
                            poId: po.poCode,
                            description: po.itemDescription,
                            category: 'Tubería',
                            specStandard: 'API 5L PSL2',
                            heatNumber: '',
                            mtrCertificateNo: '',
                            millManufacturer: po.supplierName,
                            quantityReceived: String(po.quantityOrdered),
                            unit: po.unit,
                            warehouseLocation: 'Patio P-1'
                          });
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 brand-gradient text-white font-bold rounded-lg text-[11px] shadow-brand cursor-pointer"
                      >
                        Recibir en Almacén
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRAZABILIDAD A JUNTAS DE SOLDADURA */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-extrabold text-ink font-display flex items-center gap-2">
              Cadena de Trazabilidad MTR (Almacén → Colada → Junta de Soldadura)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dispatches.map((disp) => (
              <div key={disp.id || disp.dispatchCode} className="bg-surface rounded-3xl border border-line p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {disp.dispatchCode}
                    </span>
                    <h3 className="font-bold text-ink text-sm mt-1">{disp.targetFront}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Junta: {disp.weldJointId || 'N/A'}
                  </span>
                </div>

                <div className="bg-surface-2 p-3.5 rounded-2xl border border-line space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-soft font-medium">N° Colada / Heat Number:</span>
                    <span className="font-mono font-black text-ink bg-surface px-2 py-0.5 rounded border border-line">
                      {disp.heatNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-soft font-medium">Cantidad Despachada:</span>
                    <span className="font-bold text-ink tabular">{disp.quantityDispatched} {disp.unit}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-ink-soft">
                    <span>Despachado Por:</span>
                    <span>{disp.dispatchedBy}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-ink-soft">
                    <span>Fecha:</span>
                    <span className="font-mono">{disp.dispatchDate}</span>
                  </div>
                </div>

                {disp.notes && (
                  <p className="text-xs text-ink-soft italic bg-surface-2/40 p-2.5 rounded-xl border border-line">
                    "{disp.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: NUEVA RFQ */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-lg w-full shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink font-display">Nueva Solicitud de Material (RFQ)</h3>
              <button onClick={() => setIsRfqModalOpen(false)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-soft font-bold mb-1">Código WBS / Tarea de Campo</label>
                <input
                  type="text"
                  required
                  value={newRfq.wbsCode}
                  onChange={e => setNewRfq({...newRfq, wbsCode: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="ej. 1.2.1-TUB"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-bold mb-1">Descripción del Insumo / Material</label>
                <input
                  type="text"
                  required
                  value={newRfq.itemDescription}
                  onChange={e => setNewRfq({...newRfq, itemDescription: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="ej. Tubería API 5L Gr. X52 6 Sch 40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Especificación ASTM / API</label>
                  <input
                    type="text"
                    required
                    value={newRfq.specStandard}
                    onChange={e => setNewRfq({...newRfq, specStandard: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Prioridad</label>
                  <select
                    value={newRfq.priority}
                    onChange={e => setNewRfq({...newRfq, priority: e.target.value as any})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-bold outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Cantidad Requerida</label>
                  <input
                    type="number"
                    required
                    value={newRfq.quantityRequired}
                    onChange={e => setNewRfq({...newRfq, quantityRequired: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="450"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Unidad</label>
                  <select
                    value={newRfq.unit}
                    onChange={e => setNewRfq({...newRfq, unit: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="m">Metros (m)</option>
                    <option value="und">Unidades (und)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="lts">Litros (lts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink-soft font-bold mb-1">Notas Adicionales</label>
                <textarea
                  value={newRfq.notes}
                  onChange={e => setNewRfq({...newRfq, notes: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500 h-20"
                  placeholder="Detalles para compras..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface border border-line text-ink font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 brand-gradient text-white font-bold rounded-xl shadow-brand cursor-pointer"
                >
                  Guardar RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEPCIÓN EN ALMACÉN CON HEAT NUMBER MTR */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-lg w-full shadow-lift space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink font-display">Recepción en Almacén & Certificado MTR</h3>
                <p className="text-[11px] text-ink-soft">Registro obligatorio de N° de Colada / Heat Number para trazabilidad.</p>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-soft font-bold mb-1">Descripción del Material</label>
                <input
                  type="text"
                  required
                  value={newReceipt.description}
                  onChange={e => setNewReceipt({...newReceipt, description: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="ej. Tubería API 5L Gr. X52 PSL2 6 Sch 40"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                  <Flame size={16} />
                  <span>Datos Obligatorios de Certificación MTR (ASTM/API):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-ink-soft font-bold text-[11px] mb-1">N° Colada / Heat Number *</label>
                    <input
                      type="text"
                      required
                      value={newReceipt.heatNumber}
                      onChange={e => setNewReceipt({...newReceipt, heatNumber: e.target.value})}
                      className="w-full p-2 bg-surface border border-line rounded-lg text-ink font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="HEAT-88492-X52"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-soft font-bold text-[11px] mb-1">N° Certificado MTR *</label>
                    <input
                      type="text"
                      required
                      value={newReceipt.mtrCertificateNo}
                      onChange={e => setNewReceipt({...newReceipt, mtrCertificateNo: e.target.value})}
                      className="w-full p-2 bg-surface border border-line rounded-lg text-ink font-mono outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="MTR-2026-9041"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Molino / Fabricante</label>
                  <input
                    type="text"
                    required
                    value={newReceipt.millManufacturer}
                    onChange={e => setNewReceipt({...newReceipt, millManufacturer: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Tenaris / Vallourec"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Categoría</label>
                  <select
                    value={newReceipt.category}
                    onChange={e => setNewReceipt({...newReceipt, category: e.target.value as any})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Tubería">Tubería</option>
                    <option value="Accesorios / Válvulas">Accesorios / Válvulas</option>
                    <option value="Consumibles Soldadura">Consumibles Soldadura</option>
                    <option value="Estructural">Estructural</option>
                    <option value="Revestimiento">Revestimiento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Cantidad Recibida</label>
                  <input
                    type="number"
                    required
                    value={newReceipt.quantityReceived}
                    onChange={e => setNewReceipt({...newReceipt, quantityReceived: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="450"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Ubicación en Almacén</label>
                  <input
                    type="text"
                    required
                    value={newReceipt.warehouseLocation}
                    onChange={e => setNewReceipt({...newReceipt, warehouseLocation: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Patio P-1 / Estante A-02"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface border border-line text-ink font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 brand-gradient text-white font-bold rounded-xl shadow-brand cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  Ingresar & Verificar MTR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DESPACHO A CAMPO CON TRAZABILIDAD */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-lg w-full shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink font-display">Despacho a Campo & Asignación de Colada</h3>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-soft font-bold mb-1">Seleccionar Insumo del Kardex (Heat Number)</label>
                <select
                  required
                  value={newDispatch.inventoryItemId}
                  onChange={e => setNewDispatch({...newDispatch, inventoryItemId: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="">-- Seleccionar Material en Stock --</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.description} | Colada: {item.heatNumber} ({item.quantityAvailable} {item.unit} disp.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">N° Junta de Soldadura (Si aplica)</label>
                  <input
                    type="text"
                    value={newDispatch.weldJointId}
                    onChange={e => setNewDispatch({...newDispatch, weldJointId: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="ej. J-01"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Cantidad a Despachar</label>
                  <input
                    type="number"
                    required
                    value={newDispatch.quantityDispatched}
                    onChange={e => setNewDispatch({...newDispatch, quantityDispatched: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="120"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-soft font-bold mb-1">Frente de Trabajo / Destino</label>
                <input
                  type="text"
                  required
                  value={newDispatch.targetFront}
                  onChange={e => setNewDispatch({...newDispatch, targetFront: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="ej. Frente 1 - Tramo Cardón"
                />
              </div>

              <div>
                <label className="block text-ink-soft font-bold mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={newDispatch.notes}
                  onChange={e => setNewDispatch({...newDispatch, notes: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Detalles de entrega..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface border border-line text-ink font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 brand-gradient text-white font-bold rounded-xl shadow-brand cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight size={16} />
                  Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EMITIR OC DESDE RFQ */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-lg w-full shadow-lift space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink font-display">Emitir Orden de Compra (OC)</h3>
              <button onClick={() => setIsPoModalOpen(false)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-soft font-bold mb-1">Nombre del Proveedor</label>
                <input
                  type="text"
                  required
                  value={newPo.supplierName}
                  onChange={e => setNewPo({...newPo, supplierName: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="ej. Tubos de Acero de Venezuela C.A."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">RIF Proveedor</label>
                  <input
                    type="text"
                    required
                    value={newPo.supplierRif}
                    onChange={e => setNewPo({...newPo, supplierRif: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="J-30491823-1"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Términos de Pago</label>
                  <input
                    type="text"
                    required
                    value={newPo.paymentTerms}
                    onChange={e => setNewPo({...newPo, paymentTerms: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-soft font-bold mb-1">Insumo a Contratar</label>
                <input
                  type="text"
                  required
                  value={newPo.itemDescription}
                  onChange={e => setNewPo({...newPo, itemDescription: e.target.value})}
                  className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    required
                    value={newPo.quantityOrdered}
                    onChange={e => setNewPo({...newPo, quantityOrdered: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Precio Unit. (USD)</label>
                  <input
                    type="number"
                    required
                    value={newPo.unitPriceUsd}
                    onChange={e => setNewPo({...newPo, unitPriceUsd: e.target.value})}
                    className="w-full p-2.5 bg-surface-2 border border-line rounded-xl text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-ink-soft font-bold mb-1">Total Calculado</label>
                  <div className="w-full p-2.5 bg-surface border border-line rounded-xl font-mono font-black text-ink text-xs flex items-center justify-between">
                    <span>$</span>
                    <span>{(Number(newPo.quantityOrdered || 0) * Number(newPo.unitPriceUsd || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-2 hover:bg-surface border border-line text-ink font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 brand-gradient text-white font-bold rounded-xl shadow-brand cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart size={16} />
                  Emitir Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
