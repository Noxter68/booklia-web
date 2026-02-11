'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronRight, SlidersHorizontal, User, Building2, MapPin, Star, Navigation, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ServiceCard } from '@/components/services/service-card';
import { CategoryDropdown } from '@/components/search/category-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { SearchFilters, ServiceKind, Urgency, Category, Business } from '@/types';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 20, label: '20 km' },
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
];

function FilterChip({
  label,
  active,
  onClick,
  onClear,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  onClear?: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-surface-2 text-foreground hover:bg-muted'
      }`}
    >
      {label}
      {active && onClear && (
        <X
          className="w-3.5 h-3.5 hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        />
      )}
    </motion.button>
  );
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-surface border border-border rounded-2xl overflow-hidden h-full hover:border-primary/30 transition-colors cursor-pointer"
      >
        {/* Cover image */}
        <div className="h-24 relative">
          {business.coverUrl ? (
            <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Logo overlay */}
          <div className="absolute -bottom-5 left-4">
            <div className="w-12 h-12 bg-surface border-2 border-surface rounded-xl shadow-md flex items-center justify-center overflow-hidden">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>

          {/* Verified badge */}
          {business.isVerified && (
            <Badge variant="outline" className="absolute top-2 right-2 text-xs bg-white/90 text-green-700 border-green-200">
              Vérifié
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pt-7">
          <h3 className="font-semibold truncate mb-1">{business.name}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            {business.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {business.city}
              </span>
            )}
            {business.owner?.reputation && business.owner.reputation.ratingCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {business.owner.reputation.ratingAvg5.toFixed(1)}
              </span>
            )}
          </div>
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {business.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {business._count && (
              <>
                <span>{business._count.services} prestation{business._count.services !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{business._count.employees} employé{business._count.employees !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Mobile Filters Modal Component
function MobileFiltersModal({
  isOpen,
  onClose,
  categories,
  filters,
  subcategoryId,
  searchType,
  userLocation,
  radius,
  onFilterChange,
  onSubcategoryChange,
  onRadiusChange,
  onClearAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: SearchFilters;
  subcategoryId: string | undefined;
  searchType: 'services' | 'businesses';
  userLocation: { lat: number; lng: number } | null;
  radius: number;
  onFilterChange: (key: keyof SearchFilters, value: string | undefined) => void;
  onSubcategoryChange: (id: string | undefined) => void;
  onRadiusChange: (radius: number) => void;
  onClearAll: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(filters.categoryId || null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedCategory = filters.categoryId
    ? categories.find((c) => c.id === filters.categoryId)
    : null;

  const activeFiltersCount = [
    filters.kind,
    filters.categoryId,
    filters.urgency,
    userLocation,
  ].filter(Boolean).length;

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-bold text-lg">Filtres</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Type de recherche */}
                {searchType === 'services' && (
                  <div>
                    <label className="text-sm font-semibold mb-3 block">Type de service</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        label="Tous"
                        active={!filters.kind}
                        onClick={() => onFilterChange('kind', undefined)}
                      />
                      <FilterChip
                        label="Offres"
                        active={filters.kind === 'OFFER'}
                        onClick={() => onFilterChange('kind', 'OFFER')}
                        onClear={() => onFilterChange('kind', undefined)}
                      />
                      <FilterChip
                        label="Demandes"
                        active={filters.kind === 'REQUEST'}
                        onClick={() => onFilterChange('kind', 'REQUEST')}
                        onClear={() => onFilterChange('kind', undefined)}
                      />
                    </div>
                  </div>
                )}

                {/* Catégories */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Catégorie</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onFilterChange('categoryId', undefined);
                        onSubcategoryChange(undefined);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${
                        !filters.categoryId
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      Toutes les catégories
                    </button>
                    {categories.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => {
                            if (filters.categoryId === category.id) {
                              setExpandedCategory(expandedCategory === category.id ? null : category.id);
                            } else {
                              onFilterChange('categoryId', category.id);
                              onSubcategoryChange(undefined);
                              setExpandedCategory(category.id);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                            filters.categoryId === category.id
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <span>{category.name}</span>
                          {category.children && category.children.length > 0 && (
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                expandedCategory === category.id ? 'rotate-90' : ''
                              }`}
                            />
                          )}
                        </button>

                        {/* Subcategories */}
                        <AnimatePresence>
                          {expandedCategory === category.id && category.children && category.children.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-4 mt-2 space-y-1 overflow-hidden"
                            >
                              {category.children.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    onFilterChange('categoryId', category.id);
                                    onSubcategoryChange(sub.id);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                                    subcategoryId === sub.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted/30 hover:bg-muted'
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgence */}
                {searchType === 'services' && (
                  <div>
                    <label className="text-sm font-semibold mb-3 block">Urgence</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        label="Toutes"
                        active={!filters.urgency}
                        onClick={() => onFilterChange('urgency', undefined)}
                      />
                      <FilterChip
                        label="Urgent"
                        active={filters.urgency === 'URGENT'}
                        onClick={() => onFilterChange('urgency', 'URGENT')}
                        onClear={() => onFilterChange('urgency', undefined)}
                      />
                      <FilterChip
                        label="Bientôt"
                        active={filters.urgency === 'SOON'}
                        onClick={() => onFilterChange('urgency', 'SOON')}
                        onClear={() => onFilterChange('urgency', undefined)}
                      />
                      <FilterChip
                        label="Flexible"
                        active={filters.urgency === 'FLEXIBLE'}
                        onClick={() => onFilterChange('urgency', 'FLEXIBLE')}
                        onClear={() => onFilterChange('urgency', undefined)}
                      />
                    </div>
                  </div>
                )}

                {/* Rayon (si géoloc active) */}
                {userLocation && (
                  <div>
                    <label className="text-sm font-semibold mb-3 block">Rayon de recherche</label>
                    <div className="flex flex-wrap gap-2">
                      {RADIUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onRadiusChange(option.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            radius === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border shrink-0 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                >
                  Effacer tout
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={onClose}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [searchType, setSearchType] = useState<'services' | 'businesses'>(
    (searchParams.get('type') as 'services' | 'businesses') || 'services'
  );

  // Local state for inputs (before debounce)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [cityQuery, setCityQuery] = useState(searchParams.get('city') || '');

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState<number>(10);

  // Debounced values
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedCity = useDebounce(cityQuery, 400);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || '',
    kind: (searchParams.get('kind') as ServiceKind) || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    urgency: (searchParams.get('urgency') as Urgency) || undefined,
    city: searchParams.get('city') || '',
    limit: 20,
    offset: 0,
  });

  const [subcategoryId, setSubcategoryId] = useState<string | undefined>(
    searchParams.get('subcategoryId') || undefined
  );

  // Update filters when debounced values change
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      setFilters((prev) => ({ ...prev, q: debouncedSearch, offset: 0 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedCity !== filters.city) {
      setFilters((prev) => ({ ...prev, city: debouncedCity, offset: 0 }));
    }
  }, [debouncedCity]);

  // Get user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
        setCityQuery('');
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['services', filters, subcategoryId, userLocation, radius],
    queryFn: () => api.searchServices({
      ...filters,
      categoryId: subcategoryId || filters.categoryId,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius }),
    }),
    enabled: searchType === 'services',
  });

  const { data: businessesData, isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses', { q: debouncedSearch, city: debouncedCity, categoryId: subcategoryId || filters.categoryId, userLocation, radius }],
    queryFn: () => api.searchBusinesses({
      q: debouncedSearch,
      city: debouncedCity,
      categoryId: subcategoryId || filters.categoryId,
      limit: 20,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius }),
    }),
    enabled: searchType === 'businesses',
  });

  const selectedCategory = filters.categoryId
    ? categories?.find((c) => c.id === filters.categoryId)
    : null;

  const updateFilter = (key: keyof SearchFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);

    if (key === 'categoryId') {
      setSubcategoryId(undefined);
    }

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && k !== 'limit' && k !== 'offset') {
        params.set(k, String(v));
      }
    });
    if (key !== 'categoryId' && subcategoryId) {
      params.set('subcategoryId', subcategoryId);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const updateSubcategory = (id: string | undefined) => {
    setSubcategoryId(id);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && k !== 'limit' && k !== 'offset') {
        params.set(k, String(v));
      }
    });
    if (id) {
      params.set('subcategoryId', id);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const newFilters: SearchFilters = { q: '', limit: 20, offset: 0 };
    setFilters(newFilters);
    setSubcategoryId(undefined);
    setSearchQuery('');
    setCityQuery('');
    setUserLocation(null);
    router.push('/search');
  };

  const loadMore = () => {
    setFilters((prev) => ({ ...prev, offset: (prev.offset || 0) + 20 }));
  };

  const hasActiveFilters = filters.kind || filters.categoryId || filters.urgency || filters.city || userLocation;

  const activeFiltersCount = [
    filters.kind,
    filters.categoryId,
    filters.urgency,
    filters.city,
    userLocation,
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-6 pt-24">
      {/* Search Header - Hero style */}
      <div className="mb-8">
        {/* Search Card */}
        <div className="bg-gradient-to-br from-gold-soft/50 to-muted/30 rounded-3xl p-6 md:p-8 mb-6">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Trouvez le service idéal
            </h1>

            {/* Search inputs */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Que recherchez-vous ?"
                  className="pl-12 h-14 text-base rounded-2xl bg-surface border-border/50 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* City input with geolocation */}
              <div className="relative md:w-72">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={userLocation ? 'Ma position' : cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    if (userLocation) setUserLocation(null);
                  }}
                  placeholder="Où ?"
                  className="pl-12 pr-14 h-14 text-base rounded-2xl bg-surface border-border/50 shadow-sm"
                  disabled={!!userLocation}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {(cityQuery || userLocation) && (
                    <button
                      onClick={() => {
                        setCityQuery('');
                        setUserLocation(null);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={requestLocation}
                    disabled={locationLoading}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      userLocation
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Utiliser ma position"
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Search Type Toggle - Centered */}
            <div className="flex justify-center mt-5">
              <div className="inline-flex items-center gap-1 bg-surface rounded-full p-1 shadow-sm border border-border/50">
                <button
                  onClick={() => setSearchType('services')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    searchType === 'services'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Particuliers
                </button>
                <button
                  onClick={() => setSearchType('businesses')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    searchType === 'businesses'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Professionnels
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Radius selector - shown when using geolocation */}
        <AnimatePresence>
          {userLocation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <span className="text-sm text-muted-foreground">Rayon :</span>
              <div className="flex items-center gap-1 bg-muted rounded-full p-1 overflow-x-auto">
                {RADIUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRadius(option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      radius === option.value
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Bar - Desktop */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {/* Type filters - only for services */}
          {searchType === 'services' && (
            <>
              <div className="flex items-center gap-1.5">
                <FilterChip
                  label="Tous"
                  active={!filters.kind}
                  onClick={() => updateFilter('kind', undefined)}
                />
                <FilterChip
                  label="Offres"
                  active={filters.kind === 'OFFER'}
                  onClick={() => updateFilter('kind', 'OFFER')}
                  onClear={() => updateFilter('kind', undefined)}
                />
                <FilterChip
                  label="Demandes"
                  active={filters.kind === 'REQUEST'}
                  onClick={() => updateFilter('kind', 'REQUEST')}
                  onClear={() => updateFilter('kind', undefined)}
                />
              </div>

              <div className="w-px h-6 bg-border" />
            </>
          )}

          {/* Category dropdown - Desktop only - Two-column layout */}
          <CategoryDropdown
            categories={categories || []}
            selectedCategoryId={filters.categoryId}
            subcategoryId={subcategoryId}
            onCategorySelect={(categoryId) => {
              updateFilter('categoryId', categoryId);
            }}
            onSubcategorySelect={(categoryId, subId) => {
              updateFilter('categoryId', categoryId);
              updateSubcategory(subId);
            }}
            onClear={() => {
              updateFilter('categoryId', undefined);
              updateSubcategory(undefined);
            }}
          />

          <div className="w-px h-6 bg-border" />

          {/* Urgency filters */}
          {searchType === 'services' && (
            <>
              <div className="flex items-center gap-1.5">
                <FilterChip
                  label="Urgent"
                  active={filters.urgency === 'URGENT'}
                  onClick={() => updateFilter('urgency', filters.urgency === 'URGENT' ? undefined : 'URGENT')}
                  onClear={() => updateFilter('urgency', undefined)}
                />
                <FilterChip
                  label="Bientôt"
                  active={filters.urgency === 'SOON'}
                  onClick={() => updateFilter('urgency', filters.urgency === 'SOON' ? undefined : 'SOON')}
                  onClear={() => updateFilter('urgency', undefined)}
                />
              </div>

              <div className="w-px h-6 bg-border" />
            </>
          )}

          {/* Clear all */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Effacer tout
              </motion.button>
            )}
          </AnimatePresence>

        </div>

        {/* Mobile Filter Button - Right aligned for easy thumb access */}
        <div className="flex md:hidden justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFiltersModal(true)}
            className="rounded-full gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active filters preview on mobile */}
        {activeFiltersCount > 0 && (
          <div className="flex md:hidden flex-wrap gap-2 mt-3">
            {filters.kind && (
              <Badge variant="secondary" className="gap-1">
                {filters.kind === 'OFFER' ? 'Offres' : 'Demandes'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => updateFilter('kind', undefined)}
                />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory.name}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => updateFilter('categoryId', undefined)}
                />
              </Badge>
            )}
            {filters.urgency && (
              <Badge variant="secondary" className="gap-1">
                {filters.urgency === 'URGENT' ? 'Urgent' : filters.urgency === 'SOON' ? 'Bientôt' : 'Flexible'}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => updateFilter('urgency', undefined)}
                />
              </Badge>
            )}
            {userLocation && (
              <Badge variant="secondary" className="gap-1">
                {radius} km
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setUserLocation(null)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Subcategories chips - Desktop */}
        <AnimatePresence>
          {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="hidden md:block mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedCategory.name}:
                </span>
                <FilterChip
                  label="Toutes"
                  active={!subcategoryId}
                  onClick={() => updateSubcategory(undefined)}
                />
                {selectedCategory.children.map((sub) => (
                  <FilterChip
                    key={sub.id}
                    label={sub.name}
                    active={subcategoryId === sub.id}
                    onClick={() => updateSubcategory(sub.id)}
                    onClear={() => updateSubcategory(undefined)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">
          {searchType === 'businesses'
            ? 'Professionnels'
            : filters.kind === 'OFFER'
            ? 'Offres de services'
            : filters.kind === 'REQUEST'
            ? 'Demandes de services'
            : 'Tous les services'}
        </h1>
        {searchType === 'services' && data && (
          <span className="text-sm text-muted-foreground">
            {data.total} résultat{data.total !== 1 ? 's' : ''}
          </span>
        )}
        {searchType === 'businesses' && businessesData && (
          <span className="text-sm text-muted-foreground">
            {businessesData.total} résultat{businessesData.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Results Grid - Services */}
      {searchType === 'services' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg font-medium mb-2">Aucun service trouvé</h2>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Effacer les filtres
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                <AnimatePresence>
                  {data?.data.map((service) => (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ServiceCard service={service} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {data && data.total > (filters.offset || 0) + data.data.length && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={loadMore}>
                    Charger plus
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Results Grid - Businesses */}
      {searchType === 'businesses' && (
        <>
          {businessesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : businessesData?.data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-4xl mb-4">🏢</div>
              <h2 className="text-lg font-medium mb-2">Aucun professionnel trouvé</h2>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Effacer les filtres
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {businessesData?.data.map((business) => (
                  <motion.div
                    key={business.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <BusinessCard business={business} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Mobile Filters Modal */}
      <MobileFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        categories={categories || []}
        filters={filters}
        subcategoryId={subcategoryId}
        searchType={searchType}
        userLocation={userLocation}
        radius={radius}
        onFilterChange={updateFilter}
        onSubcategoryChange={updateSubcategory}
        onRadiusChange={setRadius}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <PageLoader text="Chargement..." />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
