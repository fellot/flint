'use client';

import { useState, useMemo } from 'react';
import { FeatureWine } from '@/utils/excel';
import { ArrowUpDown, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface FeaturesTableProps {
    wines: FeatureWine[];
}

type SortConfig = {
    key: keyof FeatureWine;
    direction: 'asc' | 'desc';
} | null;

export default function FeaturesTable({ wines }: FeaturesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const handleSort = (key: keyof FeatureWine) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key: keyof FeatureWine, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const processedWines = useMemo(() => {
        let result = [...wines];

        // Filter
        Object.keys(filters).forEach(key => {
            const filterValue = filters[key].toLowerCase();
            if (filterValue) {
                result = result.filter(wine => {
                    const value = wine[key as keyof FeatureWine];
                    return String(value).toLowerCase().includes(filterValue);
                });
            }
        });

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
    }, [wines, sortConfig, filters]);

    const columns: (keyof FeatureWine)[] = [
        'Wine Name',
        'Country Name',
        'Region',
        'Score',
        'LCBO#',
        '$BTL',
        'ML',
        'Tasting Notes'
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                        <tr>
                            {columns.map(column => (
                                <th
                                    key={column}
                                    className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider min-w-[150px]"
                                >
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleSort(column)}
                                            className="flex items-center space-x-1 hover:text-red-600 font-bold"
                                        >
                                            <span>{column}</span>
                                            {sortConfig?.key === column ? (
                                                sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                                            )}
                                        </button>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                <Search className="h-3 w-3 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={`Filter...`}
                                                className="block w-full pl-7 pr-2 py-1 text-xs border border-red-200 rounded-md focus:ring-red-500 focus:border-red-500"
                                                onChange={(e) => handleFilterChange(column, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {processedWines.length > 0 ? (
                            processedWines.map((wine, idx) => (
                                <tr key={idx} className="hover:bg-red-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{wine['Wine Name']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{wine['Country Name']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{wine['Region']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{wine['Score']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{wine['LCBO#']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">${wine['$BTL']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{wine['ML']}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={wine['Tasting Notes']}>
                                        {wine['Tasting Notes']}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                                    No wines found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Showing {processedWines.length} of {wines.length} wines
            </div>
        </div>
    );
}
