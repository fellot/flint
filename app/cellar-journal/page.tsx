'use client';

import { useState, useEffect } from 'react';
import { Wine, WineFilters } from '@/types/wine';
import { sanitizeWinePayload } from '@/utils/sanitizeWine';
import CellarJournalWineTable from '@/components/CellarJournalWineTable';
import CellarJournalFilters from '@/components/CellarJournalFilters';
import { Wine as WineIcon, BarChart3, MapPin, Palette, Calendar, Search, ChevronDown, ChevronUp, ArrowLeft, Plus, Filter } from 'lucide-react';
import AIExternalWineModal from '@/components/AIExternalWineModal';
import AIWineModal from '@/components/AIWineModal';

export default function CellarJournal() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [filteredWines, setFilteredWines] = useState<Wine[]>([]);
  const [filters, setFilters] = useState<WineFilters>({
    country: 'all',
    region: 'all',
    style: 'all',
    vintage: 'all',
    status: 'all', // Default to all statuses
    coravin: 'all',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isAddExternalWineModalOpen, setIsAddExternalWineModalOpen] = useState(false);
  const [isAIWineModalOpen, setIsAIWineModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<'1' | '2' | '3'>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)data_source=([123])/);
      return (match?.[1] as '1' | '2' | '3') || '1';
    }
    return '1';
  });
  const [isPortugueseMode, setIsPortugueseMode] = useState(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)data_source=([123])/);
      return match?.[1] === '2' || match?.[1] === '3';
    }
    return false;
  });

  useEffect(() => {
    fetchWines();
  }, [dataSource]);

  useEffect(() => {
    applyFilters();
  }, [wines, filters]);

  const fetchWines = async () => {
    try {
      console.log('Fetching wines...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/wines?dataSource=${dataSource}` , {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Wines fetched:', data.length);
      setWines(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request was aborted due to timeout');
      } else {
        console.error('Error fetching wines:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...wines];

    // Show consumed, gifted, and sold wines in Cellar Journal
    filtered = filtered.filter(wine => ['consumed', 'gifted', 'sold'].includes(wine.status));

    if (filters.country !== 'all') {
      filtered = filtered.filter(wine => wine.country === filters.country);
    }

    if (filters.region !== 'all') {
      filtered = filtered.filter(wine => wine.region === filters.region);
    }

    if (filters.style !== 'all') {
      filtered = filtered.filter(wine => wine.style === filters.style);
    }

    if (filters.vintage !== 'all') {
      filtered = filtered.filter(wine => wine.vintage.toString() === filters.vintage);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(wine => wine.status === filters.status);
    }

    if (filters.coravin === 'yes') {
      filtered = filtered.filter(wine => wine.coravin === true);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(wine =>
        wine.bottle.toLowerCase().includes(searchLower) ||
        wine.country.toLowerCase().includes(searchLower) ||
        wine.region.toLowerCase().includes(searchLower) ||
        wine.grapes.toLowerCase().includes(searchLower) ||
        wine.foodPairingNotes.toLowerCase().includes(searchLower) ||
        wine.mealToHaveWithThisWine.toLowerCase().includes(searchLower)
      );
    }

    setFilteredWines(filtered);
  };

  const getStats = () => {
    // Include consumed, gifted, and sold wines for statistics
    const journalWines = wines.filter(wine => ['consumed', 'gifted', 'sold'].includes(wine.status));
    
    // Get detailed breakdowns for countries, styles, and vintages
    const countryBreakdown = journalWines.reduce((acc, wine) => {
      if (!acc[wine.country]) {
        acc[wine.country] = { count: 0, regions: {} as Record<string, number> };
      }
      acc[wine.country].count += 1;
      
      if (!acc[wine.country].regions[wine.region]) {
        acc[wine.country].regions[wine.region] = 0;
      }
      acc[wine.country].regions[wine.region] += 1;
      
      return acc;
    }, {} as Record<string, { count: number; regions: Record<string, number> }>);
    
    const styleBreakdown = journalWines.reduce((acc, wine) => {
      acc[wine.style] = (acc[wine.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const vintageBreakdown = journalWines.reduce((acc, wine) => {
      acc[wine.vintage] = (acc[wine.vintage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { countryBreakdown, styleBreakdown, vintageBreakdown };
  };

  const getStyleBadgeClasses = (style: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
    
    switch (style.toLowerCase()) {
      case 'red':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case 'white':
        return `${baseClasses} bg-yellow-50 text-yellow-800 border border-yellow-200`;
      case 'sparkling':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'rosé':
      case 'rose':
        return `${baseClasses} bg-pink-100 text-pink-800 border border-pink-200`;
      case 'dessert':
        return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
      case 'fortified':
        return `${baseClasses} bg-amber-100 text-amber-800 border border-amber-200`;
      case 'port':
        return `${baseClasses} bg-red-200 text-red-900 border border-red-300`;
      case 'sherry':
        return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
      case 'champagne':
        return `${baseClasses} bg-indigo-100 text-indigo-800 border border-indigo-200`;
      case 'prosecco':
        return `${baseClasses} bg-cyan-100 text-cyan-800 border border-cyan-200`;
      case 'riesling':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'chardonnay':
        return `${baseClasses} bg-yellow-100 text-yellow-900 border border-yellow-300`;
      case 'sauvignon blanc':
        return `${baseClasses} bg-lime-100 text-lime-800 border border-lime-200`;
      case 'pinot noir':
        return `${baseClasses} bg-red-50 text-red-700 border border-red-100`;
      case 'cabernet sauvignon':
        return `${baseClasses} bg-red-900 text-red-100 border border-red-800`;
      case 'merlot':
        return `${baseClasses} bg-red-300 text-red-900 border border-red-400`;
      case 'syrah':
      case 'shiraz':
        return `${baseClasses} bg-red-800 text-red-100 border border-red-700`;
      case 'malbec':
        return `${baseClasses} bg-red-600 text-red-100 border border-red-500`;
      case 'zinfandel':
        return `${baseClasses} bg-red-400 text-red-900 border border-red-500`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(country)) {
        newSet.delete(country);
      } else {
        newSet.add(country);
      }
      return newSet;
    });
  };

  const handleCountryClick = (country: string) => {
    setFilters(prev => ({ 
      ...prev, 
      country: prev.country === country ? 'all' : country,
      region: 'all' // Reset region when country changes
    }));
  };

  const handleAddExternalWine = async (wineData: any) => {
    try {
      const sanitizedWineData = sanitizeWinePayload(wineData);
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sanitizedWineData,
          status: 'consumed',
          consumedDate: sanitizedWineData.consumedDate || new Date().toISOString().split('T')[0],
          fromCellar: false,
          dataSource,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add external wine');
      }

      // Refresh the wines list
      await fetchWines();
    } catch (error) {
      console.error('Error adding external wine:', error);
      throw error;
    }
  };

  const handleWineUpdate = async (updatedWine: Wine) => {
    try {
      const sanitizedWine = sanitizeWinePayload(updatedWine);
      const response = await fetch(`/api/wines/${updatedWine.id}?dataSource=${dataSource}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sanitizedWine, dataSource }),
      });

      if (response.ok) {
        const savedWine: Wine = await response.json();
        setWines(prev => prev.map(w => w.id === savedWine.id ? savedWine : w));
      }
    } catch (error) {
      console.error('Error updating wine:', error);
    }
  };

  const handleWineDelete = async (wineId: string) => {
    const confirmMessage = isPortugueseMode
      ? 'Tem certeza de que deseja excluir este vinho?'
      : 'Are you sure you want to delete this wine?';
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/wines/${wineId}?dataSource=${dataSource}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWines(prev => prev.filter(w => w.id !== wineId));
      }
    } catch (error) {
      console.error('Error deleting wine:', error);
    }
  };

  const handleRegionClick = (region: string) => {
    setFilters(prev => ({ 
      ...prev, 
      region: prev.region === region ? 'all' : region 
    }));
  };

  const handleStyleClick = (style: string) => {
    setFilters(prev => ({ 
      ...prev, 
      style: prev.style === style ? 'all' : style 
    }));
  };

  const handleVintageClick = (vintage: string) => {
    setFilters(prev => ({ 
      ...prev, 
      vintage: prev.vintage === vintage ? 'all' : vintage 
    }));
  };

  const getDynamicWineLabel = () => {
    const activeFilters = [];
    
    if (filters.country !== 'all') {
      activeFilters.push(filters.country);
    }
    if (filters.region !== 'all') {
      activeFilters.push(filters.region);
    }
    if (filters.style !== 'all') {
      activeFilters.push(filters.style);
    }
    if (filters.vintage !== 'all') {
      activeFilters.push(filters.vintage);
    }
    if (filters.coravin === 'yes') {
      activeFilters.push('Coravin');
    }
    if (filters.search) {
      activeFilters.push(`"${filters.search}"`);
    }
    
    if (activeFilters.length === 0) {
      return isPortugueseMode ? 'Vinhos Consumidos' : 'Consumed Wines';
    }

    return isPortugueseMode
      ? `Vinhos Consumidos - ${activeFilters.join(' - ')}`
      : `Consumed Wines - ${activeFilters.join(' - ')}`;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isPortugueseMode ? 'Carregando seu diário da adega...' : 'Loading your cellar journal...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{isPortugueseMode ? 'Voltar para a Adega' : 'Back to Cellar'}</span>
              </button>
              <div className="h-px bg-gray-300 w-8"></div>
              <div className="flex items-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent tracking-tight">
                  {isPortugueseMode ? 'Diário da Adega' : 'Cellar Journal'}
                </h1>
              </div>
            </div>
            
            {/* Search Box - Centered */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={isPortugueseMode ? 'Buscar vinhos consumidos, uvas, harmonizações...' : 'Search consumed wines, grapes, food pairings...'}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full input-field pl-12 py-3 text-base"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium leading-tight">{getDynamicWineLabel()}</div>
                <div className="text-lg font-bold text-red-500 leading-tight">
                  {filteredWines.length}
                  {filteredWines.length !== wines.filter(w => ['consumed', 'gifted', 'sold'].includes(w.status)).length && (
                    <span className="text-sm text-gray-400 ml-1">/ {wines.filter(w => ['consumed', 'gifted', 'sold'].includes(w.status)).length}</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsAIWineModalOpen(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  aria-label={isPortugueseMode ? 'Adicionar vinho com IA' : 'Add wine with AI'}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    {isPortugueseMode ? 'Adicionar com IA' : 'Add with AI'}
                  </span>
                </button>
                <button
                  onClick={() => setIsAddExternalWineModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>{isPortugueseMode ? 'Adicionar Vinho Externo' : 'Add External Wine'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Collapsible Sections Container */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out ${
        isStatsExpanded || isFiltersExpanded ? 'pt-6 pb-4' : 'pt-4 pb-1'
      }`}>
        {/* Statistics and Filters Header */}
        <div className={`transition-all duration-300 ease-in-out ${
          isStatsExpanded || isFiltersExpanded ? 'mb-4' : 'mb-0'
        }`}>
          <div className="flex justify-between items-center">
            {/* Statistics Button */}
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="flex items-center space-x-3 text-lg font-semibold text-white hover:text-red-100 transition-colors cursor-pointer bg-gradient-to-r from-red-800 to-red-900 px-4 py-3 rounded-lg shadow-md hover:shadow-lg"
            >
              <div className="h-6 w-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span>{isPortugueseMode ? 'Estatísticas do Diário' : 'Journal Statistics'}</span>
              {isStatsExpanded ? (
                <ChevronUp className="h-5 w-5 text-white ml-auto" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white ml-auto" />
              )}
            </button>

            {/* Filters Button */}
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="flex items-center space-x-3 text-lg font-semibold text-white hover:text-red-100 transition-colors cursor-pointer bg-gradient-to-r from-red-800 to-red-900 px-4 py-3 rounded-lg shadow-md hover:shadow-lg"
            >
              <div className="h-6 w-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Filter className="h-4 w-4 text-white" />
              </div>
              <span>{isPortugueseMode ? 'Filtros' : 'Filters'}</span>
              {isFiltersExpanded ? (
                <ChevronUp className="h-5 w-5 text-white ml-auto" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white ml-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 transition-all duration-300 ease-in-out ${
          isStatsExpanded ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <div className={`card hover:shadow-md transition-all ${
            filters.country !== 'all' || filters.region !== 'all' ? 'ring-2 ring-red-200 bg-red-50' : ''
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  {isPortugueseMode ? 'Países' : 'Countries'}
                  <span className="ml-2 text-xs text-gray-400">{isPortugueseMode ? '(clique para filtrar/limpar)' : '(click to filter/clear)'}</span>
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.countryBreakdown)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([country, data]) => (
                      <div key={country}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => toggleCountryExpansion(country)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {expandedCountries.has(country) ? (
                                <span className="text-xs">−</span>
                              ) : (
                                <span className="text-xs">+</span>
                              )}
                            </button>
                            <button
                              onClick={() => handleCountryClick(country)}
                              className={`transition-colors cursor-pointer ${
                                filters.country === country
                                  ? 'text-wine-600 font-medium'
                                  : 'text-gray-700 hover:text-wine-600 hover:font-medium'
                              }`}
                            >
                              {country}
                            </button>
                          </div>
                          <span className="font-medium text-gray-900">{data.count}</span>
                        </div>
                        {expandedCountries.has(country) && (
                          <div className="ml-4 mt-1 space-y-1">
                            {Object.entries(data.regions)
                              .sort(([,a], [,b]) => b - a)
                              .map(([region, count]) => (
                                <div key={region} className="flex justify-between text-xs text-gray-600">
                                  <button
                                    onClick={() => handleRegionClick(region)}
                                    className={`ml-2 text-left transition-colors cursor-pointer hover:text-red-600 ${
                                      filters.region === region
                                        ? 'text-red-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                                    title={`Filter by ${region} region`}
                                  >
                                    {region}
                                  </button>
                                  <span className={filters.region === region ? 'text-red-600 font-medium' : ''}>
                                    {count}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className={`card hover:shadow-md transition-all ${
            filters.style !== 'all' ? 'ring-2 ring-red-200 bg-red-50' : ''
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  {isPortugueseMode ? 'Estilos' : 'Styles'}
                  <span className="ml-2 text-xs text-gray-400">{isPortugueseMode ? '(clique para filtrar/limpar)' : '(click to filter/clear)'}</span>
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.styleBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([style, count]) => (
                      <div key={style} className="flex justify-between text-sm">
                        <button
                          onClick={() => handleStyleClick(style)}
                          className={`transition-colors cursor-pointer text-left ${
                            filters.style === style
                              ? 'text-wine-600 font-medium'
                              : 'text-gray-700 hover:text-wine-600 hover:font-medium'
                          }`}
                        >
                          {style}
                        </button>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className={`card hover:shadow-md transition-all ${
            filters.vintage !== 'all' ? 'ring-2 ring-red-200 bg-red-50' : ''
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  {isPortugueseMode ? 'Safras' : 'Vintages'}
                  <span className="ml-2 text-xs text-gray-400">{isPortugueseMode ? '(clique para filtrar/limpar)' : '(click to filter/clear)'}</span>
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.vintageBreakdown)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([vintage, count]) => (
                      <div key={vintage} className="flex justify-between text-sm">
                        <button
                          onClick={() => handleVintageClick(vintage)}
                          className={`transition-colors cursor-pointer text-left ${
                            filters.vintage === vintage
                              ? 'text-wine-600 font-medium'
                              : 'text-gray-700 hover:text-wine-600 hover:font-medium'
                          }`}
                        >
                          {vintage}
                        </button>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Collapsible Filters Content */}
        <div className={`transition-all duration-300 ease-in-out ${
          isFiltersExpanded ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          <CellarJournalFilters
            filters={filters}
            onFiltersChange={setFilters}
            wines={wines.filter(w => ['consumed', 'gifted', 'sold'].includes(w.status))}
          />
        </div>
      </div>

      {/* Wine Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CellarJournalWineTable
          wines={filteredWines}
          onWineUpdate={handleWineUpdate}
          onWineDelete={handleWineDelete}
          searchTerm={filters.search}
          isPortuguese={isPortugueseMode}
        />
      </div>

      {/* AI Wine Modal */}
      <AIWineModal
        isOpen={isAIWineModalOpen}
        onClose={() => setIsAIWineModalOpen(false)}
        onAddWine={handleAddExternalWine}
        locale={isPortugueseMode ? 'pt' : 'en'}
      />

      {/* Add External Wine Modal */}
      <AIExternalWineModal
        isOpen={isAddExternalWineModalOpen}
        onClose={() => setIsAddExternalWineModalOpen(false)}
        onAddWine={handleAddExternalWine}
        locale={isPortugueseMode ? 'pt' : 'en'}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <WineIcon className="h-5 w-5" />
              <span>{isPortugueseMode ? 'Adega Principal' : 'Main Cellar'}</span>
            </button>
            <button
              onClick={() => window.location.href = '/wine-trivia'}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <WineIcon className="h-5 w-5" />
              <span>{isPortugueseMode ? 'Quiz de Vinhos' : 'Wine Trivia'}</span>
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            {isPortugueseMode ? 'Navegue pela sua coleção de vinhos e teste seus conhecimentos' : 'Navigate between your wine collection and test your knowledge'}
          </p>
        </div>
      </footer>
    </div>
  );
}
