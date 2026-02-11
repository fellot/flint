'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { Wine } from '@/types/wine';
import { getCoordinates, normalizeCountry } from '@/utils/regionCoordinates';
import { X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
  const [selectedRegion, setSelectedRegion] = useState<RegionGroup | null>(null);

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
      <Map
        initialViewState={{
          latitude: 30,
          longitude: 10,
          zoom: 2.5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {regionGroups.map(group => (
          <Marker
            key={group.key}
            latitude={group.lat}
            longitude={group.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedRegion(group);
            }}
          >
            <div className="cursor-pointer group relative">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white/80 transition-transform group-hover:scale-125"
                style={{ background: 'linear-gradient(135deg, #722F37, #4a1c22)' }}
              >
                {group.wines.length}
              </div>
            </div>
          </Marker>
        ))}

        {selectedRegion && (
          <Popup
            latitude={selectedRegion.lat}
            longitude={selectedRegion.lng}
            anchor="bottom"
            onClose={() => setSelectedRegion(null)}
            closeOnClick={false}
            maxWidth="320px"
            offset={20}
          >
            <div className="font-sans min-w-[240px]">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedRegion.region}</h3>
                  <p className="text-xs text-gray-500">{selectedRegion.country}</p>
                </div>
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-[#722F37] text-white text-xs font-bold">
                  {selectedRegion.wines.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedRegion.wines.map(wine => {
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
        )}
      </Map>

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
