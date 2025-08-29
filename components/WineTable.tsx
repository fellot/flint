'use client';

import { useState } from 'react';
import { Wine } from '@/types/wine';
import { Edit, Trash2, Wine as WineIcon, Calendar, MapPin, Star, ChevronUp, ChevronDown } from 'lucide-react';
import WineModal from './WineModal';

interface WineTableProps {
  wines: Wine[];
  onWineUpdate: (wine: Wine) => void;
  onWineDelete: (wineId: string) => void;
}

type SortColumn = 'bottle' | 'vintage' | 'country' | 'peakYear';
type SortDirection = 'asc' | 'desc';

export default function WineTable({ wines, onWineUpdate, onWineDelete }: WineTableProps) {
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [consumingWine, setConsumingWine] = useState<Wine | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('bottle');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedWines = () => {
    return [...wines].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case 'bottle':
          aValue = a.bottle.toLowerCase();
          bValue = b.bottle.toLowerCase();
          break;
        case 'vintage':
          aValue = a.vintage;
          bValue = b.vintage;
          break;
        case 'country':
          aValue = a.country.toLowerCase();
          bValue = b.country.toLowerCase();
          break;
        case 'peakYear':
          aValue = a.peakYear;
          bValue = b.peakYear;
          break;
        default:
          aValue = a.bottle.toLowerCase();
          bValue = b.bottle.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        if (sortDirection === 'asc') {
          return (aValue as number) - (bValue as number);
        } else {
          return (bValue as number) - (aValue as number);
        }
      }
    });
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-wine-600" /> : 
      <ChevronDown className="h-4 w-4 text-wine-600" />;
  };

  const handleConsumeWine = (wine: Wine) => {
    const consumedWine = {
      ...wine,
      status: 'consumed' as const,
      consumedDate: new Date().toISOString().split('T')[0],
    };
    onWineUpdate(consumedWine);
    setConsumingWine(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'status-badge';
    switch (status) {
      case 'in_cellar':
        return `${baseClasses} status-in-cellar`;
      case 'consumed':
        return `${baseClasses} status-consumed`;
      case 'sold':
        return `${baseClasses} status-sold`;
      case 'gifted':
        return `${baseClasses} status-gifted`;
      default:
        return `${baseClasses} status-in-cellar`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_cellar':
        return 'In Cellar';
      case 'consumed':
        return 'Consumed';
      case 'sold':
        return 'Sold';
      case 'gifted':
        return 'Gifted';
      default:
        return 'In Cellar';
    }
  };

  if (wines.length === 0) {
    return (
      <div className="card text-center py-12">
        <WineIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No wines found</h3>
        <p className="text-gray-500">Try adjusting your filters or add some wines to your cellar.</p>
      </div>
    );
  }

  const sortedWines = getSortedWines();

  return (
    <>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('bottle')}
                >
                  <div className="flex items-center justify-between">
                    <span>Wine</span>
                    {getSortIcon('bottle')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('vintage')}
                >
                  <div className="flex items-center justify-between">
                    <span>Vintage</span>
                    {getSortIcon('vintage')}
                  </div>
                </th>
                <th className="table-header">Drinking Window</th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('peakYear')}
                >
                  <div className="flex items-center justify-between">
                    <span>Peak</span>
                    {getSortIcon('peakYear')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('country')}
                >
                  <div className="flex items-center justify-between">
                    <span>Country & Region</span>
                    {getSortIcon('country')}
                  </div>
                </th>
                <th className="table-header">Style</th>
                <th className="table-header">Food Pairing</th>
                <th className="table-header">Suggested Meal</th>
                <th className="table-header">Status</th>
                <th className="table-header">Location</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWines.map((wine) => (
                <tr key={wine.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-wine-100 flex items-center justify-center">
                          <WineIcon className="h-6 w-6 text-wine-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {wine.bottle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {wine.grapes}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900 font-medium">{wine.vintage}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{wine.drinkingWindow}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{wine.peakYear}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{wine.country}</div>
                    <div className="text-sm text-gray-500">{wine.region}</div>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {wine.style}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {wine.foodPairingNotes}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {wine.mealToHaveWithThisWine}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={getStatusBadge(wine.status)}>
                      {getStatusText(wine.status)}
                    </span>
                    {wine.consumedDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {wine.consumedDate}
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {wine.location}
                    </div>
                    {wine.quantity > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Qty: {wine.quantity}
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingWine(wine)}
                        className="text-wine-600 hover:text-wine-900 p-1 rounded"
                        title="Edit wine"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {wine.status === 'in_cellar' && (
                        <button
                          onClick={() => setConsumingWine(wine)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Mark as consumed"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onWineDelete(wine.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete wine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Wine Modal */}
      {editingWine && (
        <WineModal
          wine={editingWine}
          isOpen={!!editingWine}
          onClose={() => setEditingWine(null)}
          onSave={onWineUpdate}
          mode="edit"
        />
      )}

      {/* Consume Wine Modal */}
      {consumingWine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <WineIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Mark as Consumed
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to mark "{consumingWine.bottle}" as consumed?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This will add today's date and move it to your consumed wines.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleConsumeWine(consumingWine)}
                  className="btn-primary w-full mb-2"
                >
                  Mark as Consumed
                </button>
                <button
                  onClick={() => setConsumingWine(null)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
