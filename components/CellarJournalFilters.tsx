'use client';

import { WineFilters } from '@/types/wine';
import { Filter, X } from 'lucide-react';

interface CellarJournalFiltersProps {
  filters: WineFilters;
  onFiltersChange: (filters: WineFilters) => void;
  wines: any[];
}

export default function CellarJournalFilters({ filters, onFiltersChange, wines }: CellarJournalFiltersProps) {
  const countries = ['all', ...Array.from(new Set(wines.map(w => w.country))).sort()];
  const styles = ['all', ...Array.from(new Set(wines.map(w => w.style)))];
  const vintages = ['all', ...Array.from(new Set(wines.map(w => w.vintage.toString())))
    .filter(v => v !== 'all')
    .sort((a, b) => parseInt(b) - parseInt(a))];
  const statuses = ['all', 'consumed', 'gifted', 'sold'];

  const handleFilterChange = (key: keyof WineFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      country: 'all',
      region: 'all',
      style: 'all',
      vintage: 'all',
      status: 'all',
      coravin: 'all',
      search: '',
    });
  };

  const hasActiveFilters = filters.country !== 'all' ||
                          filters.style !== 'all' ||
                          filters.vintage !== 'all' ||
                          filters.status !== 'all' ||
                          filters.coravin !== 'all' ||
                          filters.search !== '';

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>
          <label htmlFor="country-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Country
          </label>
          <select
            id="country-filter"
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="select-field py-1 text-sm"
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country === 'all' ? 'All Countries' : country}
              </option>
            ))}
          </select>
        </div>



        <div>
          <label htmlFor="style-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Style
          </label>
          <select
            id="style-filter"
            value={filters.style}
            onChange={(e) => handleFilterChange('style', e.target.value)}
            className="select-field py-1 text-sm"
          >
            {styles.map((style) => (
              <option key={style} value={style}>
                {style === 'all' ? 'All Styles' : style}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vintage-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Vintage
          </label>
          <select
            id="vintage-filter"
            value={filters.vintage}
            onChange={(e) => handleFilterChange('vintage', e.target.value)}
            className="select-field py-1 text-sm"
          >
            {vintages.map((vintage) => (
              <option key={vintage} value={vintage}>
                {vintage === 'all' ? 'All Vintages' : vintage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-0.5">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select-field py-1 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : 
                 status === 'consumed' ? 'Consumed' :
                 status === 'gifted' ? 'Gifted' :
                 status === 'sold' ? 'Sold' : status}
              </option>
            ))}
          </select>
        </div>

        {/* Coravin Filter */}
        <div className="flex items-end">
          <button
            onClick={() => handleFilterChange('coravin', filters.coravin === 'yes' ? 'all' : 'yes')}
            className={`w-full py-1 px-3 rounded-lg text-sm font-medium border transition-colors ${
              filters.coravin === 'yes'
                ? 'bg-[#722F37] text-white border-[#5a252c]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#722F37] hover:text-[#722F37]'
            }`}
          >
            Coravin
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {filters.country !== 'all' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wine-100 text-wine-800">
                {filters.country}
                <button
                  onClick={() => handleFilterChange('country', 'all')}
                  className="ml-1 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.style !== 'all' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wine-100 text-wine-800">
                {filters.style}
                <button
                  onClick={() => handleFilterChange('style', 'all')}
                  className="ml-1 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.vintage !== 'all' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wine-100 text-wine-800">
                {filters.vintage}
                <button
                  onClick={() => handleFilterChange('vintage', 'all')}
                  className="ml-1 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wine-100 text-wine-800">
                {filters.status === 'consumed' ? 'Consumed' :
                 filters.status === 'gifted' ? 'Gifted' :
                 filters.status === 'sold' ? 'Sold' : filters.status}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-1 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.coravin === 'yes' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#722F37] text-white">
                Coravin
                <button
                  onClick={() => handleFilterChange('coravin', 'all')}
                  className="ml-1 text-white hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
