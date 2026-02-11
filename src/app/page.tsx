'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Search,
  ChevronDown,
  MapPin,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Service, Business } from '@/types';
import { formatPrice } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// Horizontal Slider component with navigation arrows
function HorizontalSlider({
  children,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  viewAllLink,
  viewAllLabel,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  viewAllLink: string;
  viewAllLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        ref.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div>
      {/* Header with title and navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          </div>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Navigation arrows and view all button */}
        <div className="flex items-center gap-3">
          {/* Arrow buttons - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border border-border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'hover:bg-muted hover:border-primary/30 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-full border border-border flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'hover:bg-muted hover:border-primary/30 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Link href={viewAllLink}>
            <Button variant="outline" className="rounded-full hidden md:flex">
              {viewAllLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Mobile view all button */}
      <div className="md:hidden mt-6 text-center">
        <Link href={viewAllLink}>
          <Button variant="outline" className="rounded-full">
            {viewAllLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Helper to get the best avatar URL (first image or avatarUrl fallback)
function getProviderAvatarUrl(profile?: { avatarUrl?: string; images?: { url: string }[] }): string | undefined {
  if (profile?.images && profile.images.length > 0) {
    return profile.images[0].url;
  }
  return profile?.avatarUrl;
}

// Modern Service Card for homepage - with cover image support
function HomeServiceCard({ service }: { service: Service }) {
  const providerName = service.createdBy?.profile?.displayName || 'Utilisateur';
  const providerCity = service.createdBy?.profile?.city || service.city;
  const rating = service.createdBy?.reputation?.ratingAvg5;
  const ratingCount = service.createdBy?.reputation?.ratingCount || 0;
  const avatarUrl = getProviderAvatarUrl(service.createdBy?.profile);
  const coverUrl = service.createdBy?.profile?.coverUrl;

  return (
    <Link href={`/service/${service.id}`} className="block snap-start">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-72 sm:w-80 h-72 bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col"
      >
        {/* Cover image (if exists) */}
        {coverUrl && (
          <div className="h-28 relative">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Badge on cover */}
            <span className={`absolute top-2 left-2 text-xs font-medium px-2.5 py-1 rounded-full ${
              service.kind === 'OFFER'
                ? 'bg-green-500/90 text-white'
                : 'bg-blue-500/90 text-white'
            }`}>
              {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
            </span>

            {/* Price on cover */}
            <div className="absolute top-2 right-2">
              {service.priceCents ? (
                <span className="text-sm font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                  {formatPrice(service.priceCents)}{service.pricingType === 'HOURLY' && '/h'}
                </span>
              ) : null}
            </div>

            {/* Avatar overlay */}
            <div className="absolute -bottom-4 left-4">
              <div className="w-10 h-10 bg-surface border-2 border-surface rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-4 flex flex-col flex-1 ${coverUrl ? 'pt-6' : ''}`}>
          {/* Header without cover */}
          {!coverUrl && (
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                service.kind === 'OFFER'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
              </span>

              <div className="text-right">
                {service.priceCents ? (
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(service.priceCents)}{service.pricingType === 'HOURLY' && '/h'}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">À définir</span>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-2 leading-snug mb-1">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {service.description || 'Aucune description disponible'}
          </p>

          {/* Provider info + Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
            {!coverUrl && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
            )}
            <span className="font-medium text-foreground truncate max-w-20">{providerName}</span>
            {providerCity && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{providerCity}</span>
                </span>
              </>
            )}
          </div>

          {/* Footer: Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
            {rating && ratingCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({ratingCount})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Pas encore d'avis</span>
            )}

            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Modern Business Card for homepage
function HomeBusinessCard({ business }: { business: Business }) {
  const rating = business.owner?.reputation?.ratingAvg5;
  const ratingCount = business.owner?.reputation?.ratingCount || 0;
  const serviceCount = business._count?.services || business.services?.length || 0;

  return (
    <Link href={`/business/${business.slug}`} className="block snap-start">
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-72 sm:w-80 bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300"
      >
        {/* Cover image or gradient */}
        <div className="h-32 relative">
          {business.coverUrl ? (
            <img
              src={business.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Verified badge */}
          {business.isVerified && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Vérifié</span>
            </div>
          )}

          {/* Logo overlay */}
          <div className="absolute -bottom-6 left-5">
            <div className="w-16 h-16 bg-surface border-4 border-surface rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card content */}
        <div className="p-5 pt-8">
          {/* Business name */}
          <h3 className="font-semibold text-lg mb-1 truncate">{business.name}</h3>

          {/* Location and services count */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            {business.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {business.city}
              </span>
            )}
            {serviceCount > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {serviceCount} prestation{serviceCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Description */}
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {business.description}
            </p>
          )}

          {/* Footer with rating */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {rating && ratingCount > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({ratingCount})
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Nouveau</span>
            )}

            <span className="text-sm font-medium text-primary flex items-center gap-1">
              Voir
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchType, setSearchType] = useState<'services' | 'businesses'>('services');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch latest offers (services with kind=OFFER)
  const { data: latestOffers } = useQuery({
    queryKey: ['latestOffers'],
    queryFn: () => api.searchServices({
      kind: 'OFFER',
      limit: 10,
    }),
  });

  // Fetch latest businesses (sorted by most recent)
  const { data: latestBusinesses } = useQuery({
    queryKey: ['latestBusinesses'],
    queryFn: () => api.searchBusinesses({
      limit: 10,
      sortBy: 'recent',
    }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query);
    }
    if (searchType === 'businesses') {
      params.set('type', 'businesses');
    }
    router.push(`/search?${params.toString()}`);
  };

  const trustFeatures = [
    {
      icon: Star,
      title: 'Notes sur 5',
      description: 'Évaluez chaque prestation avec précision',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Système XP',
      description: 'Montez en niveau à chaque mission',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CheckCircle,
      title: 'Avis vérifiés',
      description: 'Seuls les utilisateurs ayant terminé une mission peuvent noter',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Shield,
      title: 'Score de confiance',
      description: 'Un algorithme qui calcule la fiabilité',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden -mt-20 pt-20">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ${
            isFocused ? 'scale-110 blur-sm' : 'scale-100'
          }`}
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2574&auto=format&fit=crop)',
          }}
        />
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isFocused ? 'bg-black/80' : 'bg-black/50'
          }`}
        />

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            Services de confiance,
            <br />
            <span className="bg-linear-to-r from-white via-white/90 to-white/70 bg-clip-text">
              entre particuliers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Offrez vos compétences ou trouvez l&apos;aide dont vous avez besoin.
            Un système de réputation transparent pour des échanges sereins.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative group" ref={searchContainerRef}>
              <div
                className={`absolute -inset-1 bg-linear-to-r from-white/20 via-white/10 to-white/20 rounded-full blur-lg transition-all duration-500 ${
                  isFocused ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="relative flex items-center">
                <Search className="absolute left-5 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder={searchType === 'businesses' ? "Rechercher un professionnel..." : "Que recherchez-vous ?"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className={`w-full h-14 md:h-16 pl-14 pr-36 md:pr-44 text-lg rounded-full border-2 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 ${
                    isFocused
                      ? 'border-white shadow-2xl shadow-white/25'
                      : 'border-white/50 shadow-xl'
                  }`}
                />
                <button
                  type="submit"
                  className="absolute right-2 h-10 md:h-12 px-6 md:px-8 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary-hover transition-all duration-300 hover:shadow-lg flex items-center gap-2 z-10 cursor-pointer"
                >
                  Rechercher
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Search Type Toggle */}
              <div className="flex justify-center mt-4">
                <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setSearchType('services')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      searchType === 'services'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Particuliers
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('businesses')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      searchType === 'businesses'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Professionnels
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="w-8 h-8 text-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Latest Services Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
          >
            {latestOffers?.data && latestOffers.data.length > 0 ? (
              <HorizontalSlider
                title="Derniers services"
                subtitle="Découvrez les dernières offres de la communauté"
                icon={Briefcase}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                viewAllLink="/search?kind=OFFER"
                viewAllLabel="Voir tout"
              >
                {latestOffers.data.map((service) => (
                  <HomeServiceCard key={service.id} service={service} />
                ))}
              </HorizontalSlider>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-3xl">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Aucun service disponible</h3>
                <p className="text-muted-foreground">Soyez le premier à proposer vos services !</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Latest Businesses Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
          >
            {latestBusinesses?.data && latestBusinesses.data.length > 0 ? (
              <HorizontalSlider
                title="Professionnels près de vous"
                subtitle="Des entreprises de confiance dans votre région"
                icon={Building2}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                viewAllLink="/search?type=businesses"
                viewAllLabel="Voir tout"
              >
                {latestBusinesses.data.map((business) => (
                  <HomeBusinessCard key={business.id} business={business} />
                ))}
              </HorizontalSlider>
            ) : (
              <div className="text-center py-16 bg-surface rounded-3xl border border-border">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Aucun professionnel disponible</h3>
                <p className="text-muted-foreground">Les professionnels arrivent bientôt !</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              La confiance au cœur
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Notre système de réputation garantit des échanges sereins
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {trustFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface rounded-2xl p-6 shadow-sm border border-border hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div
                  className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Rejoignez des milliers d&apos;utilisateurs qui échangent déjà des services en toute confiance
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 bg-white text-primary hover:bg-white/90 border-white"
                  onClick={() => router.push('/auth/register')}
                >
                  Créer un compte gratuit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 text-white hover:bg-white/10"
                  onClick={() => router.push('/search')}
                >
                  Explorer les services
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
