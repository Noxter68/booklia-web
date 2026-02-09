'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Shield,
  MessageCircle,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit3,
  Pause,
  Play,
  User,
  Quote,
  Euro,
  X,
  Images,
  Zap,
  CalendarDays,
} from 'lucide-react';
import { ProfileImage, Review } from '@/types';

// Image Lightbox component
function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ProfileImage[];
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
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
          className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
          className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
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
  images: ProfileImage[];
  onImageClick: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedImages.length === 1) {
    return (
      <div className="mb-6">
        <button
          onClick={() => onImageClick(0)}
          className="w-full aspect-[21/9] rounded-2xl overflow-hidden relative group cursor-pointer"
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
          className="col-span-2 rounded-l-2xl overflow-hidden relative group cursor-pointer"
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
              className={`flex-1 overflow-hidden relative group cursor-pointer ${
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
        className="col-span-2 row-span-2 rounded-l-2xl overflow-hidden relative group cursor-pointer"
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
        className="overflow-hidden relative group cursor-pointer"
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
        className="rounded-tr-2xl overflow-hidden relative group cursor-pointer"
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
        className="overflow-hidden relative group cursor-pointer"
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
        className="rounded-br-2xl overflow-hidden relative group cursor-pointer"
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

// Day labels
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.getService(id),
    enabled: !!id,
  });

  const { data: userImages } = useQuery({
    queryKey: ['profile-images', service?.createdByUserId],
    queryFn: () => api.getProfileImages(service!.createdByUserId),
    enabled: !!service?.createdByUserId,
  });

  const { data: userReviews } = useQuery({
    queryKey: ['user-reviews', service?.createdByUserId],
    queryFn: () => api.getUserReviews(service!.createdByUserId),
    enabled: !!service?.createdByUserId,
  });

  const { data: userServices } = useQuery({
    queryKey: ['user-services', service?.createdByUserId],
    queryFn: () => api.getUserServices(service!.createdByUserId),
    enabled: !!service?.createdByUserId,
  });

  // Filter out current service from other services
  const otherServices = userServices?.filter(s => s.id !== id) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <PageLoader text="Chargement du service..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Service introuvable</h1>
          <p className="text-muted-foreground mb-6">Ce service n'existe plus ou a été supprimé.</p>
          <Link href="/search">
            <Button className="rounded-xl">Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBoosted = service.boostedUntil && new Date(service.boostedUntil) > new Date();
  const isOwner = user?.id === service.createdByUserId;
  const profile = service.createdBy?.profile;
  const reputation = service.createdBy?.reputation;

  const avgRating = reputation?.ratingAvg5 ? reputation.ratingAvg5.toFixed(1) : null;
  const reviewCount = reputation?.ratingCount || 0;

  const urgencyConfig = {
    URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
    SOON: { label: 'Sous 7 jours', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    FLEXIBLE: { label: 'Flexible', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  };

  const recurrenceLabels: Record<string, string> = {
    WEEKLY: 'Hebdomadaire',
    BIWEEKLY: 'Bi-hebdomadaire',
    MONTHLY: 'Mensuel',
    ONE_TIME: 'Ponctuel',
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12 pt-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Image Gallery */}
        {userImages && userImages.length > 0 && (
          <ImageGalleryMosaic
            images={userImages}
            onImageClick={(index) => setLightboxIndex(index)}
          />
        )}

        {/* Service Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">{service.title}</h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant={service.kind === 'OFFER' ? 'default' : 'secondary'}
              className="text-sm px-3 py-1 rounded-full"
            >
              {service.kind === 'OFFER' ? 'Offre de service' : 'Recherche'}
            </Badge>
            {isBoosted && (
              <Badge variant="outline" className="bg-gold-soft text-primary border-primary/20 rounded-full">
                <Zap className="w-3 h-3 mr-1" />
                Sponsorisé
              </Badge>
            )}
            {service.urgency && (
              <Badge
                variant="outline"
                className={`rounded-full ${urgencyConfig[service.urgency as keyof typeof urgencyConfig]?.color}`}
              >
                {urgencyConfig[service.urgency as keyof typeof urgencyConfig]?.label}
              </Badge>
            )}
            {service.category && (
              <Badge variant="outline" className="rounded-full">
                {service.category.name}
              </Badge>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            {service.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {service.city}
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">{avgRating}</span>
                <span>({reviewCount} avis)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Publié le {formatDate(service.createdAt)}
            </span>
          </div>

          {/* Price */}
          {service.priceMinCents && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-soft">
              <Euro className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-primary">
                {service.priceMaxCents
                  ? `${formatPrice(service.priceMinCents)} - ${formatPrice(service.priceMaxCents)}`
                  : formatPrice(service.priceMinCents)}
              </span>
              {service.isRecurring && (
                <span className="text-sm text-muted-foreground">
                  / {recurrenceLabels[service.recurrence || 'ONE_TIME']?.toLowerCase()}
                </span>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
            >
              <h2 className="font-bold text-lg mb-4">Description</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.section>

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
              >
                <h2 className="font-bold text-lg mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map(({ tag }) => (
                    <Link key={tag.id} href={`/search?tag=${tag.name}`}>
                      <Badge
                        variant="outline"
                        className="bg-muted hover:bg-muted/80 transition-colors cursor-pointer rounded-full px-4 py-1.5"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Details */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
            >
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Détails
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Duration */}
                {service.durationMinutes && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Durée
                    </div>
                    <p className="font-semibold">{formatDuration(service.durationMinutes)}</p>
                  </div>
                )}

                {/* Recurrence */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <RefreshCw className="w-4 h-4" />
                    Récurrence
                  </div>
                  <p className="font-semibold">
                    {service.isRecurring
                      ? recurrenceLabels[service.recurrence || 'ONE_TIME']
                      : 'Ponctuel'}
                  </p>
                </div>

                {/* Deadline */}
                {service.deadlineAt && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <CalendarDays className="w-4 h-4" />
                      Deadline
                    </div>
                    <p className="font-semibold">{formatDate(service.deadlineAt)}</p>
                  </div>
                )}

                {/* Expires */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Expire le
                  </div>
                  <p className="font-semibold">{formatDate(service.expiresAt)}</p>
                </div>
              </div>
            </motion.section>

            {/* Availability */}
            {((service.availableDays && service.availableDays.length > 0) || service.availableFromTime || service.availableFromDate) && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
              >
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Disponibilités
                </h2>

                <div className="space-y-4">
                  {/* Days */}
                  {service.availableDays && service.availableDays.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Jours</p>
                      <div className="flex flex-wrap gap-2">
                        {service.availableDays.map((day) => (
                          <span
                            key={day}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                          >
                            {DAY_LABELS[day] || day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time */}
                  {(service.availableFromTime || service.availableToTime) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Horaires</p>
                      <p className="font-medium">
                        {service.availableFromTime && formatTime(service.availableFromTime)}
                        {service.availableFromTime && service.availableToTime && ' - '}
                        {service.availableToTime && formatTime(service.availableToTime)}
                      </p>
                    </div>
                  )}

                  {/* Period */}
                  {(service.availableFromDate || service.availableToDate) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Période</p>
                      <p className="font-medium">
                        {service.availableFromDate && formatDate(service.availableFromDate)}
                        {service.availableFromDate && service.availableToDate && ' → '}
                        {service.availableToDate && formatDate(service.availableToDate)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Reviews - Mobile */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:hidden bg-surface border border-border rounded-2xl p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Avis
                </h2>
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg">{avgRating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({reviewCount})</span>
                  </div>
                )}
              </div>

              {!userReviews || userReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Quote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              ) : (
                <>
                  {userReviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {userReviews.length > 3 && (
                    <Link
                      href={`/profile/${service.createdByUserId}`}
                      className="block text-center text-sm text-primary font-medium mt-4 hover:underline"
                    >
                      Voir tous les avis ({userReviews.length})
                    </Link>
                  )}
                </>
              )}
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Author Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface border border-border rounded-2xl overflow-hidden"
              >
                {/* Author Header */}
                <div className="p-6 bg-gradient-to-br from-gold-soft to-muted">
                  <Link href={`/profile/${service.createdByUserId}`} className="block">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {profile?.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white shadow-lg flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {profile?.displayName || 'Utilisateur'}
                        </p>
                        {profile?.city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {profile.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Rating */}
                {reputation && (
                  <div className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">
                          {reputation.ratingAvg5?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({reputation.ratingCount || 0} avis)
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-gold-soft text-primary rounded-full">
                        Niveau {reputation.level || 1}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
                      <Shield className="w-3 h-3 text-green-500" />
                      Identité vérifiée
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
                      <MessageCircle className="w-3 h-3 text-primary" />
                      Répond rapidement
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                  {!isOwner ? (
                    <>
                      {user ? (
                        <>
                          <Button className="w-full rounded-xl" size="lg">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {service.kind === 'OFFER' ? 'Contacter' : 'Proposer mes services'}
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 rounded-xl">
                              <Heart className="w-4 h-4 mr-2" />
                              Sauvegarder
                            </Button>
                            <Button variant="outline" className="flex-1 rounded-xl">
                              <Share2 className="w-4 h-4 mr-2" />
                              Partager
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            Connectez-vous pour contacter ce prestataire
                          </p>
                          <Link href="/auth/login" className="block">
                            <Button className="w-full rounded-xl" size="lg">
                              Se connecter
                            </Button>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-3">
                            Pas encore inscrit ?{' '}
                            <Link href="/auth/register" className="text-primary hover:underline">
                              Créer un compte
                            </Link>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href={`/dashboard/services/${service.id}/edit`} className="block">
                        <Button variant="outline" className="w-full rounded-xl">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier l'annonce
                        </Button>
                      </Link>
                      {service.status === 'PUBLISHED' ? (
                        <Button variant="outline" className="w-full rounded-xl">
                          <Pause className="w-4 h-4 mr-2" />
                          Mettre en pause
                        </Button>
                      ) : (
                        <Button className="w-full rounded-xl">
                          <Play className="w-4 h-4 mr-2" />
                          Publier
                        </Button>
                      )}
                      <Button variant="outline" className="w-full rounded-xl">
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Reviews Card - Desktop */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="hidden lg:block bg-surface border border-border rounded-2xl p-6"
              >
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
                      {reviewCount} avis
                    </span>
                  </div>
                )}

                {!userReviews || userReviews.length === 0 ? (
                  <div className="text-center py-6">
                    <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun avis</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
                    {userReviews.slice(0, 5).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}

                {userReviews && userReviews.length > 5 && (
                  <Link
                    href={`/profile/${service.createdByUserId}`}
                    className="block text-center text-sm text-primary font-medium mt-4 pt-4 border-t border-border hover:underline"
                  >
                    Voir tous les avis ({userReviews.length})
                  </Link>
                )}
              </motion.div>

                          </div>
          </div>
        </div>

        {/* Other Services from this User */}
        {otherServices.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Autres services de {profile?.displayName || 'cet utilisateur'}
              </h2>
              <Link href={`/profile/${service.createdByUserId}`}>
                <Badge variant="outline" className="rounded-full hover:bg-muted transition-colors cursor-pointer">
                  Voir tout
                </Badge>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherServices.slice(0, 3).map((otherService) => (
                <Link key={otherService.id} href={`/service/${otherService.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-surface border border-border rounded-2xl p-5 h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge
                        variant={otherService.kind === 'OFFER' ? 'default' : 'secondary'}
                        className="text-xs rounded-full"
                      >
                        {otherService.kind === 'OFFER' ? 'Offre' : 'Demande'}
                      </Badge>
                      {otherService.category && (
                        <span className="text-xs text-muted-foreground">
                          {otherService.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2">{otherService.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {otherService.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      {otherService.priceMinCents ? (
                        <span className="font-bold text-primary">
                          {formatPrice(otherService.priceMinCents)}
                          {otherService.pricingType === 'HOURLY' && '/h'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Prix à définir</span>
                      )}
                      {otherService.city && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {otherService.city}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border p-4 z-40">
          {user ? (
            <Button className="w-full rounded-full shadow-lg" size="lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              {service.kind === 'OFFER' ? 'Contacter' : 'Proposer mes services'}
            </Button>
          ) : (
            <Link href="/auth/login" className="block">
              <Button className="w-full rounded-full shadow-lg" size="lg">
                Se connecter pour contacter
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && userImages && userImages.length > 0 && (
          <ImageLightbox
            images={userImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
