'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  CheckCircle,
  Calendar,
  ChevronRight,
  User,
  Quote,
  MessageCircle,
  Edit3,
  X,
  ChevronLeft,
  Palmtree,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { BusinessService, Review, Booking, BusinessImage } from '@/types';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';

// Image Lightbox component
function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: BusinessImage[];
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

  // Handle keyboard navigation
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
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
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

      {/* Current image */}
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

      {/* Next button */}
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

      {/* Thumbnail strip */}
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

// ============================================
// IMAGE GALLERY - Adaptive layout (matches profile page)
// ============================================

function ImageGallery({
  images,
  onImageClick,
}: {
  images: BusinessImage[];
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

  // 1 image - full width
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

// Vacation Mode Banner component
function VacationModeBanner({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Palmtree className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
            Établissement en vacances
          </h3>
          <p className="text-sm text-amber-600/80 dark:text-amber-300/80">
            {message || 'Ce salon est actuellement fermé pour congés. Les réservations en ligne ne sont pas disponibles.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Day names helper
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || '';
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

// Service card component for public page
function ServiceCard({
  service,
  onSelect,
  disabled = false
}: {
  service: BusinessService;
  onSelect: (service: BusinessService) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={() => !disabled && onSelect(service)}
      className={`w-full text-left bg-surface border border-border rounded-2xl p-4 sm:p-5 transition-all ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.99]'
      }`}
      whileTap={disabled ? {} : { scale: 0.99 }}
      disabled={disabled}
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base sm:text-lg mb-1 truncate pr-2">{service.name}</h3>
          {service.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
            <span className="font-semibold text-primary text-base">
              {formatPrice(service.priceCents)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {service.durationMinutes} min
            </span>
          </div>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.button>
  );
}

// Review card component
function ReviewCard({ review }: { review: Review }) {
  const authorName = review.author?.profile?.displayName || 'Client';
  const serviceName = review.booking?.businessService?.name;
  const employeeName = review.booking?.employee
    ? `${review.booking.employee.firstName} ${review.booking.employee.lastName}`
    : null;

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
          {serviceName && (
            <p className="text-xs text-muted-foreground mb-2">
              {serviceName}
              {employeeName && ` • avec ${employeeName}`}
            </p>
          )}
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

          {/* Business reply */}
          {review.reply && (
            <div className="mt-3 pl-3 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg py-2 pr-3">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Réponse du propriétaire
              </p>
              <p className="text-sm text-foreground/80">{review.reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessPublicPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.getBusinessBySlug(slug as string),
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: () => api.getBusinessReviews(business!.id),
    enabled: !!business?.id,
  });

  const { data: images } = useQuery({
    queryKey: ['business-images', slug],
    queryFn: () => api.getBusinessImages(slug as string),
    enabled: !!slug,
  });

  // Get user's completed bookings with this business (to check if they can leave a review)
  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings-for-review', business?.id],
    queryFn: () => api.getMyBookings('requester'),
    enabled: !!user && !!business?.id,
  });

  // Find a completed booking without a review for this business
  const completedBookingWithoutReview = myBookings?.find(
    (booking) =>
      booking.businessServiceId &&
      booking.businessService?.business?.id === business?.id &&
      booking.status === 'COMPLETED' &&
      !booking.reviews?.some((r) => r.type === 'REVIEW_PROVIDER')
  );

  // Check if user is the business owner (can't review own business)
  const isOwnBusiness = user?.id === business?.ownerId;

  const handleServiceSelect = (service: BusinessService) => {
    router.push(`/business/${slug}/book/${service.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Business non trouvé</h1>
        <p className="text-muted-foreground">Ce business n'existe pas ou a été supprimé.</p>
      </div>
    );
  }

  const avgRating = business.owner?.reputation?.ratingAvg5
    ? business.owner.reputation.ratingAvg5.toFixed(1)
    : null;
  const reviewCount = business.owner?.reputation?.ratingCount || 0;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12 pt-24">
      {/* Vacation Mode Banner */}
      {business.isOnVacation && (
        <div className="container mx-auto px-4 sm:px-6 mb-4">
          <VacationModeBanner message={business.vacationMessage} />
        </div>
      )}

      {/* Image Gallery Mosaic */}
      {images && images.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6">
          <ImageGallery
            images={images}
            onImageClick={(index: number) => setLightboxIndex(index)}
          />
        </div>
      )}

      {/* Business Header */}
      <div className="container mx-auto px-4 sm:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start gap-5"
        >
          {/* Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface border border-border rounded-2xl shadow-sm flex items-center justify-center overflow-hidden shrink-0">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {business.name[0]}
              </span>
            )}
          </div>

          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{business.name}</h1>
              {business.isVerified && (
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              {business.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {business.city}
                </span>
              )}
              {avgRating && reviews && reviews.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-foreground">{avgRating}</span>
                  <span>({reviews.length} avis)</span>
                </span>
              )}
              {business.services && business.services.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {business.services.length} prestation{business.services.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Description */}
            {business.description && (
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed mb-4">
                {business.description}
              </p>
            )}

            {/* Contact Links */}
            <div className="flex flex-wrap gap-2">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">{business.phone}</span>
                  <span className="sm:hidden">Appeler</span>
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">{business.email}</span>
                  <span className="sm:hidden">Email</span>
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg"
                >
                  <Globe className="w-4 h-4" />
                  Site web
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Team Section */}
        {business.employees && business.employees.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Notre équipe</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
              {business.employees.map((employee) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all min-w-50 sm:min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {employee.avatarUrl ? (
                        <img
                          src={employee.avatarUrl}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      {employee.role && (
                        <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Services List */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Services - Grouped by Category */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold mb-4">Nos prestations</h2>

              {business.services?.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground">Aucune prestation disponible</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group services by businessCategory */}
                  {(() => {
                    const services = business.services || [];
                    const categories = business.categories || [];

                    // Get services without a category
                    const uncategorizedServices = services.filter(s => !s.businessCategoryId);

                    // Get services grouped by category
                    const categorizedGroups = categories
                      .map(cat => ({
                        category: cat,
                        services: services.filter(s => s.businessCategoryId === cat.id),
                      }))
                      .filter(group => group.services.length > 0);

                    return (
                      <>
                        {/* Categorized services */}
                        {categorizedGroups.map(({ category, services: categoryServices }) => (
                          <div key={category.id}>
                            <h3 className="font-semibold text-base mb-3 text-muted-foreground uppercase tracking-wide">
                              {category.name}
                            </h3>
                            <div className="space-y-3">
                              {categoryServices.map((service) => (
                                <ServiceCard
                                  key={service.id}
                                  service={service}
                                  onSelect={handleServiceSelect}
                                  disabled={business.isOnVacation}
                                />
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Uncategorized services */}
                        {uncategorizedServices.length > 0 && (
                          <div>
                            {categorizedGroups.length > 0 && (
                              <h3 className="font-semibold text-base mb-3 text-muted-foreground uppercase tracking-wide">
                                Autres prestations
                              </h3>
                            )}
                            <div className="space-y-3">
                              {uncategorizedServices.map((service) => (
                                <ServiceCard
                                  key={service.id}
                                  service={service}
                                  onSelect={handleServiceSelect}
                                  disabled={business.isOnVacation}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </section>

            {/* Reviews Section - Mobile */}
            <section className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Avis clients</h2>
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

              {/* Leave review button - Mobile */}
              {completedBookingWithoutReview && !isOwnBusiness && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl mb-4"
                  onClick={() => setReviewBooking(completedBookingWithoutReview)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Écrire un avis
                </Button>
              )}

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

            {/* Business Hours - Mobile only */}
            {business.hours && business.hours.length > 0 && (
              <section className="lg:hidden">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Horaires</h2>
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                      const dayHours = business.hours?.find((h) => h.dayOfWeek === dayOfWeek);
                      const isToday = new Date().getDay() === dayOfWeek;

                      return (
                        <div
                          key={dayOfWeek}
                          className={`flex items-center justify-between text-sm py-1 ${
                            isToday ? 'font-medium text-primary' : ''
                          }`}
                        >
                          <span className={isToday ? 'font-semibold' : 'text-muted-foreground'}>
                            {getDayName(dayOfWeek)}
                          </span>
                          <span className={dayHours?.isClosed ? 'text-muted-foreground' : ''}>
                            {dayHours?.isClosed
                              ? 'Fermé'
                              : dayHours
                              ? `${dayHours.startTime} - ${dayHours.endTime}`
                              : 'Fermé'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Address - Mobile only */}
            {business.address && (
              <section className="lg:hidden">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Adresse</h2>
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {business.address}
                      <br />
                      {business.postalCode} {business.city}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Quick Book Card */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Réserver
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {business.isOnVacation
                    ? 'Les réservations sont suspendues pendant les vacances'
                    : 'Sélectionnez une prestation pour réserver un créneau'}
                </p>
                {business.services && business.services.length > 0 && (
                  <Button
                    className="w-full rounded-full"
                    onClick={() => handleServiceSelect(business.services![0])}
                    disabled={business.isOnVacation}
                  >
                    {business.isOnVacation ? 'En vacances' : 'Réserver maintenant'}
                  </Button>
                )}
              </div>

              {/* Business Hours Card */}
              {business.hours && business.hours.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires
                  </h3>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                      const dayHours = business.hours?.find((h) => h.dayOfWeek === dayOfWeek);
                      const isToday = new Date().getDay() === dayOfWeek;

                      return (
                        <div
                          key={dayOfWeek}
                          className={`flex items-center justify-between text-sm py-1 ${
                            isToday ? 'font-medium text-primary' : ''
                          }`}
                        >
                          <span className={isToday ? 'font-semibold' : 'text-muted-foreground'}>
                            {getDayName(dayOfWeek)}
                          </span>
                          <span className={dayHours?.isClosed ? 'text-muted-foreground' : ''}>
                            {dayHours?.isClosed
                              ? 'Fermé'
                              : dayHours
                              ? `${dayHours.startTime} - ${dayHours.endTime}`
                              : 'Fermé'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews Card - Desktop */}
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

                {/* Leave review button - Desktop */}
                {completedBookingWithoutReview && !isOwnBusiness && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl mb-4"
                    onClick={() => setReviewBooking(completedBookingWithoutReview)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Écrire un avis
                  </Button>
                )}

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun avis</p>
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

              {/* Address Card - Desktop */}
              {business.address && (
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adresse
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {business.address}
                    <br />
                    {business.postalCode} {business.city}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border p-4 z-40">
        <Button
          className="w-full rounded-full shadow-lg"
          size="lg"
          onClick={() => {
            if (business.services && business.services.length > 0) {
              handleServiceSelect(business.services[0]);
            }
          }}
          disabled={!business.services || business.services.length === 0 || business.isOnVacation}
        >
          {business.isOnVacation ? (
            <>
              <Palmtree className="w-5 h-5 mr-2" />
              En vacances
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              Réserver maintenant
            </>
          )}
        </Button>
      </div>

      {/* Review Form Modal */}
      <ReviewFormModal
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={() => setReviewBooking(null)}
      />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images && images.length > 0 && (
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
