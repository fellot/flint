'use client';

import { useState, useEffect } from 'react';
import { Wine, WineFilters } from '@/types/wine';
import WineTable from '@/components/WineTable';
import WineFiltersComponent from '@/components/WineFilters';
import AddWineModal from '@/components/AddWineModal';
import { Plus, Wine as WineIcon, BarChart3 } from 'lucide-react';

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
    const total = wines.length;
    const inCellar = wines.filter(w => w.status === 'in_cellar').length;
    const consumed = wines.filter(w => w.status === 'consumed').length;
    const totalValue = wines.reduce((sum, w) => sum + (w.price || 0), 0);

    return { total, inCellar, consumed, totalValue };
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
              <WineIcon className="h-8 w-8 text-wine-600" />
              <h1 className="text-3xl font-bold text-gray-900">Wine Cellar Manager</h1>
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
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WineIcon className="h-8 w-8 text-wine-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Wines</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <WineIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Cellar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inCellar}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Consumed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consumed}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-600">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
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
