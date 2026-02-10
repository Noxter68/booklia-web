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
  TrendingUp,
  Award,
  Quote,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getXpProgress } from '@/lib/utils';
import { PeopleImage, Review } from '@/types';

// Image Lightbox component
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
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-full bg-black/50">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
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

// Image Gallery Mosaic component
function ImageGalleryMosaic({
  images,
  onImageClick,
}: {
  images: PeopleImage[];
  onImageClick: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedImages.length === 1) {
    return (
      <div className="mb-6">
        <button
          onClick={() => onImageClick(0)}
          className="w-full aspect-[21/9] rounded-2xl overflow-hidden relative group"
        >
          <img
            src={sortedImages[0].url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
      </div>
    );
  }

  if (sortedImages.length <= 4) {
    return (
      <div className="mb-6 grid grid-cols-3 gap-2 h-64 sm:h-80">
        <button
          onClick={() => onImageClick(0)}
          className="col-span-2 rounded-l-2xl overflow-hidden relative group"
        >
          <img
            src={sortedImages[0].url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>

        <div className="flex flex-col gap-2">
          {sortedImages.slice(1, 4).map((img, idx) => (
            <button
              key={img.id}
              onClick={() => onImageClick(idx + 1)}
              className={`flex-1 overflow-hidden relative group ${
                idx === 0 ? 'rounded-tr-2xl' : ''
              } ${idx === sortedImages.slice(1, 4).length - 1 ? 'rounded-br-2xl' : ''}`}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-4 gap-2 h-64 sm:h-80">
      <button
        onClick={() => onImageClick(0)}
        className="col-span-2 row-span-2 rounded-l-2xl overflow-hidden relative group"
      >
        <img
          src={sortedImages[0].url}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>

      <button
        onClick={() => onImageClick(1)}
        className="overflow-hidden relative group"
      >
        <img
          src={sortedImages[1].url}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>

      <button
        onClick={() => onImageClick(2)}
        className="rounded-tr-2xl overflow-hidden relative group"
      >
        <img
          src={sortedImages[2].url}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>

      <button
        onClick={() => onImageClick(3)}
        className="overflow-hidden relative group"
      >
        <img
          src={sortedImages[3].url}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>

      <button
        onClick={() => onImageClick(4)}
        className="rounded-br-2xl overflow-hidden relative group"
      >
        <img
          src={sortedImages[4].url}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        {sortedImages.length > 5 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium flex items-center gap-1.5">
              <Images className="w-4 h-4" />
              +{sortedImages.length - 5}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

// Star rating component
function StarRating({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

// Review card component
function ReviewCard({ review }: { review: Review }) {
  const authorName = review.author?.profile?.displayName || 'Utilisateur';

  return (
    <div className="border-b border-border/50 last:border-0 pb-4 last:pb-0 mb-4 last:mb-0">
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
            <p className="text-sm text-foreground/90 leading-relaxed">{review.comment}</p>
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

  const images = user?.profile?.images || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-64 sm:h-80 bg-muted rounded-2xl mb-6" />
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 bg-muted rounded-xl" />
                <div className="h-5 w-40 bg-muted rounded-lg" />
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
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">?</span>
          </div>
          <h1 className="text-2xl font-bold">Utilisateur introuvable</h1>
          <p className="text-muted-foreground mt-2">Ce profil n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  const xpProgress = user.reputation
    ? getXpProgress(user.reputation.xp, user.reputation.level)
    : 0;

  const avgRating = user.reputation?.ratingAvg5
    ? user.reputation.ratingAvg5.toFixed(1)
    : null;

  const stats = [
    {
      label: 'Note moyenne',
      value: avgRating || '-',
      suffix: avgRating ? '/5' : '',
      icon: Star,
      color: 'text-primary',
    },
    {
      label: 'Niveau',
      value: user.reputation?.level || 1,
      suffix: '',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: 'Confiance',
      value: user.reputation ? Math.round(user.reputation.trustScore) : '-',
      suffix: user.reputation ? '%' : '',
      icon: Shield,
      color: 'text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12 pt-24">
      {/* Image Gallery Mosaic */}
      {images.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6">
          <ImageGalleryMosaic
            images={images}
            onImageClick={(index) => setLightboxIndex(index)}
          />
        </div>
      )}

      {/* Profile Header */}
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start gap-5"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface border border-border rounded-2xl shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {(user.profile?.displayName || user.email)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {user.subscriptionStatus === 'PRO' && (
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <Award className="w-3 h-3" />
                PRO
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {user.profile?.displayName || 'Utilisateur'}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {user.profile?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {user.profile.city}
                </span>
              )}
              {avgRating && reviews && reviews.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-foreground">{avgRating}</span>
                  <span>({reviews.length} avis)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Membre depuis {formatDate(user.createdAt)}
              </span>
            </div>

            {user.profile?.bio && (
              <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
                {user.profile.bio}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-2xl p-4 md:p-6 border border-border/50 text-center"
                >
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl md:text-3xl font-black">
                    {stat.value}
                    <span className="text-base md:text-lg font-medium text-muted-foreground">
                      {stat.suffix}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* XP Progress */}
            {user.reputation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-surface rounded-2xl p-4 md:p-6 border border-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Progression niveau {user.reputation.level}</span>
                  <span className="text-sm text-muted-foreground">{user.reputation.xp} XP</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Reviews Section - Mobile */}
            <section className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Avis reçus</h2>
                {avgRating && reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg">{avgRating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
              </div>

              {!reviews || reviews.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
                  {reviews.slice(0, 5).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {reviews.length > 5 && (
                    <button className="w-full text-center text-sm text-primary font-medium mt-4 hover:underline">
                      Voir tous les avis ({reviews.length})
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Reviews Card */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Avis
                  </h3>
                  {avgRating && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg">{avgRating}</span>
                      <span className="text-sm text-muted-foreground">/ 5</span>
                    </div>
                  )}
                </div>

                {avgRating && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i <= Math.round(parseFloat(avgRating))
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {reviews?.length || 0} avis
                    </span>
                  </div>
                )}

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun avis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Les avis apparaîtront ici après les premières missions.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
                    {reviews.slice(0, 5).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}

                {reviews && reviews.length > 5 && (
                  <button className="w-full text-center text-sm text-primary font-medium mt-4 pt-4 border-t border-border hover:underline">
                    Voir tous les avis ({reviews.length})
                  </button>
                )}
              </div>

              {/* XP Card - Desktop */}
              {user.reputation && (
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progression
                  </h3>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-black text-primary mb-1">
                      {user.reputation.level}
                    </div>
                    <p className="text-sm text-muted-foreground">Niveau actuel</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">XP</span>
                      <span className="font-medium">{user.reputation.xp}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(xpProgress)}% vers le niveau {user.reputation.level + 1}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
