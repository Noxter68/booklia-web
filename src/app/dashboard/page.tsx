'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  User,
  Star,
  Eye,
  Pause,
  Trash2,
  ExternalLink,
  Briefcase,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowUpRight,
  Scissors,
  MapPin,
  CalendarClock,
  Euro,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { BookingStatus, Service, BusinessService, Booking, Review } from '@/types';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';
import { ReviewReplyModal } from '@/components/reviews/review-reply-modal';

type Tab = 'provider' | 'requester';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('provider');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [replyReview, setReplyReview] = useState<Review | null>(null);

  // Pour business: toujours provider (réservations reçues)
  // Pour particulier: selon le tab
  const bookingsRole = user?.isBusiness ? 'provider' : tab;
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', bookingsRole],
    queryFn: () => api.getMyBookings(bookingsRole),
    enabled: !!user,
  });

  // Services P2P (pour particuliers)
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => api.getMyServices(),
    enabled: !!user && !user.isBusiness,
  });

  // Business info (pour professionnels)
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user && user.isBusiness,
  });

  // Réservations business (rendez-vous pris chez des pros)
  const { data: myReservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => api.getMyBookings('requester'),
    enabled: !!user,
  });

  // Business reviews (for business owners to see and reply)
  const { data: businessReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: () => api.getBusinessReviews(business!.id),
    enabled: !!business?.id,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.publishService(id),
    onSuccess: () => {
      success('Service publié !');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la publication'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseService(id),
    onSuccess: () => {
      success('Service mis en pause');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la mise en pause'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      success('Service supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const acceptBookingMutation = useMutation({
    mutationFn: (id: string) => api.acceptBooking(id),
    onSuccess: () => {
      success('Réservation acceptée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
    onError: () => showError('Erreur lors de l\'acceptation'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
    },
    onError: () => showError('Erreur lors de l\'annulation'),
  });

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Accepté',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELED: 'Annulé',
    DISPUTED: 'Litige',
  };

  const statusIcons: Record<BookingStatus, React.ReactNode> = {
    PENDING: <Clock className="w-3.5 h-3.5" />,
    ACCEPTED: <CheckCircle className="w-3.5 h-3.5" />,
    IN_PROGRESS: <CheckCircle className="w-3.5 h-3.5" />,
    COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
    CANCELED: <XCircle className="w-3.5 h-3.5" />,
    DISPUTED: <XCircle className="w-3.5 h-3.5" />,
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    IN_PROGRESS: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    COMPLETED: 'bg-success-soft text-success dark:bg-success/20 dark:text-success',
    CANCELED: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400',
    DISPUTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  // Helper to get display status based on actual status and scheduled date
  const getDisplayStatus = (status: BookingStatus, scheduledAt?: string) => {
    if (status === 'ACCEPTED' && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();
      if (scheduledDate > now) {
        return {
          label: 'À venir',
          icon: <CalendarClock className="w-3.5 h-3.5" />,
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        };
      }
    }
    return {
      label: statusLabels[status],
      icon: statusIcons[status],
      color: statusColors[status],
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connectez-vous</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour accéder à votre dashboard.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="rounded-xl px-8">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Stats for business users
  const businessServices = business?.services || [];
  const activeBusinessServices = businessServices.filter((s) => s.isActive);
  // Stats for particuliers
  const publishedServices = services?.filter((s) => s.status === 'PUBLISHED') || [];
  // Pending bookings (works for both)
  const pendingBookings = bookings?.filter((b) => b.status === 'PENDING') || [];

  // Calculate monthly revenue for business users (from accepted/completed bookings this month)
  const monthlyRevenue = (() => {
    if (!bookings) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return bookings
      .filter((b) => {
        // Only count accepted, in_progress, or completed bookings
        if (!['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)) return false;
        // Only business bookings
        if (!b.businessServiceId) return false;
        // Only this month (based on scheduledAt or createdAt)
        const bookingDate = b.scheduledAt ? new Date(b.scheduledAt) : new Date(b.createdAt);
        return bookingDate >= startOfMonth;
      })
      .reduce((sum, b) => sum + (b.agreedPriceCents || 0), 0);
  })();

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black">
                  Bonjour, {user.name?.split(' ')[0] || 'là'}
                </h1>
                <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-gold-soft text-primary">
                  {user.isBusiness ? 'Professionnel' : 'Particulier'}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">
                Gérez vos services et suivez vos missions
              </p>
            </div>
            <Link href={user.isBusiness ? '/business/services/new' : '/dashboard/services/new'}>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Créer un service
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {(user.isBusiness ? [
            {
              label: 'Prestations',
              value: businessServices.length,
              icon: Scissors,
              color: 'bg-primary/10 text-primary',
            },
            {
              label: 'Actives',
              value: activeBusinessServices.length,
              icon: Eye,
              color: 'bg-success-soft text-success',
            },
            {
              label: 'En attente',
              value: pendingBookings.length,
              icon: Clock,
              color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            },
            {
              label: 'CA du mois',
              value: formatPrice(monthlyRevenue),
              icon: Euro,
              color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
            },
          ] : [
            {
              label: 'Services créés',
              value: services?.length || 0,
              icon: Briefcase,
              color: 'bg-primary/10 text-primary',
            },
            {
              label: 'Publiés',
              value: publishedServices.length,
              icon: Eye,
              color: 'bg-success-soft text-success',
            },
            {
              label: 'En attente',
              value: pendingBookings.length,
              icon: Clock,
              color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            },
            {
              label: 'Note moyenne',
              value: user.reputation?.ratingAvg5 ? user.reputation.ratingAvg5.toFixed(1) : '-',
              icon: Star,
              color: 'bg-primary/10 text-primary',
            },
          ]).map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-surface border border-border/50 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {user.isBusiness ? (
          /* ===== BUSINESS DASHBOARD LAYOUT ===== */
          <>
          {/* My Business Services - Table format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Mes prestations</h2>
              {business?.services && business.services.length > 0 && (
                <span className="text-sm text-muted-foreground">{business.services.length} prestation{business.services.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {businessLoading ? (
              <div className="bg-surface border border-border/50 rounded-2xl animate-pulse h-40" />
            ) : !business?.services || business.services.length === 0 ? (
              <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Aucune prestation</p>
                <p className="text-sm text-muted-foreground mb-5">Créez votre première prestation pour commencer</p>
                <Link href="/business/services/new">
                  <Button className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une prestation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prestation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Durée</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {business.services.map((service, index) => (
                      <motion.tr
                        key={service.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium line-clamp-1">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                          {service.category?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMinutes} min
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-primary">
                          {formatPrice(service.priceCents)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            service.isActive
                              ? 'bg-success-soft text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {service.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/business/services/${service.id}/edit`}>
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Business Reservations - Table format */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Mes réservations</h2>
              {bookings && bookings.filter(b => b.businessServiceId).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {bookings.filter(b => b.businessServiceId).length} réservation{bookings.filter(b => b.businessServiceId).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {bookingsLoading ? (
              <div className="bg-surface border border-border/50 rounded-2xl animate-pulse h-40" />
            ) : !bookings || bookings.filter(b => b.businessServiceId).length === 0 ? (
              <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Aucune réservation</p>
                <p className="text-sm text-muted-foreground">Les réservations de vos clients apparaîtront ici</p>
              </div>
            ) : (
              <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Prestation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Employé</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(b => b.businessServiceId).map((booking, index) => (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium line-clamp-1">
                            {booking.requester?.profile?.displayName || 'Anonyme'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm hidden sm:table-cell">
                          <p className="line-clamp-1">{booking.businessService?.name || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                          {booking.employee
                            ? `${booking.employee.firstName} ${booking.employee.lastName}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {booking.scheduledAt ? (
                            <div>
                              <p className="font-medium">
                                {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-primary">
                          {booking.agreedPriceCents ? formatPrice(booking.agreedPriceCents) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusIcons[booking.status]}
                            <span className="hidden sm:inline">{statusLabels[booking.status]}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {booking.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="rounded-lg h-8 px-3"
                                onClick={() => acceptBookingMutation.mutate(booking.id)}
                                disabled={acceptBookingMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg h-8 px-3"
                                onClick={() => cancelBookingMutation.mutate(booking.id)}
                                disabled={cancelBookingMutation.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Business Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5" />
                Avis clients
              </h2>
              {businessReviews && businessReviews.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {businessReviews.length} avis
                </span>
              )}
            </div>

            {reviewsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : !businessReviews || businessReviews.length === 0 ? (
              <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Aucun avis</p>
                <p className="text-sm text-muted-foreground">Les avis de vos clients apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessReviews.map((review, index) => (
                  <BusinessReviewCard
                    key={review.id}
                    review={review}
                    index={index}
                    onReply={() => setReplyReview(review)}
                  />
                ))}
              </div>
            )}
          </motion.div>
          </>
        ) : (
          /* ===== PARTICULIER DASHBOARD LAYOUT ===== */
          <>
            {/* Mes services - Table format */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Mes services</h2>
                {services && services.length > 0 && (
                  <span className="text-sm text-muted-foreground">{services.length} service{services.length > 1 ? 's' : ''}</span>
                )}
              </div>

              {servicesLoading ? (
                <div className="bg-surface border border-border/50 rounded-2xl animate-pulse h-40" />
              ) : services?.length === 0 ? (
                <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-2">Aucun service</p>
                  <p className="text-sm text-muted-foreground mb-5">Créez votre premier service pour commencer</p>
                  <Link href="/dashboard/services/new">
                    <Button className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer mon premier service
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-surface border border-border/50 rounded-2xl overflow-visible">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Titre</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services?.map((service, index) => (
                        <ServiceTableRow
                          key={service.id}
                          service={service}
                          index={index}
                          onPublish={() => publishMutation.mutate(service.id)}
                          onPause={() => pauseMutation.mutate(service.id)}
                          onDelete={() => deleteMutation.mutate(service.id)}
                          isPublishing={publishMutation.isPending}
                          isPausing={pauseMutation.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Mes missions - Full width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Mes missions</h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-5 w-fit">
                <button
                  onClick={() => setTab('provider')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    tab === 'provider'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Prestataire
                </button>
                <button
                  onClick={() => setTab('requester')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    tab === 'requester'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Demandeur
                </button>
              </div>

              {bookingsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : bookings?.filter(b => !b.businessServiceId).length === 0 ? (
                <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-2">Aucune mission</p>
                  <p className="text-sm text-muted-foreground mb-5">Explorez les services disponibles</p>
                  <Link href="/search">
                    <Button variant="outline" className="rounded-xl">
                      <Search className="w-4 h-4 mr-2" />
                      Explorer
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {bookings?.filter(b => !b.businessServiceId).map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/services/${booking.serviceId}`}
                              className="font-semibold hover:text-primary transition-colors line-clamp-1 flex items-center gap-1"
                            >
                              {booking.service?.title}
                              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1.5">
                              {tab === 'provider' ? 'Demandeur: ' : 'Prestataire: '}
                              <span className="text-foreground">
                                {tab === 'provider'
                                  ? booking.requester?.profile?.displayName || 'Anonyme'
                                  : booking.provider?.profile?.displayName || 'Anonyme'}
                              </span>
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              statusColors[booking.status]
                            }`}
                          >
                            {statusIcons[booking.status]}
                            <span>{statusLabels[booking.status]}</span>
                          </div>
                        </div>

                        {booking.agreedPriceCents && (
                          <p className="text-sm font-semibold text-primary">
                            {formatPrice(booking.agreedPriceCents)}
                          </p>
                        )}

                        {(booking.status === 'PENDING' && tab === 'provider') && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                            <Button
                              size="sm"
                              className="rounded-xl h-8 flex-1"
                              onClick={() => acceptBookingMutation.mutate(booking.id)}
                              disabled={acceptBookingMutation.isPending}
                            >
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-8 flex-1"
                              onClick={() => cancelBookingMutation.mutate(booking.id)}
                              disabled={cancelBookingMutation.isPending}
                            >
                              Refuser
                            </Button>
                          </div>
                        )}
                        {booking.status === 'COMPLETED' && !booking.reviews?.length && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                            <Button size="sm" variant="outline" className="rounded-xl h-8 w-full">
                              <Star className="w-4 h-4 mr-1.5" />
                              Écrire un avis
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Mes réservations - At the bottom */}
            {myReservations && myReservations.filter(b => b.businessServiceId).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">Mes réservations</h2>
                  <span className="text-sm text-muted-foreground">
                    {myReservations.filter(b => b.businessServiceId).length} réservation{myReservations.filter(b => b.businessServiceId).length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myReservations
                    .filter(b => b.businessServiceId)
                    .map((reservation, index) => {
                      const displayStatus = getDisplayStatus(reservation.status, reservation.scheduledAt);
                      const businessSlug = reservation.businessService?.business?.slug;
                      return (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                          className="bg-surface border border-border/50 rounded-2xl overflow-hidden hover:border-border transition-colors group"
                        >
                          {businessSlug ? (
                            <Link
                              href={`/business/${businessSlug}`}
                              className="block p-5 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                    {reservation.businessService?.name || 'Service'}
                                  </p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {reservation.businessService?.business?.name || 'Business'}
                                  </p>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${displayStatus.color}`}
                                >
                                  {displayStatus.icon}
                                  <span>{displayStatus.label}</span>
                                </div>
                              </div>

                              {reservation.employee && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <span className="text-sm">
                                    {reservation.employee.firstName} {reservation.employee.lastName}
                                  </span>
                                </div>
                              )}

                              {reservation.scheduledAt && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(reservation.scheduledAt).toLocaleDateString('fr-FR', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    {' à '}
                                    {new Date(reservation.scheduledAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}

                              {reservation.businessService?.business?.address && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="line-clamp-1">
                                    {reservation.businessService.business.address}
                                    {reservation.businessService.business.city && `, ${reservation.businessService.business.city}`}
                                  </span>
                                </div>
                              )}

                              {reservation.agreedPriceCents && (
                                <p className="text-sm font-semibold text-primary">
                                  {formatPrice(reservation.agreedPriceCents)}
                                </p>
                              )}
                            </Link>
                          ) : (
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold line-clamp-1">
                                    {reservation.businessService?.name || 'Service'}
                                  </p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {reservation.businessService?.business?.name || 'Business'}
                                  </p>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${displayStatus.color}`}
                                >
                                  {displayStatus.icon}
                                  <span>{displayStatus.label}</span>
                                </div>
                              </div>

                              {reservation.employee && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <span className="text-sm">
                                    {reservation.employee.firstName} {reservation.employee.lastName}
                                  </span>
                                </div>
                              )}

                              {reservation.scheduledAt && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(reservation.scheduledAt).toLocaleDateString('fr-FR', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    {' à '}
                                    {new Date(reservation.scheduledAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}

                              {reservation.agreedPriceCents && (
                                <p className="text-sm font-semibold text-primary">
                                  {formatPrice(reservation.agreedPriceCents)}
                                </p>
                              )}
                            </div>
                          )}

                          {(reservation.status === 'PENDING' || reservation.status === 'ACCEPTED') && (
                            <div className="px-5 pb-5 pt-0 border-t border-border/50 mt-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 w-full text-destructive hover:bg-destructive/10 mt-3"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  cancelBookingMutation.mutate(reservation.id);
                                }}
                                disabled={cancelBookingMutation.isPending}
                              >
                                Annuler
                              </Button>
                            </div>
                          )}

                          {/* Leave review button for completed bookings */}
                          {reservation.status === 'COMPLETED' && !reservation.reviews?.some(r => r.type === 'REVIEW_PROVIDER') && (
                            <div className="px-5 pb-5 pt-0 border-t border-border/50 mt-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 w-full mt-3"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReviewBooking(reservation);
                                }}
                              >
                                <Star className="w-4 h-4 mr-1.5" />
                                Écrire un avis
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Review Form Modal */}
      {reviewBooking && (
        <ReviewFormModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          reviewType="REVIEW_PROVIDER"
        />
      )}

      {/* Review Reply Modal */}
      {replyReview && (
        <ReviewReplyModal
          review={replyReview}
          isOpen={!!replyReview}
          onClose={() => setReplyReview(null)}
        />
      )}
    </div>
  );
}

// Service Card Component
function ServiceCard({
  service,
  index,
  onPublish,
  onPause,
  onDelete,
  isPublishing,
  isPausing,
}: {
  service: Service;
  index: number;
  onPublish: () => void;
  onPause: () => void;
  onDelete: () => void;
  isPublishing: boolean;
  isPausing: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const statusConfig = {
    PUBLISHED: { label: 'Publié', class: 'bg-success-soft text-success' },
    PAUSED: { label: 'En pause', class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
    DRAFT: { label: 'Brouillon', class: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              service.kind === 'OFFER'
                ? 'bg-success-soft text-success'
                : 'bg-primary/10 text-primary'
            }`}>
              {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.class}`}>
              {status.label}
            </span>
          </div>
          <Link
            href={`/services/${service.id}`}
            className="font-semibold hover:text-primary transition-colors line-clamp-1"
          >
            {service.title}
          </Link>
          {service.category && (
            <p className="text-sm text-muted-foreground mt-1">{service.category.name}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 z-10 min-w-[160px]"
              >
                <Link
                  href={`/services/${service.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setShowActions(false)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir le service
                </Link>

                {service.status === 'DRAFT' && (
                  <button
                    onClick={() => { onPublish(); setShowActions(false); }}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                  >
                    <Eye className="w-4 h-4" />
                    Publier
                  </button>
                )}

                {service.status === 'PUBLISHED' && (
                  <button
                    onClick={() => { onPause(); setShowActions(false); }}
                    disabled={isPausing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left"
                  >
                    <Pause className="w-4 h-4" />
                    Mettre en pause
                  </button>
                )}

                {service.status === 'PAUSED' && (
                  <button
                    onClick={() => { onPublish(); setShowActions(false); }}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                  >
                    <Eye className="w-4 h-4" />
                    Republier
                  </button>
                )}

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => { setShowConfirmDelete(true); setShowActions(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Supprimer ce service ?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Cette action est irréversible. Le service sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => { onDelete(); setShowConfirmDelete(false); }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Business Service Card Component
function BusinessServiceCard({
  service,
  index,
}: {
  service: BusinessService;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              service.isActive
                ? 'bg-success-soft text-success'
                : 'bg-muted text-muted-foreground'
            }`}>
              {service.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="font-semibold line-clamp-1">{service.name}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatPrice(service.priceCents)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.durationMinutes} min
            </span>
            {service.category && <span>{service.category.name}</span>}
          </div>
        </div>
        <Link href={`/business/services/${service.id}/edit`}>
          <Button variant="ghost" size="sm" className="rounded-xl">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// Service Table Row Component (for particuliers)
function ServiceTableRow({
  service,
  index,
  onPublish,
  onPause,
  onDelete,
  isPublishing,
  isPausing,
}: {
  service: Service;
  index: number;
  onPublish: () => void;
  onPause: () => void;
  onDelete: () => void;
  isPublishing: boolean;
  isPausing: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const statusConfig = {
    PUBLISHED: { label: 'Publié', class: 'bg-success-soft text-success' },
    PAUSED: { label: 'En pause', class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
    DRAFT: { label: 'Brouillon', class: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  const priceDisplay = () => {
    if (service.priceMinCents && service.priceMaxCents) {
      if (service.priceMinCents === service.priceMaxCents) {
        return formatPrice(service.priceMinCents);
      }
      return `${formatPrice(service.priceMinCents)} - ${formatPrice(service.priceMaxCents)}`;
    }
    if (service.priceMinCents) return `À partir de ${formatPrice(service.priceMinCents)}`;
    if (service.priceMaxCents) return `Jusqu'à ${formatPrice(service.priceMaxCents)}`;
    return 'À définir';
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03 }}
        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
      >
        <td className="py-3 px-4">
          <Link
            href={`/services/${service.id}`}
            className="font-medium hover:text-primary transition-colors line-clamp-1"
          >
            {service.title}
          </Link>
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            service.kind === 'OFFER'
              ? 'bg-success-soft text-success'
              : 'bg-primary/10 text-primary'
          }`}>
            {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
          </span>
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground">
          {service.category?.name || '-'}
        </td>
        <td className="py-3 px-4 text-sm font-medium">
          {priceDisplay()}
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.class}`}>
            {status.label}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="relative inline-block">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 min-w-[140px]"
                >
                  <Link
                    href={`/services/${service.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowActions(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir
                  </Link>

                  {service.status === 'DRAFT' && (
                    <button
                      onClick={() => { onPublish(); setShowActions(false); }}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                    >
                      <Eye className="w-4 h-4" />
                      Publier
                    </button>
                  )}

                  {service.status === 'PUBLISHED' && (
                    <button
                      onClick={() => { onPause(); setShowActions(false); }}
                      disabled={isPausing}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  )}

                  {service.status === 'PAUSED' && (
                    <button
                      onClick={() => { onPublish(); setShowActions(false); }}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                    >
                      <Eye className="w-4 h-4" />
                      Republier
                    </button>
                  )}

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={() => { setShowConfirmDelete(true); setShowActions(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </td>
      </motion.tr>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Supprimer ce service ?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Cette action est irréversible. Le service sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => { onDelete(); setShowConfirmDelete(false); }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Business Review Card Component
function BusinessReviewCard({
  review,
  index,
  onReply,
}: {
  review: Review;
  index: number;
  onReply: () => void;
}) {
  const authorName = review.author?.profile?.displayName || 'Client';
  const serviceName = review.booking?.businessService?.name;
  const employeeName = review.booking?.employee
    ? `${review.booking.employee.firstName} ${review.booking.employee.lastName}`
    : null;
  const stars = review.score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
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
          <div>
            <p className="font-medium text-sm">{authorName}</p>
            {serviceName && (
              <p className="text-xs text-muted-foreground">
                {serviceName}
                {employeeName && ` • ${employeeName}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i <= stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-foreground/80 leading-relaxed mb-3 line-clamp-3">
          "{review.comment}"
        </p>
      )}

      <p className="text-xs text-muted-foreground mb-3">
        {new Date(review.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* Business reply preview */}
      {review.reply && (
        <div className="bg-muted/30 rounded-lg p-3 mb-3 border-l-2 border-primary/30">
          <p className="text-xs font-medium text-primary mb-1">Votre réponse</p>
          <p className="text-sm text-foreground/80 line-clamp-2">{review.reply}</p>
        </div>
      )}

      {/* Reply button */}
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl h-8 w-full"
        onClick={onReply}
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        {review.reply ? 'Modifier la réponse' : 'Répondre'}
      </Button>
    </motion.div>
  );
}
