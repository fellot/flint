'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Wine } from '@/types/wine';
import { normalizeCountry } from '@/utils/regionCoordinates';
import { Wine as WineIcon, MapPin, Calendar, Globe } from 'lucide-react';

const WineMapView = dynamic(() => import('@/components/WineMapView'), { ssr: false });

export default function WineMapPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('1');
  const [isPortugueseMode, setIsPortugueseMode] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)data_source=([123])/);
      const source = match?.[1] || '1';
      setDataSource(source);
      setIsPortugueseMode(source === '2' || source === '3');
    }
  }, []);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#722F37] to-[#4a1c22] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">
                  {isPT ? 'Mapa de Vinhos' : 'Wine Map'}
                </h1>
                <p className="text-xs text-white/60">
                  {isPT ? 'Explore sua adega pelo mundo' : 'Explore your cellar around the world'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-800/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-1.5">
              <WineIcon className="h-3.5 w-3.5 text-[#d4686e]" />
              <span className="text-white font-semibold">{stats.total}</span>
              <span className="text-gray-400">{isPT ? 'vinhos' : 'wines'}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center space-x-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-white font-semibold">{stats.countries}</span>
              <span className="text-gray-400">{isPT ? 'países' : 'countries'}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-white font-semibold">{stats.regions}</span>
              <span className="text-gray-400">{isPT ? 'regiões' : 'regions'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative w-full">
        <WineMapView wines={cellarWines} isPT={isPT} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <WineIcon className="h-5 w-5" />
              <span>{isPT ? 'Adega Principal' : 'Main Cellar'}</span>
            </button>
            <button
              onClick={() => window.location.href = '/cellar-journal'}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Calendar className="h-5 w-5" />
              <span>{isPT ? 'Diário da Adega' : 'Cellar Journal'}</span>
            </button>
            <button
              onClick={() => window.location.href = `/wine-trivia?language=${isPT ? 'pt' : 'en'}`}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <WineIcon className="h-5 w-5" />
              <span>{isPT ? 'Quiz de Vinhos' : 'Wine Trivia'}</span>
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            {isPT ? 'Navegue pela sua adega no mapa mundial' : 'Browse your cellar on the world map'}
          </p>
        </div>
      </footer>
    </div>
  );
}
