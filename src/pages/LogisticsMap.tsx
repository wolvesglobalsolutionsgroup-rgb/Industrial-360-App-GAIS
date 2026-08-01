import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, Search, Navigation, Loader2, Map as MapIcon, Play, Square, Route, 
  Wifi, WifiOff, RefreshCw, Download, Upload, Plus, Check, Compass, Layers, 
  Shield, Sparkles, AlertCircle, FileSpreadsheet, Network
} from 'lucide-react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { collection, query, onSnapshot, where, addDoc, serverTimestamp, orderBy, collectionGroup } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useProject } from '../ProjectContext';
import { fieldReportsRepo, routesRepo } from '../lib/repositories';

import { Card, CardHeader, CardContent, Button, StatusBadge, Input } from '../components/ui';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { FieldMap, GPSPicker, RouteDrawer } from '../components/field';
import { MapMarkerData, MapRouteData } from '../components/field/FieldMap';
import { RoutePoint } from '../components/field/RouteDrawer';
import PortfolioNetwork from '../components/map/PortfolioNetwork';
import { subscribeSyncStatus, syncPendingRecords, SyncStats, isBrowserOnline } from '../lib/offline/syncEngine';
import { exportRouteToKML, exportMarkersToKML, downloadKMLFile, importKMLToGeoJSON } from '../lib/kml/kmlExporter';
import * as turf from '@turf/turf';

