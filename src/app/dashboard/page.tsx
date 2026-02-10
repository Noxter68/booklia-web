'use client';

import { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowUpRight,
  Scissors,
  Euro,
  MessageCircle,
  Phone,
  Ban,
  Building2,
  Send,
  Inbox,
  Package,
  Play,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { BookingStatus, Service, Booking, Review } from '@/types';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';
import { ReviewReplyModal } from '@/components/reviews/review-reply-modal';
import { BookingDetailModal } from '@/components/booking/booking-detail-modal';
import { CancelBookingModal } from '@/components/booking/cancel-booking-modal';
import { useWebSocket } from '@/contexts/WebSocketContext';

type TabType = 'activity' | 'reservations' | 'services';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { onBookingStatus } = useWebSocket();

  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; role: 'provider' | 'requester' } | null>(null);

  // Listen for real-time booking status updates
  useEffect(() => {
    const unsubscribe = onBookingStatus((updatedBooking) => {
      const updateBookingInCache = (oldData: Booking[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((b) =>
          b.id === updatedBooking.id ? { ...b, status: updatedBooking.status, rejectionMessage: updatedBooking.rejectionMessage } : b
        );
      };

      queryClient.setQueryData(['bookings', 'provider'], updateBookingInCache);
      queryClient.setQueryData(['bookings', 'requester'], updateBookingInCache);

      if (selectedBooking?.booking.id === updatedBooking.id) {
        setSelectedBooking({
          ...selectedBooking,
          booking: { ...selectedBooking.booking, status: updatedBooking.status, rejectionMessage: updatedBooking.rejectionMessage },
        });
      }
    });

    return unsubscribe;
  }, [onBookingStatus, queryClient, selectedBooking]);

  // Queries
  const { data: receivedBookings, isLoading: receivedBookingsLoading } = useQuery({
    queryKey: ['bookings', 'provider'],
    queryFn: () => api.getMyBookings('provider'),
    enabled: !!user && !user.isBusiness,
  });

  const { data: sentBookings, isLoading: sentBookingsLoading } = useQuery({
    queryKey: ['bookings', 'requester'],
    queryFn: () => api.getMyBookings('requester'),
    enabled: !!user && !user.isBusiness,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => api.getMyServices(),
    enabled: !!user && !user.isBusiness,
  });

  // Mutations
  const publishMutation = useMutation({
    mutationFn: (id: string) => api.publishService(id),
    onSuccess: () => {
      success('Service publié !');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseService(id),
    onSuccess: () => {
      success('Service mis en pause');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      success('Service supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const acceptBookingMutation = useMutation({
    mutationFn: (id: string) => api.acceptBooking(id),
    onSuccess: () => {
      success('Réservation acceptée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const rejectBookingMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) => api.rejectBooking(id, message),
    onSuccess: () => {
      success('Demande refusée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => api.deleteBooking(id),
    onSuccess: () => {
      success('Réservation supprimée');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  // Status helpers
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
    IN_PROGRESS: <Play className="w-3.5 h-3.5" />,
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

  // Redirect business users
  if (user.isBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Espace Professionnel</h1>
          <p className="text-muted-foreground mb-6">
            En tant que professionnel, accédez à votre espace dédié.
          </p>
          <Link href="/business/dashboard">
            <Button size="lg" className="rounded-xl px-8">Accéder au dashboard pro</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter P2P bookings (not business)
  const p2pReceivedBookings = receivedBookings?.filter(b => !b.businessServiceId) || [];
  const p2pSentBookings = sentBookings?.filter(b => !b.businessServiceId) || [];
  const businessReservations = sentBookings?.filter(b => b.businessServiceId) || [];

  // Stats
  const pendingReceived = p2pReceivedBookings.filter(b => b.status === 'PENDING').length;
  const pendingSent = p2pSentBookings.filter(b => b.status === 'PENDING').length;
  const publishedServices = services?.filter(s => s.status === 'PUBLISHED').length || 0;
  const upcomingReservations = businessReservations.filter(b =>
    b.status === 'ACCEPTED' && b.scheduledAt && new Date(b.scheduledAt) > new Date()
  ).length;

  const tabs = [
    {
      id: 'activity' as TabType,
      label: 'Entre particuliers',
      icon: Inbox,
      badge: pendingReceived + pendingSent > 0 ? pendingReceived + pendingSent : undefined,
    },
    {
      id: 'reservations' as TabType,
      label: 'Mes RDV pros',
      icon: Building2,
      badge: upcomingReservations > 0 ? upcomingReservations : undefined,
    },
    {
      id: 'services' as TabType,
      label: 'Mes services',
      icon: Package,
      badge: services?.length || undefined,
    },
  ];

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
                  Particulier
                </span>
              </div>
              <p className="text-muted-foreground mt-1">
                Gérez vos services et vos réservations
              </p>
            </div>
            <Link href="/dashboard/services/new">
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
          {[
            {
              label: 'Services publiés',
              value: publishedServices,
              icon: Eye,
              color: 'bg-success-soft text-success',
            },
            {
              label: 'Demandes reçues',
              value: pendingReceived,
              subLabel: 'en attente',
              icon: Inbox,
              color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            },
            {
              label: 'RDV à venir',
              value: upcomingReservations,
              icon: Calendar,
              color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            },
            {
              label: 'Note moyenne',
              value: user.reputation?.ratingAvg5 ? user.reputation.ratingAvg5.toFixed(1) : '-',
              icon: Star,
              color: 'bg-primary/10 text-primary',
            },
          ].map((stat, index) => (
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
              <div className="text-sm text-muted-foreground">
                {stat.label}
                {stat.subLabel && <span className="opacity-70"> ({stat.subLabel})</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                    activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Demandes reçues */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-bold">Demandes reçues</h2>
                    <p className="text-xs text-muted-foreground">Services que vous proposez</p>
                  </div>
                  {pendingReceived > 0 && (
                    <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {pendingReceived} en attente
                    </span>
                  )}
                </div>

                {receivedBookingsLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-40 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : p2pReceivedBookings.length === 0 ? (
                  <div className="bg-surface border border-border/50 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Inbox className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">Aucune demande reçue</p>
                    <p className="text-sm text-muted-foreground">
                      Publiez des services pour recevoir des demandes
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {p2pReceivedBookings.map((booking, index) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          index={index}
                          role="provider"
                          statusColors={statusColors}
                          statusIcons={statusIcons}
                          statusLabels={statusLabels}
                          onAccept={() => acceptBookingMutation.mutate(booking.id)}
                          onReject={(message) => rejectBookingMutation.mutate({ id: booking.id, message })}
                          isAccepting={acceptBookingMutation.isPending}
                          isRejecting={rejectBookingMutation.isPending}
                          onReview={() => setReviewBooking(booking)}
                          onClick={() => setSelectedBooking({ booking, role: 'provider' })}
                          onCancel={() => cancelBookingMutation.mutate(booking.id)}
                          isCanceling={cancelBookingMutation.isPending}
                          onDelete={() => deleteBookingMutation.mutate(booking.id)}
                          isDeleting={deleteBookingMutation.isPending}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Demandes envoyées */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-bold">Mes demandes</h2>
                    <p className="text-xs text-muted-foreground">Services que vous avez sollicités</p>
                  </div>
                  {pendingSent > 0 && (
                    <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {pendingSent} en attente
                    </span>
                  )}
                </div>

                {sentBookingsLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-40 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : p2pSentBookings.length === 0 ? (
                  <div className="bg-surface border border-border/50 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Send className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">Aucune demande envoyée</p>
                    <p className="text-sm text-muted-foreground">
                      Explorez les services disponibles
                    </p>
                    <Link href="/search">
                      <Button variant="outline" size="sm" className="mt-4 rounded-xl">
                        Rechercher des services
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {p2pSentBookings.map((booking, index) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          index={index}
                          role="requester"
                          statusColors={statusColors}
                          statusIcons={statusIcons}
                          statusLabels={statusLabels}
                          onAccept={() => acceptBookingMutation.mutate(booking.id)}
                          onReject={(message) => rejectBookingMutation.mutate({ id: booking.id, message })}
                          isAccepting={acceptBookingMutation.isPending}
                          isRejecting={rejectBookingMutation.isPending}
                          onReview={() => setReviewBooking(booking)}
                          onClick={() => setSelectedBooking({ booking, role: 'requester' })}
                          onCancel={() => cancelBookingMutation.mutate(booking.id)}
                          isCanceling={cancelBookingMutation.isPending}
                          onDelete={() => deleteBookingMutation.mutate(booking.id)}
                          isDeleting={deleteBookingMutation.isPending}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reservations' && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold">Mes rendez-vous chez les pros</h2>
                  <p className="text-xs text-muted-foreground">Coiffeur, esthéticienne, etc.</p>
                </div>
              </div>

              {sentBookingsLoading ? (
                <div className="bg-surface border border-border/50 rounded-2xl animate-pulse h-60" />
              ) : businessReservations.length === 0 ? (
                <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-2">Aucune réservation</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    Prenez rendez-vous chez un professionnel
                  </p>
                  <Link href="/business">
                    <Button className="rounded-xl">
                      <Scissors className="w-4 h-4 mr-2" />
                      Trouver un pro
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Établissement</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prestation</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {businessReservations.map((booking) => (
                          <tr key={booking.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{booking.businessService?.business?.name || 'Établissement'}</p>
                                  {booking.employee && (
                                    <p className="text-xs text-muted-foreground">
                                      avec {booking.employee.firstName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm">{booking.businessService?.name || 'Prestation'}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.businessService?.durationMinutes} min
                              </p>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              {booking.scheduledAt ? (
                                <div>
                                  <p className="text-sm font-medium">
                                    {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                      weekday: 'short',
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
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-sm">
                                {formatPrice(booking.agreedPriceCents || 0)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                                {statusIcons[booking.status]}
                                {statusLabels[booking.status]}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {booking.status === 'PENDING' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => cancelBookingMutation.mutate(booking.id)}
                                    disabled={cancelBookingMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {booking.status === 'CANCELED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteBookingMutation.mutate(booking.id)}
                                    disabled={deleteBookingMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold">Mes services</h2>
                    <p className="text-xs text-muted-foreground">Offres et demandes que vous proposez</p>
                  </div>
                </div>
                <Link href="/dashboard/services/new">
                  <Button size="sm" className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau
                  </Button>
                </Link>
              </div>

              {servicesLoading ? (
                <div className="bg-surface border border-border/50 rounded-2xl animate-pulse h-60" />
              ) : !services || services.length === 0 ? (
                <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-2">Aucun service</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    Créez votre premier service pour commencer
                  </p>
                  <Link href="/dashboard/services/new">
                    <Button className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un service
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((service) => (
                          <ServiceRow
                            key={service.id}
                            service={service}
                            onPublish={() => publishMutation.mutate(service.id)}
                            onPause={() => pauseMutation.mutate(service.id)}
                            onDelete={() => deleteMutation.mutate(service.id)}
                            isPublishing={publishMutation.isPending}
                            isPausing={pauseMutation.isPending}
                            isDeleting={deleteMutation.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <ReviewFormModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
          }}
        />

        <ReviewReplyModal
          review={replyReview}
          onClose={() => setReplyReview(null)}
          onSuccess={() => {
            setReplyReview(null);
          }}
        />

        {selectedBooking && (
          <BookingDetailModal
            booking={selectedBooking.booking}
            role={selectedBooking.role}
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </div>
    </div>
  );
}

// Service Row Component
function ServiceRow({
  service,
  onPublish,
  onPause,
  onDelete,
  isPublishing,
  isPausing,
  isDeleting,
}: {
  service: Service;
  onPublish: () => void;
  onPause: () => void;
  onDelete: () => void;
  isPublishing: boolean;
  isPausing: boolean;
  isDeleting: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const statusConfig = {
    DRAFT: { label: 'Brouillon', color: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400' },
    PUBLISHED: { label: 'Publié', color: 'bg-success-soft text-success' },
    PAUSED: { label: 'En pause', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
    ARCHIVED: { label: 'Archivé', color: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400' },
  };

  const config = statusConfig[service.status] || statusConfig.DRAFT;

  return (
    <>
      <tr className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            {service.coverUrl ? (
              <img src={service.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <Link href={`/services/${service.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                {service.title}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 hidden sm:table-cell">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            service.kind === 'OFFER'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
          }`}>
            {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
          </span>
        </td>
        <td className="py-3 px-4 hidden md:table-cell">
          <span className="text-sm text-muted-foreground">{service.category?.name || '-'}</span>
        </td>
        <td className="py-3 px-4">
          <span className="font-semibold text-sm">
            {service.priceCents ? formatPrice(service.priceCents) : 'Gratuit'}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {service.status === 'PUBLISHED' && <Eye className="w-3 h-3" />}
            {service.status === 'PAUSED' && <Pause className="w-3 h-3" />}
            {config.label}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="relative inline-block">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            <AnimatePresence>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]"
                  >
                    <Link
                      href={`/services/${service.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowActions(false)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir
                    </Link>
                    <Link
                      href={`/dashboard/services/${service.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowActions(false)}
                    >
                      <Briefcase className="w-4 h-4" />
                      Modifier
                    </Link>

                    {service.status === 'PUBLISHED' && (
                      <button
                        onClick={() => { onPause(); setShowActions(false); }}
                        disabled={isPausing}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-amber-600"
                      >
                        <EyeOff className="w-4 h-4" />
                        Mettre en pause
                      </button>
                    )}

                    {(service.status === 'PAUSED' || service.status === 'DRAFT') && (
                      <button
                        onClick={() => { onPublish(); setShowActions(false); }}
                        disabled={isPublishing}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                      >
                        <Eye className="w-4 h-4" />
                        Publier
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
                </>
              )}
            </AnimatePresence>
          </div>
        </td>
      </tr>

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
                  disabled={isDeleting}
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

// Booking Card Component
function BookingCard({
  booking,
  index,
  role,
  statusColors,
  statusIcons,
  statusLabels,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  onReview,
  onClick,
  onCancel,
  isCanceling,
  onDelete,
  isDeleting,
}: {
  booking: Booking;
  index: number;
  role: 'provider' | 'requester';
  statusColors: Record<BookingStatus, string>;
  statusIcons: Record<BookingStatus, React.ReactNode>;
  statusLabels: Record<BookingStatus, string>;
  onAccept: () => void;
  onReject: (message?: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
  onReview: () => void;
  onClick: () => void;
  onCancel: () => void;
  isCanceling: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const otherParty = role === 'provider' ? booking.requester : booking.provider;
  const otherPartyLabel = role === 'provider' ? 'Demandeur' : 'Prestataire';

  const canSeePhone = role === 'provider' &&
    ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) &&
    (booking as any).requesterPhone;

  const handleReject = () => {
    onReject(rejectMessage || undefined);
    setShowRejectModal(false);
    setRejectMessage('');
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border hover:shadow-md transition-all cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold line-clamp-1 flex items-center gap-1">
              {booking.service?.title}
              <ArrowUpRight className="w-4 h-4 opacity-50" />
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              {otherPartyLabel}:{' '}
              <span className="text-foreground">
                {otherParty?.profile?.displayName || 'Anonyme'}
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

        {booking.scheduledAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              à{' '}
              {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {canSeePhone && (
          <div className="flex items-center gap-2 text-sm mb-2 bg-success-soft text-success px-3 py-2 rounded-lg">
            <Phone className="w-4 h-4" />
            <span className="font-medium">{(booking as any).requesterPhone}</span>
          </div>
        )}

        {booking.notes && role === 'provider' && (
          <div className="text-sm text-muted-foreground mb-2 bg-muted/30 p-3 rounded-lg">
            <p className="text-xs font-medium text-foreground mb-1">Message</p>
            <p className="line-clamp-2">{booking.notes}</p>
          </div>
        )}

        {booking.status === 'CANCELED' && (booking as any).rejectionMessage && role === 'requester' && (
          <div className="text-sm mb-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Motif du refus</p>
            <p className="text-red-700 dark:text-red-300 line-clamp-2">{(booking as any).rejectionMessage}</p>
          </div>
        )}

        {booking.agreedPriceCents && (
          <p className="text-sm font-semibold text-primary">
            {formatPrice(booking.agreedPriceCents)}
          </p>
        )}

        {/* Actions for PENDING status (provider only) */}
        {booking.status === 'PENDING' && role === 'provider' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              size="sm"
              className="rounded-xl h-8 flex-1"
              onClick={(e) => { e.stopPropagation(); onAccept(); }}
              disabled={isAccepting}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-8 flex-1"
              onClick={(e) => { e.stopPropagation(); setShowRejectModal(true); }}
              disabled={isRejecting}
            >
              <Ban className="w-4 h-4 mr-1" />
              Refuser
            </Button>
          </div>
        )}

        {/* Cancel button for requester (PENDING or ACCEPTED status) */}
        {role === 'requester' && (booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-8 w-full text-muted-foreground hover:text-destructive hover:border-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelModal(true);
              }}
              disabled={isCanceling}
            >
              <Ban className="w-4 h-4 mr-1" />
              Annuler ma demande
            </Button>
          </div>
        )}

        {/* Review button for completed bookings */}
        {booking.status === 'COMPLETED' && !booking.reviews?.length && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-8 w-full"
              onClick={(e) => { e.stopPropagation(); onReview(); }}
            >
              <Star className="w-4 h-4 mr-1.5" />
              Écrire un avis
            </Button>
          </div>
        )}

        {/* Delete button for canceled bookings */}
        {booking.status === 'CANCELED' && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl h-8 w-full text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Supprimer
            </Button>
          </div>
        )}
      </motion.div>

      {/* Cancel Modal for requester */}
      <CancelBookingModal
        booking={booking}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          onCancel();
          setShowCancelModal(false);
        }}
        isLoading={isCanceling}
      />

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Refuser cette demande ?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Vous pouvez ajouter un message pour expliquer votre refus (optionnel).
              </p>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Ex: Je ne suis pas disponible à cette date..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowRejectModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleReject}
                  disabled={isRejecting}
                >
                  {isRejecting ? 'Refus...' : 'Refuser'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Supprimer cette réservation ?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Cette réservation annulée sera retirée de votre tableau de bord.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    onDelete();
                    setShowDeleteModal(false);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
