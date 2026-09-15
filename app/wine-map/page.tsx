'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCellar } from '@/components/CellarSession';
import { Wine } from '@/types/wine';
import { normalizeCountry } from '@/utils/regionCoordinates';
import { Wine as WineIcon, MapPin, Calendar, Globe } from 'lucide-react';

const WineMapView = dynamic(() => import('@/components/WineMapView'), { ssr: false });

export default function WineMapPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const { dataSource, isPortugueseMode } = useCellar();

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const res = await fetch(`/api/wines?dataSource=${dataSource}`);
        if (res.ok) {
          const data = await res.json();
          setWines(data);
        }
      } catch (err) {
        console.error('Failed to fetch wines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWines();
  }, [dataSource]);

  const cellarWines = useMemo(() => wines.filter(w => w.status === 'in_cellar'), [wines]);

  const stats = useMemo(() => {
    const countries = new Set(cellarWines.map(w => normalizeCountry(w.country)));
    const regions = new Set(cellarWines.map(w => `${normalizeCountry(w.country)}|${w.region}`));
    return {
      total: cellarWines.length,
      countries: countries.size,
      regions: regions.size,
    };
  }, [cellarWines]);

  const isPT = isPortugueseMode;

  if (loading) {
    return (
      <div className="session-loading">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#722F37] to-[#4a1c22] flex items-center justify-center animate-pulse">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-400 text-sm">{isPT ? 'Carregando mapa...' : 'Loading map...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flint-subpage flex flex-col">
      <header className="subpage-heading">
        <p className="eyebrow">{isPT ? 'O MUNDO, EM UMA TAÇA' : 'THE WORLD, ONE GLASS AT A TIME'}</p>
        <h1>{isPT ? 'Uma coleção sem fronteiras.' : 'A collection without borders.'}</h1>
        <p>{isPT ? 'Explore os lugares, as regiões e as histórias por trás de cada garrafa.' : 'Explore the places, regions, and stories behind every bottle in your cellar.'}</p>
      </header>

      {/* Stats Bar */}
      <div className="border-y border-gray-200 relative z-10 mb-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs flex-wrap">
            <div className="flex items-center space-x-1.5">
              <WineIcon className="h-3.5 w-3.5 text-red-500" />
              <span className="text-gray-900 font-semibold">{stats.total}</span>
              <span className="text-gray-500">{isPT ? 'vinhos' : 'wines'}</span>
            </div>
            <div className="h-3 w-px bg-gray-300" />
            <div className="flex items-center space-x-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-gray-900 font-semibold">{stats.countries}</span>
              <span className="text-gray-500">{isPT ? 'países' : 'countries'}</span>
            </div>
            <div className="h-3 w-px bg-gray-300" />
            <div className="flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-gray-900 font-semibold">{stats.regions}</span>
              <span className="text-gray-500">{isPT ? 'regiões' : 'regions'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-frame flex-1 relative w-full">
        <WineMapView wines={cellarWines} isPT={isPT} />
      </div>


    </div>
  );
}
