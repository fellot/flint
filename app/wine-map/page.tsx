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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent tracking-tight cursor-pointer" onClick={() => window.location.href = '/'}>
                Flint Cellar
              </h1>
              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {isPT ? 'Mapa de Vinhos' : 'Wine Map'}
                  </h2>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {isPT ? 'Explore sua adega' : 'Explore your cellar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
              >
                {isPT ? 'Voltar para Adega' : 'Back to Cellar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-center space-x-6 text-sm">
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
