'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { Search, X, ChevronRight, ChevronDown, SlidersHorizontal, Building2, MapPin, Navigation, Loader2, BadgeCheck, List, Map as MapIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { CategoryDropdown } from '@/components/search/category-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { Category, Business } from '@/types';
import { formatPrice } from '@/lib/utils';
import 'mapbox-gl/dist/mapbox-gl.css';

// Dynamic import for Mapbox to avoid loading on every page
let mapboxgl: typeof import('mapbox-gl') | null = null;
const loadMapbox = async () => {
  if (!mapboxgl) {
    mapboxgl = await import('mapbox-gl');
  }
  return mapboxgl;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Keyword → category matching ──────────────────────────────────────
// Maps common search terms to category slugs (case-insensitive)
const CATEGORY_KEYWORDS: Record<string, string> = {
  // Direct category names
  coiffeur: 'coiffeur',
  coiffeuse: 'coiffeur',
  coiffure: 'coiffeur',
  barbier: 'barbier',
  barber: 'barbier',
  manucure: 'manucure',
  manicure: 'manucure',
  onglerie: 'manucure',
  ongles: 'manucure',
  'institut de beauté': 'institut-de-beaute',
  institut: 'institut-de-beaute',
  beauté: 'institut-de-beaute',
  esthéticienne: 'institut-de-beaute',
  estheticienne: 'institut-de-beaute',
  'bien-être': 'bien-etre',
  'bien être': 'bien-etre',
  bienêtre: 'bien-etre',
  spa: 'bien-etre',
  // Subcategory keywords → bien-etre
  massage: 'bien-etre',
  masseur: 'bien-etre',
  masseuse: 'bien-etre',
  réflexologue: 'bien-etre',
  reflexologue: 'bien-etre',
  réflexologues: 'bien-etre',
  reflexologues: 'bien-etre',
  réflexologie: 'bien-etre',
  reflexologie: 'bien-etre',
  sophrologue: 'bien-etre',
  sophrologues: 'bien-etre',
  sophrologie: 'bien-etre',
  hypnothérapeute: 'bien-etre',
  hypnotherapeute: 'bien-etre',
  hypnothérapeutes: 'bien-etre',
  hypnotherapeutes: 'bien-etre',
  hypnothérapie: 'bien-etre',
  hypnotherapie: 'bien-etre',
  naturopathe: 'bien-etre',
  naturopathes: 'bien-etre',
  naturopathie: 'bien-etre',
};

function matchCategoryKeyword(query: string, categories: Category[]): { categoryId: string; subcategoryId?: string } | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const slug = CATEGORY_KEYWORDS[normalized];
  if (!slug) return null;

  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;

  // Check if the keyword matches a subcategory name/slug (incl. singular/plural)
  if (category.children) {
    const sub = category.children.find((s) => {
      const name = s.name.toLowerCase();
      const slug = s.slug;
      return name === normalized || slug === normalized
        || name === normalized + 's' || slug === normalized + 's'
        || name.replace(/s$/, '') === normalized || slug.replace(/s$/, '') === normalized;
    });
    if (sub) return { categoryId: category.id, subcategoryId: sub.id };
  }

  return { categoryId: category.id };
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 20, label: '20 km' },
  { value: 30, label: '30 km' },
  { value: 50, label: '50 km' },
];

