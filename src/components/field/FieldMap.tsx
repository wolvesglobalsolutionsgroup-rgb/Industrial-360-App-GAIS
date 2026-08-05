import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Layers, Eye, Download, Navigation, Maximize2, Compass } from 'lucide-react';
import { Button } from '../ui';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (match) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return map[match] || match;
  });
}

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  category?: 'report' | 'facility' | 'inspection' | 'ncr' | 'custom';
  imageUrl?: string | null;
  date?: string;
}

export interface MapRouteData {
  id: string;
  name: string;
  color?: string;
  path: { lat: number; lng: number }[];
  distanceKm?: number;
}

export interface FieldMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarkerData[];
  routes?: MapRouteData[];
  userLocation?: { lat: number; lng: number; accuracy?: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onMarkerSelect?: (marker: MapMarkerData) => void;
  height?: string;
  enableDrawing?: boolean;
  onShapeCreated?: (geoJson: any) => void;
}

export default function FieldMap({
  center = { lat: 8.8234, lng: -63.5129 }, // Default Faja del Orinoco PDVSA area
  zoom = 12,
  markers = [],
  routes = [],
  userLocation = null,
  onMapClick,
  onMarkerSelect,
  height = '500px',
  enableDrawing = false,
  onShapeCreated
}: FieldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeTileLayer, setActiveTileLayer] = useState<'osm' | 'satellite' | 'dark'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false
      });

      // Add Zoom Control at bottomright
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });
    }

    const map = mapInstanceRef.current;

    // Center map if provided center changed
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }

    // Tile layers definitions
    const tileUrls = {
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    };

    const attributions = {
      osm: '&copy; OpenStreetMap contributors',
      satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      dark: '&copy; CartoDB'
    };

    // Remove existing tile layer and add new one
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const newTileLayer = L.tileLayer(tileUrls[activeTileLayer], {
      attribution: attributions[activeTileLayer],
      maxZoom: 19
    });
    newTileLayer.addTo(map);

    // Redraw markers & routes
    renderMapOverlay();

  }, [center.lat, center.lng, zoom, activeTileLayer, markers, routes, userLocation]);

  const renderMapOverlay = () => {
    const map = mapInstanceRef.current;
    if (!map || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Render User Location Marker if available
    if (userLocation && userLocation.lat && userLocation.lng) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `<div style="
          width: 20px; height: 20px; 
          background-color: #0284c7; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 12px rgba(2, 132, 199, 0.8);
          animation: pulse 2s infinite;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #0b2239;">
            📍 Su Ubicación en Campo
            ${userLocation.accuracy ? `<br/><span style="font-weight: normal; font-size: 10px; color: #64748b;">Precisión: ±${userLocation.accuracy}m</span>` : ''}
          </div>
        `);

      layerGroupRef.current.addLayer(userMarker);

      if (userLocation.accuracy && userLocation.accuracy > 0) {
        const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: '#0284c7',
          fillColor: '#0284c7',
          fillOpacity: 0.15,
          weight: 1
        });
        layerGroupRef.current.addLayer(accuracyCircle);
      }
    }

    // 2. Render Field Markers
    markers.forEach(m => {
      let pinColor = '#0b2239';
      if (m.category === 'report') pinColor = '#ff6b00';
      if (m.category === 'inspection') pinColor = '#059669';
      if (m.category === 'ncr') pinColor = '#dc2626';

      const customIcon = L.divIcon({
        className: 'custom-field-pin',
        html: `<div style="
          width: 28px; height: 28px; 
          background-color: ${pinColor}; 
          border: 2px solid white; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 180px; max-width: 240px; padding: 2px;">
          <h4 style="margin:0 0 4px 0; font-size: 13px; font-weight: bold; color: #0f172a;">${escapeHtml(m.title)}</h4>
          ${m.date ? `<p style="margin:0 0 6px 0; font-size: 10px; color: #64748b;">📅 ${m.date}</p>` : ''}
          ${m.description ? `<p style="margin:0 0 8px 0; font-size: 11px; color: #334155; line-height: 1.4;">${escapeHtml(m.description)}</p>` : ''}
          ${m.imageUrl ? `<img src="${m.imageUrl}" style="width:100%; height:90px; object-fit:cover; border-radius:8px; margin-bottom:6px; border:1px solid #e2e8f0;" />` : ''}
          <div style="font-size:10px; font-family:monospace; color:#94a3b8;">
            Lat: ${m.lat.toFixed(5)}, Lng: ${m.lng.toFixed(5)}
          </div>
        </div>
      `;

      const marker = L.marker([m.lat, m.lng], { icon: customIcon })
        .bindPopup(popupHtml);

      marker.on('click', () => {
        if (onMarkerSelect) onMarkerSelect(m);
      });

      layerGroupRef.current?.addLayer(marker);
    });

    // 3. Render Route Polylines
    routes.forEach(r => {
      if (r.path && r.path.length > 1) {
        const latLngs: [number, number][] = r.path.map(pt => [pt.lat, pt.lng]);
        const polyline = L.polyline(latLngs, {
          color: r.color || '#ff6b00',
          weight: 4,
          opacity: 0.85,
          smoothFactor: 1
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong style="color: #0b2239;">🛣️ ${escapeHtml(r.name)}</strong>
            ${r.distanceKm ? `<br/><span style="color: #64748b; font-size: 11px;">Distancia: ${r.distanceKm.toFixed(2)} km</span>` : ''}
          </div>
        `);

        layerGroupRef.current?.addLayer(polyline);
      }
    });
  };

  const locateUserCenter = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-line shadow-soft" style={{ height }}>
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Layer Switcher Floating Toolbar */}
      <div className="absolute top-3 right-3 z-10 bg-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-line shadow-card flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTileLayer('satellite')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
            activeTileLayer === 'satellite'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          Satélite
        </button>

        <button
          type="button"
          onClick={() => setActiveTileLayer('osm')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
            activeTileLayer === 'osm'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          Callejero
        </button>

        <button
          type="button"
          onClick={() => setActiveTileLayer('dark')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
            activeTileLayer === 'dark'
              ? 'bg-brand-500 text-white shadow-xs'
              : 'text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          Oscuro
        </button>
      </div>

      {/* Recenter GPS Floating Button */}
      {userLocation && (
        <button
          type="button"
          onClick={locateUserCenter}
          className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur-md text-ink p-2.5 rounded-xl border border-line shadow-card hover:bg-surface-2 transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="Centrar en mi ubicación GPS"
        >
          <Navigation size={15} className="text-brand-500" />
          Mi GPS
        </button>
      )}

      {/* Legend badge */}
      <div className="absolute bottom-4 right-14 z-10 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-line shadow-card hidden sm:flex items-center gap-3 text-[11px] text-ink font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00]"></span> Reporte
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span> Inspección
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0b2239]"></span> Instalación
        </span>
      </div>

    </div>
  );
}
