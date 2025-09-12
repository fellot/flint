'use client';

import { useState } from 'react';
import { Wine } from '@/types/wine';
import { Edit, Trash2, Wine as WineIcon, Calendar, MapPin, Star, ChevronUp, ChevronDown, ExternalLink, X } from 'lucide-react';
import WineModal from './WineModal';
import { highlightSearchTerm } from '@/utils/highlight';

interface WineTableProps {
  wines: Wine[];
  onWineUpdate: (wine: Wine) => void;
  onWineDelete: (wineId: string) => void;
  searchTerm?: string;
  isPortuguese?: boolean;
}

type SortColumn = 'bottle' | 'vintage' | 'country' | 'peakYear';
type SortDirection = 'asc' | 'desc';

export default function WineTable({ wines, onWineUpdate, onWineDelete, searchTerm = '', isPortuguese = false }: WineTableProps) {
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [consumingWine, setConsumingWine] = useState<Wine | null>(null);
  const [wineNotes, setWineNotes] = useState<string>('');
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
      <ChevronUp className="h-4 w-4 text-red-600" /> : 
      <ChevronDown className="h-4 w-4 text-red-600" />;
  };

  const handleConsumeWine = (wine: Wine) => {
    const consumedWine = {
      ...wine,
      status: 'consumed' as const,
      consumedDate: new Date().toISOString().split('T')[0],
      location: 'N/A',
      notes: wineNotes.trim() ? wineNotes.trim() : wine.notes,
    };
    onWineUpdate(consumedWine);
    setConsumingWine(null);
    setWineNotes(''); // Reset notes after consuming
  };

  const handleImageExpand = (src: string, alt: string, location: string) => {
    setExpandedImage({ src, alt, location });
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



  const handleWineClick = (wine: Wine, event: React.MouseEvent) => {
    // Don't open technical sheet if clicking on action buttons or their containers
    if (event.target instanceof Element) {
      const target = event.target as Element;
      if (target.closest('.action-buttons') || target.closest('button')) {
        return;
      }
    }
    
    if (wine.technical_sheet) {
      window.open(wine.technical_sheet, '_blank');
    }
  };

  const getRowClasses = (wine: Wine) => {
    const baseClasses = "hover:bg-gray-50";
    if (wine.technical_sheet) {
      return `${baseClasses} cursor-pointer hover:bg-wine-50 transition-colors`;
    }
    return baseClasses;
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
        <div className="overflow-x-auto relative">
          <table className="w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('bottle')}
                >
                  <div className="flex items-center justify-between">
                    <span>{isPortuguese ? 'Vinho' : 'Wine'}</span>
                    {getSortIcon('bottle')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('vintage')}
                >
                  <div className="flex items-center justify-between">
                    <span>{isPortuguese ? 'Safra' : 'Vintage'}</span>
                    {getSortIcon('vintage')}
                  </div>
                </th>
                <th className="table-header">{isPortuguese ? 'Janela de Consumo' : 'Drinking Window'}</th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('peakYear')}
                >
                  <div className="flex items-center justify-between">
                    <span>{isPortuguese ? 'Pico' : 'Peak'}</span>
                    {getSortIcon('peakYear')}
                  </div>
                </th>
                <th 
                  className="table-header cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('country')}
                >
                  <div className="flex items-center justify-between">
                    <span>{isPortuguese ? 'País e Região' : 'Country & Region'}</span>
                    {getSortIcon('country')}
                  </div>
                </th>
                <th className="table-header">{isPortuguese ? 'Estilo' : 'Style'}</th>
                <th className="table-header">{isPortuguese ? 'Harmonização' : 'Food Pairing'}</th>
                <th className="table-header">{isPortuguese ? 'Prato Sugerido' : 'Suggested Meal'}</th>
                <th className="table-header">{isPortuguese ? 'Localização' : 'Location'}</th>
                <th className="table-header">{isPortuguese ? 'Ações' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWines.map((wine) => (
                <tr 
                  key={wine.id} 
                  className={getRowClasses(wine)}
                  onClick={(e) => wine.technical_sheet && handleWineClick(wine, e)}
                  title={wine.technical_sheet ? `Click to open technical sheet` : undefined}
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
                    <div className="text-xs text-gray-900 font-medium">{wine.vintage}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs text-gray-900">{wine.drinkingWindow}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs text-gray-900">{wine.peakYear}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs text-gray-900">
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
                    <div className="text-xs text-gray-500">
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
                    <span className={getStyleBadgeClasses(wine.style)}>
                      {wine.style}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-32">
                      <div className="text-xs text-gray-900 whitespace-pre-wrap leading-tight">
                        {highlightSearchTerm(wine.foodPairingNotes, searchTerm).map((part, index) => 
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
                  <td className="table-cell">
                    <div className="max-w-32">
                      <div className="text-xs text-gray-900 whitespace-pre-wrap leading-tight">
                        {highlightSearchTerm(wine.mealToHaveWithThisWine, searchTerm).map((part, index) => 
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

                  <td className="table-cell">
                                          <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="table-icon mr-1" />
                        {wine.location}
                      </div>
                    {wine.quantity > 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Qty: {wine.quantity}
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-1 action-buttons">
                      <button
                        onClick={() => setEditingWine(wine)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Edit wine"
                      >
                        <Edit className="table-icon" />
                      </button>
                      
                      {wine.status === 'in_cellar' && (
                        <button
                          onClick={() => setConsumingWine(wine)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Mark as consumed"
                        >
                          <Calendar className="table-icon" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onWineDelete(wine.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete wine"
                      >
                        <Trash2 className="table-icon" />
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
          locale={isPortuguese ? 'pt' : 'en'}
        />
      )}

      {/* Consume Wine Modal */}
      {consumingWine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <WineIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Mark as Consumed
                </h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 text-center mb-4">
                  Are you sure you want to mark "{consumingWine.bottle}" as consumed?
                </p>
                <p className="text-sm text-gray-500 text-center">
                  This will add today's date and move it to your consumed wines.
                </p>
              </div>

              {/* Wine Notes Section */}
              <div className="mb-6">
                <label htmlFor="wine-notes" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Wine Notes (Optional)
                </label>
                <textarea
                  id="wine-notes"
                  value={wineNotes}
                  onChange={(e) => setWineNotes(e.target.value)}
                  placeholder="Add your tasting notes, thoughts, or experience with this wine..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1 text-left">
                  Share your experience, tasting notes, or any thoughts about this wine
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleConsumeWine(consumingWine)}
                  className="btn-primary flex-1"
                >
                  Mark as Consumed
                </button>
                <button
                  onClick={() => {
                    setConsumingWine(null);
                    setWineNotes(''); // Reset notes when canceling
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
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