function FilterChip({ label, active, onClick, onClear }: { label: string; active: boolean; onClick: () => void; onClear?: () => void }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
        active ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-foreground hover:bg-muted'
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

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ── Image carousel for cards ─────────────────────────────────────────
function CardImageCarousel({ business }: { business: Business }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);

  // Build image list: cover first, then gallery images (deduplicated)
  const allImages = (() => {
    const imgs: string[] = [];
    if (business.coverUrl) imgs.push(business.coverUrl);
    if (business.images) {
      for (const img of business.images) {
        if (!imgs.includes(img.url)) imgs.push(img.url);
      }
    }
    return imgs;
  })();

  const goTo = (newIndex: number) => {
    setPrevIndex(currentIndex);
    setCurrentIndex(newIndex);
  };

  if (allImages.length === 0) {
    return business.logoUrl ? (
      <div className="w-full h-full flex items-center justify-center bg-primary/5">
        <img src={business.logoUrl} alt={business.name} className="w-16 h-16 object-contain" />
      </div>
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-primary/5">
        <Building2 className="w-10 h-10 text-primary/40" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {/* Previous image stays underneath during transition */}
      <img src={allImages[prevIndex]} alt="" className="w-full h-full object-cover absolute inset-0" />
      {/* New image fades in on top */}
      <motion.img
        key={currentIndex}
        src={allImages[currentIndex]}
        alt={business.name}
        className="w-full h-full object-cover absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      />

      {/* Navigation arrows */}
      {allImages.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm z-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          {currentIndex < allImages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm z-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-1">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── List card for left panel ──────────────────────────────────────────
function BusinessListCard({ business, isSelected, onSelect, onHover, onLeave }: { business: Business; isSelected: boolean; onSelect: () => void; onHover?: () => void; onLeave?: () => void }) {
  // Get price range from services
  const priceRange = (() => {
    if (!business.services || business.services.length === 0) return null;
    const prices = business.services.map((s) => s.priceCents).filter(Boolean);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  })();

  return (
    <div onClick={onSelect} onMouseEnter={onHover} onMouseLeave={onLeave} className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}>
      {/* Cover image carousel — tall and impactful */}
      <div className="w-full h-40 rounded-xl overflow-hidden bg-muted mb-3 relative">
        <CardImageCarousel business={business} />
        {business.distance !== undefined && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 z-1">
            <Navigation className="w-3 h-3" />
            {formatDistance(business.distance)}
          </div>
        )}
        {business.category && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-1">
            {business.category.name}
          </div>
        )}
      </div>

      {/* Business info */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-semibold text-base truncate">{business.name}</h3>
          {business.isVerified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
        </div>
        {priceRange && (
          <span className="text-sm font-bold shrink-0">
            {priceRange.min === priceRange.max
              ? formatPrice(priceRange.min)
              : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`}
          </span>
        )}
      </div>

      {business.address && business.city ? (
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{business.address}, {business.city}</span>
        </p>
      ) : business.city ? (
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {business.city}
        </p>
      ) : null}

      {/* Services preview */}
      {business.services && business.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {business.services.slice(0, 3).map((service) => (
            <span key={service.id} className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
              {service.name}
            </span>
          ))}
          {business._count && business._count.services > 3 && (
            <span className="text-xs text-muted-foreground px-1 py-0.5">
              +{business._count.services - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/business/${business.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Plus d&apos;informations
        </Link>
        <Link
          href={`/business/${business.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="px-5 py-2 bg-foreground text-background text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Voir
        </Link>
      </div>
    </div>
  );
}

// ── Mobile Filters Modal ──────────────────────────────────────────────
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
  const t = useTranslations('search');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeFiltersCount = [categoryId, userLocation].filter(Boolean).length;

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-bold text-lg">{t('filters')}</span>
                  {activeFiltersCount > 0 && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>}
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <label className="text-sm font-semibold mb-3 block">{t('category')}</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onCategoryChange(undefined);
                        onSubcategoryChange(undefined);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${!categoryId ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted/50 hover:bg-muted'}`}
                    >
                      {t('allCategories')}
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
                          className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${categoryId === category.id ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted/50 hover:bg-muted'}`}
                        >
                          <span>{category.name}</span>
                          {category.children && category.children.length > 0 && <ChevronRight className={`w-4 h-4 transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`} />}
                        </button>
                        <AnimatePresence>
                          {expandedCategory === category.id && category.children && category.children.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-4 mt-2 space-y-1 overflow-hidden">
                              {category.children.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    onCategoryChange(category.id);
                                    onSubcategoryChange(sub.id);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${subcategoryId === sub.id ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-muted'}`}
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

                {userLocation && (
                  <div>
                    <label className="text-sm font-semibold mb-3 block">{t('nearMe')}</label>
                    <div className="flex flex-wrap gap-2">
                      {RADIUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onRadiusChange(option.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${radius === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border shrink-0 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                >
                  {t('clearFilters')}
                </Button>
                <Button className="flex-1 rounded-xl" onClick={onClose}>
                  Appliquer
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Map popup card ────────────────────────────────────────────────────
function MapPopupCard({ business, onClose }: { business: Business; onClose: () => void }) {
  // Get price range from services
  const priceRange = (() => {
    if (!business.services || business.services.length === 0) return null;
    const prices = business.services.map((s) => s.priceCents).filter(Boolean);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[380px] z-10"
    >
      <div className="bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Image */}
        <div className="h-40 relative">
          <CardImageCarousel business={business} />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors cursor-pointer z-2"
          >
            <X className="w-4 h-4" />
          </button>
          {business.distance !== undefined && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 z-1 shadow-sm">
              <Navigation className="w-3.5 h-3.5" />
              {formatDistance(business.distance)}
            </div>
          )}
          {business.category && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-1">
              {business.category.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-base truncate">{business.name}</h3>
              {business.isVerified && <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />}
            </div>
            {priceRange && (
              <span className="text-sm font-bold shrink-0">
                {priceRange.min === priceRange.max
                  ? formatPrice(priceRange.min)
                  : `dès ${formatPrice(priceRange.min)}`}
              </span>
            )}
          </div>

          {business.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{business.address ? `${business.address}, ${business.city}` : business.city}</span>
            </p>
          )}

          {/* Services tags */}
          {business.services && business.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {business.services.slice(0, 3).map((service) => (
                <span key={service.id} className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                  {service.name}
                </span>
              ))}
              {business._count && business._count.services > 3 && (
                <span className="text-xs text-muted-foreground px-1 py-0.5">
                  +{business._count.services - 3}
                </span>
              )}
            </div>
          )}

          <Link
            href={`/business/${business.slug}`}
            className="block w-full text-center px-5 py-2.5 bg-foreground text-background text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Voir
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mapbox component ──────────────────────────────────────────────────
function SearchMap({
  businesses,
  userLocation,
  selectedBusinessId,
  onSelectBusiness,
}: {
  businesses: Business[];
  userLocation: { lat: number; lng: number } | null;
  selectedBusinessId: string | null;
  onSelectBusiness: (id: string | null) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load mapbox dynamically
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    loadMapbox().then((mb) => {
      if (cancelled || !mapContainerRef.current) return;

      const map = new mb.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: userLocation ? [userLocation.lng, userLocation.lat] : DEFAULT_CENTER,
        zoom: 12,
        accessToken: MAPBOX_TOKEN,
      });

      map.addControl(new mb.NavigationControl(), 'bottom-right');
      map.on('load', () => {
        setMapReady(true);
        setMapLoaded(true);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Center map when user location changes
  useEffect(() => {
    if (mapRef.current && userLocation && mapLoaded) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 1500,
      });
    }
  }, [userLocation, mapLoaded]);

  // Update markers (only when businesses list changes, NOT on selection)
  useEffect(() => {
    if (!mapRef.current || !mapReady || !mapboxgl) return;
    const mb = mapboxgl;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mb.LngLatBounds();
    let hasValidCoords = false;

    businesses.forEach((business) => {
      if (!business.latitude || !business.longitude) return;
      hasValidCoords = true;

      const el = document.createElement('div');
      el.className = 'search-marker';
      el.dataset.businessId = business.id;
      el.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="white" stroke="#d4d4d4" stroke-width="1.5"/>
        <path d="M20 10c-4.42 0-8 3.58-8 8 0 5.6 8 13.5 8 13.5s8-7.9 8-13.5c0-4.42-3.58-8-8-8z" fill="#1a1a1a"/>
        <circle cx="20" cy="18" r="3" fill="white"/>
      </svg>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectBusiness(business.id);
      });

      const marker = new mb.Marker({ element: el, anchor: 'center' }).setLngLat([business.longitude, business.latitude]).addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([business.longitude, business.latitude]);
    });

    if (userLocation) {
      bounds.extend([userLocation.lng, userLocation.lat]);
    }

    if (hasValidCoords) {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 14,
        duration: 1000,
      });
    }
  }, [businesses, mapReady, userLocation, onSelectBusiness]);

  // Handle selection: fly to pin + toggle visual state
  useEffect(() => {
    if (!mapRef.current) return;

    // Reset all markers
    document.querySelectorAll('.search-marker').forEach((el) => el.classList.remove('selected'));

    if (!selectedBusinessId) return;

    const biz = businesses.find((b) => b.id === selectedBusinessId);
    if (biz?.latitude && biz?.longitude) {
      mapRef.current.flyTo({ center: [biz.longitude, biz.latitude], zoom: 15, duration: 800 });
    }

    const selectedEl = document.querySelector(`[data-business-id="${selectedBusinessId}"]`);
    if (selectedEl) selectedEl.classList.add('selected');
  }, [selectedBusinessId, businesses]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

// ── Address suggestion type ───────────────────────────────────────────
interface AddressSuggestion {
  label: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

// ── Main search content ───────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Location state - either city text search OR geolocation coordinates
  const [cityInputValue, setCityInputValue] = useState(searchParams.get('city') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const cityInputRef = useRef<HTMLDivElement>(null);

  // Geolocation state (only via "Autour de moi" button)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState<number>(15);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedCityInput = useDebounce(cityInputValue, 300);

  // Category state
  const categorySlugParam = searchParams.get('category') || undefined;
  const subcategorySlugParam = searchParams.get('subcategory') || undefined;
  const categoryIdParam = searchParams.get('categoryId') || undefined;
  const subcategoryIdParam = searchParams.get('subcategoryId') || undefined;

  const [categoryId, setCategoryId] = useState<string | undefined>(categoryIdParam);
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>(subcategoryIdParam);
  const [slugsResolved, setSlugsResolved] = useState(!categorySlugParam);

  // Restore lat/lng from URL params (e.g. shared link)
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  }, []);

  // Address autocomplete via api-adresse.data.gouv.fr
  const { data: addressSuggestions } = useQuery({
    queryKey: ['address-search', debouncedCityInput],
    queryFn: async () => {
      const result = await api.searchAddress(debouncedCityInput, 5);
      return result.suggestions;
    },
    enabled: debouncedCityInput.length >= 3 && !selectedLocation && !userLocation,
  });

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedLocation({ lat: suggestion.latitude, lng: suggestion.longitude, label: suggestion.city || suggestion.label });
    setCityInputValue(suggestion.city || suggestion.label);
    setUserLocation({ lat: suggestion.latitude, lng: suggestion.longitude }); // Use geo search
    setShowSuggestions(false);
  };

  const handleClearLocation = () => {
    setCityInputValue('');
    setSelectedLocation(null);
    setUserLocation(null);
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedLocation(null);
        setCityInputValue('');
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const autoExpandedRef = useRef(false);

  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api.getCategories(),
  });

  // Resolve slug params
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

  // Auto-match search query to category filter
  useEffect(() => {
    if (!categories || !debouncedSearch) return;
    const match = matchCategoryKeyword(debouncedSearch, categories);
    if (match) {
      setCategoryId(match.categoryId);
      if (match.subcategoryId) setSubcategoryId(match.subcategoryId);
      setSearchQuery(''); // Clear text search since we matched a category
    }
  }, [debouncedSearch, categories]);

  const { data: businessesData, isLoading } = useQuery({
    queryKey: ['businesses', { q: debouncedSearch, categoryId: subcategoryId || categoryId, userLocation, radius }],
    queryFn: () =>
      api.searchBusinesses({
        q: debouncedSearch || undefined,
        categoryId: subcategoryId || categoryId,
        limit: 50,
        ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius }),
      }),
    enabled: slugsResolved,
  });

  const businesses = businessesData?.data || [];

  // Auto-expand radius
  useEffect(() => {
    if (userLocation && !isLoading && businessesData?.total === 0 && radius < 50 && !autoExpandedRef.current) {
      autoExpandedRef.current = true;
      const nextRadius = RADIUS_OPTIONS.find((r) => r.value > radius);
      if (nextRadius) setRadius(nextRadius.value);
    }
    if (businessesData && businessesData.total > 0) autoExpandedRef.current = false;
  }, [businessesData, userLocation, radius, isLoading]);

  const selectedCategory = categoryId ? categories?.find((c) => c.id === categoryId) : null;

  const updateCategory = (id: string | undefined) => {
    setCategoryId(id);
    setSubcategoryId(undefined);
  };

  const clearAllFilters = () => {
    setCategoryId(undefined);
    setSubcategoryId(undefined);
    setSearchQuery('');
    handleClearLocation();
    router.push('/search');
  };

  const hasActiveFilters = categoryId || selectedLocation || userLocation;
  const activeFiltersCount = [categoryId, selectedLocation || userLocation].filter(Boolean).length;

  const selectedBusiness = selectedBusinessId ? businesses.find((b) => b.id === selectedBusinessId) : null;

  // Location display label
  const locationLabel = userLocation && !selectedLocation ? 'Autour de moi' : selectedLocation?.label || '';

  // Scroll selected card into view
  useEffect(() => {
    if (selectedBusinessId && listRef.current) {
      const el = listRef.current.querySelector(`[data-list-id="${selectedBusinessId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedBusinessId]);

  const handleSelectBusiness = useCallback((id: string | null) => {
    setSelectedBusinessId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      {/* Marker styles */}
      <style jsx global>{`
        .search-marker {
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        .search-marker:hover,
        .search-marker.hovered {
          transform: scale(1.2);
          filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3));
          z-index: 10;
        }
        .search-marker.hovered svg circle:first-child {
          fill: #3b82f6;
          stroke: white;
          stroke-width: 2;
        }
        .search-marker.hovered svg path {
          fill: white;
        }
        .search-marker.hovered svg circle:last-child {
          fill: #3b82f6;
        }
        .search-marker.selected {
          transform: scale(1.25);
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
          z-index: 20;
        }
        .search-marker.selected svg circle:first-child {
          fill: #1a1a1a;
          stroke: white;
          stroke-width: 2;
        }
        .search-marker.selected svg path {
          fill: white;
        }
        .search-marker.selected svg circle:last-child {
          fill: #1a1a1a;
        }
      `}</style>

      <div className="flex h-full overflow-hidden">
        {/* ── Left Panel ── */}
        <div className={`w-full md:w-[440px] lg:w-[520px] xl:w-[560px] shrink-0 flex flex-col bg-surface border-r border-border z-10 ${showMobileMap ? 'hidden md:flex' : 'flex'}`}>
          {/* Search bar */}
          <div className="p-4 pb-3 pt-25 border-b border-border space-y-2.5">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('placeholder')}
                className="pl-10 pr-9 h-11 rounded-xl bg-muted/30 border-border/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Location input + Autour de moi */}
            <div className="flex gap-2">
              <div ref={cityInputRef} className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={locationLabel || cityInputValue}
                  onChange={(e) => {
                    setCityInputValue(e.target.value);
                    setSelectedLocation(null);
                    setUserLocation(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (addressSuggestions?.length) setShowSuggestions(true);
                  }}
                  placeholder={t('nearMe')}
                  className="pl-10 pr-9 h-11 rounded-xl bg-muted/30 border-border/50"
                  disabled={!!(userLocation && !selectedLocation)}
                />
                {(cityInputValue || selectedLocation || (userLocation && !selectedLocation)) && (
                  <button onClick={handleClearLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Address suggestions dropdown */}
                <AnimatePresence>
                  {showSuggestions && addressSuggestions && addressSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto"
                    >
                      {addressSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectAddress(suggestion)}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{suggestion.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Autour de moi button */}
              <button
                onClick={requestLocation}
                disabled={locationLoading}
                className={`inline-flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-medium transition-colors cursor-pointer shrink-0 ${
                  userLocation && !selectedLocation ? 'bg-primary text-primary-foreground' : 'bg-muted/30 border border-border/50 text-foreground hover:bg-muted'
                }`}
              >
                {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('nearMe')}</span>
              </button>
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Desktop category dropdown */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setShowFiltersModal(true)}
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtres
                {activeFiltersCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>}
              </button>

              {/* Radius pills - only when geolocation is active */}
              {userLocation && (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-[11px] text-muted-foreground">{t('nearMe')}:</span>
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRadius(opt.value)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                        radius === opt.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer ml-auto">
                  {t('clearFilters')}
                </button>
              )}
            </div>

            {/* Subcategory chips */}
            <AnimatePresence>
              {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="hidden md:block overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <FilterChip label="Toutes" active={!subcategoryId} onClick={() => setSubcategoryId(undefined)} />
                    {selectedCategory.children.map((sub) => (
                      <FilterChip key={sub.id} label={sub.name} active={subcategoryId === sub.id} onClick={() => setSubcategoryId(sub.id)} onClear={() => setSubcategoryId(undefined)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results count */}
          <div className="px-4 py-2 border-b border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                'Recherche...'
              ) : (
                <>
                  <span className="font-semibold text-foreground">{businessesData?.total || 0}</span> resultat{(businessesData?.total || 0) !== 1 ? 's' : ''}
                  {userLocation && !selectedLocation && ` autour de vous (${radius} km)`}
                  {selectedLocation && ` a ${selectedLocation.label} (${radius} km)`}
                </>
              )}
            </p>
          </div>

          {/* Business list */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-28 h-22 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-36 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium mb-1">{t('noResults')}</p>
                <p className="text-xs text-muted-foreground mb-3">{t('noResultsDesc')}</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    {t('clearFilters')}
                  </Button>
                )}
              </div>
            ) : (
              businesses.map((business) => (
                <div key={business.id} data-list-id={business.id}>
                  <BusinessListCard
                    business={business}
                    isSelected={selectedBusinessId === business.id}
                    onSelect={() => handleSelectBusiness(business.id)}
                    onHover={() => {
                      document.querySelectorAll('.search-marker.hovered').forEach((el) => el.classList.remove('hovered'));
                      document.querySelector(`[data-business-id="${business.id}"]`)?.classList.add('hovered');
                    }}
                    onLeave={() => {
                      document.querySelector(`[data-business-id="${business.id}"]`)?.classList.remove('hovered');
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Map panel ── */}
        <div className={`flex-1 relative min-h-0 ${showMobileMap ? 'block h-full w-full' : 'hidden md:block'}`}>
          {MAPBOX_TOKEN ? (
            <SearchMap businesses={businesses} userLocation={userLocation} selectedBusinessId={selectedBusinessId} onSelectBusiness={handleSelectBusiness} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <p className="text-sm text-muted-foreground">Mapbox token missing</p>
            </div>
          )}

          {/* Popup for selected business */}
          <AnimatePresence>{selectedBusiness && <MapPopupCard business={selectedBusiness} onClose={() => setSelectedBusinessId(null)} />}</AnimatePresence>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => setShowMobileMap(!showMobileMap)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-full shadow-xl text-sm font-semibold cursor-pointer"
          >
            {showMobileMap ? (
              <>
                <List className="w-4 h-4" />
                {t('listView')}
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4" />
                {t('mapView')}
              </>
            )}
          </button>
        </div>
      </div>

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
    </>
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
