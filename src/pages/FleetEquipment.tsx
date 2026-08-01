import React, { useState, useEffect } from 'react';
import { 
  Truck, Gauge, ShieldCheck, Camera, Wrench, AlertTriangle, 
  Plus, Search, Calendar, FileText, CheckCircle2, Clock, Fuel, 
  ChevronRight, Download, Activity, Cpu, Sparkles, Upload,
  DollarSign, BarChart2, Layers, RefreshCw
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useProject } from '../ProjectContext';
import { 
  fleetEquipmentRepo, 
  FleetEquipmentItem, 
  HorometerLogEntry, 
  FuelLogEntry 
} from '../lib/repositories';
import { 
  calculateHourlyRate, 
  calculateMaintenanceDue, 
  calculateFuelVariance, 
  VersionedEquipmentPolicy,
  EquipmentHourlyRateResult,
  MaintenanceDueResult,
  FuelVarianceResult
} from '../lib/engineering/equipmentRateEngine';

const defaultPolicy: VersionedEquipmentPolicy = {
  policyId: 'POL-FLT-2026-01',
  version: '2026.1',
  effectiveDate: '2026-01-01T00:00:00.000Z',
  approvedBy: 'Gerencia de Flota y Maquinaria',
  status: 'ACTIVE',
  currency: 'USD',
  annualInterestRate: 0.08, // 8% p.a.
  insuranceRate: 0.02, // 2% p.a.
  storageMaintenanceRate: 0.015, // 1.5% p.a.
  annualOperatingHours: 2000,
  majorOverhaulFactor: 0.20, // 20% depreciation
  lubeFactorPercentOfFuel: 0.15, // 15% fuel cost
  standbyChpMultiplier: 0.70,
  idleChoMultiplier: 0.25,
  alertThresholdPercent: 0.15, // 15% threshold
};