export default function LogisticsMap() {
  const { currentProject, currentOrganization } = useProject();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'map' | 'drawer' | 'network' | 'assistant'>('map');

  // GPS Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // Firestore & Field Data
  const [fieldReports, setFieldReports] = useState<any[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<MapRouteData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Live Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [liveDistance, setLiveDistance] = useState(0); // km
  const [livePath, setLivePath] = useState<RoutePoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);

  // Offline Sync State
  const [syncStats, setSyncStats] = useState<SyncStats>({
    isOnline: true,
    pendingReportsCount: 0,
    pendingValuationsCount: 0,
    pendingRoutesCount: 0,
    outboxPendingCount: 0,
    blockedCount: 0,
    failedCount: 0,
    deniedCount: 0,
    totalPending: 0,
    isSyncing: false
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // AI Assistant state
  const [queryText, setQueryText] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [mapLinks, setMapLinks] = useState<string[]>([]);

  // KML File Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFeaturesCount, setImportedFeaturesCount] = useState<number | null>(null);

  // 1. Subscribe to offline sync engine status
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((stats) => {
      setSyncStats(stats);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Field Reports & Saved Routes from Firestore
  useEffect(() => {
    setIsLoadingData(true);
    const projId = currentProject?.id || 'all';
    const orgId = currentOrganization?.id || '';

    // Query field reports via Repo
    const unsubReports = fieldReportsRepo.subscribe(orgId, projId, (reportsData) => {
      setFieldReports(reportsData);
      setIsLoadingData(false);
    }, (err) => {
      console.warn("Error fetching field reports for map:", err);
      setIsLoadingData(false);
    });

    // Query saved routes via Repo
    const unsubRoutes = routesRepo.subscribe(orgId, projId, (routesDocs) => {
      const routesData = routesDocs.map(d => ({
        id: d.id,
        name: d.name || 'Ruta Registrada',
        color: '#ff6b00',
        path: d.path || [],
        distanceKm: d.distanceKm || 0
      } as MapRouteData));
      setSavedRoutes(routesData);
    }, (err) => {
      console.warn("Error fetching routes for map:", err);
    });

    return () => {
      unsubReports();
      unsubRoutes();
    };
  }, [currentProject]);

  // 3. Initial GPS Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy)
          });
        },
        (err) => {
          console.warn("Defaulting location to Faja del Orinoco:", err);
          setUserLocation({ lat: 8.8234, lng: -63.5129, accuracy: 15 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 4. Live GPS Tracking Toggle
  const toggleTracking = () => {
    if (isTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);

      if (livePath.length >= 2) {
        // Automatically save live route
        const autoName = `Recorrido GPS - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;
        const targetOrgId = currentOrganization?.id || '';
        const targetProjId = currentProject?.id || '';
        routesRepo.create(targetOrgId, targetProjId, {
          name: autoName,
          distanceKm: Number(liveDistance.toFixed(3)),
          path: livePath,
          startTime: livePath[0]?.timestamp || Date.now(),
          endTime: Date.now(),
        }).catch(err => console.error("Error saving live route:", err));
      }
    } else {
      // Start tracking
      setLiveDistance(0);
      setLivePath([]);
      lastLocRef.current = userLocation;
      setIsTracking(true);

      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = {
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              timestamp: Date.now()
            };
            setUserLocation({ lat: newLoc.lat, lng: newLoc.lng, accuracy: Math.round(pos.coords.accuracy) });
            setLivePath(prev => [...prev, newLoc]);

            if (lastLocRef.current) {
              try {
                const from = turf.point([lastLocRef.current.lng, lastLocRef.current.lat]);
                const to = turf.point([newLoc.lng, newLoc.lat]);
                const distKm = turf.distance(from, to, { units: 'kilometers' });
                if (distKm > 0.005) { // Filter out minor GPS jitter < 5 meters
                  setLiveDistance(prev => prev + distKm);
                  lastLocRef.current = newLoc;
                }
              } catch (e) {
                lastLocRef.current = newLoc;
              }
            } else {
              lastLocRef.current = newLoc;
            }
          },
          (err) => console.error("Tracking watchPosition error:", err),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    }
  };

  // 5. Manual Sync Trigger
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncPendingRecords();
      setSyncMessage(`Sincronización completada: ${res.synced} registros subidos.`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(`Error de sincronización: ${err?.message || 'Error de red'}`);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // 6. Handle AI Assistant Search
  const handleSearchAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setIsProcessingAI(true);
    setResponse('');
    setMapLinks([]);

    try {
      const prompt = `Eres un Asistente Experto en Logística de Campo, Rutas de Transporte e Infraestructura Petrolera (PDVSA / Oil & Gas).
El usuario consulta desde la obra en coordenadas: ${userLocation ? `Lat: ${userLocation.lat}, Lng: ${userLocation.lng}` : 'Faja del Orinoco'}.
Consulta: ${queryText}

Ofrece una respuesta técnica, indicando rutas de acceso recomendadas, estaciones de servicio, proveedores o puntos logísticos clave.`;

      const res = await callGeminiProxy({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userLocation ? {
                latitude: userLocation.lat,
                longitude: userLocation.lng
              } : undefined
            }
          }
        }
      });

      setResponse(res.text || 'No se obtuvieron resultados para la consulta.');

      const chunks = res.raw?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks.map((chunk: any) => chunk.web?.uri || chunk.maps?.uri).filter(Boolean);
        setMapLinks(links);
      }
    } catch (err: any) {
      console.error("Error en Asistente IA Logística:", err);
      setResponse(`Error al procesar consulta: ${err.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // 7. Handle KML File Upload / Import
  const handleKmlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const geoJson = importKMLToGeoJSON(content);
      if (geoJson && geoJson.features) {
        setImportedFeaturesCount(geoJson.features.length);
        // Add lines as route overlays
        const newRoutes: MapRouteData[] = [];
        geoJson.features.forEach((feat: any, idx: number) => {
          if (feat.geometry?.type === 'LineString') {
            const coords = feat.geometry.coordinates || [];
            const pts = coords.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
            newRoutes.push({
              id: `imported_${idx}_${Date.now()}`,
              name: feat.properties?.name || `KML Ruta ${idx + 1}`,
              color: '#0284c7',
              path: pts
            });
          }
        });

        if (newRoutes.length > 0) {
          setSavedRoutes(prev => [...prev, ...newRoutes]);
        }
      }
    };
    reader.readAsText(file);
  };

  // 8. Convert Field Reports to Map Markers
  const mapMarkers: MapMarkerData[] = fieldReports
    .filter(r => r.location && r.location.lat && r.location.lng)
    .map(r => ({
      id: r.id,
      lat: r.location.lat,
      lng: r.location.lng,
      title: r.correlatedTaskName || `Reporte de Inspección (${r.date})`,
      description: r.notes || r.aiAnalysis || 'Reporte de campo',
      category: 'report',
      imageUrl: r.imagePreview || null,
      date: r.date
    }));

  // Combine live tracking route with saved routes
  const combinedRoutes = [...savedRoutes];
  if (isTracking && livePath.length > 0) {
    combinedRoutes.push({
      id: 'live_tracking_route',
      name: '🔴 Recorrido GPS en Vivo',
      color: '#dc2626',
      path: livePath,
      distanceKm: liveDistance
    });
  }

  const handleExportAllKML = () => {
    const kmlXml = exportMarkersToKML(mapMarkers.map(m => ({
      id: m.id,
      name: m.title,
      description: m.description,
      lat: m.lat,
      lng: m.lng,
      category: m.category
    })));
    downloadKMLFile(kmlXml, `Puntos_Inspeccion_${currentProject?.id || 'Campo'}.kml`);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <PageHeader
        title="Modo Campo, Mapas y GIS"
        subtitle="Mapeo satelital Leaflet, captura GPS offline, trazado de servidumbre y exportación KML (PDVSA)"
        badge={
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Compass size={12} /> GIS Field Engine
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('map')}
              leftIcon={<MapIcon size={14} />}
            >
              Mapa e Inspección
            </Button>
            <Button
              variant={activeTab === 'drawer' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('drawer')}
              leftIcon={<Route size={14} />}
            >
              Dibujador de Trazado
            </Button>
            <Button
              variant={activeTab === 'network' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('network')}
              leftIcon={<Network size={14} />}
            >
              Red Interconectada (PAMS)
            </Button>
            <Button
              variant={activeTab === 'assistant' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('assistant')}
              leftIcon={<Sparkles size={14} />}
            >
              Asistente Geográfico IA
            </Button>
          </div>
        }
      />

      {/* Offline Sync Status Bar */}
      <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
        syncStats.isOnline 
          ? 'bg-surface border-line' 
          : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            syncStats.isOnline ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
          }`}>
            {syncStats.isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">
                {syncStats.isOnline ? 'Conexión a Red Activa (Online)' : 'Modo Campo Offline Activo'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                syncStats.totalPending > 0 ? 'bg-amber-500/20 text-amber-700' : 'bg-emerald-500/20 text-emerald-700'
              }`}>
                {syncStats.totalPending > 0 ? `${syncStats.totalPending} Pendientes por Sincronizar` : 'Todo Sincronizado'}
              </span>
            </div>
            <p className="text-[11px] text-ink-soft">
              {syncStats.isOnline 
                ? 'Los datos de reportes, rutas y valuaciones se guardan directo en Firestore.'
                : 'Trabajando sin red. Los datos se almacenan en la base IndexedDB del dispositivo y se subirán automáticamente al recuperar señal.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncStats.totalPending > 0 && syncStats.isOnline && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isManualSyncing || syncStats.isSyncing}
              onClick={handleManualSync}
              leftIcon={<RefreshCw size={14} />}
              className="text-xs font-bold"
            >
              Sincronizar Ahora ({syncStats.totalPending})
            </Button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check size={14} />
          {syncMessage}
        </div>
      )}

      {/* Main Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Puntos GPS en Mapa"
          value={mapMarkers.length}
          sublabel="Reportes de inspección geolocalizados"
        />
        <StatCard
          title="Trazados / Rutas"
          value={combinedRoutes.length}
          sublabel="Líneas de tuberías y transporte"
        />
        <StatCard
          title="Distancia Recorrida Hoy"
          value={`${liveDistance.toFixed(2)} km`}
          sublabel={isTracking ? '🔴 Tracking GPS Activo' : 'Tracking Detenido'}
        />
        <StatCard
          title="Estado Base de Datos"
          value={syncStats.isOnline ? 'Online DB' : 'IndexedDB'}
          sublabel={`${syncStats.totalPending} registros en cola`}
        />
      </div>

      {/* Tab 1: Map & Live Tracking */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tracking & GIS Toolbar Panel */}
          <div className="lg:col-span-1 space-y-5">
            
            {/* Tracking Control Card */}
            <Card>
              <CardHeader className="border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Route size={18} className="text-brand-500" />
                  <h3 className="font-bold text-sm text-ink">Tracking GPS en Vivo</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-ink-faint mb-1">Distancia del Recorrido</span>
                  <div className="text-3xl font-display font-bold text-ink tabular">
                    {liveDistance.toFixed(3)} <span className="text-sm font-normal text-ink-soft">km</span>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-1">Cálculo de distancia geodésica con algoritmo Turf.js</p>
                </div>

                <Button
                  type="button"
                  variant={isTracking ? 'danger' : 'primary'}
                  size="md"
                  className="w-full font-bold"
                  onClick={toggleTracking}
                  leftIcon={isTracking ? <Square size={16} /> : <Play size={16} />}
                >
                  {isTracking ? 'Detener Tracking GPS' : 'Iniciar Recorrido en Vivo'}
                </Button>

                {isTracking && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium text-center bg-amber-500/10 p-2 rounded-xl animate-pulse">
                    Registrando coordenadas GPS en segundo plano...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* GPS Picker Card */}
            <GPSPicker 
              onLocationChange={(loc) => setUserLocation(loc)} 
              initialLocation={userLocation}
            />

            {/* KML Import / Export Tools */}
            <Card>
              <CardHeader className="border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-brand-500" />
                  <h3 className="font-bold text-sm text-ink">Gestión de Capas KML (PDVSA)</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <input
                  type="file"
                  accept=".kml,.xml"
                  ref={fileInputRef}
                  onChange={handleKmlImport}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full font-bold text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload size={14} />}
                >
                  Importar Archivo KML a Mapa
                </Button>

                {importedFeaturesCount !== null && (
                  <p className="text-[11px] text-emerald-600 font-bold bg-emerald-500/10 p-2 rounded-xl">
                    ✓ Se importaron {importedFeaturesCount} elementos del archivo KML.
                  </p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={mapMarkers.length === 0}
                  className="w-full font-bold text-xs"
                  onClick={handleExportAllKML}
                  leftIcon={<Download size={14} />}
                >
                  Exportar Puntos a KML ({mapMarkers.length})
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Leaflet Map Interactive View */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden p-0 border border-line">
              <FieldMap
                height="560px"
                center={userLocation || { lat: 8.8234, lng: -63.5129 }}
                zoom={13}
                markers={mapMarkers}
                routes={combinedRoutes}
                userLocation={userLocation}
              />
            </Card>
          </div>

        </div>
      )}

      {/* Tab 2: Route Drawer */}
      {activeTab === 'drawer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RouteDrawer
              onRouteSaved={(r) => {
                setSavedRoutes(prev => [...prev, {
                  id: `drawer_${Date.now()}`,
                  name: r.name,
                  color: '#ff6b00',
                  path: r.points,
                  distanceKm: r.distanceKm
                }]);
              }}
            />
          </div>

          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <CardHeader className="p-4 border-b border-line">
                <h3 className="font-bold text-sm text-ink">Vista Previa del Mapa</h3>
              </CardHeader>
              <div className="p-2">
                <FieldMap
                  height="420px"
                  center={userLocation || { lat: 8.8234, lng: -63.5129 }}
                  zoom={12}
                  routes={savedRoutes}
                  userLocation={userLocation}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: PAMS Interconnected Network */}
      {activeTab === 'network' && (
        <PortfolioNetwork />
      )}

      {/* Tab 4: AI Geographic & Logistics Assistant */}
      {activeTab === 'assistant' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader className="border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500" />
                <h3 className="font-bold text-sm text-ink">Asistente Geográfico IA & Búsqueda de Rutas</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form onSubmit={handleSearchAI} className="flex gap-2">
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ej: Ferreterías industriales, suministros de tubería o talleres cerca de mi ubicación..."
                  className="input-base text-xs py-2.5"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProcessingAI || !queryText.trim()}
                  isLoading={isProcessingAI}
                  leftIcon={<Search size={14} />}
                  className="shrink-0 font-bold text-xs"
                >
                  Consultar
                </Button>
              </form>

              {response && (
                <div className="bg-surface-2 p-4 rounded-xl border border-line space-y-3">
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase">
                    <Compass size={14} className="text-brand-500" />
                    Respuesta Técnica del Asistente
                  </h4>
                  <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                    {response}
                  </p>

                  {mapLinks.length > 0 && (
                    <div className="pt-2 border-t border-line">
                      <span className="block text-[11px] font-bold text-ink mb-2">Enlaces Google Maps recomendados:</span>
                      <div className="flex flex-wrap gap-2">
                        {mapLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-surface border border-line px-2.5 py-1 rounded-full text-brand-500 hover:bg-brand-500/10 transition-colors"
                          >
                            <MapPin size={12} />
                            Ubicación Maps #{idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
