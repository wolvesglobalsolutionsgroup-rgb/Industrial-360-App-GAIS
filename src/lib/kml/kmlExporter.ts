import tokml from 'tokml';

export interface RoutePoint {
  lat: number;
  lng: number;
  altitude?: number;
  timestamp?: number;
}

export interface MapMarkerItem {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  category?: string;
}

export function convertGeoJSONToKML(geoJson: any, nameName = 'name', descriptionName = 'description'): string {
  try {
    const tokmlFn = typeof tokml === 'function' ? tokml : (tokml as any)?.default;
    if (typeof tokmlFn === 'function') {
      const kml = tokmlFn(geoJson, {
        name: nameName,
        description: descriptionName
      });
      return kml;
    }
    return generateCustomKMLFromGeoJSON(geoJson);
  } catch (err) {
    console.error("Error converting GeoJSON to KML via tokml:", err);
    // Fallback XML generator
    return generateCustomKMLFromGeoJSON(geoJson);
  }
}

export function exportRouteToKML(routeName: string, pathPoints: RoutePoint[], description?: string): string {
  const geoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: routeName,
          description: description || `Ruta de inspección registrada con Industrial Control 360 - ${new Date().toLocaleDateString('es-VE')}`
        },
        geometry: {
          type: 'LineString',
          coordinates: pathPoints.map(pt => [pt.lng, pt.lat, pt.altitude || 0])
        }
      }
    ]
  };

  return convertGeoJSONToKML(geoJson);
}

export function exportMarkersToKML(markers: MapMarkerItem[], collectionName = 'Puntos de Inspección PDVSA'): string {
  const geoJson = {
    type: 'FeatureCollection',
    features: markers.map(m => ({
      type: 'Feature',
      properties: {
        name: m.name,
        description: `${m.description || ''} | Categoría: ${m.category || 'General'}`
      },
      geometry: {
        type: 'Point',
        coordinates: [m.lng, m.lat, 0]
      }
    }))
  };

  return convertGeoJSONToKML(geoJson);
}

export function downloadKMLFile(kmlContent: string, filename: string) {
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.kml') ? filename : `${filename}.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateCustomKMLFromGeoJSON(geoJson: any): string {
  const features = geoJson?.features || [];
  let placemarksXml = '';

  features.forEach((feat: any) => {
    const name = feat.properties?.name || 'Objeto GIS';
    const desc = feat.properties?.description || '';
    const geomType = feat.geometry?.type;
    const coords = feat.geometry?.coordinates || [];

    if (geomType === 'Point') {
      placemarksXml += `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description>${escapeXml(desc)}</description>
      <Point>
        <coordinates>${coords[0]},${coords[1]},0</coordinates>
      </Point>
    </Placemark>`;
    } else if (geomType === 'LineString') {
      const coordStr = coords.map((c: number[]) => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
      placemarksXml += `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description>${escapeXml(desc)}</description>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <coordinates>${coordStr}</coordinates>
      </LineString>
    </Placemark>`;
    } else if (geomType === 'Polygon') {
      const outerRing = coords[0] || [];
      const coordStr = outerRing.map((c: number[]) => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
      placemarksXml += `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description>${escapeXml(desc)}</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Exportación GIS Industrial Control 360</name>
    <description>Formato Estándar KML PDVSA / Oil &amp; Gas</description>
    ${placemarksXml}
  </Document>
</kml>`;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function importKMLToGeoJSON(kmlString: string): any {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlString, 'text/xml');
    const placemarks = Array.from(xmlDoc.getElementsByTagName('Placemark'));
    
    const features: any[] = [];

    placemarks.forEach((pm, idx) => {
      const name = pm.getElementsByTagName('name')[0]?.textContent || `Elemento ${idx + 1}`;
      const description = pm.getElementsByTagName('description')[0]?.textContent || '';

      // Point
      const pointNode = pm.getElementsByTagName('Point')[0];
      if (pointNode) {
        const coordTxt = pointNode.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const parts = coordTxt.split(',').map(Number);
        if (parts.length >= 2) {
          features.push({
            type: 'Feature',
            properties: { name, description },
            geometry: { type: 'Point', coordinates: [parts[0], parts[1], parts[2] || 0] }
          });
        }
      }

      // LineString
      const lineNode = pm.getElementsByTagName('LineString')[0];
      if (lineNode) {
        const coordTxt = lineNode.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const rawCoords = coordTxt.split(/\s+/).filter(Boolean);
        const lineCoords = rawCoords.map(c => c.split(',').map(Number));
        features.push({
          type: 'Feature',
          properties: { name, description },
          geometry: { type: 'LineString', coordinates: lineCoords }
        });
      }

      // Polygon
      const polyNode = pm.getElementsByTagName('Polygon')[0];
      if (polyNode) {
        const coordTxt = polyNode.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const rawCoords = coordTxt.split(/\s+/).filter(Boolean);
        const ringCoords = rawCoords.map(c => c.split(',').map(Number));
        features.push({
          type: 'Feature',
          properties: { name, description },
          geometry: { type: 'Polygon', coordinates: [ringCoords] }
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features
    };
  } catch (err) {
    console.error("Error parsing KML string:", err);
    return { type: 'FeatureCollection', features: [] };
  }
}
