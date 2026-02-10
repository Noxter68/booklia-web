'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  Users,
  Scissors,
  Calendar,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Euro,
  ChevronLeft,
  ChevronRight,
  Crown,
  Palmtree,
  Image as ImageIcon,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { Business, Employee, BusinessService, Booking, BookingStatus, BusinessHours, BusinessCategory, BusinessImage } from '@/types';

export default function BusinessDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'employees' | 'bookings' | 'settings'>('overview');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculer les dates de début et fin de la période
  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      // Début de la semaine (lundi)
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      // Fin de la semaine (dimanche)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Début du mois
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      // Fin du mois
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    const label = viewMode === 'week'
      ? `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return { periodStart: start, periodEnd: end, periodLabel: label };
  }, [currentDate, viewMode]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { data: business, isLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
    refetchOnMount: 'always',
  });

  // Réservations reçues (en tant que provider) avec filtre de date
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['business-bookings', periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: () => api.getMyBookings('provider', periodStart.toISOString(), periodEnd.toISOString()),
    enabled: !!user,
  });

  // Filtrer uniquement les bookings business
  const businessBookings = bookings?.filter(b => b.businessServiceId) || [];
  const pendingBookings = businessBookings.filter(b => b.status === 'PENDING');

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Confirmé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELED: 'Annulé',
    DISPUTED: 'Litige',
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    IN_PROGRESS: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    CANCELED: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400',
    DISPUTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  const acceptBookingMutation = useMutation({
    mutationFn: (id: string) => api.acceptBooking(id),
    onSuccess: () => {
      success('Réservation confirmée');
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError('Erreur lors de la confirmation'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError('Erreur lors de l\'annulation'),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessService(id),
    onSuccess: () => {
      success('Service supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      success('Employé supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <p className="text-muted-foreground">Vous devez être connecté.</p>
        <Link href="/auth/login">
          <Button className="mt-4">Se connecter</Button>
        </Link>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Créez votre business</h1>
          <p className="text-muted-foreground mb-6">
            Configurez votre établissement pour commencer à recevoir des réservations.
          </p>
          <Link href="/business/setup">
            <Button size="lg" className="rounded-full px-8">
              Commencer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'services', label: 'Prestations', icon: Scissors },
    { id: 'employees', label: 'Équipe', icon: Users },
    { id: 'bookings', label: 'Réservations', icon: Calendar },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ] as const;

  return (
    <div className="container mx-auto px-4 pb-6 sm:pb-8 pt-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {business.city || 'Aucune adresse'}
              {business.isVerified && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${business.slug}`}>
            <Button variant="outline" className="rounded-full">
              Voir ma page
            </Button>
          </Link>
          <Link href="/business/settings">
            <Button variant="outline" className="rounded-full w-10 h-10 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="rounded-full whitespace-nowrap"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.services?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.employees?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Employés</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{businessBookings.length}</div>
                <div className="text-sm text-muted-foreground">Réservations</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">0 €</div>
                <div className="text-sm text-muted-foreground">CA ce mois</div>
              </div>
            </div>

            {/* Réservations avec navigation temporelle */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              {/* Header avec navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Réservations
                  </h3>
                  {pendingBookings.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {pendingBookings.length} en attente
                    </Badge>
                  )}
                </div>

                {/* Switcher Semaine/Mois */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-muted rounded-full p-1">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                        viewMode === 'week'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Semaine
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                        viewMode === 'month'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Mois
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation de période */}
              <div className="flex items-center justify-between bg-background rounded-xl p-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{periodLabel}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="rounded-full text-xs h-7"
                  >
                    Aujourd'hui
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Liste des réservations */}
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : businessBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucune réservation pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {businessBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {booking.businessService?.name || 'Prestation'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{booking.requester?.profile?.displayName || 'Client'}</span>
                          {booking.employee && (
                            <>
                              <span>•</span>
                              <span>{booking.employee.firstName} {booking.employee.lastName}</span>
                            </>
                          )}
                          {booking.scheduledAt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                                {' à '}
                                {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {booking.agreedPriceCents && (
                          <span className="font-semibold text-primary">
                            {formatPrice(booking.agreedPriceCents)}
                          </span>
                        )}
                        {booking.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-full h-8 px-3"
                              onClick={() => acceptBookingMutation.mutate(booking.id)}
                              disabled={acceptBookingMutation.isPending}
                            >
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-8 px-3"
                              onClick={() => cancelBookingMutation.mutate(booking.id)}
                              disabled={cancelBookingMutation.isPending}
                            >
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Categories Section */}
            <BusinessCategoriesEditor business={business} />

            {/* Prestations Section */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Prestations
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez les prestations proposées par votre établissement
                  </p>
                </div>
                <Link href="/business/services/new">
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </Link>
              </div>

              {business.services?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Aucune prestation pour le moment</p>
                  <Link href="/business/services/new">
                    <Button variant="outline" className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une prestation
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {business.services?.map((service) => (
                    <DashboardServiceCard
                      key={service.id}
                      service={service}
                      categories={business.categories || []}
                      onDelete={() => deleteServiceMutation.mutate(service.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'employees' && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Équipe</h2>
              <Link href="/business/employees/new">
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un employé
                </Button>
              </Link>
            </div>

            {business.employees?.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Aucun employé pour le moment</p>
                <Link href="/business/employees/new">
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un employé
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {business.employees?.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onDelete={() => deleteEmployeeMutation.mutate(employee.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header avec navigation temporelle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Réservations</h2>
                {pendingBookings.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {pendingBookings.length} en attente
                  </Badge>
                )}
              </div>

              {/* Switcher Semaine/Mois */}
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-full p-1">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                      viewMode === 'week'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                      viewMode === 'month'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Mois
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation de période */}
            <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold capitalize">{periodLabel}</span>
                  {/* Bouton Aujourd'hui */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="rounded-full text-xs"
                  >
                    Aujourd'hui
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : businessBookings.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucune réservation pour cette période</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-surface border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {booking.businessService?.name || 'Service'}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium text-foreground">Client:</span>{' '}
                            {booking.requester?.profile?.displayName || 'Anonyme'}
                          </p>
                          {booking.employee && (
                            <p>
                              <span className="font-medium text-foreground">Avec:</span>{' '}
                              {booking.employee.firstName} {booking.employee.lastName}
                            </p>
                          )}
                          {booking.scheduledAt && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                              {' à '}
                              {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          {booking.agreedPriceCents && (
                            <p className="font-semibold text-primary">
                              {formatPrice(booking.agreedPriceCents)}
                            </p>
                          )}
                        </div>
                      </div>

                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => acceptBookingMutation.mutate(booking.id)}
                            disabled={acceptBookingMutation.isPending}
                          >
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => cancelBookingMutation.mutate(booking.id)}
                            disabled={cancelBookingMutation.isPending}
                          >
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold mb-6">Paramètres</h2>

            {/* Vacation Mode */}
            <VacationModeEditor business={business} />

            {/* Gallery Images */}
            <BusinessGalleryEditor business={business} />

            {/* Business Hours */}
            <BusinessHoursEditor business={business} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Business Hours Editor Component
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function BusinessHoursEditor({ business }: { business: Business }) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Initialize hours state from business.hours or with defaults
  const getInitialHours = () => {
    const defaultHours = [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
      const existing = business.hours?.find((h) => h.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '18:00',
        isClosed: existing?.isClosed ?? (dayOfWeek === 0), // Closed on Sunday by default
      };
    });
    return defaultHours;
  };

  const [hours, setHours] = useState(getInitialHours);

  const updateHoursMutation = useMutation({
    mutationFn: (data: { dayOfWeek: number; startTime: string; endTime: string; isClosed?: boolean }[]) =>
      api.updateBusinessHours(data),
    onSuccess: () => {
      success('Horaires mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  const handleSave = () => {
    updateHoursMutation.mutate(hours);
  };

  const updateHour = (dayOfWeek: number, field: 'startTime' | 'endTime' | 'isClosed', value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horaires d'ouverture
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Définissez les horaires d'ouverture de votre établissement
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateHoursMutation.isPending}
          className="rounded-full"
        >
          {updateHoursMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <div className="space-y-3">
        {hours.map((hour) => (
          <div
            key={hour.dayOfWeek}
            className={`flex items-center gap-4 p-3 rounded-xl ${
              hour.isClosed ? 'bg-muted/50' : 'bg-background'
            }`}
          >
            <div className="w-24 font-medium text-sm">
              {DAY_NAMES[hour.dayOfWeek]}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!hour.isClosed}
                onChange={(e) => updateHour(hour.dayOfWeek, 'isClosed', !e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">Ouvert</span>
            </label>

            {!hour.isClosed && (
              <>
                <input
                  type="time"
                  value={hour.startTime}
                  onChange={(e) => updateHour(hour.dayOfWeek, 'startTime', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground">à</span>
                <input
                  type="time"
                  value={hour.endTime}
                  onChange={(e) => updateHour(hour.dayOfWeek, 'endTime', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </>
            )}

            {hour.isClosed && (
              <span className="text-sm text-muted-foreground italic">Fermé</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Business Categories Editor Component
function BusinessCategoriesEditor({ business }: { business: Business }) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => api.createBusinessCategory({ name }),
    onSuccess: () => {
      success('Catégorie créée');
      setNewCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la création'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.updateBusinessCategory(id, { name }),
    onSuccess: () => {
      success('Catégorie modifiée');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la modification'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessCategory(id),
    onSuccess: () => {
      success('Catégorie supprimée');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const handleCreate = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  const handleUpdate = (id: string) => {
    if (editingName.trim()) {
      updateCategoryMutation.mutate({ id, name: editingName.trim() });
    }
  };

  const startEditing = (category: { id: string; name: string }) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Catégories de prestations
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Organisez vos prestations par catégorie (ex: Ongles, Extensions de cils, etc.)
        </p>
      </div>

      {/* Add new category */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nouvelle catégorie..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />
        <Button
          onClick={handleCreate}
          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
          className="rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Categories list */}
      {business.categories && business.categories.length > 0 ? (
        <div className="space-y-2">
          {business.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-background"
            >
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(category.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(category.id)}
                    disabled={updateCategoryMutation.isPending}
                    className="rounded-full"
                  >
                    Sauver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                    className="rounded-full"
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {category._count?.services || 0} prestation{(category._count?.services || 0) > 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(category)}
                    className="rounded-full h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                    disabled={deleteCategoryMutation.isPending}
                    className="rounded-full h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune catégorie. Créez-en une pour organiser vos prestations.
        </p>
      )}
    </div>
  );
}

function DashboardServiceCard({
  service,
  categories,
  onDelete
}: {
  service: BusinessService;
  categories: BusinessCategory[];
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{service.name}</h4>
            {!service.isActive && (
              <Badge variant="outline" className="text-xs shrink-0">Inactif</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatPrice(service.priceCents)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.durationMinutes} min
            </span>
            {service.businessCategory && (
              <Badge variant="secondary" className="text-xs">
                {service.businessCategory.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-xl shadow-lg py-1 z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowEditModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors w-full cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditServiceModal
          service={service}
          categories={categories}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

// Edit Service Modal
function EditServiceModal({
  service,
  categories,
  onClose,
}: {
  service: BusinessService;
  categories: BusinessCategory[];
  onClose: () => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || '',
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
    businessCategoryId: service.businessCategoryId || null,
    isActive: service.isActive,
  });

  useState(() => {
    setIsMounted(true);
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateBusinessService(service.id, {
        name: formData.name,
        description: formData.description || undefined,
        priceCents: formData.priceCents,
        durationMinutes: formData.durationMinutes,
        businessCategoryId: formData.businessCategoryId || undefined,
        isActive: formData.isActive,
      }),
    onSuccess: () => {
      success('Prestation modifiée');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      onClose();
    },
    onError: () => showError('Erreur lors de la modification'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold">Modifier la prestation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nom de la prestation
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Coupe homme"
                required
                minLength={2}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez cette prestation..."
                rows={3}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Prix
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.priceCents / 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  placeholder="0.00"
                  min={0}
                  step={0.5}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Durée
              </label>
              <div className="grid grid-cols-6 gap-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData({ ...formData, durationMinutes: duration })}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                      formData.durationMinutes === duration
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {duration >= 60 ? `${duration / 60}h` : `${duration}min`}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })
                }
                placeholder="Durée personnalisée"
                min={5}
                max={480}
                className="mt-2"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Catégorie
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, businessCategoryId: null })}
                  className={`w-full p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
                    formData.businessCategoryId === null
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm text-muted-foreground">Sans catégorie</span>
                  {formData.businessCategoryId === null && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessCategoryId: category.id })}
                    className={`w-full p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      formData.businessCategoryId === category.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    {formData.businessCategoryId === category.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Créez des catégories ci-dessus pour organiser vos prestations.
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background">
              <div>
                <p className="font-medium text-sm">Prestation active</p>
                <p className="text-xs text-muted-foreground">
                  Les prestations inactives ne sont pas visibles par les clients
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Annuler
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!formData.name.trim() || updateMutation.isPending}
              isLoading={updateMutation.isPending}
              className="rounded-full"
            >
              Enregistrer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function EmployeeCard({ employee, onDelete }: { employee: Employee; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-medium text-primary">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
            {employee.role && (
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
              <Link
                href={`/business/employees/${employee.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
      {employee.services && employee.services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {employee.services.slice(0, 3).map(({ businessService }) => (
            <Badge key={businessService.id} variant="outline" className="text-xs">
              {businessService.name}
            </Badge>
          ))}
          {employee.services.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{employee.services.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Vacation Mode Editor Component
function VacationModeEditor({ business }: { business: Business }) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [isOnVacation, setIsOnVacation] = useState(business.isOnVacation || false);
  const [vacationMessage, setVacationMessage] = useState(business.vacationMessage || '');

  const updateVacationMutation = useMutation({
    mutationFn: () => api.updateVacationMode(isOnVacation, vacationMessage),
    onSuccess: () => {
      success(isOnVacation ? 'Mode vacances activé' : 'Mode vacances désactivé');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la mise à jour'),
  });

  const handleSave = () => {
    updateVacationMutation.mutate();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Palmtree className="w-5 h-5" />
            Mode vacances
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Activez le mode vacances pour informer vos clients et bloquer les réservations
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateVacationMutation.isPending}
          className="rounded-full"
        >
          {updateVacationMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-background">
          <div className="flex items-center gap-3">
            {isOnVacation && (
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Palmtree className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {isOnVacation ? 'Mode vacances activé' : 'Mode vacances désactivé'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnVacation
                  ? 'Les clients ne peuvent pas prendre de rendez-vous'
                  : 'Les clients peuvent prendre des rendez-vous normalement'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOnVacation}
              onChange={(e) => setIsOnVacation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Message */}
        {isOnVacation && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Message pour vos clients (optionnel)
            </label>
            <textarea
              value={vacationMessage}
              onChange={(e) => setVacationMessage(e.target.value)}
              placeholder="Ex: Nous sommes en congés du 15 au 30 août. À très bientôt !"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce message sera affiché sur votre page publique
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Business Gallery Editor Component
function BusinessGalleryEditor({ business }: { business: Business }) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const images = business.images || [];

  const addImageMutation = useMutation({
    mutationFn: (url: string) => api.addBusinessImage(url),
    onSuccess: () => {
      success('Image ajoutée');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: (err: Error) => showError(err.message || 'Erreur lors de l\'ajout'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessImage(id),
    onSuccess: () => {
      success('Image supprimée');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Cloudinary first
      const result = await api.uploadFile(file, 'image');
      // Then save URL to BusinessImage table
      await addImageMutation.mutateAsync(result.url);
    } catch {
      showError('Erreur lors de l\'upload de l\'image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Galerie photos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez jusqu'à 10 photos de votre établissement ({images.length}/10)
          </p>
        </div>
        {images.length < 10 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              isLoading={isUploading}
              variant="outline"
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isUploading ? 'Upload...' : 'Ajouter une photo'}
            </Button>
          </>
        )}
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">Aucune photo</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez des photos pour présenter votre établissement
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img
                src={image.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => deleteImageMutation.mutate(image.id)}
                  disabled={deleteImageMutation.isPending}
                  className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
