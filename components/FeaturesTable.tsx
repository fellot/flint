'use client';

import { useState, useMemo } from 'react';
import { FeatureWine } from '@/utils/excel';
import { Search, ChevronDown, ChevronUp, Wine, MapPin, DollarSign, Award, Droplet, FileText } from 'lucide-react';

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
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-red-100 flex flex-col md:flex-row gap-4 items-center justify-between">
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

                <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</span>
                    {sortOptions.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => handleSort(option.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center space-x-1 ${sortConfig?.key === option.key
                                    ? 'bg-red-100 text-red-800 ring-1 ring-red-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <span>{option.label}</span>
                            {sortConfig?.key === option.key && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedWines.map((wine, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                    >
                        {/* Card Header */}
                        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-white to-red-50/30">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                    {wine['Wine Name']}
                                </h3>
                                {wine['Score'] && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm whitespace-nowrap">
                                        <Award className="w-3 h-3 mr-1" />
                                        {wine['Score']}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-1 text-red-400" />
                                <span>{wine['Country Name']} • {wine['Region']}</span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-grow space-y-4">
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center text-gray-700 bg-gray-50 p-2 rounded-lg">
                                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                                    <span className="font-semibold">${wine['$BTL']}</span>
                                </div>
                                <div className="flex items-center text-gray-700 bg-gray-50 p-2 rounded-lg">
                                    <Droplet className="w-4 h-4 mr-2 text-blue-500" />
                                    <span>{wine['ML']} ml</span>
                                </div>
                                <div className="col-span-2 flex items-center text-gray-500 text-xs">
                                    <span className="font-medium mr-1">LCBO#:</span> {wine['LCBO#']}
                                </div>
                            </div>

                            {/* Tasting Notes */}
                            <div className="relative">
                                <div className="flex items-center mb-2">
                                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                                    <h4 className="text-sm font-bold text-gray-900">Tasting Notes</h4>
                                </div>
                                <div
                                    className={`text-sm text-gray-600 leading-relaxed ${expandedNotes.has(idx) ? '' : 'line-clamp-4'
                                        }`}
                                >
                                    {wine['Tasting Notes']}
                                </div>
                                {wine['Tasting Notes'].length > 150 && (
                                    <button
                                        onClick={() => toggleNote(idx)}
                                        className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 focus:outline-none flex items-center"
                                    >
                                        {expandedNotes.has(idx) ? (
                                            <>Show less <ChevronUp className="w-3 h-3 ml-1" /></>
                                        ) : (
                                            <>Read more <ChevronDown className="w-3 h-3 ml-1" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {processedWines.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Wine className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No wines found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
}
