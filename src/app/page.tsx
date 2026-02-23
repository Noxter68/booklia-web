'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  BadgeCheck,
  ArrowRight,
  Search,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Business, Category } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';

// Category images (Unsplash)
const CATEGORY_IMAGES: Record<string, string> = {
  coiffeur: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
  barbier: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
  manucure: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
  'institut-de-beaute': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
  'bien-etre': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
};

// Horizontal Slider component with navigation arrows
function HorizontalSlider({
  children,
  title,
  subtitle,
  viewAllLink,
  viewAllLabel,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
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
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border border-border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'hover:bg-muted hover:border-primary/30 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed'
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
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Link href={viewAllLink} className="hidden md:block">
            <Button variant="outline" className="rounded-full">
              {viewAllLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

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

// Business Card
function HomeBusinessCard({ business }: { business: Business }) {
  const serviceCount = business._count?.services || business.services?.length || 0;

  return (
    <Link href={`/business/${business.slug}`} className="block snap-start">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-72 sm:w-80 bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300"
      >
        <div className="h-36 relative">
          {business.coverUrl ? (
            <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 via-primary/10 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

          {business.isVerified && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <BadgeCheck className="w-4 h-4 text-foreground" />
              <span className="text-xs font-semibold text-foreground">Vérifié</span>
            </div>
          )}

          <div className="absolute -bottom-5 left-4">
            <div className="w-14 h-14 bg-surface border-[3px] border-surface rounded-xl shadow-md flex items-center justify-center overflow-hidden">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 pt-7">
          <h3 className="font-semibold text-base mb-1 truncate">{business.name}</h3>
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
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { latitude, longitude, hasPosition } = useGeolocation();

  // Parallax for hero
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const { data: latestBusinesses } = useQuery({
    queryKey: ['latestBusinesses'],
    queryFn: () => api.searchBusinesses({ limit: 10, sortBy: 'recent' }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    if (hasPosition) {
      params.set('lat', String(latitude));
      params.set('lng', String(longitude));
    }
    router.push(`/search?${params.toString()}`);
  };

  const { data: dbCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const benefits = [
    {
      title: 'Reservation instantanee',
      description: 'Reservez en quelques clics, 24h/24 et 7j/7. Plus besoin d\'appeler.',
    },
    {
      title: 'Professionnels verifies',
      description: 'Chaque prestataire est verifie par notre equipe.',
    },
    {
      title: 'Avis authentiques',
      description: 'Seuls les clients ayant realise une prestation peuvent laisser un avis.',
    },
    {
      title: 'Confirmation immediate',
      description: 'Confirmation instantanee et rappels avant votre rendez-vous.',
    },
  ];

  const stats = [
    { value: '+50%', label: 'de frequence sur les rdv pris en ligne' },
    { value: '4x', label: 'moins d\'oublis avec les rappels automatiques' },
    { value: '50%', label: 'des rdv pris en dehors des horaires d\'ouverture' },
  ];

  return (
    <div className="flex flex-col">
      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden -mt-20">
        {/* Background with parallax */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0"
        >
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 transition-all duration-700 ${
              isFocused ? 'blur-sm' : ''
            }`}
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=2574&auto=format&fit=crop)',
            }}
          />
        </motion.div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/60" />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 text-center text-white pt-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium">
              La plateforme de reservation beaute & bien-etre
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Reservez chez les
            <br />
            <span className="bg-linear-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              meilleurs professionnels
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Coiffure, barbier, manucure, institut de beaute, bien-etre.
            <br className="hidden md:block" />
            Trouvez et reservez en quelques secondes.
          </motion.p>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onSubmit={handleSearch}
            className="max-w-xl mx-auto mb-12"
          >
            <div ref={searchContainerRef}>
              <div
                className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
                  isFocused ? 'shadow-white/10 ring-2 ring-white/20' : ''
                }`}
              >
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Search className="w-5 h-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Coiffeur, Barbier, Manucure..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="flex-1 text-gray-900 placeholder:text-gray-400 outline-none text-base bg-transparent"
                  />
                  <button
                    type="submit"
                    className="h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-all cursor-pointer shrink-0"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Quick category links */}
          {dbCategories && dbCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {dbCategories.filter(c => !c.parentId).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.slug}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full text-sm text-white/80 hover:text-white transition-all"
                >
                  {category.name}
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent" />
      </section>

      {/* ==================== STATS ==================== */}
      <section className="relative z-10 -mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.04 }}
                className="bg-surface border border-border rounded-2xl p-8 shadow-lg cursor-default transition-shadow hover:shadow-xl hover:border-primary/20"
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      {dbCategories && dbCategories.filter(c => !c.parentId).length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Explorez nos categories
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Trouvez le professionnel adapte a vos besoins
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {dbCategories.filter(c => !c.parentId).map((category, index) => {
                const image = CATEGORY_IMAGES[category.slug];
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <Link
                      href={`/search?category=${category.slug}`}
                      className="group block relative h-52 md:h-64 rounded-2xl overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="font-semibold text-white text-base">{category.name}</span>
                        {category.children && category.children.length > 0 && (
                          <p className="text-white/70 text-xs mt-0.5">
                            {category.children.length} specialite{category.children.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==================== BENEFITS ==================== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi Sidely ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Une experience de reservation simple, rapide et securisee
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-surface p-8 md:p-10 group hover:bg-muted/30 transition-colors"
              >
                <span className="text-5xl md:text-6xl font-bold text-primary/10 block mb-4 leading-none">0{index + 1}</span>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ca marche ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Prenez rendez-vous en 3 etapes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-0">
            {[
              { step: '01', title: 'Trouvez', description: 'Recherchez un professionnel par categorie, nom ou localisation.' },
              { step: '02', title: 'Reservez', description: 'Choisissez le service, l\'employe et le creneau qui vous conviennent.' },
              { step: '03', title: 'Profitez', description: 'Rendez-vous confirme. Apres la prestation, laissez un avis.' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className={`relative p-8 ${index < 2 ? 'md:border-r md:border-border' : ''}`}
              >
                <span className="text-5xl md:text-6xl font-bold text-primary/10 block mb-4 leading-none">{item.step}</span>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED BUSINESSES ==================== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
          >
            {latestBusinesses?.data && latestBusinesses.data.length > 0 ? (
              <HorizontalSlider
                title="Decouvrez nos professionnels"
                subtitle="Des prestataires de confiance pres de chez vous"
                viewAllLink="/search"
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
                <h3 className="font-semibold text-lg mb-2">Bientot disponible</h3>
                <p className="text-muted-foreground">Les professionnels arrivent bientot !</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ==================== SOCIAL PROOF ==================== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: content */}
              <div>
                <span className="inline-block px-4 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium rounded-full mb-4">
                  Confiance & transparence
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Des avis sur lesquels vous pouvez compter
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Chez Sidely, chaque avis est lie a une prestation reelle. Pas de faux avis, pas de notes gonflees. Juste des retours honnetes de vrais clients.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: BadgeCheck, text: 'Avis lies a des prestations reelles' },
                    { icon: Shield, text: 'Professionnels verifies par notre equipe' },
                    { icon: Users, text: 'Communaute de confiance' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 dark:bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: visual card */}
              <div className="relative">
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">M</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Marie L.</p>
                      <p className="text-xs text-muted-foreground">Il y a 2 jours</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Super experience ! L'interface est intuitive, j'ai pu reserver en 2 minutes. Le coiffeur etait ponctuel et professionnel. Je recommande !"
                  </p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
                    Prestation verifiee
                  </div>
                </div>

                {/* Decorative second card behind */}
                <div className="absolute -bottom-4 -right-4 -z-10 w-full h-full bg-muted/50 rounded-2xl border border-border" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center"
          >
            {/* Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Pret a trouver votre professionnel ?
              </h2>
              <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
                Inscription gratuite. Reservation en ligne 24h/24.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 bg-white text-primary hover:bg-white/90 border-white"
                  onClick={() => router.push('/search')}
                >
                  Explorer les professionnels
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 text-primary-foreground hover:bg-white/10"
                  onClick={() => router.push('/auth/register')}
                >
                  Creer un compte
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
