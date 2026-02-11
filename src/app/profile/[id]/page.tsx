'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Star,
  Shield,
  CheckCircle,
  Quote,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getTrustLevel } from '@/lib/utils';
import { PeopleImage, Review } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// ============================================
// IMAGE LIGHTBOX
// ============================================

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: PeopleImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    },
    [goNext, goPrev, onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <motion.img
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        src={images[currentIndex].url}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-sm">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// IMAGE GALLERY - Adaptive Planity style
// ============================================

function ImageGallery({
  images,
  onImageClick,
}: {
  images: PeopleImage[];
  onImageClick: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const count = sortedImages.length;

  // Mobile: single image with photo count badge
  const MobileGallery = () => (
    <div className="sm:hidden mb-6">
      <button
        onClick={() => onImageClick(0)}
        className="w-full h-64 rounded-xl overflow-hidden relative group cursor-pointer"
      >
        <img src={sortedImages[0].url} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        {count > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            1/{count}
          </div>
        )}
      </button>
    </div>
  );

  // 1 image - full width (desktop only different)
  if (count === 1) {
    return (
      <>
        <MobileGallery />
        <div className="hidden sm:block mb-6">
          <button
            onClick={() => onImageClick(0)}
            className="w-full h-96 rounded-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[0].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        </div>
      </>
    );
  }

  // 2 images - side by side on desktop
  if (count === 2) {
    return (
      <>
        <MobileGallery />
        <div className="hidden sm:flex mb-6 gap-2 h-96">
          <button
            onClick={() => onImageClick(0)}
            className="flex-1 rounded-l-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[0].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <button
            onClick={() => onImageClick(1)}
            className="flex-1 rounded-r-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[1].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        </div>
      </>
    );
  }

  // 3 images - 1 big left + 2 stacked right on desktop
  if (count === 3) {
    return (
      <>
        <MobileGallery />
        <div className="hidden sm:flex mb-6 gap-2 h-96">
          <button
            onClick={() => onImageClick(0)}
            className="w-1/2 rounded-l-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[0].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <div className="w-1/2 flex flex-col gap-2">
            <button
              onClick={() => onImageClick(1)}
              className="flex-1 rounded-tr-xl overflow-hidden relative group cursor-pointer"
            >
              <img src={sortedImages[1].url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
            <button
              onClick={() => onImageClick(2)}
              className="flex-1 rounded-br-xl overflow-hidden relative group cursor-pointer"
            >
              <img src={sortedImages[2].url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // 4+ images - 1 big left + 2x2 grid right on desktop (with +N overlay if more)
  return (
    <>
      <MobileGallery />
      <div className="hidden sm:flex mb-6 gap-2 h-96">
        <button
          onClick={() => onImageClick(0)}
          className="w-1/2 rounded-l-xl overflow-hidden relative group cursor-pointer"
        >
          <img src={sortedImages[0].url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        <div className="w-1/2 grid grid-cols-2 grid-rows-2 gap-2">
          <button
            onClick={() => onImageClick(1)}
            className="overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[1].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <button
            onClick={() => onImageClick(2)}
            className="rounded-tr-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[2].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <button
            onClick={() => onImageClick(3)}
            className="overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[3].url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <button
            onClick={() => onImageClick(count > 4 ? 4 : 3)}
            className="rounded-br-xl overflow-hidden relative group cursor-pointer"
          >
            <img src={sortedImages[Math.min(4, count - 1)].url} alt="" className="w-full h-full object-cover" />
            {count > 4 ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <span className="text-white font-medium text-sm">
                  +{count - 4} photos
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// STAR RATING
// ============================================

function StarRating({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================
// REVIEW CARD
// ============================================

function ReviewCard({ review }: { review: Review }) {
  const authorName = review.author?.profile?.displayName || 'Utilisateur';

  return (
    <div className="py-4 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          {review.author?.profile?.avatarUrl ? (
            <img
              src={review.author.profile.avatarUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-sm">{authorName}</span>
            <StarRating score={review.score} />
          </div>
          {review.comment && (
            <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TRUST BADGE
// ============================================

function TrustBadge({ elo }: { elo: number }) {
  const trust = getTrustLevel(elo);

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${trust.bgColor} ${trust.color}`}>
      <Shield className="w-4 h-4" />
      {trust.label}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.getProfile(id),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.getUserReviews(id),
    enabled: !!id,
  });

  const { data: services } = useQuery({
    queryKey: ['user-services', id],
    queryFn: () => api.getUserServices(id),
    enabled: !!id,
  });

  const images = user?.profile?.images || [];
  const publishedServices = services?.filter(s => s.status === 'PUBLISHED') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-48 sm:h-64 bg-muted rounded-2xl" />
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-muted rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-48 bg-muted rounded-lg" />
                <div className="h-5 w-32 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profil introuvable</h1>
          <p className="text-muted-foreground">Ce profil n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  const avgRating = user.reputation?.ratingAvg5
    ? user.reputation.ratingAvg5.toFixed(1)
    : null;

  const elo = user.reputation?.elo ?? 1000;
  const completedBookings = user.reputation?.completedBookings ?? 0;

  return (
    <div className="min-h-screen bg-background pb-12 pt-24">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Image Gallery */}
        {images.length > 0 && (
          <ImageGallery
            images={images}
            onImageClick={(index) => setLightboxIndex(index)}
          />
        )}

        {/* Main Layout: Content Left + Profile Card Right */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Bio - Hidden on mobile (shown in compact card) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:block"
            >
              <h1 className="text-3xl font-bold mb-3">
                {user.profile?.displayName || 'Utilisateur'}
              </h1>
              {user.profile?.bio && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {user.profile.bio}
                </p>
              )}
            </motion.div>

            {/* Bio on mobile only */}
            {user.profile?.bio && (
              <p className="lg:hidden text-muted-foreground text-sm leading-relaxed">
                {user.profile.bio}
              </p>
            )}

            {/* Stats Row - Desktop only */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="hidden lg:flex flex-wrap items-center gap-6 text-sm"
            >
              {avgRating && reviews && reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-lg">{avgRating}</span>
                  <span className="text-muted-foreground">({reviews.length} avis)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span><span className="font-medium text-foreground">{completedBookings}</span> missions</span>
              </div>
              {user.profile?.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{user.profile.city}</span>
                </div>
              )}
            </motion.div>

            {/* Services Section */}
            {publishedServices.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-bold mb-5">Services</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {publishedServices.slice(0, 4).map((service) => (
                    <Link
                      key={service.id}
                      href={`/service/${service.id}`}
                      className="group bg-surface border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          service.kind === 'OFFER'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
                        </span>
                      </div>
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {service.description}
                      </p>
                    </Link>
                  ))}
                </div>
                {publishedServices.length > 4 && (
                  <Button variant="ghost" className="w-full mt-4 text-primary">
                    Voir tous les services ({publishedServices.length})
                  </Button>
                )}
              </motion.section>
            )}

            {/* Reviews Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Avis</h2>
                {avgRating && reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating score={Math.round(parseFloat(avgRating))} size="md" />
                    <span className="font-semibold">{avgRating}</span>
                  </div>
                )}
              </div>

              {!reviews || reviews.length === 0 ? (
                <div className="bg-muted/30 rounded-2xl p-10 text-center">
                  <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-border/50">
                  {reviews.slice(0, 5).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {reviews.length > 5 && (
                    <div className="pt-4">
                      <Button variant="ghost" className="w-full text-primary">
                        Voir tous les avis ({reviews.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Column - Profile Card */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:sticky lg:top-24"
            >
              {/* Mobile: Compact horizontal card */}
              <div className="lg:hidden mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {user.profile?.avatarUrl ? (
                        <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary">
                          {(user.profile?.displayName || user.email)?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {user.subscriptionStatus === 'PRO' && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1 rounded-full">
                        <Award className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-lg truncate">{user.profile?.displayName || 'Utilisateur'}</h2>
                      <TrustBadge elo={elo} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {user.profile?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {user.profile.city}
                        </span>
                      )}
                      {avgRating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          {avgRating}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {completedBookings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Full card */}
              <div className="hidden lg:block bg-surface border border-border/50 rounded-2xl p-6 space-y-5">
                {/* Avatar & Name */}
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center overflow-hidden mx-auto">
                      {user.profile?.avatarUrl ? (
                        <img
                          src={user.profile.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {(user.profile?.displayName || user.email)?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {user.subscriptionStatus === 'PRO' && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        PRO
                      </div>
                    )}
                  </div>
                  <h2 className="font-bold text-lg">
                    {user.profile?.displayName || 'Utilisateur'}
                  </h2>
                  {user.profile?.city && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.profile.city}
                    </p>
                  )}
                </div>

                {/* Trust Badge */}
                <div className="flex justify-center">
                  <TrustBadge elo={elo} />
                </div>

                {/* Divider */}
                <div className="border-t border-border/50" />

                {/* Stats */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Missions terminées
                    </span>
                    <span className="font-semibold">{completedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Avis reçus
                    </span>
                    <span className="font-semibold">{reviews?.length || 0}</span>
                  </div>
                  {avgRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Note moyenne
                      </span>
                      <span className="font-semibold">{avgRating}/5</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Membre depuis
                    </span>
                    <span className="font-semibold">{new Date(user.createdAt).getFullYear()}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="border-t border-border/50 pt-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Identité vérifiée</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Profil complet</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images.length > 0 && (
          <ImageLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
