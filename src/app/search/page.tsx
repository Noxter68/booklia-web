'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, SlidersHorizontal, Building2, MapPin, Star, Navigation, Loader2, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { CategoryDropdown } from '@/components/search/category-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { Category, Business } from '@/types';

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
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

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
            <div className="w-full h-full bg-linear-to-br from-primary/20 via-primary/10 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

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

          {/* Distance badge */}
          {business.distance !== undefined && (
            <Badge variant="outline" className="absolute top-2 left-2 text-xs bg-white/90 text-primary border-primary/30 gap-1">
              <Navigation className="w-3 h-3" />
              {formatDistance(business.distance)}
            </Badge>
          )}

          {/* Verified badge */}
          {business.isVerified && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5 text-foreground" />
              <span className="text-xs font-semibold text-foreground">Vérifié</span>
            </div>
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
                <span>{business._count.employees} employe{business._count.employees !== 1 ? 's' : ''}</span>
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
  categoryId,
  subcategoryId,
  userLocation,
  radius,
  onCategoryChange,
  onSubcategoryChange,
  onRadiusChange,
  onClearAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  categoryId: string | undefined;
  subcategoryId: string | undefined;
  userLocation: { lat: number; lng: number } | null;
  radius: number;
  onCategoryChange: (id: string | undefined) => void;
  onSubcategoryChange: (id: string | undefined) => void;
  onRadiusChange: (radius: number) => void;
  onClearAll: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(categoryId || null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeFiltersCount = [
    categoryId,
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
                {/* Categories */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Categorie</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onCategoryChange(undefined);
                        onSubcategoryChange(undefined);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${
                        !categoryId
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      Toutes les categories
                    </button>
                    {categories.map((category) => (
                      <div key={category.id}>
                        <button
                          onClick={() => {
                            if (categoryId === category.id) {
                              setExpandedCategory(expandedCategory === category.id ? null : category.id);
                            } else {
                              onCategoryChange(category.id);
                              onSubcategoryChange(undefined);
                              setExpandedCategory(category.id);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                            categoryId === category.id
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
                                    onCategoryChange(category.id);
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

                {/* Radius (if geolocation active) */}
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

  // Support both slug-based (?category=coiffeur) and id-based (?categoryId=xxx) URL params
  const categorySlugParam = searchParams.get('category') || undefined;
  const subcategorySlugParam = searchParams.get('subcategory') || undefined;
  const categoryIdParam = searchParams.get('categoryId') || undefined;
  const subcategoryIdParam = searchParams.get('subcategoryId') || undefined;

  const [categoryId, setCategoryId] = useState<string | undefined>(categoryIdParam);
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>(subcategoryIdParam);
  const [slugsResolved, setSlugsResolved] = useState(!categorySlugParam);

  // Auto-detect location on mount: use URL params or request geolocation
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    } else if (!searchParams.get('city') && !searchParams.get('q')) {
      // No location or search context provided — auto-detect position
      if (navigator.geolocation) {
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationLoading(false);
          },
          () => {
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, []);

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

  const autoExpandedRef = useRef(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Resolve slug params to IDs once categories are loaded
  useEffect(() => {
    if (!categorySlugParam || !categories) return;
    const cat = categories.find((c) => c.slug === categorySlugParam);
    if (cat) {
      setCategoryId(cat.id);
      if (subcategorySlugParam && cat.children) {
        const sub = cat.children.find((s) => s.slug === subcategorySlugParam);
        if (sub) setSubcategoryId(sub.id);
      }
    }
    setSlugsResolved(true);
  }, [categories, categorySlugParam, subcategorySlugParam]);

  const { data: businessesData, isLoading } = useQuery({
    queryKey: ['businesses', { q: debouncedSearch, city: debouncedCity, categoryId: subcategoryId || categoryId, userLocation, radius }],
    queryFn: () => api.searchBusinesses({
      q: debouncedSearch,
      city: debouncedCity,
      categoryId: subcategoryId || categoryId,
      limit: 20,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius }),
    }),
    enabled: slugsResolved,
  });

  // Auto-expand radius when no results found with geolocation active
  useEffect(() => {
    if (
      userLocation &&
      !isLoading &&
      businessesData?.total === 0 &&
      radius < 50 &&
      !autoExpandedRef.current
    ) {
      autoExpandedRef.current = true;
      const nextRadius = RADIUS_OPTIONS.find((r) => r.value > radius);
      if (nextRadius) {
        setRadius(nextRadius.value);
      }
    }
    if (businessesData && businessesData.total > 0) {
      autoExpandedRef.current = false;
    }
  }, [businessesData, userLocation, radius, isLoading]);

  const selectedCategory = categoryId
    ? categories?.find((c) => c.id === categoryId)
    : null;

  const updateCategory = (id: string | undefined) => {
    setCategoryId(id);
    setSubcategoryId(undefined);
  };

  const clearAllFilters = () => {
    setCategoryId(undefined);
    setSubcategoryId(undefined);
    setSearchQuery('');
    setCityQuery('');
    setUserLocation(null);
    router.push('/search');
  };

  const hasActiveFilters = categoryId || cityQuery || userLocation;

  const activeFiltersCount = [
    categoryId,
    cityQuery,
    userLocation,
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-6 pt-24">
      {/* Search Header */}
      <div className="mb-8">
        {/* Search Card */}
        <div className="bg-linear-to-br from-gold-soft/50 to-muted/30 rounded-3xl p-6 md:p-8 mb-6">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Trouvez le professionnel ideal
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
                  placeholder="Ou ?"
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
          </div>
        </div>

        {/* Radius selector - shown when using geolocation */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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

        {/* Filters Bar - Desktop */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {/* Category dropdown */}
          <CategoryDropdown
            categories={categories || []}
            selectedCategoryId={categoryId}
            subcategoryId={subcategoryId}
            onCategorySelect={(id) => updateCategory(id)}
            onSubcategorySelect={(catId, subId) => {
              setCategoryId(catId);
              setSubcategoryId(subId);
            }}
            onClear={() => {
              updateCategory(undefined);
              setSubcategoryId(undefined);
            }}
          />

          <div className="w-px h-6 bg-border" />

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

        {/* Mobile Filter Button */}
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
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory.name}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => updateCategory(undefined)}
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
                  onClick={() => setSubcategoryId(undefined)}
                />
                {selectedCategory.children.map((sub) => (
                  <FilterChip
                    key={sub.id}
                    label={sub.name}
                    active={subcategoryId === sub.id}
                    onClick={() => setSubcategoryId(sub.id)}
                    onClear={() => setSubcategoryId(undefined)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Professionnels</h1>
        {businessesData && (
          <span className="text-sm text-muted-foreground">
            {businessesData.total} resultat{businessesData.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Results Grid */}
      {isLoading ? (
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
          <h2 className="text-lg font-medium mb-2">Aucun professionnel trouve</h2>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos criteres de recherche
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

      {/* Mobile Filters Modal */}
      <MobileFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        categories={categories || []}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        userLocation={userLocation}
        radius={radius}
        onCategoryChange={updateCategory}
        onSubcategoryChange={setSubcategoryId}
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
