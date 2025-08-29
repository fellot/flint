'use client';

import { Wine, WineFilters } from '@/types/wine';
import { Search, Filter, X } from 'lucide-react';

interface WineFiltersComponentProps {
  filters: WineFilters;
  onFiltersChange: (filters: WineFilters) => void;
  wines: Wine[];
}

export default function WineFiltersComponent({
  filters,
  onFiltersChange,
  wines,
}: WineFiltersComponentProps) {
  // Get unique values for filter options
  const countries = ['all', ...Array.from(new Set(wines.map(w => w.country)))];
  const styles = ['all', ...Array.from(new Set(wines.map(w => w.style)))];
  const vintages = ['all', ...Array.from(new Set(wines.map(w => w.vintage.toString())))];
  const statuses = ['all', 'in_cellar', 'consumed', 'sold', 'gifted'];

  const handleFilterChange = (key: keyof WineFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      country: 'all',
      style: 'all',
      vintage: 'all',
      status: 'all',
      search: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '');

  return (
    <div className="card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search wines, grapes, food pairings..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Filter Options */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Country Filter */}
        <div>
          <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            id="country-filter"
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="select-field"
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country === 'all' ? 'All Countries' : country}
              </option>
            ))}
          </select>
        </div>

        {/* Style Filter */}
        <div>
          <label htmlFor="style-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            id="style-filter"
            value={filters.style}
            onChange={(e) => handleFilterChange('style', e.target.value)}
            className="select-field"
          >
            {styles.map((style) => (
              <option key={style} value={style}>
                {style === 'all' ? 'All Styles' : style}
              </option>
            ))}
          </select>
        </div>

        {/* Vintage Filter */}
        <div>
          <label htmlFor="vintage-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Vintage
          </label>
          <select
            id="vintage-filter"
            value={filters.vintage}
            onChange={(e) => handleFilterChange('vintage', e.target.value)}
            className="select-field"
          >
            {vintages.map((vintage) => (
              <option key={vintage} value={vintage}>
                {vintage === 'all' ? 'All Vintages' : vintage}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="select-field"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : 
                 status === 'in_cellar' ? 'In Cellar' :
                 status === 'consumed' ? 'Consumed' :
                 status === 'sold' ? 'Sold' :
                 status === 'gifted' ? 'Gifted' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.country !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-800">
                Country: {filters.country}
                <button
                  onClick={() => handleFilterChange('country', 'all')}
                  className="ml-2 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.style !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-800">
                Style: {filters.style}
                <button
                  onClick={() => handleFilterChange('style', 'all')}
                  className="ml-2 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.vintage !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-800">
                Vintage: {filters.vintage}
                <button
                  onClick={() => handleFilterChange('vintage', 'all')}
                  className="ml-2 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-800">
                Status: {filters.status === 'in_cellar' ? 'In Cellar' :
                         filters.status === 'consumed' ? 'Consumed' :
                         filters.status === 'sold' ? 'Sold' :
                         filters.status === 'gifted' ? 'Gifted' : filters.status}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-2 text-wine-600 hover:text-wine-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 text-wine-600 hover:text-wine-800"
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
