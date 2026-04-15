import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Map as MapIcon, Eye, EyeOff } from 'lucide-react';
import { AOI } from '../types';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  aoi: AOI | null;
  setAoi: (aoi: AOI | null) => void;
  mapLayerUrl?: string | null;
  mapLayerType: 'turbidity' | 'chlorophyll';
  setMapLayerType: (type: 'turbidity' | 'chlorophyll') => void;
}

function MapUpdater({ aoi }: { aoi: AOI | null }) {
  const map = useMap();
  useEffect(() => {
    if (aoi && aoi.geometry.coordinates.length > 0) {
      const coords = aoi.geometry.coordinates[0] as [number, number][];
      const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [aoi, map]);
  return null;
}

export default function Map({ aoi, setAoi, mapLayerUrl, mapLayerType, setMapLayerType }: MapProps) {
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('satellite');
  const [dismissPrompt, setDismissPrompt] = useState(false);
  const [isLayerVisible, setIsLayerVisible] = useState(true);

  const onCreated = (e: any) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon' || layerType === 'rectangle') {
      const geojson = layer.toGeoJSON();
      
      const newAoi: AOI = {
        type: 'Feature',
        geometry: geojson.geometry,
        properties: {
          area: L.GeometryUtil.geodesicArea(layer.getLatLngs()[0])
        }
      };
      setAoi(newAoi);
      
      // Remove the drawn layer from the FeatureGroup because we render our own <Polygon>
      // to prevent duplicate polygons on the map
      layer.remove();
    }
  };

  const renderLegend = () => {
    if (!mapLayerUrl || !isLayerVisible) return null;
    
    if (mapLayerType === 'chlorophyll') {
      return (
        <div className="mt-3 px-1">
          <div className="flex justify-between text-[10px] text-app-muted mb-1 font-mono">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#0000ff] via-[#00ff00] to-[#ff0000]"></div>
        </div>
      );
    }
    
    return (
      <div className="mt-3 px-1">
        <div className="flex justify-between text-[10px] text-app-muted mb-1 font-mono">
          <span>Clear</span>
          <span>Turbid</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#000080] via-[#00ffff] to-[#ff00ff]"></div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-[#1c1d21]">
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-[#151619] border border-[#2a2b2e] rounded-lg p-1 flex shadow-xl">
          <button
            onClick={() => setMapType('osm')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${mapType === 'osm' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'}`}
          >
            OSM
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'}`}
          >
            Satellite
          </button>
        </div>
      </div>

      <MapContainer
        center={[0, 20]}
        zoom={3}
        className="w-full h-full"
        zoomControl={false}
      >
        {mapType === 'osm' ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          />
        )}

        <FeatureGroup>
          <EditControl
            position="topleft"
            onCreated={onCreated}
            draw={{
              rectangle: {
                shapeOptions: {
                  color: '#3b82f6',
                  fillOpacity: 0.2,
                  weight: 2
                }
              },
              circle: false,
              polyline: false,
              circlemarker: false,
              marker: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e1e1',
                  message: '<strong>Error:</strong> Polygon edges cannot cross!'
                },
                shapeOptions: {
                  color: '#3b82f6',
                  fillOpacity: 0.2,
                  weight: 2
                }
              }
            }}
          />
        </FeatureGroup>

        {mapLayerUrl && isLayerVisible && (
          <TileLayer
            url={mapLayerUrl}
            opacity={0.8}
            zIndex={10}
          />
        )}

        {aoi && (
          <Polygon
            positions={(aoi.geometry.coordinates[0] as [number, number][]).map(c => [c[1], c[0]])}
            pathOptions={{ color: '#3b82f6', fillOpacity: (mapLayerUrl && isLayerVisible) ? 0 : 0.2, weight: 2 }}
          />
        )}

        <MapUpdater aoi={aoi} />
      </MapContainer>

      {!aoi && !dismissPrompt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="bg-[#151619]/80 backdrop-blur-md border border-[#2a2b2e] px-6 py-4 rounded-2xl shadow-2xl text-center max-w-sm pointer-events-auto relative">
            <button 
              onClick={() => setDismissPrompt(true)}
              className="absolute top-2 right-2 text-[#8E9299] hover:text-white transition-colors"
              aria-label="Close prompt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <MapIcon className="mx-auto mb-3 text-blue-500" size={32} />
            <h3 className="text-white font-medium mb-1">Define Area of Interest</h3>
            <p className="text-sm text-[#8E9299]">Use the drawing tools on the left to select a water body for analysis.</p>
          </div>
        </div>
      )}

      {mapLayerUrl && (
        <div className="absolute bottom-6 right-6 z-[1000] bg-[#151619]/90 backdrop-blur-md border border-[#2a2b2e] p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-app-muted uppercase tracking-wider">Map Layer</div>
            <button 
              onClick={() => setIsLayerVisible(!isLayerVisible)}
              className="text-app-muted hover:text-app-text transition-colors"
              title={isLayerVisible ? "Hide Layer" : "Show Layer"}
            >
              {isLayerVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          
          <div className="flex bg-[#0b0c0e] rounded-lg p-1">
            <button
              onClick={() => setMapLayerType('turbidity')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mapLayerType === 'turbidity' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Turbidity
            </button>
            <button
              onClick={() => setMapLayerType('chlorophyll')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mapLayerType === 'chlorophyll' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Chlorophyll
            </button>
          </div>
          
          {renderLegend()}
        </div>
      )}
    </div>
  );
}
