'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Search,
  Building2,
  User,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';
import { CancelBookingModal } from '@/components/booking/cancel-booking-modal';
import { useWebSocket } from '@/contexts/WebSocketContext';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ACCEPTED: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  REJECTED: { label: 'Refusée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  COMPLETED: { label: 'Terminée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CANCELED: { label: 'Annulée', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  NO_SHOW: { label: 'Absent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

function BookingCard({
  booking,
  onCancel,
  onReview,
}: {
  booking: Booking;
  onCancel: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
}) {
  const status = STATUS_CONFIG[booking.status];
  const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';
  const canReview = booking.status === 'COMPLETED' && (!booking.reviews || booking.reviews.length === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="p-5">
        {/* Header: Service name + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {booking.businessService?.name || 'Prestation'}
            </h3>
            {booking.businessService?.business && (
              <Link
                href={`/business/${booking.businessService.business.slug}`}
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-0.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                {booking.businessService.business.name}
              </Link>
            )}
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {booking.scheduledAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                a{' '}
                {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {booking.employee && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 shrink-0" />
              <span>{booking.employee.firstName} {booking.employee.lastName}</span>
            </div>
          )}

          {booking.agreedPriceCents != null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatPrice(booking.agreedPriceCents)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canCancel || canReview) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive"
                onClick={() => onCancel(booking)}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" />
                Annuler
              </Button>
            )}
            {canReview && (
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => onReview(booking)}
              >
                <Star className="w-3.5 h-3.5 mr-1.5" />
                Laisser un avis
              </Button>
            )}
          </div>
        )}

        {/* Rejection message */}
        {booking.status === 'REJECTED' && booking.rejectionMessage && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Motif : </span>
              {booking.rejectionMessage}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MesReservationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { onBookingStatus, onNotification } = useWebSocket();

  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Listen for real-time booking updates
  useEffect(() => {
    const unsubStatus = onBookingStatus(() => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    });

    const unsubNotification = onNotification((notification) => {
      if (notification.type === 'BOOKING_ACCEPTED' || notification.type === 'BOOKING_REJECTED' || notification.type === 'BOOKING_CANCELED' || notification.type === 'BOOKING_COMPLETED') {
        queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      }
    });

    return () => {
      unsubStatus();
      unsubNotification();
    };
  }, [onBookingStatus, onNotification, queryClient]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => api.getMyBookings('requester'),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setCancelBooking(null);
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de l\'annulation');
    },
  });

  // Auth loading
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Mes reservations</h1>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour voir vos reservations.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="rounded-full px-8">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sort bookings: upcoming first, then past
  const sortedBookings = bookings ? [...bookings].sort((a, b) => {
    // Active bookings first (PENDING, ACCEPTED)
    const activeStatuses: BookingStatus[] = ['PENDING', 'ACCEPTED'];
    const aActive = activeStatuses.includes(a.status);
    const bActive = activeStatuses.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    // Then by date descending
    return new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime();
  }) : [];

  // Find the most recent booking that has a business (for "Reprendre RDV")
  const lastBookedBusiness = sortedBookings
    .find((b) => b.businessService?.business)
    ?.businessService?.business;

  return (
    <div className="container mx-auto px-4 py-8 pt-28 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes reservations</h1>
          <p className="text-muted-foreground mt-1">
            Retrouvez toutes vos reservations
          </p>
        </div>
        {lastBookedBusiness && (
          <Link href={`/business/${lastBookedBusiness.slug}`}>
            <Button variant="outline" size="sm" className="rounded-full shrink-0">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Reprendre RDV</span>
              <span className="sm:hidden">Re-RDV</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader text="Chargement des reservations..." />
      ) : sortedBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-muted/30 rounded-3xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Aucune reservation</h3>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore effectue de reservation.
          </p>
          <Link href="/search">
            <Button className="rounded-full">
              <Search className="w-4 h-4 mr-2" />
              Rechercher des professionnels
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={setCancelBooking}
              onReview={setReviewBooking}
            />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelBooking && (
        <CancelBookingModal
          booking={cancelBooking}
          isOpen={!!cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={() => cancelMutation.mutate(cancelBooking.id)}
          isLoading={cancelMutation.isPending}
        />
      )}

      {/* Review Modal */}
      <ReviewFormModal
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
      />
    </div>
  );
}
