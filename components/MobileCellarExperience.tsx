'use client';

import { useMemo } from 'react';
import { Wine, WineFilters } from '@/types/wine';
import {
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wine as WineIcon,
  XCircle,
} from 'lucide-react';

type CellarStats = {
  countryBreakdown: Record<string, { count: number; regions: Record<string, number> }>;
  styleBreakdown: Record<string, number>;
  vintageBreakdown: Record<string | number, number>;
};

interface MobileCellarExperienceProps {
  filteredWines: Wine[];
  filters: WineFilters;
  stats: CellarStats;
  totalInCellar: number;
  isPortuguese: boolean;
  onSetFilter: (key: keyof WineFilters, value: string) => void;
  onClearFilters: () => void;
  onOpenAIWineModal: () => void;
  onOpenSommelier: () => void;
  onSelectWine: (wine: Wine, mode: 'view' | 'edit') => void;
  onQuickConsume: (wine: Wine) => void;
}

const copy = {
  en: {
    heroTitle: 'Pocket Cellar',
    heroSubtitle: 'Swipe through your bottles and plan what to drink next.',
    searchPlaceholder: 'Search bottles, grapes, meals...',
    quickCountry: 'Favorite countries',
    quickStyle: 'Style / mood',
    quickVintage: 'Ready vintages',
    clearFilters: 'Clear filters',
    emptyTitle: 'No bottles found',
    emptySubtitle: 'Try another filter or add a new wine.',
    pairingFallback: 'Tap edit to add pairing notes.',
    card: {
      edit: 'View & edit',
      drink: 'Drink now',
      sheet: 'Tech sheet',
    },
    stats: {
      bottles: 'In cellar',
      countries: 'Countries',
      styles: 'Styles',
    },
    actions: {
      add: 'Add with AI',
      sommelier: 'Ask Sommelier',
      locale: 'Switch origin',
    },
  },
  pt: {
    heroTitle: 'Adega de Bolso',
    heroSubtitle: 'Escolha o próximo vinho direto do celular.',
    searchPlaceholder: 'Busque garrafas, uvas, refeições...',
    quickCountry: 'Países favoritos',
    quickStyle: 'Estilo / humor',
    quickVintage: 'Safras prontas',
    clearFilters: 'Limpar filtros',
    emptyTitle: 'Nenhum vinho encontrado',
    emptySubtitle: 'Tente outros filtros ou adicione um novo vinho.',
    pairingFallback: 'Toque em editar para adicionar notas de harmonização.',
    card: {
      edit: 'Ver e editar',
      drink: 'Beber agora',
      sheet: 'Ficha técnica',
    },
    stats: {
      bottles: 'Na adega',
      countries: 'Países',
      styles: 'Estilos',
    },
    actions: {
      add: 'Adicionar com IA',
      sommelier: 'Perguntar ao Sommelier',
      locale: 'Trocar origem',
    },
  },
};

const formatLabel = (value: string) =>
  value
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

const getStyleBadgeClasses = (style: string) => {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border';
  switch (style.toLowerCase()) {
    case 'red':
      return `${base} border-red-100 bg-red-50 text-red-700`;
    case 'white':
      return `${base} border-yellow-100 bg-yellow-50 text-yellow-700`;
    case 'sparkling':
      return `${base} border-blue-100 bg-blue-50 text-blue-700`;
    case 'rosé':
    case 'rose':
      return `${base} border-pink-100 bg-pink-50 text-pink-700`;
    case 'dessert':
      return `${base} border-purple-100 bg-purple-50 text-purple-700`;
    case 'fortified':
      return `${base} border-amber-100 bg-amber-50 text-amber-700`;
    default:
      return `${base} border-gray-200 bg-gray-50 text-gray-700`;
  }
};

interface QuickFilterRailProps {
  label: string;
  values: string[];
  activeValue: string;
  filterKey: keyof WineFilters;
  onToggle: (key: keyof WineFilters, value: string) => void;
}

