'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Wine } from '@/types/wine';
import { getCoordinates, normalizeCountry } from '@/utils/regionCoordinates';
import { X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Wine-colored marker
const wineMarkerIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #722F37, #4a1c22);
    border: 2px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
  ">
    <span style="transform: rotate(45deg); color: white; font-size: 12px; font-weight: bold;"></span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface WineMapViewProps {
  wines: Wine[];
  isPT: boolean;
}

interface RegionGroup {
  key: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  wines: Wine[];
}

export default function WineMapView({ wines, isPT }: WineMapViewProps) {
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);

  const regionGroups = useMemo(() => {
    const groups: Record<string, RegionGroup> = {};

    wines.forEach(wine => {
      const country = normalizeCountry(wine.country);
      const region = wine.region || 'Unknown';
      const key = `${country}|${region}`;
      const coords = getCoordinates(wine.country, region);

      if (!coords) return;

      if (!groups[key]) {
        groups[key] = {
          key,
          country,
          region,
          lat: coords.lat,
          lng: coords.lng,
          wines: [],
        };
      }
      groups[key].wines.push(wine);
    });

    return Object.values(groups);
  }, [wines]);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <MapContainer
        center={[30, 10]}
        zoom={3}
        className="h-full w-full"
        scrollWheelZoom={true}
        style={{ background: '#1a1a2e' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {regionGroups.map(group => (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={wineMarkerIcon}
          >
            <Popup maxWidth={320} minWidth={260}>
              <div className="font-sans">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{group.region}</h3>
                    <p className="text-xs text-gray-500">{group.country}</p>
                  </div>
                  <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-[#722F37] text-white text-xs font-bold">
                    {group.wines.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {group.wines.map(wine => {
                    const peak = Number(wine.peakYear) || 0;
                    const diff = peak - currentYear;
                    let maturityLabel = '';
                    let maturityColor = 'text-gray-400';
                    if (peak > 0) {
                      if (diff < 0) { maturityLabel = isPT ? 'Passou do pico' : 'Past peak'; maturityColor = 'text-red-500'; }
                      else if (diff === 0) { maturityLabel = isPT ? 'No pico' : 'At peak'; maturityColor = 'text-green-600'; }
                      else if (diff <= 2) { maturityLabel = isPT ? 'Perto do pico' : 'Near peak'; maturityColor = 'text-amber-500'; }
                      else { maturityLabel = `${diff}y`; maturityColor = 'text-gray-400'; }
                    }
                    return (
                      <div key={wine.id} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        {wine.bottle_image ? (
                          <button
                            onClick={() => setExpandedImage({ src: wine.bottle_image!, alt: wine.bottle })}
                            className="flex-shrink-0 w-8 h-10 rounded overflow-hidden bg-gray-100 hover:ring-2 hover:ring-[#722F37]/40 transition-all cursor-pointer"
                          >
                            <img src={wine.bottle_image} alt="" className="w-full h-full object-contain" />
                          </button>
                        ) : (
                          <div className="flex-shrink-0 w-8 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-300 text-xs">🍷</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{wine.bottle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-500">{wine.vintage}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-500">{wine.style}</span>
                            {maturityLabel && (
                              <>
                                <span className="text-[10px] text-gray-300">·</span>
                                <span className={`text-[10px] font-medium ${maturityColor}`}>{maturityLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Bottle Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 truncate pr-2">{expandedImage.alt}</h4>
              <button
                onClick={() => setExpandedImage(null)}
                className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50">
              <img
                src={expandedImage.src}
                alt={expandedImage.alt}
                className="max-h-[50vh] w-auto object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
