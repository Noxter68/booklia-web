'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Users,
  UserCheck,
  Scissors,
  Calendar,
  Plus,
  Settings,
  Home,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Euro,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  CalendarDays,
  CornerDownRight,
  BanknoteArrowUp,
  Calculator,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  PricingTiersEditor,
  PricingTierDraft,
  tiersToPayload,
  tiersHaveDuplicates,
} from '@/components/business/pricing-tiers-editor';
import { formatPrice } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { Business, Employee, BusinessService, Booking, BookingStatus, BusinessHours, BusinessCategory, BusinessImage } from '@/types';
import dynamic from 'next/dynamic';
import { RevenueChart } from './components/revenue-chart';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { LatestReviews } from './components/latest-reviews';

// Heavy tabs (clients, invoices, agenda) pull in recharts / calendar libs,
// big forms, and the invoice editor. Lazy-load them so the initial dashboard
// bundle only contains the overview path.
const ClientsTab = dynamic(
  () => import('./components/clients-tab').then((m) => ({ default: m.ClientsTab })),
  { ssr: false },
);
const InvoicesTab = dynamic(
  () => import('./components/invoices-tab').then((m) => ({ default: m.InvoicesTab })),
  { ssr: false },
);
const AccountingTab = dynamic(
  () => import('./components/accounting-tab').then((m) => ({ default: m.AccountingTab })),
  { ssr: false },
);
const AgendaTab = dynamic(
  () =>
    import('./components/calendar/agenda-tab').then((m) => ({ default: m.AgendaTab })),
  { ssr: false },
);
import { useTranslations, useLocale } from 'next-intl';
import {
  AmountsVisibilityProvider,
  AmountsVisibilityToggle,
  MaskedAmount,
} from '@/contexts/amounts-visibility-context';

const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  pt: 'pt-BR',
};

function BusinessDashboardContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { onBookingStatus, onNotification } = useWebSocket();
  const t = useTranslations('dashboard');
  const tb = useTranslations('bookings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = LOCALE_MAP[locale] || 'fr-FR';

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['overview', 'services', 'employees', 'bookings', 'clients', 'invoices', 'accounting', 'agenda'] as const;
  const initialTab = validTabs.includes(tabParam as any) ? (tabParam as typeof validTabs[number]) : 'overview';

  type TabId = typeof validTabs[number];
  const [activeTab, setActiveTabState] = useState<TabId>(initialTab);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [navigateToClientId, setNavigateToClientId] = useState<string | null>(null);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(`/business/dashboard${query ? `?${query}` : ''}`, { scroll: false });
  }, [router]);

  const goToClientByUserId = async (userId: string) => {
    try {
      const clients = await api.getBusinessClients();
      const found = clients.find((c) => c.userId === userId);
      if (found) {
        setNavigateToClientId(found.id);
        setActiveTab('clients');
      }
    } catch { /* ignore */ }
  };

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

    const dl = LOCALE_MAP[locale] || 'fr-FR';
    const label = viewMode === 'week'
      ? `${start.toLocaleDateString(dl, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(dl, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : start.toLocaleDateString(dl, { month: 'long', year: 'numeric' });

    return { periodStart: start, periodEnd: end, periodLabel: label };
  }, [currentDate, viewMode, locale]);

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

  // Listen for real-time booking status updates
  useEffect(() => {
    const unsubStatus = onBookingStatus(() => {
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
    });

    // Also listen for new booking notifications (BOOKING_NEW)
    const unsubNotification = onNotification((notification) => {
      if (notification.type === 'BOOKING_NEW' || notification.type === 'BOOKING_CANCELED') {
        queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      }
      if (notification.type === 'REVIEW_RECEIVED') {
        queryClient.invalidateQueries({ queryKey: ['business-reviews'] });
      }
    });

    return () => {
      unsubStatus();
      unsubNotification();
    };
  }, [onBookingStatus, onNotification, queryClient]);

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
  const completedRevenue = businessBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.agreedPriceCents || 0), 0);

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: tb('status.PENDING'),
    ACCEPTED: tb('status.ACCEPTED'),
    REJECTED: tb('status.REJECTED'),
    COMPLETED: tb('status.COMPLETED'),
    CANCELED: tb('status.CANCELED'),
    NO_SHOW: tb('status.NO_SHOW'),
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    CANCELED: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400',
    NO_SHOW: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  };

  const acceptBookingMutation = useMutation({
    mutationFn: (id: string) => api.acceptBooking(id),
    onSuccess: () => {
      success(t('bookingConfirmed'));
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError(t('errorConfirm')),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success(t('bookingCanceled'));
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError(t('errorCancel')),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessService(id),
    onSuccess: () => {
      success(t('serviceDeleted'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError(t('errorDelete')),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      success(t('employeeDeleted'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError(t('errorDelete')),
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text={tc('loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <p className="text-muted-foreground">{t('loginRequired')}</p>
        <Link href="/auth/login">
          <Button className="mt-4">{t('loginButton')}</Button>
        </Link>
      </div>
    );
  }

  if (!business) {
    router.replace('/');
    return null;
  }

  const tabs = [
    { id: 'overview', label: t('overview'), icon: Home },
    { id: 'agenda', label: t('agenda'), icon: CalendarDays },
    { id: 'bookings', label: t('bookings'), icon: Calendar },
    { id: 'services', label: t('prestations'), icon: Scissors },
    { id: 'employees', label: t('team'), icon: Users },
    { id: 'clients', label: t('clients'), icon: UserCheck },
    { id: 'invoices', label: t('invoices'), icon: FileText },
    { id: 'accounting', label: t('accounting'), icon: Calculator },
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
              {business.city || t('noAddress')}
              {business.isVerified && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                  {tc('verified')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <AmountsVisibilityToggle />
          <Link href={`/business/${business.slug}`}>
            <Button variant="outline" className="rounded-full">
              {t('viewMyPage')}
            </Button>
          </Link>
          <Link href="/business/settings">
            <Button variant="outline" className="rounded-full w-10 h-10 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs - Toggle Switcher */}
      <div className="overflow-x-auto -mx-4 px-4 mb-6 scrollbar-none">
        <div className="flex p-1 bg-muted/50 rounded-lg w-fit min-w-full sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-background rounded-md shadow-sm"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.services?.length || 0}</div>
                <div className="text-sm text-muted-foreground">{t('services')}</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.employees?.length || 0}</div>
                <div className="text-sm text-muted-foreground">{t('employeesCount')}</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{businessBookings.length}</div>
                <div className="text-sm text-muted-foreground">{t('reservations')}</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Home className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  <MaskedAmount value={formatPrice(completedRevenue)} />
                </div>
                <div className="text-sm text-muted-foreground">{viewMode === 'week' ? t('caWeek') : t('caMonth')}</div>
              </div>
            </div>

            {/* Graphique CA */}
            <RevenueChart />

            {/* Réservations avec navigation temporelle */}
            <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
              {/* Header: titre · navigation période · switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t('bookings')}
                  </h3>
                  {pendingBookings.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {t('pendingCount', { count: pendingBookings.length })}
                    </Badge>
                  )}
                </div>

                {/* Navigation de période (inline) */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigatePeriod('prev')}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium capitalize px-1">{periodLabel}</span>
                  <button
                    onClick={() => navigatePeriod('next')}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    {t('today')}
                  </button>
                </div>

                <div className="flex-1" />

                {/* Switcher Semaine/Mois */}
                <div className="flex bg-muted/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      viewMode === 'week'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('week')}
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      viewMode === 'month'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('month')}
                  </button>
                </div>
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
                  <p className="text-muted-foreground">{t('noBookingsForPeriod')}</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {/* Table header - desktop */}
                  <div className="hidden lg:grid lg:grid-cols-[140px_1fr_180px_1fr_100px_140px] gap-3 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>{t('tableClient')}</span>
                    <span>{t('tablePrestation')}</span>
                    <span>{t('tableDateTime')}</span>
                    <span>{t('tableEmployee')}</span>
                    <span className="text-right">{t('tablePrice')}</span>
                    <span className="text-center">{t('tableStatus')}</span>
                  </div>

                  {businessBookings.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        idx < businessBookings.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      {/* Mobile layout */}
                      <div className="sm:hidden px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                            className="text-sm font-medium hover:text-primary transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center gap-1">
                              {booking.requester?.name || 'Client'}
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                            </span>
                          </button>
                          {booking.status === 'PENDING' ? (
                            <div className="flex gap-1.5">
                              <Button size="sm" className="rounded-full h-6 px-2 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>OK</Button>
                              <Button size="sm" variant="outline" className="rounded-full h-6 px-2 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>Non</Button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                              {statusLabels[booking.status]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate mr-2 flex items-center gap-1.5 min-w-0">
                            <span className="truncate">{booking.businessService?.name || t('prestation')}</span>
                            {booking.appliedTierWeeks != null && (
                              <span
                                title={`Prix majoré (tarif fidélité, +${booking.appliedTierWeeks} semaines)`}
                                aria-label={`Prix majoré : client revenu après plus de ${booking.appliedTierWeeks} semaines`}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 shrink-0"
                              >
                                <BanknoteArrowUp className="w-3 h-3" />
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {booking.scheduledAt && (
                              <>
                                <span>{new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</span>
                                <span className="px-1 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                                  {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tablet layout */}
                      <div className="hidden sm:flex lg:hidden items-center gap-3 px-4 py-3">
                        <div className="w-30 shrink-0">
                          <button
                            onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                            className="text-sm font-medium truncate block hover:text-primary transition-colors text-left cursor-pointer group"
                          >
                            <span className="flex items-center gap-1">
                              {booking.requester?.name || 'Client'}
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                            </span>
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1.5">
                            <span className="truncate">
                              {booking.businessService?.name || t('prestation')}
                            </span>
                            {booking.appliedTierWeeks != null && (
                              <span
                                title={`Prix majoré (tarif fidélité, +${booking.appliedTierWeeks} semaines)`}
                                aria-label={`Prix majoré : client revenu après plus de ${booking.appliedTierWeeks} semaines`}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 shrink-0"
                              >
                                <BanknoteArrowUp className="w-3 h-3" />
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {booking.scheduledAt ? (
                            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                              <span className="text-muted-foreground">
                                {new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                                {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                        <div className="shrink-0">
                          {booking.status === 'PENDING' ? (
                            <div className="flex gap-1.5">
                              <Button size="sm" className="rounded-full h-7 px-2.5 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>{t('confirm')}</Button>
                              <Button size="sm" variant="outline" className="rounded-full h-7 px-2.5 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>{t('reject')}</Button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                              {statusLabels[booking.status]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden lg:flex items-center gap-3 px-4 py-3">
                        <div className="w-35 shrink-0">
                          <button
                            onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                            className="text-sm font-medium truncate block hover:text-primary transition-colors text-left cursor-pointer group"
                          >
                            <span className="flex items-center gap-1">
                              {booking.requester?.name || 'Client'}
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                            </span>
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate flex items-center gap-1.5">
                            <span className="truncate">
                              {booking.businessService?.name || t('prestation')}
                            </span>
                            {booking.appliedTierWeeks != null && (
                              <span
                                title={`Prix majoré (tarif fidélité, +${booking.appliedTierWeeks} semaines)`}
                                aria-label={`Prix majoré : client revenu après plus de ${booking.appliedTierWeeks} semaines`}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 shrink-0"
                              >
                                <BanknoteArrowUp className="w-3 h-3" />
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="w-45 shrink-0">
                          {booking.scheduledAt ? (
                            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                              <span className="text-muted-foreground">
                                {new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                                {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : <p className="text-sm text-muted-foreground">—</p>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">
                            {booking.employee ? `${booking.employee.firstName} ${booking.employee.lastName}` : '—'}
                          </p>
                        </div>
                        <div className="w-25 text-right shrink-0">
                          {booking.agreedPriceCents ? (
                            <span className="text-sm font-semibold text-primary">{formatPrice(booking.agreedPriceCents)}</span>
                          ) : null}
                        </div>
                        <div className="w-35 shrink-0 flex justify-center">
                          {booking.status === 'PENDING' ? (
                            <div className="flex gap-1.5">
                              <Button size="sm" className="rounded-full h-7 px-2.5 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>{t('confirm')}</Button>
                              <Button size="sm" variant="outline" className="rounded-full h-7 px-2.5 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>{t('reject')}</Button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                              {statusLabels[booking.status]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Derniers avis */}
            <LatestReviews businessId={business.id} />
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ServicesByCategoryView
              business={business}
              onDeleteService={(id) => deleteServiceMutation.mutate(id)}
            />
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
              <h2 className="text-xl font-bold">{t('team')}</h2>
              <Link href="/business/employees/new">
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addEmployee')}
                </Button>
              </Link>
            </div>

            {business.employees?.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">{t('noEmployees')}</p>
                <Link href="/business/employees/new">
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addEmployee')}
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
                <h2 className="text-xl font-bold">{t('bookings')}</h2>
                {pendingBookings.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {t('pendingCount', { count: pendingBookings.length })}
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
                    {t('week')}
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                      viewMode === 'month'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('month')}
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
                    {t('today')}
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
                <p className="text-muted-foreground">{t('noBookingsForPeriod')}</p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Table header */}
                {/* Table header - desktop */}
                  <div className="hidden lg:grid lg:grid-cols-[140px_1fr_180px_1fr_100px_140px] gap-3 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>{t('tableClient')}</span>
                    <span>{t('tablePrestation')}</span>
                    <span>{t('tableDateTime')}</span>
                    <span>{t('tableEmployee')}</span>
                    <span className="text-right">{t('tablePrice')}</span>
                    <span className="text-center">{t('tableStatus')}</span>
                  </div>

                {businessBookings.map((booking, idx) => (
                  <div
                    key={booking.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      idx < businessBookings.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                          className="text-sm font-medium hover:text-primary transition-colors cursor-pointer group"
                        >
                          <span className="flex items-center gap-1">
                            {booking.requester?.name || 'Client'}
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                          </span>
                        </button>
                        {booking.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" className="rounded-full h-6 px-2 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>OK</Button>
                            <Button size="sm" variant="outline" className="rounded-full h-6 px-2 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>Non</Button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate mr-2">{booking.businessService?.name || t('prestation')}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {booking.scheduledAt && (
                            <>
                              <span>{new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</span>
                              <span className="px-1 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                                {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tablet layout */}
                    <div className="hidden sm:flex lg:hidden items-center gap-3 px-4 py-3">
                      <div className="w-30 shrink-0">
                        <button
                          onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                          className="text-sm font-medium truncate block hover:text-primary transition-colors text-left cursor-pointer group"
                        >
                          <span className="flex items-center gap-1">
                            {booking.requester?.name || 'Client'}
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                          </span>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{booking.businessService?.name || t('prestation')}</p>
                      </div>
                      <div className="shrink-0">
                        {booking.scheduledAt ? (
                          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                            <span className="text-muted-foreground">
                              {new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                              {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                      <div className="shrink-0">
                        {booking.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" className="rounded-full h-7 px-2.5 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>{t('confirm')}</Button>
                            <Button size="sm" variant="outline" className="rounded-full h-7 px-2.5 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>{t('reject')}</Button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:flex items-center gap-3 px-4 py-3">
                      <div className="w-35 shrink-0">
                        <button
                          onClick={() => booking.requesterId && goToClientByUserId(booking.requesterId)}
                          className="text-sm font-medium truncate block hover:text-primary transition-colors text-left cursor-pointer group"
                        >
                          <span className="flex items-center gap-1">
                            {booking.requester?.name || 'Client'}
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                          </span>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{booking.businessService?.name || t('prestation')}</p>
                      </div>
                      <div className="w-45 shrink-0">
                        {booking.scheduledAt ? (
                          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                            <span className="text-muted-foreground">
                              {new Date(booking.scheduledAt).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                              {new Date(booking.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : <p className="text-sm text-muted-foreground">—</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.employee ? `${booking.employee.firstName} ${booking.employee.lastName}` : '—'}
                        </p>
                      </div>
                      <div className="w-25 text-right shrink-0">
                        {booking.agreedPriceCents ? (
                          <span className="text-sm font-semibold text-primary">{formatPrice(booking.agreedPriceCents)}</span>
                        ) : null}
                      </div>
                      <div className="w-35 shrink-0 flex justify-center">
                        {booking.status === 'PENDING' ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" className="rounded-full h-7 px-2.5 text-xs" onClick={() => acceptBookingMutation.mutate(booking.id)} disabled={acceptBookingMutation.isPending}>{t('confirm')}</Button>
                            <Button size="sm" variant="outline" className="rounded-full h-7 px-2.5 text-xs" onClick={() => cancelBookingMutation.mutate(booking.id)} disabled={cancelBookingMutation.isPending}>{t('reject')}</Button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'clients' && (
          <motion.div
            key="clients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ClientsTab key={navigateToClientId || 'default'} businessId={business.id} initialClientId={navigateToClientId} />
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InvoicesTab businessId={business.id} />
          </motion.div>
        )}

        {activeTab === 'accounting' && (
          <motion.div
            key="accounting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AccountingTab />
          </motion.div>
        )}

        {activeTab === 'agenda' && (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AgendaTab
              business={business}
              employees={business.employees ?? []}
              services={business.services ?? []}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ============================================
// Services-by-category hierarchical view
// Layout: category > options (sub-folder) > services (sub-folder)
// ============================================
function ServicesByCategoryView({
  business,
  onDeleteService,
}: {
  business: Business;
  onDeleteService: (id: string) => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('dashboard');
  const tf = useTranslations('serviceForm');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);
  // Accordion: at most one group open at a time. "__uncategorized__" for orphan block.
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessCategory(id),
    onSuccess: () => {
      success(t('categoryDeleted'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError(t('errorDelete')),
  });

  const categories = business.categories ?? [];
  const services = business.services ?? [];

  // Group services by category (null category = orphan/uncategorized)
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, BusinessService[]>();
    for (const s of services) {
      const key = s.businessCategoryId ?? '__uncategorized__';
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [services]);

  const uncategorizedServices = servicesByCategory.get('__uncategorized__') ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t('prestations')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('managePrestations')}</p>
        </div>
        <Button
          onClick={() => setShowCreateCategory(true)}
          className="rounded-full shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('newCategory')}
        </Button>
      </div>

      {categories.length === 0 && services.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <Scissors className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">{t('noCategoriesHint')}</p>
          <Button
            onClick={() => setShowCreateCategory(true)}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newCategory')}
          </Button>
        </div>
      )}

      {/* Categories with their services */}
      {categories.map((category) => {
        const catServices = servicesByCategory.get(category.id) ?? [];
        return (
          <CategoryGroup
            key={category.id}
            category={category}
            services={catServices}
            categories={categories}
            isOpen={openGroupId === category.id}
            onToggle={() =>
              setOpenGroupId((prev) => (prev === category.id ? null : category.id))
            }
            onEditCategory={() => setEditingCategory(category)}
            onDeleteCategory={() => deleteCategoryMutation.mutate(category.id)}
            deletingCategory={deleteCategoryMutation.isPending}
            onDeleteService={onDeleteService}
          />
        );
      })}

      {/* Uncategorized services (also collapsible) */}
      {uncategorizedServices.length > 0 && (
        <UncategorizedGroup
          services={uncategorizedServices}
          categories={categories}
          isOpen={openGroupId === '__uncategorized__'}
          onToggle={() =>
            setOpenGroupId((prev) =>
              prev === '__uncategorized__' ? null : '__uncategorized__',
            )
          }
          onDeleteService={onDeleteService}
        />
      )}

      {showCreateCategory && (
        <CategoryEditorModal mode="create" onClose={() => setShowCreateCategory(false)} />
      )}
      {editingCategory && (
        <CategoryEditorModal
          mode="edit"
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Uncategorized services block (collapsible)
// ============================================
function UncategorizedGroup({
  services,
  categories,
  isOpen,
  onToggle,
  onDeleteService,
}: {
  services: BusinessService[];
  categories: BusinessCategory[];
  isOpen: boolean;
  onToggle: () => void;
  onDeleteService: (id: string) => void;
}) {
  const tf = useTranslations('serviceForm');

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors cursor-pointer ${
          isOpen ? 'border-b border-border bg-muted/30' : ''
        }`}
      >
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
        <Scissors className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{tf('recapNoCategory')}</h3>
          <p className="text-xs text-muted-foreground">
            {services.length} {services.length > 1 ? 'prestations' : 'prestation'}
          </p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {services.map((service) => (
                <DashboardServiceCard
                  key={service.id}
                  service={service}
                  categories={categories}
                  onDelete={() => onDeleteService(service.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Single category block: collapsible header + options subfolder + services subfolder
// ============================================
function CategoryGroup({
  category,
  services,
  categories,
  isOpen,
  onToggle,
  onEditCategory,
  onDeleteCategory,
  deletingCategory,
  onDeleteService,
}: {
  category: BusinessCategory;
  services: BusinessService[];
  categories: BusinessCategory[];
  isOpen: boolean;
  onToggle: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  deletingCategory: boolean;
  onDeleteService: (id: string) => void;
}) {
  const t = useTranslations('dashboard');
  const tf = useTranslations('serviceForm');
  const options = category.options ?? [];
  const serviceCount = category._count?.services ?? services.length;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Category header — clickable row; action buttons stop propagation */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors cursor-pointer ${
          isOpen ? 'border-b border-border bg-muted/30' : ''
        }`}
      >
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
        <Scissors className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{category.name}</h3>
          <p className="text-xs text-muted-foreground">
            {serviceCount} {serviceCount > 1 ? 'prestations' : 'prestation'}
            {options.length > 0 &&
              ` · ${options.length} ${options.length > 1 ? 'options' : 'option'}`}
          </p>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 shrink-0"
        >
          <Link href={`/business/services/new?category=${category.id}`}>
            <Button size="sm" variant="outline" className="rounded-full gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t('add')}
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEditCategory}
            className="rounded-full h-8 w-8 p-0"
            title={t('editCategory')}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDeleteCategory}
            disabled={deletingCategory}
            className="rounded-full h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {/* Options subfolder */}
            {options.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="pl-4 border-l-2 border-muted">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <CornerDownRight className="w-3 h-3" />
                    {tf('options')}
                  </p>
                  <div className="space-y-1.5">
                    {options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-muted/40 text-sm"
                      >
                        <span className="font-medium truncate">{opt.name}</span>
                        {opt.groupName && (
                          <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                            {opt.groupName}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-primary font-medium shrink-0">
                          +{(opt.priceCents / 100).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Services subfolder */}
            <div className="px-4 pt-3 pb-4">
              <div className="pl-4 border-l-2 border-muted">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CornerDownRight className="w-3 h-3" />
                  {t('prestations')}
                </p>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{t('noPrestation')}</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <DashboardServiceCard
                        key={service.id}
                        service={service}
                        categories={categories}
                        onDelete={() => onDeleteService(service.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Category create/edit modal (with inline options management)
// ============================================
function CategoryEditorModal({
  mode,
  category,
  onClose,
}: {
  mode: 'create' | 'edit';
  category?: BusinessCategory;
  onClose: () => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('dashboard');
  const tf = useTranslations('serviceForm');
  const tc = useTranslations('common');

  const [name, setName] = useState(category?.name ?? '');
  // Options state: keeps `id` on existing entries so the server can diff-update
  const [options, setOptions] = useState<import('@/lib/api').CategoryOptionInput[]>(
    (category?.options ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description ?? undefined,
      priceCents: o.priceCents,
      durationMinutes: o.durationMinutes ?? undefined,
      groupName: o.groupName ?? undefined,
      sortOrder: o.sortOrder,
    })),
  );

  const createMutation = useMutation({
    mutationFn: () => api.createBusinessCategory({ name: name.trim(), options }),
    onSuccess: () => {
      success(t('categoryCreated'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      onClose();
    },
    onError: () => showError(t('errorUpdate')),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateBusinessCategory(category!.id, { name: name.trim(), options }),
    onSuccess: () => {
      success(t('categoryUpdated'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      onClose();
    },
    onError: () => showError(t('errorUpdate')),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSave = name.trim().length >= 2 && !isPending;

  const handleSubmit = () => {
    if (!canSave) return;
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
  };

  const addOption = (opt: import('@/lib/api').CategoryOptionInput) => {
    setOptions((prev) => [...prev, opt]);
  };
  const updateOption = (index: number, patch: Partial<import('@/lib/api').CategoryOptionInput>) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };
  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

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
          className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold">
              {mode === 'create' ? t('newCategory') : t('editCategory')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('categoryName')} *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('categoryNamePlaceholder')}
                maxLength={100}
              />
            </div>

            <CategoryOptionsEditor
              options={options}
              onAdd={addOption}
              onUpdate={updateOption}
              onRemove={removeOption}
            />
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-full" disabled={isPending}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSave}
              isLoading={isPending}
              className="rounded-full"
            >
              {tc('save')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

// ============================================
// Options editor (list + inline add form) for CategoryEditorModal
// ============================================
function CategoryOptionsEditor({
  options,
  onAdd,
  onUpdate,
  onRemove,
}: {
  options: import('@/lib/api').CategoryOptionInput[];
  onAdd: (opt: import('@/lib/api').CategoryOptionInput) => void;
  onUpdate: (index: number, patch: Partial<import('@/lib/api').CategoryOptionInput>) => void;
  onRemove: (index: number) => void;
}) {
  const tf = useTranslations('serviceForm');
  const tc = useTranslations('common');
  const [draftOpen, setDraftOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [groupName, setGroupName] = useState('');

  const resetDraft = () => {
    setName('');
    setDescription('');
    setPrice('');
    setGroupName('');
    setDraftOpen(false);
  };

  const canAddDraft = name.trim().length > 0 && price !== '' && !isNaN(parseFloat(price));
  const handleAddDraft = () => {
    if (!canAddDraft) return;
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      priceCents: Math.round(parseFloat(price) * 100),
      groupName: groupName.trim() || undefined,
    });
    resetDraft();
  };

  return (
    <div className="border-t border-border pt-5">
      <label className="text-sm font-medium block mb-1">{tf('options')}</label>
      <p className="text-xs text-muted-foreground mb-3">{tf('optionsHint')}</p>

      {options.length > 0 && (
        <div className="space-y-2 mb-3">
          {options.map((opt, i) => (
            <div
              key={opt.id ?? `new-${i}`}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background"
            >
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={opt.name}
                      onChange={(e) => onUpdate(i, { name: e.target.value })}
                      className="h-8 text-sm flex-1 min-w-[120px]"
                      maxLength={100}
                    />
                    {opt.groupName && (
                      <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                        {opt.groupName}
                      </span>
                    )}
                  </div>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {opt.description}
                    </p>
                  )}
                </div>
                <div className="relative w-28">
                  <Euro className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={opt.priceCents / 100}
                    onChange={(e) =>
                      onUpdate(i, {
                        priceCents: e.target.value
                          ? Math.round(parseFloat(e.target.value) * 100)
                          : 0,
                      })
                    }
                    min={0}
                    step={0.5}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
                aria-label={tf('remove')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {draftOpen ? (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
          <div>
            <label className="text-xs font-medium mb-1 block">{tf('optionName')} *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tf('optionNamePlaceholder')}
              maxLength={100}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">{tf('optionDescription')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tf('optionDescriptionPlaceholder')}
              maxLength={500}
              rows={2}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">{tf('optionPrice')} *</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.5}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{tf('optionGroup')}</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={tf('optionGroupPlaceholder')}
                maxLength={50}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{tf('optionGroupHint')}</p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handleAddDraft}
              disabled={!canAddDraft}
              size="sm"
              className="rounded-full gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {tf('addOption')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetDraft}
              className="rounded-full"
            >
              {tc('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setDraftOpen(true)}
          className="w-full rounded-xl gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          {tf('addOption')}
        </Button>
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
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-xl bg-background hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{service.name}</h4>
            {!service.isActive && (
              <Badge variant="outline" className="text-xs shrink-0">{t('inactive')}</Badge>
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
                {tc('edit')}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {tc('delete')}
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
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const tForm = useTranslations('serviceForm');

  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || '',
    detailedDescription: service.detailedDescription || '',
    priceMode: service.priceMode,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
    businessCategoryId: service.businessCategoryId || null,
    isActive: service.isActive,
    pricingTiers: (service.pricingTiers ?? []).map<PricingTierDraft>((tier) => ({
      thresholdWeeks: tier.thresholdWeeks,
      surchargeCents: tier.surchargeCents,
    })),
  });

  useState(() => {
    setIsMounted(true);
  });

  const isFixedPrice = formData.priceMode === 'FIXED';
  const tiersInvalid = tiersHaveDuplicates(formData.pricingTiers);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateBusinessService(service.id, {
        name: formData.name,
        description: formData.description || undefined,
        detailedDescription: formData.detailedDescription || undefined,
        priceMode: formData.priceMode,
        priceCents: isFixedPrice ? formData.priceCents : 0,
        durationMinutes: formData.durationMinutes,
        businessCategoryId: formData.businessCategoryId || undefined,
        isActive: formData.isActive,
        pricingTiers: isFixedPrice ? tiersToPayload(formData.pricingTiers) : [],
      }),
    onSuccess: () => {
      success(t('serviceUpdated'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      onClose();
    },
    onError: () => showError(t('errorUpdate')),
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
          className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold">{t('editServiceTitle')}</h2>
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
                {t('serviceName')}
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
                {t('shortDescription')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Résumé de la prestation (affiché dans la liste)"
                rows={2}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('detailedDescription')}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                {t('detailedDescriptionHint')}
              </p>
              <RichTextEditor
                value={formData.detailedDescription}
                onChange={(value) => setFormData({ ...formData, detailedDescription: value })}
                placeholder="Décrivez en détail ce que comprend cette prestation..."
                minHeight="120px"
              />
            </div>

            {/* Price mode */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tForm('priceMode')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['FIXED', 'QUOTE', 'FREE'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, priceMode: m })}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                      formData.priceMode === m
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {tForm(
                      m === 'FIXED'
                        ? 'priceModeFixed'
                        : m === 'QUOTE'
                        ? 'priceModeQuote'
                        : 'priceModeFree',
                    )}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={formData.priceMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-muted-foreground mt-2"
                >
                  {tForm(
                    formData.priceMode === 'FIXED'
                      ? 'priceModeFixedHint'
                      : formData.priceMode === 'QUOTE'
                      ? 'priceModeQuoteHint'
                      : 'priceModeFreeHint',
                  )}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Price (only for FIXED mode) */}
            <AnimatePresence initial={false}>
              {isFixedPrice && (
                <motion.div
                  key="edit-price-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <label className="text-sm font-medium mb-2 block">
                    {t('price')}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('duration')}
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
                placeholder={t('customDuration')}
                min={5}
                max={480}
                className="mt-2"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('serviceCategories')}
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
                  <span className="text-sm text-muted-foreground">{t('noCategory')}</span>
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
                  {t('noCategoriesCreateHint')}
                </p>
              )}
            </div>

            {/* Loyalty pricing tiers (FIXED only) */}
            <AnimatePresence initial={false}>
              {isFixedPrice && (
                <motion.div
                  key="edit-pricing-tiers"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-3">
                      {tForm('pricingTiersTitle')}
                    </h3>
                    <PricingTiersEditor
                      basePriceCents={formData.priceCents}
                      tiers={formData.pricingTiers}
                      onChange={(next) => setFormData({ ...formData, pricingTiers: next })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background">
              <div>
                <p className="font-medium text-sm">{t('activeService')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('inactiveServiceHint')}
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
              {tc('cancel')}
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={
                !formData.name.trim() || updateMutation.isPending || tiersInvalid
              }
              isLoading={updateMutation.isPending}
              className="rounded-full"
            >
              {tc('save')}
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
  const tc = useTranslations('common');

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
                {tc('edit')}
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
              >
                <Trash2 className="w-4 h-4" />
                {tc('delete')}
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

export default function BusinessDashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 pt-24"><PageLoader /></div>}>
      <AmountsVisibilityProvider>
        <BusinessDashboardContent />
      </AmountsVisibilityProvider>
    </Suspense>
  );
}