const QuickFilterRail = ({
  label,
  values,
  activeValue,
  filterKey,
  onToggle,
}: QuickFilterRailProps) => {
  if (!values.length) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <SlidersHorizontal className="h-4 w-4 text-gray-300" />
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {values.map((value) => {
          const isActive = activeValue === value;
          return (
            <button
              key={`${filterKey}-${value}`}
              onClick={() => onToggle(filterKey, isActive ? 'all' : value)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
                isActive
                  ? 'border-red-600 bg-red-600 text-white shadow-sm'
                  : 'border-transparent bg-gray-100 text-gray-600'
              }`}
            >
              {formatLabel(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function MobileCellarExperience({
  filteredWines,
  filters,
  stats,
  totalInCellar,
  isPortuguese,
  onSetFilter,
  onClearFilters,
  onOpenAIWineModal,
  onOpenSommelier,
  onSelectWine,
  onQuickConsume,
}: MobileCellarExperienceProps) {
  const localeKey = isPortuguese ? 'pt' : 'en';
  const t = copy[localeKey];

  const quickCountries = useMemo(
    () =>
      Object.entries(stats.countryBreakdown)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([country]) => country)
        .slice(0, 4),
    [stats.countryBreakdown]
  );

  const quickStyles = useMemo(
    () =>
      Object.entries(stats.styleBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([style]) => style)
        .slice(0, 4),
    [stats.styleBreakdown]
  );

  const quickVintages = useMemo(
    () =>
      Object.entries(stats.vintageBreakdown)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .map(([vintage]) => vintage)
        .slice(0, 4),
    [stats.vintageBreakdown]
  );

  const hasActiveFilters =
    filters.country !== 'all' ||
    filters.region !== 'all' ||
    filters.style !== 'all' ||
    filters.vintage !== 'all' ||
    filters.search.trim().length > 0;

  const countryCount = Object.keys(stats.countryBreakdown).length;
  const styleCount = Object.keys(stats.styleBreakdown).length;

  return (
    <div className="md:hidden">
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-950 to-black text-white pb-32">
        <header className="px-4 pt-10 pb-24">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-red-200">
                Flint Cellar
              </p>
              <h1 className="mt-1 text-3xl font-semibold">{t.heroTitle}</h1>
              <p className="mt-3 text-sm text-red-100">{t.heroSubtitle}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">{t.stats.bottles}</p>
              <p className="mt-2 text-2xl font-semibold">
                {filteredWines.length}
                <span className="ml-1 text-sm text-white/60">/ {totalInCellar}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">{t.stats.countries}</p>
              <p className="mt-2 text-2xl font-semibold">{countryCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">{t.stats.styles}</p>
              <p className="mt-2 text-2xl font-semibold">{styleCount}</p>
            </div>
          </div>
        </header>

        <section className="-mt-16 rounded-t-[32px] bg-white px-4 pb-10 pt-6 text-gray-900 shadow-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onSetFilter('search', e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-11 py-3 text-sm font-medium text-gray-900 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="mt-3 inline-flex items-center text-xs font-semibold text-red-600"
            >
              <XCircle className="mr-1 h-4 w-4" />
              {t.clearFilters}
            </button>
          )}

          <div className="mt-6 space-y-5">
            <QuickFilterRail
              label={t.quickCountry}
              values={quickCountries}
              activeValue={filters.country}
              filterKey="country"
              onToggle={onSetFilter}
            />
            <QuickFilterRail
              label={t.quickStyle}
              values={quickStyles}
              activeValue={filters.style}
              filterKey="style"
              onToggle={onSetFilter}
            />
            <QuickFilterRail
              label={t.quickVintage}
              values={quickVintages}
              activeValue={filters.vintage}
              filterKey="vintage"
              onToggle={onSetFilter}
            />
          </div>

          <div className="mt-6 space-y-4">
            {filteredWines.map((wine) => (
              <article
                key={wine.id}
                className="rounded-3xl border border-gray-100 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-red-500">
                      {wine.country}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug text-gray-900">
                      {wine.bottle}
                    </h3>
                    <p className="text-xs text-gray-500">{wine.region}</p>
                  </div>
                  {wine.bottle_image ? (
                    <img
                      src={wine.bottle_image}
                      alt={wine.bottle}
                      className="h-16 w-12 rounded-2xl bg-gray-50 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                      <WineIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={getStyleBadgeClasses(wine.style)}>{formatLabel(wine.style)}</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    {wine.vintage}
                  </span>
                  {wine.location && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      {wine.location}
                    </span>
                  )}
                </div>

                <p
                  className="mt-3 text-sm text-gray-600"
                  style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}
                >
                  {wine.foodPairingNotes?.trim() || t.pairingFallback}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectWine(wine, 'edit')}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    <Edit3 className="mr-1.5 h-4 w-4" />
                    {t.card.edit}
                  </button>
                  <button
                    onClick={() => onQuickConsume(wine)}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white shadow"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {t.card.drink}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    {wine.quantity} {isPortuguese ? 'garrafas' : 'bottles'}
                  </span>
                  {wine.peakYear && (
                    <span>
                      {isPortuguese ? 'Melhor até' : 'Peak by'} {wine.peakYear}
                    </span>
                  )}
                  {wine.rating && (
                    <span>
                      ⭐ {wine.rating}/100
                    </span>
                  )}
                </div>

                {wine.technical_sheet && (
                  <button
                    onClick={() => window.open(wine.technical_sheet, '_blank')}
                    className="mt-3 inline-flex items-center text-xs font-semibold text-gray-500"
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    {t.card.sheet}
                  </button>
                )}
              </article>
            ))}
          </div>

          {filteredWines.length === 0 && (
            <div className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner">
                <WineIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-gray-900">{t.emptyTitle}</p>
              <p className="mt-1 text-sm text-gray-500">{t.emptySubtitle}</p>
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-2xl">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onOpenAIWineModal}
            className="flex flex-col items-center justify-center rounded-2xl bg-red-600 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white"
          >
            <Sparkles className="mb-1 h-4 w-4" />
            {t.actions.add}
          </button>
          <button
            onClick={onOpenSommelier}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-700"
          >
            <WineIcon className="mb-1 h-4 w-4" />
            {t.actions.sommelier}
          </button>
        </div>
      </div>
    </div>
  );
}
