'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Clock,
  Check,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarX,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { ConfirmBookingModal } from '@/components/booking/confirm-booking-modal';
import { LoyaltySurchargeModal } from '@/components/booking/loyalty-surcharge-modal';
import { formatPrice } from '@/lib/utils';
import { computeLoyaltySurcharge } from '@/lib/loyalty';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  pt: 'pt-BR',
};

export default function BookingPage() {
  const { slug, serviceId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const t = useTranslations('business');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = LOCALE_MAP[locale] || 'fr-FR';

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [direction, setDirection] = useState(0);
  const [expandedDayOverride, setExpandedDayOverride] = useState<string | null | undefined>(undefined);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch business data
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.getBusinessBySlug(slug as string),
    enabled: !!slug,
  });

  // Check if current user owns a business (business accounts cannot book)
  const { data: myBusiness, isLoading: myBusinessLoading } = useQuery({
    queryKey: ['myBusiness'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
    retry: false,
  });

  const isBusinessOwner = !!myBusiness;

  // Get the selected service
  const selectedService = business?.services?.find(s => s.id === serviceId);

  // Service options inherited from the service's business category
  const serviceOptions = useMemo(
    () =>
      (selectedService?.businessCategory?.options ?? []).filter(
        (o) => o.isActive,
      ),
    [selectedService],
  );

  // Group options by groupName: entries with null group become individual checkboxes
  const optionGroups = useMemo(() => {
    const groups = new Map<string, typeof serviceOptions>();
    const ungrouped: typeof serviceOptions = [];
    for (const opt of serviceOptions) {
      if (opt.groupName) {
        const arr = groups.get(opt.groupName) ?? [];
        arr.push(opt);
        groups.set(opt.groupName, arr);
      } else {
        ungrouped.push(opt);
      }
    }
    return { groups: Array.from(groups.entries()), ungrouped };
  }, [serviceOptions]);

  const selectedOptions = useMemo(
    () => serviceOptions.filter((o) => selectedOptionIds.includes(o.id)),
    [serviceOptions, selectedOptionIds],
  );

  const optionsExtraCents = useMemo(
    () => selectedOptions.reduce((sum, o) => sum + o.priceCents, 0),
    [selectedOptions],
  );

  const toggleOption = (optionId: string, groupName: string | null | undefined) => {
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      if (groupName) {
        // Replace any other option from the same group
        const othersInGroup = serviceOptions
          .filter((o) => o.groupName === groupName && o.id !== optionId)
          .map((o) => o.id);
        return [...prev.filter((id) => !othersInGroup.includes(id)), optionId];
      }
      return [...prev, optionId];
    });
  };

  // Get employees for this service
  const employeesForService = useMemo(() => {
    if (!business?.employees || !selectedService) return [];
    return business.employees.filter((emp) =>
      emp.services?.some((s) => s.businessService.id === selectedService.id)
    );
  }, [business?.employees, selectedService]);

  // Generate dates for the calendar week
  const calendarDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    today.setDate(today.getDate() + calendarWeekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [calendarWeekOffset]);

  // Fetch slots for the week
  const { data: weekSlotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['weekSlots', selectedEmployee, serviceId, calendarWeekOffset],
    queryFn: () =>
      api.getAvailableSlotsMultipleDays(
        selectedEmployee!,
        serviceId as string,
        calendarDates
      ),
    enabled: !!selectedEmployee && !!serviceId,
  });

  // Loyalty info comes from any day in the week response (it's per service+user,
  // not per day). Pick the first non-null payload.
  const loyalty = useMemo(() => {
    if (!weekSlotsData) return null;
    const found = weekSlotsData.find((d) => d.loyalty);
    return found?.loyalty ?? null;
  }, [weekSlotsData]);

  // Surcharge applies on the service base price only — options are unchanged.
  const loyaltyResult = useMemo(() => {
    if (!loyalty || !selectedDate || !selectedTime) {
      return { surchargeCents: 0, appliedTierWeeks: null, weeksSinceLast: null };
    }
    return computeLoyaltySurcharge(
      loyalty.pricingTiers,
      loyalty.lastCompletedAt ? new Date(loyalty.lastCompletedAt) : null,
      new Date(`${selectedDate}T${selectedTime}:00`),
    );
  }, [loyalty, selectedDate, selectedTime]);

  const baseServiceCents = selectedService?.priceCents ?? 0;
  const totalPriceCents =
    baseServiceCents + optionsExtraCents + loyaltyResult.surchargeCents;
  const totalWithoutSurchargeCents = baseServiceCents + optionsExtraCents;
  const hasSurcharge = loyaltyResult.surchargeCents > 0;

  // Show the loyalty modal once per (date, time) selection so it doesn't
  // re-trigger on every re-render. Cleared when the selection changes.
  const [loyaltyAcknowledgedKey, setLoyaltyAcknowledgedKey] = useState<string | null>(
    null,
  );
  const selectionKey = `${selectedDate}|${selectedTime}`;
  const shouldShowLoyaltyModal =
    hasSurcharge && loyaltyAcknowledgedKey !== selectionKey;

  // Auto-expand first available day on mobile, allow user override
  const autoExpandDay = useMemo(() => {
    if (!weekSlotsData) return null;
    const first = weekSlotsData.find(d => d.slots?.some(s => s.available));
    return first?.date ?? null;
  }, [weekSlotsData]);

  const expandedDay = expandedDayOverride !== undefined ? expandedDayOverride : autoExpandDay;
  const setExpandedDay = (day: string | null) => setExpandedDayOverride(day);

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      return api.createBusinessBooking({
        businessServiceId: serviceId as string,
        employeeId: selectedEmployee!,
        scheduledAt,
        selectedOptionIds: selectedOptionIds.length ? selectedOptionIds : undefined,
      });
    },
    onSuccess: () => {
      setBookingSuccess(true);
      success(t('bookingSuccess'));
    },
    onError: (err: Error) => {
      showError(err.message || t('bookingError'));
    },
  });

  // Format day header
  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekday = date.toLocaleDateString(dateLocale, { weekday: 'long' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString(dateLocale, { month: 'short' });

    if (dateStr === todayStr) {
      return { weekday: t('today'), dayNum, month, isToday: true };
    }
    if (dateStr === tomorrowStr) {
      return { weekday: t('tomorrow'), dayNum, month, isToday: false };
    }

    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      dayNum,
      month,
      isToday: false
    };
  };

  // Get slots for a specific date
  const getSlotsForDate = (date: string) => {
    const daySlots = weekSlotsData?.find(d => d.date === date);
    return daySlots?.slots || [];
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    if (calendarWeekOffset > 0) {
      setDirection(-1);
      setCalendarWeekOffset(prev => prev - 1);
      setExpandedDayOverride(undefined);
    }
  };

  const goToNextWeek = () => {
    setDirection(1);
    setCalendarWeekOffset(prev => prev + 1);
    setExpandedDayOverride(undefined);
  };

  // Get header text
  const headerText = useMemo(() => {
    const start = new Date(calendarDates[0]);
    const end = new Date(calendarDates[6]);

    const startMonth = start.toLocaleDateString(dateLocale, { month: 'long' });
    const endMonth = end.toLocaleDateString(dateLocale, { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`;
    }
    return `${startMonth.slice(0, 3)} - ${endMonth.slice(0, 3)} ${year}`;
  }, [calendarDates, dateLocale]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (businessLoading || myBusinessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader text={tc('loading')} />
      </div>
    );
  }

  if (!business || !selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">{t('serviceNotFound')}</h1>
          <p className="text-muted-foreground mb-4">{t('serviceNotFoundDesc')}</p>
          <Link href={`/business/${slug}`}>
            <Button>{tc('back')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Online booking disabled by the business
  if (business && !business.acceptsOnlineBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarX className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Réservation en ligne indisponible</h1>
          <p className="text-muted-foreground mb-6">
            Ce salon n&apos;accepte pas les réservations en ligne pour le moment. Contactez-le directement pour prendre rendez-vous.
          </p>
          {(business.phone || business.email) && (
            <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{business.phone}</span>
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{business.email}</span>
                </a>
              )}
            </div>
          )}
          <Link href={`/business/${slug}`}>
            <Button variant="outline">{t('backToProfile')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Business owners cannot book
  if (isBusinessOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">{t('bookingImpossible')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('businessCannotBook')}
          </p>
          <Link href={`/business/${slug}`}>
            <Button variant="outline">{t('backToProfile')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('bookingConfirmedTitle')}</h1>
            <p className="text-muted-foreground mb-8">
              {t('bookingConfirmedDesc')}
            </p>

            <div className="bg-muted rounded-xl p-4 mb-8 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('prestation')}</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('date')}</span>
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString(dateLocale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('time')}</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium">{t('total')}</span>
                <span className="font-bold text-primary">{formatPrice(totalPriceCents)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={() => router.push('/mes-reservations')}
              >
                {t('viewMyBookings')}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                size="lg"
                onClick={() => router.push(`/business/${slug}`)}
              >
                {t('backTo', { name: business.name })}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const selectedEmployeeData = employeesForService.find(e => e.id === selectedEmployee);

  return (
    <div className="min-h-screen bg-background pt-28 pb-32 md:pb-12">
      <div className="container mx-auto px-4">
        {/* Header + Employee Selection (single row) */}
        <div className="mb-6">
          <Link
            href={`/business/${slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backTo', { name: business.name })}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Service info */}
            <div className="shrink-0">
              <h1 className="text-2xl font-bold">{selectedService.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {t('duration', { minutes: selectedService.durationMinutes })}
                </span>
                <span className="font-semibold text-primary">
                  {formatPrice(totalPriceCents)}
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden lg:block w-px h-10 bg-border" />

            {/* Mobile: Employee select dropdown */}
            <div className="md:hidden relative" ref={employeeDropdownRef}>
              <button
                onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {selectedEmployeeData ? (
                    <>
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {selectedEmployeeData.avatarUrl ? (
                          <img src={selectedEmployeeData.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-primary">
                            {selectedEmployeeData.firstName[0]}{selectedEmployeeData.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{selectedEmployeeData.firstName} {selectedEmployeeData.lastName}</p>
                        {selectedEmployeeData.role && (
                          <p className="text-xs text-muted-foreground">{selectedEmployeeData.role}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t('selectProfessional')}</span>
                    </>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${employeeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {employeeDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-30 overflow-hidden">
                  {employeesForService.length > 1 && (
                    <button
                      onClick={() => {
                        setSelectedEmployee(employeesForService[0]?.id || null);
                        setSelectedDate('');
                        setSelectedTime('');
                        setEmployeeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors cursor-pointer ${
                        !selectedEmployee ? 'bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{t('noPreference')}</span>
                    </button>
                  )}
                  {employeesForService.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => {
                        setSelectedEmployee(employee.id);
                        setSelectedDate('');
                        setSelectedTime('');
                        setEmployeeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors cursor-pointer ${
                        selectedEmployee === employee.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {employee.avatarUrl ? (
                          <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{employee.firstName} {employee.lastName}</p>
                        {employee.role && (
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                        )}
                      </div>
                      {selectedEmployee === employee.id && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: Employee cards (horizontal) */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-0.5 -mx-0.5">
              {employeesForService.length > 1 && (
                <button
                  onClick={() => {
                    setSelectedEmployee(employeesForService[0]?.id || null);
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-surface transition-all cursor-pointer shrink-0 ${
                    !selectedEmployee
                      ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                      : 'border-border hover:border-primary/50 shadow-sm'
                  }`}
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-xs">{t('noPreference')}</span>
                </button>
              )}

              {employeesForService.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => {
                    setSelectedEmployee(employee.id);
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-surface transition-all cursor-pointer shrink-0 ${
                    selectedEmployee === employee.id
                      ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                      : 'border-border hover:border-primary/50 shadow-sm'
                  }`}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {employee.avatarUrl ? (
                      <img
                        src={employee.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-xs whitespace-nowrap">
                      {employee.firstName} {employee.lastName}
                    </p>
                    {employee.role && (
                      <p className="text-[11px] text-muted-foreground whitespace-nowrap">{employee.role}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Options Section */}
        {selectedEmployee && serviceOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-surface border border-border rounded-2xl"
          >
            <h2 className="text-lg font-semibold mb-1">{t('optionsTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('optionsSubtitle')}</p>

            <div className="space-y-5">
              {/* Grouped options (exclusive choice) */}
              {optionGroups.groups.map(([groupName, opts]) => (
                <div key={groupName}>
                  <p className="text-sm font-medium mb-2">{groupName}</p>
                  <div className="space-y-2">
                    {opts.map((opt) => {
                      const checked = selectedOptionIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`option-group-${groupName}`}
                            checked={checked}
                            onChange={() => toggleOption(opt.id, groupName)}
                            className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{opt.name}</span>
                              <span className="text-sm font-semibold text-primary shrink-0">
                                +{formatPrice(opt.priceCents)}
                              </span>
                            </div>
                            {opt.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Ungrouped options (free multi-select) */}
              {optionGroups.ungrouped.length > 0 && (
                <div>
                  {optionGroups.groups.length > 0 && (
                    <p className="text-sm font-medium mb-2">{t('optionsExtras')}</p>
                  )}
                  <div className="space-y-2">
                    {optionGroups.ungrouped.map((opt) => {
                      const checked = selectedOptionIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOption(opt.id, null)}
                            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{opt.name}</span>
                              <span className="text-sm font-semibold text-primary shrink-0">
                                +{formatPrice(opt.priceCents)}
                              </span>
                            </div>
                            {opt.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Calendar Section */}
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{t('chooseDateAndTime')}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousWeek}
                  disabled={calendarWeekOffset === 0}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    calendarWeekOffset === 0
                      ? 'text-muted-foreground/30 cursor-not-allowed'
                      : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {headerText}
                </span>
                <button
                  onClick={goToNextWeek}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Full Width Calendar Grid */}
            <div className="relative overflow-hidden bg-surface border border-border rounded-2xl">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={calendarWeekOffset}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <>
                    {/* Desktop: 7-column grid */}
                    <div className="hidden md:grid md:grid-cols-7 divide-x divide-border">
                      {calendarDates.map((date) => {
                        const { weekday, dayNum, month, isToday } = formatDayHeader(date);
                        const slots = getSlotsForDate(date);
                        const availableSlots = slots.filter(s => s.available);

                        return (
                          <div key={date} className="min-h-[300px]">
                            {/* Day Header */}
                            <div className={`text-center py-4 border-b border-border ${
                              isToday ? 'bg-primary/5' : 'bg-muted/30'
                            }`}>
                              <div className={`text-xs font-medium mb-1 ${
                                isToday ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {weekday}
                              </div>
                              <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-lg font-semibold ${
                                isToday
                                  ? 'bg-primary text-primary-foreground'
                                  : availableSlots.length > 0
                                  ? 'text-foreground'
                                  : 'text-muted-foreground/40'
                              }`}>
                                {dayNum}
                              </div>
                              <div className={`text-[10px] mt-0.5 ${
                                isToday ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {month}
                              </div>
                            </div>

                            {/* Time Slots */}
                            <div className="p-2 space-y-1">
                              {availableSlots.length === 0 ? (
                                <div className="text-xs text-muted-foreground/40 text-center py-8">
                                  {t('unavailable')}
                                </div>
                              ) : (
                                availableSlots.map((slot) => {
                                  const isSelected = selectedDate === date && selectedTime === slot.time;

                                  return (
                                    <button
                                      key={`${date}-${slot.time}`}
                                      onClick={() => {
                                        setSelectedDate(date);
                                        setSelectedTime(slot.time);
                                      }}
                                      className={`w-full text-sm py-2 px-2 rounded-lg transition-all font-medium cursor-pointer ${
                                        isSelected
                                          ? 'bg-primary text-primary-foreground shadow-md'
                                          : 'bg-primary/10 hover:bg-primary/20 text-primary'
                                      }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile: Accordion day list */}
                    <div className="md:hidden divide-y divide-border">
                      {calendarDates.map((date) => {
                        const { weekday, dayNum, month, isToday } = formatDayHeader(date);
                        const slots = getSlotsForDate(date);
                        const availableSlots = slots.filter(s => s.available);
                        const isExpanded = expandedDay === date;
                        const hasSelection = selectedDate === date;

                        return (
                          <div key={date}>
                            {/* Day row */}
                            <button
                              onClick={() => setExpandedDay(isExpanded ? null : date)}
                              className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer ${
                                isToday ? 'bg-primary/5' : ''
                              } ${isExpanded ? 'bg-muted/30' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isToday
                                    ? 'bg-primary text-primary-foreground'
                                    : hasSelection
                                    ? 'bg-primary/15 text-primary'
                                    : availableSlots.length > 0
                                    ? 'bg-muted text-foreground'
                                    : 'bg-muted/50 text-muted-foreground/40'
                                }`}>
                                  {dayNum}
                                </div>
                                <div className="text-left">
                                  <p className={`text-sm font-semibold ${
                                    availableSlots.length === 0 ? 'text-muted-foreground/40' : 'text-foreground'
                                  }`}>
                                    {weekday} {month}
                                  </p>
                                  <p className={`text-xs ${
                                    availableSlots.length === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground'
                                  }`}>
                                    {availableSlots.length === 0
                                      ? t('unavailable')
                                      : availableSlots.length > 1
                                        ? t('slotsAvailablePlural', { count: availableSlots.length })
                                        : t('slotsAvailable', { count: availableSlots.length })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasSelection && (
                                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {selectedTime}
                                  </span>
                                )}
                                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                } ${availableSlots.length === 0 ? 'opacity-30' : ''}`} />
                              </div>
                            </button>

                            {/* Expanded slots */}
                            <AnimatePresence>
                              {isExpanded && availableSlots.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-1 grid grid-cols-4 gap-2">
                                    {availableSlots.map((slot) => {
                                      const isSelected = selectedDate === date && selectedTime === slot.time;
                                      return (
                                        <button
                                          key={`${date}-${slot.time}`}
                                          onClick={() => {
                                            setSelectedDate(date);
                                            setSelectedTime(slot.time);
                                          }}
                                          className={`text-sm py-2.5 rounded-xl transition-all font-medium cursor-pointer ${
                                            isSelected
                                              ? 'bg-primary text-primary-foreground shadow-md'
                                              : 'bg-primary/10 hover:bg-primary/20 text-primary'
                                          }`}
                                        >
                                          {slot.time}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* Loyalty surcharge modal — fired once per slot selection when applicable */}
      <LoyaltySurchargeModal
        isOpen={shouldShowLoyaltyModal}
        onClose={() => setLoyaltyAcknowledgedKey(selectionKey)}
        weeksSinceLast={loyaltyResult.weeksSinceLast ?? 0}
        appliedTierWeeks={loyaltyResult.appliedTierWeeks ?? 0}
        basePriceCents={totalWithoutSurchargeCents}
        totalPriceCents={totalPriceCents}
      />

      {/* Confirmation Modal */}
      <ConfirmBookingModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          bookingMutation.mutate();
          setShowConfirmModal(false);
        }}
        isLoading={bookingMutation.isPending}
        businessName={business.name}
        serviceName={selectedService.name}
        employeeName={
          selectedEmployeeData
            ? `${selectedEmployeeData.firstName} ${selectedEmployeeData.lastName}`
            : ''
        }
        address={business.address || ''}
        city={business.city || ''}
        date={selectedDate}
        time={selectedTime}
        durationMinutes={selectedService.durationMinutes}
        priceCents={totalPriceCents}
        originalPriceCents={hasSurcharge ? totalWithoutSurchargeCents : undefined}
        loyaltySurchargeNote={
          hasSurcharge && loyaltyResult.appliedTierWeeks
            ? loyaltyResult.appliedTierWeeks
            : undefined
        }
        selectedOptions={selectedOptions.map((o) => ({ name: o.name, priceCents: o.priceCents }))}
      />

      {/* Fixed Bottom Bar */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border p-4 z-40"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString(dateLocale, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedTime}</span>
                </div>
                {selectedEmployeeData && (
                  <div className="hidden sm:flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEmployeeData.firstName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {hasSurcharge && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(totalWithoutSurchargeCents)}
                    </span>
                  )}
                  <span className="font-bold text-primary">
                    {formatPrice(totalPriceCents)}
                  </span>
                </div>
              </div>

              {!user ? (
                <div className="flex gap-3 w-full sm:w-auto">
                  <Link href="/auth/login" className="flex-1 sm:flex-none">
                    <Button className="w-full rounded-full" size="lg">
                      {t('loginToBook')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full sm:w-auto rounded-full px-8"
                  size="lg"
                  onClick={() => setShowConfirmModal(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('confirmBooking')}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
