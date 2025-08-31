'use client';

import { useState, useEffect } from 'react';
import { Wine, WineFilters } from '@/types/wine';
import WineTable from '@/components/WineTable';
import WineFiltersComponent from '@/components/WineFilters';
import AddWineModal from '@/components/AddWineModal';
import { Plus, Wine as WineIcon, BarChart3, MapPin, Palette, Calendar } from 'lucide-react';

export default function Home() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [filteredWines, setFilteredWines] = useState<Wine[]>([]);
  const [filters, setFilters] = useState<WineFilters>({
    country: 'all',
    style: 'all',
    vintage: 'all',
    status: 'all',
    search: '',
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [wines, filters]);

  const fetchWines = async () => {
    try {
      console.log('Fetching wines...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/wines', {
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

    if (filters.country !== 'all') {
      filtered = filtered.filter(wine => wine.country === filters.country);
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

  const handleWineUpdate = async (updatedWine: Wine) => {
    try {
      const response = await fetch(`/api/wines/${updatedWine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWine),
      });

      if (response.ok) {
        setWines(prev => prev.map(w => w.id === updatedWine.id ? updatedWine : w));
      }
    } catch (error) {
      console.error('Error updating wine:', error);
    }
  };

  const handleWineDelete = async (wineId: string) => {
    if (!confirm('Are you sure you want to delete this wine?')) return;

    try {
      const response = await fetch(`/api/wines/${wineId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWines(prev => prev.filter(w => w.id !== wineId));
      }
    } catch (error) {
      console.error('Error deleting wine:', error);
    }
  };

  const handleAddWine = async (wineData: any) => {
    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wineData),
      });

      if (response.ok) {
        const newWine = await response.json();
        setWines(prev => [...prev, newWine]);
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding wine:', error);
    }
  };

  const getStats = () => {
    // Get detailed breakdowns for countries, styles, and vintages
    const countryBreakdown = wines.reduce((acc, wine) => {
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
    
    const styleBreakdown = wines.reduce((acc, wine) => {
      acc[wine.style] = (acc[wine.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const vintageBreakdown = wines.reduce((acc, wine) => {
      acc[wine.vintage] = (acc[wine.vintage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { countryBreakdown, styleBreakdown, vintageBreakdown };
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

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your wine cellar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl flex items-center justify-center shadow-lg">
                <WineIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-wine-600 to-wine-800 bg-clip-text text-transparent">
                  Flint
                </h1>
                <p className="text-sm text-gray-500 font-medium tracking-wide">
                  CELLAR MANAGEMENT
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium">Total Wines</div>
                <div className="text-lg font-bold text-wine-600">{wines.length}</div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Wine</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Countries</p>
                <div className="space-y-1">
                  {Object.entries(stats.countryBreakdown)
                    .sort(([,a], [,b]) => b.count - a.count)
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
                            <span className="text-gray-700">{country}</span>
                          </div>
                          <span className="font-medium text-gray-900">{data.count}</span>
                        </div>
                        {expandedCountries.has(country) && (
                          <div className="ml-4 mt-1 space-y-1">
                            {Object.entries(data.regions)
                              .sort(([,a], [,b]) => b - a)
                              .map(([region, count]) => (
                                <div key={region} className="flex justify-between text-xs text-gray-600">
                                  <span className="ml-2">{region}</span>
                                  <span>{count}</span>
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
          
          <div className="card">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Styles</p>
                <div className="space-y-1">
                  {Object.entries(stats.styleBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([style, count]) => (
                      <div key={style} className="flex justify-between text-sm">
                        <span className="text-gray-700">{style}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Vintages</p>
                <div className="space-y-1">
                  {Object.entries(stats.vintageBreakdown)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([vintage, count]) => (
                      <div key={vintage} className="flex justify-between text-sm">
                        <span className="text-gray-700">{vintage}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <WineFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          wines={wines}
        />

        {/* Wine Table */}
        <WineTable
          wines={filteredWines}
          onWineUpdate={handleWineUpdate}
          onWineDelete={handleWineDelete}
        />
      </div>

      {/* Add Wine Modal */}
      <AddWineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWine={handleAddWine}
      />
    </div>
  );
}