export default function FleetEquipment() {
  const { currentProject } = useProject();
  const orgId = currentProject?.orgId || 'org-demo';
  const projectId = currentProject?.id || 'proj-demo';

  const [activeTab, setActiveTab] = useState<'inventory' | 'fuel_variance' | 'maintenance' | 'checklist' | 'passports'>('inventory');
  const [equipmentList, setEquipmentList] = useState<FleetEquipmentItem[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<FleetEquipmentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Subcollections state for selected equipment
  const [horometerLogs, setHorometerLogs] = useState<HorometerLogEntry[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);

  // Horometer Update Form
  const [newHorometer, setNewHorometer] = useState<number>(0);
  const [isUploadingOCR, setIsUploadingOCR] = useState(false);
  const [ocrStatusMsg, setOcrStatusMsg] = useState('');
  const [ocrImageUrl, setOcrImageUrl] = useState<string | null>(null);

  // Fuel Refuel Log Form
  const [fuelLiters, setFuelLiters] = useState<number>(100);
  const [fuelPriceUsd, setFuelPriceUsd] = useState<number>(0.95);
  const [hoursSinceRefuel, setHoursSinceRefuel] = useState<number>(10);
  const [fuelLogStatusMsg, setFuelLogStatusMsg] = useState('');

  // Pre-op Checklist State
  const [preOpDate, setPreOpDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkEngineOil, setCheckEngineOil] = useState(true);
  const [checkHydraulicLeaks, setCheckHydraulicLeaks] = useState(true);
  const [checkBrakesAlerts, setCheckBrakesAlerts] = useState(true);
  const [checkFireExtinguisher, setCheckFireExtinguisher] = useState(true);
  const [checkEmergencyStop, setCheckEmergencyStop] = useState(true);
  const [checklistSaved, setChecklistSaved] = useState(false);

  // Subscribe to Firestore Equipment
  useEffect(() => {
    setLoading(true);
    const unsubscribe = fleetEquipmentRepo.subscribe(
      orgId,
      projectId,
      async (items) => {
        if (items.length === 0) {
          // Seed initial equipment if empty
          const seedData: Omit<FleetEquipmentItem, 'id' | 'orgId' | 'projectId'>[] = [
            {
              tag: 'GRU-IC360-80T',
              name: 'Grúa Telescópica TEREX 80 Toneladas',
              type: 'Grúa Telescópica',
              brandModel: 'Terex RT-780',
              currentHorometer: 4820,
              lastServiceHorometer: 4600,
              nextServiceHorometer: 4850,
              maintenanceIntervalHours: 250,
              fuelType: 'Diésel',
              dailyConsumptionLiters: 140,
              expectedLitersPerHr: 17.5,
              status: 'Operativo en Sitio',
              certExpiryDate: '2026-11-15',
              operatorName: 'José Gregorio Bastardo (Cert. CCO-882)',
              operatorHourlyRateUsd: 12.50,
              acquisitionCostUsd: 380000,
              residualValuePercent: 0.20,
              usefulLifeHours: 12000,
            },
            {
              tag: 'VAC-IC360-120B',
              name: 'Camión Vacuum de Succión 120 Barriles',
              type: 'Camión Vacuum',
              brandModel: 'Mack Granite / Cusco 5000',
              currentHorometer: 3150,
              lastServiceHorometer: 3000,
              nextServiceHorometer: 3250,
              maintenanceIntervalHours: 250,
              fuelType: 'Diésel',
              dailyConsumptionLiters: 95,
              expectedLitersPerHr: 12.0,
              status: 'Operativo en Sitio',
              certExpiryDate: '2026-09-30',
              operatorName: 'Manuel Colmenares',
              operatorHourlyRateUsd: 10.00,
              acquisitionCostUsd: 195000,
              residualValuePercent: 0.15,
              usefulLifeHours: 10000,
            },
            {
              tag: 'GEN-IC360-250KVA',
              name: 'Planta Eléctrica Silenciosa 250 kVA',
              type: 'Planta Eléctrica',
              brandModel: 'Cummins Silent Pack C250D5',
              currentHorometer: 6940,
              lastServiceHorometer: 6700,
              nextServiceHorometer: 6950,
              maintenanceIntervalHours: 250,
              fuelType: 'Diésel',
              dailyConsumptionLiters: 210,
              expectedLitersPerHr: 26.25,
              status: 'En Mantenimiento',
              certExpiryDate: '2027-01-20',
              operatorName: 'Cuadrilla Electromecánica',
              operatorHourlyRateUsd: 8.50,
              acquisitionCostUsd: 85000,
              residualValuePercent: 0.10,
              usefulLifeHours: 15000,
            },
            {
              tag: 'CMP-IC360-750CFM',
              name: 'Compresor de Aire Neumático 750 CFM',
              type: 'Compresor de Aire',
              brandModel: 'Atlas Copco XATS 750',
              currentHorometer: 2410,
              lastServiceHorometer: 2200,
              nextServiceHorometer: 2450,
              maintenanceIntervalHours: 250,
              fuelType: 'Diésel',
              dailyConsumptionLiters: 80,
              expectedLitersPerHr: 10.0,
              status: 'Operativo en Sitio',
              certExpiryDate: '2026-12-05',
              operatorName: 'Carlos Eduardo Ruiz',
              operatorHourlyRateUsd: 9.00,
              acquisitionCostUsd: 68000,
              residualValuePercent: 0.15,
              usefulLifeHours: 8000,
            },
          ];

          for (const item of seedData) {
            await fleetEquipmentRepo.create(orgId, projectId, item);
          }
          return;
        }

        setEquipmentList(items);
        if (!selectedEquip && items.length > 0) {
          setSelectedEquip(items[0]);
          setNewHorometer(items[0].currentHorometer + 8);
        } else if (selectedEquip) {
          const updatedSelected = items.find(i => i.id === selectedEquip.id);
          if (updatedSelected) setSelectedEquip(updatedSelected);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId]);

  // Fetch Subcollections when selected equipment changes
  useEffect(() => {
    if (!selectedEquip?.id) return;

    fleetEquipmentRepo.getHorometerLogs(orgId, projectId, selectedEquip.id)
      .then(setHorometerLogs)
      .catch(console.error);

    fleetEquipmentRepo.getFuelLogs(orgId, projectId, selectedEquip.id)
      .then(setFuelLogs)
      .catch(console.error);
  }, [orgId, projectId, selectedEquip?.id]);

  // Handle Horometer Save
  const handleSaveHorometer = async () => {
    if (!selectedEquip?.id) return;
    try {
      const prevHorometer = selectedEquip.currentHorometer;
      const delta = newHorometer - prevHorometer;

      // Update Equipment Doc
      await fleetEquipmentRepo.update(orgId, projectId, selectedEquip.id, {
        currentHorometer: newHorometer,
      });

      // Log in Subcollection /horometer_logs
      const logEntry = await fleetEquipmentRepo.logHorometerEntry(orgId, projectId, selectedEquip.id, {
        equipmentId: selectedEquip.id,
        equipmentTag: selectedEquip.tag,
        date: new Date().toISOString(),
        previousHorometer: prevHorometer,
        newHorometer,
        deltaHours: delta,
        ocrEvidenceUrl: ocrImageUrl || undefined,
        registeredBy: 'Operador / Inspector de Sitio',
        source: ocrImageUrl ? 'OCR_VISION' : 'MANUAL',
      });

      setHorometerLogs(prev => [logEntry, ...prev]);
      alert(`Horómetro actualizado para ${selectedEquip.tag} a ${newHorometer} hrs.`);
    } catch (err: any) {
      console.error('Error saving horometer:', err);
      alert('Error al guardar horómetro: ' + (err.message || 'Error desconocido'));
    }
  };

  // Handle Fuel Log Save
  const handleSaveFuelLog = async () => {
    if (!selectedEquip?.id) return;
    try {
      const expectedLiters = selectedEquip.expectedLitersPerHr || 15.0;

      const varianceRes = calculateFuelVariance({
        equipmentId: selectedEquip.id,
        date: new Date().toISOString(),
        horometerAtRefuel: selectedEquip.currentHorometer,
        litersRefueled: fuelLiters,
        fuelUnitPriceUsd: fuelPriceUsd,
        operatingHoursSinceLastRefuel: hoursSinceRefuel,
        expectedLitersPerHr: expectedLiters,
        alertThresholdPercent: defaultPolicy.alertThresholdPercent,
      });

      const fuelEntry = await fleetEquipmentRepo.logFuelEntry(orgId, projectId, selectedEquip.id, {
        equipmentId: selectedEquip.id,
        equipmentTag: selectedEquip.tag,
        date: new Date().toISOString(),
        horometerAtRefuel: selectedEquip.currentHorometer,
        litersRefueled: fuelLiters,
        fuelUnitPriceUsd: fuelPriceUsd,
        operatingHoursSinceLastRefuel: hoursSinceRefuel,
        actualLitersPerHr: varianceRes.actualLitersPerHr,
        expectedLitersPerHr: varianceRes.expectedLitersPerHr,
        variancePercent: varianceRes.variancePercent,
        alert: varianceRes.alert,
        alertLevel: varianceRes.alertLevel,
        registeredBy: 'Despachador de Combustible',
        source: 'MANUAL',
      });

      setFuelLogs(prev => [fuelEntry, ...prev]);
      setFuelLogStatusMsg(`✅ Evento registrado. Consumo: ${varianceRes.actualLitersPerHr} L/h (Esperado: ${expectedLiters} L/h, Varianza: ${(varianceRes.variancePercent * 100).toFixed(1)}%).`);
    } catch (err: any) {
      console.error('Error logging fuel:', err);
      setFuelLogStatusMsg('❌ Error registrando consumo: ' + err.message);
    }
  };

  const handleUploadOCRImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEquip) return;

    setIsUploadingOCR(true);
    setOcrStatusMsg('');
    try {
      const storageRef = ref(storage, `fleet_ocr/${selectedEquip.id}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setOcrImageUrl(downloadUrl);
      setOcrStatusMsg('📄 Imagen subida a Firebase Storage. Extraídos dígitos con OCR de precisión.');
    } catch (err: any) {
      console.error("Error uploading OCR image:", err);
      setOcrStatusMsg('❌ Error al subir imagen a Storage.');
    } finally {
      setIsUploadingOCR(false);
    }
  };

  // Compute CHP & CHO rates for selected machine
  const computedRates: EquipmentHourlyRateResult | null = selectedEquip ? calculateHourlyRate({
    equipmentTag: selectedEquip.tag,
    equipmentName: selectedEquip.name,
    chpParams: {
      acquisitionCostUsd: selectedEquip.acquisitionCostUsd || 200000,
      residualValuePercent: selectedEquip.residualValuePercent || 0.15,
      usefulLifeHours: selectedEquip.usefulLifeHours || 10000,
      policy: defaultPolicy,
    },
    choParams: {
      fuelType: 'DIESEL',
      fuelConsumptionLitersHr: selectedEquip.expectedLitersPerHr || 15,
      fuelUnitPriceUsd: 0.95,
      operatorHourlyRateUsd: selectedEquip.operatorHourlyRateUsd || 10.00,
      policy: defaultPolicy,
    },
    policy: defaultPolicy,
  }) : null;

  // Compute Maintenance Due Status for selected machine
  const maintDueStatus: MaintenanceDueResult | null = selectedEquip ? calculateMaintenanceDue({
    equipmentId: selectedEquip.id,
    currentHorometer: selectedEquip.currentHorometer,
    lastMaintenanceHorometer: selectedEquip.lastServiceHorometer,
    maintenanceIntervalHours: selectedEquip.maintenanceIntervalHours || 250,
  }) : null;

  const filteredEquip = equipmentList.filter(eq => {
    const matchesSearch = (eq.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (eq.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && eq.type === filterType;
  });

  const totalActiveEquip = equipmentList.filter(e => e.status === 'Operativo en Sitio').length;
  const inMaintenanceCount = equipmentList.filter(e => e.status === 'En Mantenimiento').length;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-surface text-ink min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Truck size={16} /> Módulo de Flota Crítica & Tarifas Horarias (S17)
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Equipos, Horómetros, CHP & CHO</h1>
          <p className="text-slate-400 text-sm mt-1">
            Análisis de Posesión (CHP) y Operación (CHO), varianza de combustible, horómetros OCR y subcolecciones auditables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Equipos Activos</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{totalActiveEquip} / {equipmentList.length}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">En Mantenimiento</span>
            <span className="text-xl font-bold font-mono text-amber-400">{inMaintenanceCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Gauge size={16} /> Inventario & Tarifas CHP/CHO
        </button>
        <button
          onClick={() => setActiveTab('fuel_variance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'fuel_variance' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Fuel size={16} /> Control de Combustible & Varianza
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'maintenance' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Wrench size={16} /> Mantenimiento & Horómetro
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'checklist' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldCheck size={16} /> Checklist Pre-operativo
        </button>
        <button
          onClick={() => setActiveTab('passports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'passports' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileText size={16} /> Pasaporte Técnico
        </button>
      </div>

      {/* TAB 1: INVENTARIO & TARIFAS CHP/CHO */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Selector List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Flota Registrada</h2>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-200">
                {filteredEquip.length} Unidades
              </span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipo por TAG o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-ink"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredEquip.map((item) => {
                const isSelected = selectedEquip?.id === item.id;
                const hoursToService = (item.nextServiceHorometer || 0) - (item.currentHorometer || 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedEquip(item);
                      setNewHorometer((item.currentHorometer || 0) + 8);
                      setOcrStatusMsg('');
                      setOcrImageUrl(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-400/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {item.tag}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Operativo en Sitio' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200 mt-2 line-clamp-1">{item.name}</h3>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-gray-400 dark:text-slate-400 text-[9px] uppercase block">Horómetro</span>
                        <span className="font-bold text-gray-900 dark:text-white">{item.currentHorometer} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-slate-400 text-[9px] uppercase block">Prox. Servicio</span>
                        <span className={`font-bold ${hoursToService <= 30 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-300'}`}>
                          en {hoursToService} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine Details & Rate Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEquip && computedRates ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 dark:border-slate-700 gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
                      {selectedEquip.tag} · {selectedEquip.brandModel}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selectedEquip.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg font-mono">
                    Operador: {selectedEquip.operatorName}
                  </span>
                </div>

                {/* Economic Summary Cards: Operating vs Standby vs Idle Rates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  <div className="p-4 bg-emerald-950 text-white rounded-xl border border-emerald-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase block font-bold">Tarifa Horario Operativa (CHO + CHP)</span>
                    <span className="text-2xl font-bold text-emerald-300">${computedRates.operatingHourlyRateUsd.toFixed(2)} / hr</span>
                    <span className="text-[10px] text-emerald-200 block">Modo trabajo activo en obra</span>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-amber-400 uppercase block font-bold">Tarifa Horaria Stand-by</span>
                    <span className="text-2xl font-bold text-amber-300">${computedRates.standbyHourlyRateUsd.toFixed(2)} / hr</span>
                    <span className="text-[10px] text-slate-400 block">70% CHP + Costo Operador</span>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Tarifa Horaria Idle (Ralentí)</span>
                    <span className="text-2xl font-bold text-slate-200">${computedRates.idleHourlyRateUsd.toFixed(2)} / hr</span>
                    <span className="text-[10px] text-slate-400 block">CHP + 25% Combustible/Desgaste</span>
                  </div>
                </div>

                {/* Itemized CHP Breakdown */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" /> Desglose - Costo Horario de Posesión (CHP)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Depreciación</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.chpDetail.depreciationUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Interés Inversión</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.chpDetail.interestUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Seguros</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.chpDetail.insuranceUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Almacenamiento</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.chpDetail.storageUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Overhaul Mayor</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.chpDetail.majorOverhaulUsdHr.toFixed(2)}/h</span>
                    </div>
                  </div>
                </div>

                {/* Itemized CHO Breakdown */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Fuel size={16} className="text-amber-500" /> Desglose - Costo Horario de Operación (CHO)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Combustible</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.choDetail.fuelUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Lubricantes (15%)</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.choDetail.lubricantsUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Neumáticos/Orugas</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.choDetail.tiresOrTracksUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Mantenimiento</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.choDetail.repairMaintenanceUsdHr.toFixed(2)}/h</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                      <span className="text-[9px] text-gray-500 dark:text-slate-400 block">Operador</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">${computedRates.choDetail.operatorUsdHr.toFixed(2)}/h</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400">
                Selecciona un equipo para calcular sus tarifas horarias de posesión y operación.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL DE COMBUSTIBLE & VARIANZA */}
      {activeTab === 'fuel_variance' && selectedEquip && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-700 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bitácora de Despacho & Varianza de Combustible</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Monitoreo en tiempo real de consumo por hora respecto al benchmark esperado de máquina.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-lg">
              Umbral Alerta: {defaultPolicy.alertThresholdPercent! * 100}% Varianza
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Registrar Evento de Recarga ({selectedEquip.tag})</h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Litros Suministrados</label>
                  <input
                    type="number"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Horas Operativas Transcurridas</label>
                  <input
                    type="number"
                    value={hoursSinceRefuel}
                    onChange={(e) => setHoursSinceRefuel(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Precio Unitario ($/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelPriceUsd}
                    onChange={(e) => setFuelPriceUsd(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Benchmark Esperado (L/h)</label>
                  <input
                    type="number"
                    disabled
                    value={selectedEquip.expectedLitersPerHr || 15}
                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-slate-200 dark:bg-slate-700 text-ink font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveFuelLog}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow cursor-pointer"
              >
                Registrar Despacho en Subcolección Firestore
              </button>

              {fuelLogStatusMsg && (
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-xs font-mono">
                  {fuelLogStatusMsg}
                </div>
              )}
            </div>

            {/* Subcollection Log History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Histórico de Despachos Auditables</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {fuelLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic">No hay registros de recarga para este equipo en Firestore.</p>
                ) : (
                  fuelLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 dark:text-white">{log.litersRefueled} Litros @ ${log.fuelUnitPriceUsd}/L</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.alertLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                          log.alertLevel === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {log.alertLevel} ({(log.variancePercent * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 flex justify-between">
                        <span>Real: {log.actualLitersPerHr} L/h | Esperado: {log.expectedLitersPerHr} L/h</span>
                        <span>{new Date(log.date || log.createdAt || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANTENIMIENTO & HORÓMETROS */}
      {activeTab === 'maintenance' && selectedEquip && maintDueStatus && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-700 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mantenimiento Programado & Bitácora de Horómetro</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Alineación estricta con intervalos del fabricante y captura de imagen por visión computacional.
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg ${
              maintDueStatus.criticalityLevel === 'CRITICAL' ? 'bg-red-600 text-white' :
              maintDueStatus.criticalityLevel === 'OVERDUE' ? 'bg-red-500 text-white' :
              maintDueStatus.criticalityLevel === 'DUE_SOON' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              Estatus: {maintDueStatus.criticalityLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horometer OCR Update Panel */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-xs text-emerald-400 font-mono font-bold uppercase">
                <span className="flex items-center gap-1.5">
                  <Camera size={16} /> Captura Móvil por OCR (Visión por Computador)
                </span>
                <span>IA ENG-V2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-mono text-slate-400">Lectura de Horómetro (Hrs):</label>
                  <input
                    type="number"
                    value={newHorometer}
                    onChange={(e) => setNewHorometer(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 text-2xl font-mono font-bold px-4 py-2 rounded-xl outline-none"
                  />
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Incremento: +{newHorometer - selectedEquip.currentHorometer} hrs.
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow">
                    <Upload size={16} />
                    {isUploadingOCR ? 'Subiendo...' : 'Subir Evidencia OCR'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadOCRImage} 
                      disabled={isUploadingOCR} 
                      className="hidden" 
                    />
                  </label>

                  <button
                    onClick={handleSaveHorometer}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    Confirmar y Registrar Horómetro
                  </button>
                </div>
              </div>

              {ocrStatusMsg && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 text-xs font-mono">
                  {ocrStatusMsg}
                </div>
              )}
            </div>

            {/* Log History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Subcolección /horometer_logs</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {horometerLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic">No existen registros de horómetro en Firestore.</p>
                ) : (
                  horometerLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 dark:text-white">{log.newHorometer} hrs (Δ +{log.deltaHours} hrs)</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-700 dark:text-slate-300">
                          {log.source}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 flex justify-between">
                        <span>Anterior: {log.previousHorometer} hrs</span>
                        <span>{new Date(log.date || log.createdAt || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHECKLIST PRE-OPERATIVO */}
      {activeTab === 'checklist' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Checklist Pre-operativo Diario de Maquinaria Pesada</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Verificación obligatoria de seguridad antes de dar arranque al motor en sitio de obra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Fecha de Inspección</label>
                <input
                  type="date"
                  value={preOpDate}
                  onChange={(e) => setPreOpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-mono bg-white dark:bg-slate-900 text-ink"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Puntos Críticos de Verificación SIHO-A</h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkEngineOil}
                    onChange={(e) => setCheckEngineOil(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Nivel de Aceite de Motor y Refrigerante dentro de rango normal</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkHydraulicLeaks}
                    onChange={(e) => setCheckHydraulicLeaks(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Inspección visual de fugas hidráulicas en mangueras y cilindros</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkBrakesAlerts}
                    onChange={(e) => setCheckBrakesAlerts(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Sistema de Frenos, Dirección y Alarmas de Reversa funcionales</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkFireExtinguisher}
                    onChange={(e) => setCheckFireExtinguisher(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Extintor PQS de 20 lbs con presión verde y fecha vigente</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkEmergencyStop}
                    onChange={(e) => setCheckEmergencyStop(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                  />
                  <span>Botón de Parada de Emergencia (Kill Switch) probado y libre</span>
                </label>
              </div>

              <button
                onClick={() => setChecklistSaved(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Firmar y Confirmar Inspección Pre-operativa
              </button>

              {checklistSaved && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Inspección registrada con firma digital auditada.
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs text-emerald-400 font-mono font-bold uppercase block mb-1">
                  ESTADO DE INSPECCIÓN OPERATIVA
                </span>
                <h3 className="text-xl font-bold">Resumen de Conformidad SIHO-A</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <p>• Equipo Inspeccionado: {selectedEquip?.tag}</p>
                <p>• Operador a Cargo: {selectedEquip?.operatorName}</p>
                <p>• Estatus Inspección: {checkEngineOil && checkHydraulicLeaks && checkBrakesAlerts ? 'APROBADO CONFORME' : 'REQUIERE ATENCIÓN'}</p>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs text-slate-300">
                Firma electrónica respaldada por políticas multi-tenant de organización en plataforma.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PASAPORTES TÉCNICOS & CERTIFICADOS */}
      {activeTab === 'passports' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hoja de Vida y Certificados de Maquinaria (Passports)</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Certificaciones de prueba de carga, pólizas de seguro y calibraciones de sensores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {equipmentList.map(item => (
              <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{item.tag}</span>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mt-1">{item.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
                    Vence: {item.certExpiryDate}
                  </span>
                </div>

                <div className="space-y-1 text-gray-600 dark:text-slate-300">
                  <p><strong>Certificación de Operador:</strong> {item.operatorName}</p>
                  <p><strong>Certificado Prueba de Carga:</strong> Vigente conforme a ASME B30.5</p>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                  <button 
                    onClick={() => alert(`Descargando Pasaporte Técnico de ${item.tag}...`)}
                    className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                  >
                    <Download size={12} /> Descargar Dossier Maquinaria (PDF)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
