'use client';

import { useState, useMemo } from 'react';
import { FeatureWine } from '@/utils/excel';
import { Search, ChevronDown, ChevronUp, Wine, MapPin, DollarSign, Award, Droplet, FileText, ShoppingCart, Plus, Minus, X, Copy, Check } from 'lucide-react';

interface FeaturesTableProps {
    wines: FeatureWine[];
}

type SortConfig = {
    key: keyof FeatureWine;
    direction: 'asc' | 'desc';
} | null;

export default function FeaturesTable({ wines }: FeaturesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [filter, setFilter] = useState('');
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    const [orders, setOrders] = useState<Record<string, number>>({});
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSort = (key: keyof FeatureWine) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleNote = (index: number) => {
        setExpandedNotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const getWineId = (wine: FeatureWine) => String(wine['LCBO#'] || wine['Wine Name']);

    const updateOrder = (wine: FeatureWine, delta: number) => {
        const id = getWineId(wine);
        setOrders(prev => {
            const currentQty = prev[id] || 0;
            const newQty = Math.max(0, currentQty + delta);

            const newOrders = { ...prev };
            if (newQty === 0) {
                delete newOrders[id];
            } else {
                newOrders[id] = newQty;
            }
            return newOrders;
        });
    };

    const copyOrderToClipboard = () => {
        const orderList = Object.entries(orders).map(([id, qty]) => {
            const wine = wines.find(w => getWineId(w) === id);
            if (!wine) return '';
            return `${qty}x ${wine['Wine Name']} (LCBO#: ${wine['LCBO#']})`;
        }).filter(Boolean).join('\n');

        const total = calculateTotal();
        const text = `My Wine Order:\n\n${orderList}\n\nTotal Estimated: $${total.toFixed(2)}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const calculateTotal = () => {
        return Object.entries(orders).reduce((total, [id, qty]) => {
            const wine = wines.find(w => getWineId(w) === id);
            return total + (wine ? wine['$BTL'] * qty : 0);
        }, 0);
    };

    const totalItems = Object.values(orders).reduce((a, b) => a + b, 0);

    const processedWines = useMemo(() => {
        let result = [...wines];

        // Global Filter
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            result = result.filter(wine =>
                Object.values(wine).some(val =>
                    String(val).toLowerCase().includes(lowerFilter)
                )
            );
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [wines, sortConfig, filter]);

    const sortOptions: { label: string; key: keyof FeatureWine }[] = [
        { label: 'Name', key: 'Wine Name' },
        { label: 'Country', key: 'Country Name' },
        { label: 'Score', key: 'Score' },
        { label: 'Price', key: '$BTL' },
    ];

    return (
        <div className="space-y-6 pb-24">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-red-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-30">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search wines, countries, notes..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-shadow"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('Wine Name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Wine Name</span>
                                        {sortConfig?.key === 'Wine Name' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('Country Name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Region</span>
                                        {sortConfig?.key === 'Country Name' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('Score')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Score</span>
                                        {sortConfig?.key === 'Score' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('$BTL')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Price</span>
                                        {sortConfig?.key === '$BTL' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedWines.map((wine, idx) => {
                                const wineId = getWineId(wine);
                                const quantity = orders[wineId] || 0;
                                const isExpanded = expandedNotes.has(idx);

                                return (
                                    <tr key={idx} className={quantity > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{wine['Wine Name']}</span>
                                                <button
                                                    onClick={() => toggleNote(idx)}
                                                    className="text-xs text-red-600 hover:text-red-800 flex items-center mt-1"
                                                >
                                                    {isExpanded ? 'Hide Notes' : 'Show Notes'}
                                                    {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div className="flex items-start">
                                                            <FileText className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                                            <span>{wine['Tasting Notes']}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{wine['Country Name']}</div>
                                            <div className="text-xs text-gray-500">{wine['Region']}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {wine['Score'] && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                    <Award className="w-3 h-3 mr-1" />
                                                    {wine['Score']}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ${wine['$BTL']}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-1">
                                                <span className="flex items-center">
                                                    <Droplet className="w-3 h-3 mr-1" /> {wine['ML']} ml
                                                </span>
                                                <span className="text-xs">LCBO#: {wine['LCBO#']}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {quantity === 0 ? (
                                                <button
                                                    onClick={() => updateOrder(wine, 1)}
                                                    className="text-red-600 hover:text-red-900 font-bold flex items-center justify-end w-full"
                                                >
                                                    <ShoppingCart className="w-4 h-4 mr-1" /> Add
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => updateOrder(wine, -1)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-bold w-4 text-center">{quantity}</span>
                                                    <button
                                                        onClick={() => updateOrder(wine, 1)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {processedWines.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Wine className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No wines found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
            )}

            {/* Floating Order Button */}
            {totalItems > 0 && (
                <div className="fixed bottom-6 right-6 z-40 animate-bounce-in">
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="flex items-center space-x-3 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-transform hover:scale-105"
                    >
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-600">
                                {totalItems}
                            </span>
                        </div>
                        <span className="font-bold text-lg">View Order</span>
                    </button>
                </div>
            )}

            {/* Order Modal */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50 rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                <ShoppingCart className="w-6 h-6 mr-3 text-red-600" />
                                Your Order
                            </h2>
                            <button
                                onClick={() => setIsOrderModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {Object.keys(orders).length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Your order is empty.</p>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(orders).map(([id, qty]) => {
                                        const wine = wines.find(w => getWineId(w) === id);
                                        if (!wine) return null;
                                        return (
                                            <div key={id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{wine['Wine Name']}</h4>
                                                    <p className="text-sm text-gray-500">LCBO#: {wine['LCBO#']} • ${wine['$BTL']}</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                                                        <button
                                                            onClick={() => updateOrder(wine, -1)}
                                                            className="p-2 hover:bg-gray-100 text-red-600 rounded-l-lg"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
                                                        <button
                                                            onClick={() => updateOrder(wine, 1)}
                                                            className="p-2 hover:bg-gray-100 text-red-600 rounded-r-lg"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="w-20 text-right font-bold text-gray-900">
                                                        ${(wine['$BTL'] * qty).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-medium text-gray-600">Total Estimated</span>
                                <span className="text-3xl font-bold text-red-600">${calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsOrderModalOpen(false)}
                                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                                >
                                    Keep Browsing
                                </button>
                                <button
                                    onClick={copyOrderToClipboard}
                                    className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    <span>{copied ? 'Copied!' : 'Copy Order List'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
