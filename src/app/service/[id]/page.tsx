'use client';

/**
 * Service Detail Page
 *
 * Displays a single P2P service listing with:
 * - Service info (header, description, details, availability)
 * - Author sidebar with booking actions
 * - Reviews section
 * - Related services from the same user
 */
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Star,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Quote,
  CalendarDays,
  Calendar,
  Send,
} from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import { P2PBookingModal } from '@/components/booking/p2p-booking-modal';

import {
  ServiceHeader,
  ServiceSidebar,
  ReviewCard,
  DAY_LABELS,
  RECURRENCE_LABELS,
  formatDuration,
  formatTime,
} from '@/components/services/service-detail';

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Data fetching
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.getService(id),
    enabled: !!id,
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

  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings-for-service', id],
    queryFn: () => api.getMyBookings(),
    enabled: !!user && !!id,
  });

  // Computed values
  const existingBooking = myBookings?.find(
    (b) => b.serviceId === id && ['PENDING', 'ACCEPTED'].includes(b.status)
  );
  const otherServices = userServices?.filter((s) => s.id !== id) || [];
  const isOwner = user?.id === service?.createdByUserId;
  const reputation = service?.createdBy?.reputation;
  const avgRating = reputation?.ratingAvg5 ? reputation.ratingAvg5.toFixed(1) : null;
  const reviewCount = reputation?.ratingCount || 0;
  const profile = service?.createdBy?.profile;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <PageLoader text="Chargement du service..." />
      </div>
    );
  }

  // Not found state
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

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12 pt-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <ServiceHeader service={service} avgRating={avgRating} reviewCount={reviewCount} />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <DescriptionSection description={service.description} />
            <TagsSection tags={service.tags} />
            <DetailsSection service={service} />
            <AvailabilitySection service={service} />
            <MobileReviewsSection reviews={userReviews} avgRating={avgRating} userId={service.createdByUserId} />
          </div>

          {/* Sidebar */}
          <ServiceSidebar
            service={service}
            isOwner={isOwner}
            user={user}
            existingBooking={existingBooking}
            reviews={userReviews}
            onBookingClick={() => setShowBookingModal(true)}
          />
        </div>

        {/* Other Services */}
        {otherServices.length > 0 && (
          <OtherServicesSection services={otherServices} profileName={profile?.displayName} userId={service.createdByUserId} />
        )}
      </div>

      {/* Mobile Sticky CTA */}
      {!isOwner && (
        <MobileCTA
          user={user}
          existingBooking={existingBooking}
          serviceKind={service.kind}
          onBookingClick={() => setShowBookingModal(true)}
        />
      )}

      {/* Booking Modal */}
      <P2PBookingModal service={service} isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} />
    </div>
  );
}

// ============================================
// Section Components
// ============================================

function DescriptionSection({ description }: { description: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
    >
      <h2 className="font-bold text-lg mb-4">Description</h2>
      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{description}</p>
      </div>
    </motion.section>
  );
}

function TagsSection({ tags }: { tags?: { tag: { id: string; name: string } }[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-surface border border-border rounded-2xl p-5 sm:p-6"
    >
      <h2 className="font-bold text-lg mb-4">Tags</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag }) => (
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
  );
}

function DetailsSection({ service }: { service: any }) {
  return (
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
        {service.durationMinutes && (
          <DetailCard icon={Clock} label="Durée" value={formatDuration(service.durationMinutes)} />
        )}
        <DetailCard
          icon={RefreshCw}
          label="Récurrence"
          value={service.isRecurring ? RECURRENCE_LABELS[service.recurrence || 'ONE_TIME'] : 'Ponctuel'}
        />
        {service.deadlineAt && (
          <DetailCard icon={CalendarDays} label="Deadline" value={formatDate(service.deadlineAt)} />
        )}
        <DetailCard icon={Calendar} label="Expire le" value={formatDate(service.expiresAt)} />
      </div>
    </motion.section>
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function AvailabilitySection({ service }: { service: any }) {
  const hasAvailability =
    (service.availableDays && service.availableDays.length > 0) ||
    service.availableFromTime ||
    service.availableFromDate;

  if (!hasAvailability) return null;

  return (
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
        {service.availableDays && service.availableDays.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Jours</p>
            <div className="flex flex-wrap gap-2">
              {service.availableDays.map((day: string) => (
                <span key={day} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  {DAY_LABELS[day] || day}
                </span>
              ))}
            </div>
          </div>
        )}

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
  );
}

function MobileReviewsSection({
  reviews,
  avgRating,
  userId,
}: {
  reviews: any[] | undefined;
  avgRating: string | null;
  userId: string;
}) {
  return (
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
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-lg">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({reviews?.length || 0})</span>
          </div>
        )}
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-8">
          <Quote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
        </div>
      ) : (
        <>
          {reviews.slice(0, 3).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {reviews.length > 3 && (
            <Link
              href={`/profile/${userId}`}
              className="block text-center text-sm text-primary font-medium mt-4 hover:underline"
            >
              Voir tous les avis ({reviews.length})
            </Link>
          )}
        </>
      )}
    </motion.section>
  );
}

function OtherServicesSection({
  services,
  profileName,
  userId,
}: {
  services: any[];
  profileName?: string;
  userId: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Autres services de {profileName || 'cet utilisateur'}</h2>
        <Link href={`/profile/${userId}`}>
          <Badge variant="outline" className="rounded-full hover:bg-muted transition-colors cursor-pointer">
            Voir tout
          </Badge>
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.slice(0, 3).map((service) => (
          <OtherServiceCard key={service.id} service={service} />
        ))}
      </div>
    </motion.section>
  );
}

function OtherServiceCard({ service }: { service: any }) {
  return (
    <Link href={`/service/${service.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-surface border border-border rounded-2xl p-5 h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant={service.kind === 'OFFER' ? 'default' : 'secondary'} className="text-xs rounded-full">
            {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
          </Badge>
          {service.category && <span className="text-xs text-muted-foreground">{service.category.name}</span>}
        </div>
        <h3 className="font-semibold mb-2 line-clamp-2">{service.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
        <div className="flex items-center justify-between mt-auto">
          {service.priceCents ? (
            <span className="font-bold text-primary">
              {formatPrice(service.priceCents)}
              {service.pricingType === 'HOURLY' && '/h'}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Prix à définir</span>
          )}
          {service.city && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {service.city}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function MobileCTA({
  user,
  existingBooking,
  serviceKind,
  onBookingClick,
}: {
  user: any;
  existingBooking?: any;
  serviceKind: string;
  onBookingClick: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border p-4 z-40">
      {user ? (
        existingBooking ? (
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {existingBooking.status === 'PENDING'
                ? 'Demande en attente'
                : existingBooking.status === 'ACCEPTED'
                ? 'Réservation acceptée'
                : 'Mission en cours'}
            </p>
          </div>
        ) : (
          <Button className="w-full rounded-full shadow-lg" size="lg" onClick={onBookingClick}>
            <Send className="w-5 h-5 mr-2" />
            {serviceKind === 'OFFER' ? 'Réserver' : 'Proposer mes services'}
          </Button>
        )
      ) : (
        <Link href="/auth/login" className="block">
          <Button className="w-full rounded-full shadow-lg" size="lg">
            Se connecter pour réserver
          </Button>
        </Link>
      )}
    </div>
  );
}
