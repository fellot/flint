'use client';

import { useState } from 'react';
import { Wine } from '@/types/wine';
import { Edit, Trash2, Wine as WineIcon, Calendar, Star, ChevronUp, ChevronDown, ExternalLink, X, MapPin } from 'lucide-react';
import WineModal from './WineModal';
import { highlightSearchTerm } from '@/utils/highlight';

interface CellarJournalWineTableProps {
  wines: Wine[];
  onWineUpdate: (wine: Wine) => void;
  onWineDelete: (wineId: string) => void;
  searchTerm?: string;
  isPortuguese?: boolean;
}

type SortColumn = 'bottle' | 'vintage' | 'country' | 'peakYear';
type SortDirection = 'asc' | 'desc';

export default function CellarJournalWineTable({ wines, onWineUpdate, onWineDelete, searchTerm = '', isPortuguese = false }: CellarJournalWineTableProps) {
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string; location: string } | null>(null);
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
          aValue = a.peakYear || 0;
          bValue = b.peakYear || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-400 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-gray-600" /> : 
      <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  const handleImageExpand = (src: string, alt: string, location: string) => {
    setExpandedImage({ src, alt, location });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'status-badge';
    switch (status) {
      case 'consumed':
        return `${baseClasses} status-consumed`;
      case 'sold':
        return `${baseClasses} status-sold`;
      case 'gifted':
        return `${baseClasses} status-gifted`;
      default:
        return `${baseClasses} status-consumed`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'consumed':
        return 'Consumed';
      case 'sold':
        return 'sold';
      case 'gifted':
        return 'gifted';
      default:
        return 'Consumed';
    }
  };

  const handleWineClick = (wine: Wine, event: React.MouseEvent) => {
    // Don't open technical sheet if clicking on action buttons or their containers
    if (event.target instanceof Element) {
      const target = event.target as Element;
      if (target.closest('button') || target.closest('[role="button"]')) {
        return;
      }
    }
    
    // Open technical sheet in new tab
    if (wine.technical_sheet) {
      window.open(wine.technical_sheet, '_blank');
    }
  };

  const sortedWines = getSortedWines();

  if (sortedWines.length === 0) {
    return (
      <div className="card p-8 text-center">
        <WineIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{isPortuguese ? 'Nenhum vinho encontrado' : 'No wines found'}</h3>
        <p className="text-gray-500">{isPortuguese ? 'Tente ajustar seus filtros para ver mais resultados.' : 'Try adjusting your filters to see more results.'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">
                  <button
                    onClick={() => handleSort('bottle')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span>Bottle</span>
                    {getSortIcon('bottle')}
                  </button>
                </th>
                <th className="table-header">
                  <button
                    onClick={() => handleSort('vintage')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span>Vintage</span>
                    {getSortIcon('vintage')}
                  </button>
                </th>
                <th className="table-header">
                  <button
                    onClick={() => handleSort('country')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span>Country & Region</span>
                      {getSortIcon('country')}
                    </div>
                  </button>
                </th>
                <th className="table-header">Style</th>
                <th className="table-header">Wine Notes</th>
                <th className="table-header status-column">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWines.map((wine) => (
                <tr 
                  key={wine.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => handleWineClick(wine, e)}
                >
                  <td className="table-cell wine-column">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {wine.bottle_image ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageExpand(wine.bottle_image!, `${wine.bottle} bottle`, wine.location);
                            }}
                            className="hover:opacity-80 transition-opacity cursor-pointer p-1"
                            title="Click to expand image"
                          >
                            <img
                              src={wine.bottle_image}
                              alt={`${wine.bottle} bottle`}
                              className="wine-thumbnail h-8 w-8"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          </button>
                        ) : null}
                        <div className={`h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center ${wine.bottle_image ? 'hidden' : ''}`}>
                          <WineIcon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900 leading-tight flex items-center min-w-0">
                          <div className="flex-1 min-w-0 break-words">
                            {highlightSearchTerm(wine.bottle, searchTerm).map((part, index) => 
                              typeof part === 'string' ? part : (
                                part.highlighted ? (
                                  <span key={index} className="bg-yellow-200 font-semibold break-words">
                                    {part.text}
                                  </span>
                                ) : (
                                  part.text
                                )
                              )
                            )}
                          </div>
                          {wine.technical_sheet && (
                            <ExternalLink className="table-icon ml-1 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight break-words">
                          {highlightSearchTerm(wine.grapes, searchTerm).map((part, index) => 
                            typeof part === 'string' ? part : (
                              part.highlighted ? (
                                <span key={index} className="bg-yellow-200 font-semibold break-words">
                                  {part.text}
                                </span>
                              ) : (
                                part.text
                              )
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="table-icon mr-1" />
                      {wine.vintage}
                    </div>
                    {wine.peakYear && (
                      <div className="text-xs text-gray-500 mt-1">
                        Peak: {wine.peakYear}
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {highlightSearchTerm(wine.country, searchTerm).map((part, index) =>
                        typeof part === 'string' ? part : (
                          part.highlighted ? (
                            <span key={index} className="bg-yellow-200 font-semibold">
                              {part.text}
                            </span>
                          ) : (
                            part.text
                          )
                        )
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {highlightSearchTerm(wine.region, searchTerm).map((part, index) =>
                        typeof part === 'string' ? part : (
                          part.highlighted ? (
                            <span key={index} className="bg-yellow-200 font-semibold">
                              {part.text}
                            </span>
                          ) : (
                            part.text
                          )
                        )
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {wine.style}
                      </span>
                      {wine.coravin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          Coravin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-64">
                      <div className="text-xs text-gray-900 whitespace-pre-wrap leading-tight">
                        {highlightSearchTerm(wine.notes, searchTerm).map((part, index) => 
                          typeof part === 'string' ? part : (
                            part.highlighted ? (
                              <span key={index} className="bg-yellow-200 font-semibold">
                                {part.text}
                              </span>
                            ) : (
                              part.text
                            )
                          )
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell status-column">
                    <div className="flex flex-col space-y-1 items-center">
                      <span className={getStatusBadge(wine.status)}>
                        {getStatusText(wine.status)}
                      </span>
                      {wine.consumedDate && (
                        <div className="text-2xs text-gray-400">
                          {wine.consumedDate}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWine(wine);
                        }}
                        className="text-gray-400 hover:text-wine-600 transition-colors"
                        title="Edit wine"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {wine.technical_sheet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(wine.technical_sheet, '_blank');
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Open technical sheet"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wine Modal */}
      {editingWine && (
      <WineModal
        wine={editingWine}
        isOpen={!!editingWine}
        onClose={() => setEditingWine(null)}
        onSave={onWineUpdate}
        mode="edit"
        locale={isPortuguese ? 'pt' : 'en'}
      />
      )}

      {/* Image Expansion Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 w-full max-w-4xl">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {expandedImage.alt}
                </h3>
                <button
                  onClick={() => setExpandedImage(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={expandedImage.src}
                  alt={expandedImage.alt}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="flex items-center justify-center h-64 text-gray-500">
                        <div class="text-center">
                          <WineIcon class="h-16 w-16 mx-auto mb-2 text-gray-300" />
                          <p>Image failed to load</p>
                        </div>
                      </div>
                    `;
                  }}
                />
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Location: {expandedImage.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
