'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { ConfirmBookingModal } from '@/components/booking/confirm-booking-modal';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function BookingPage() {
  const { slug, serviceId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [direction, setDirection] = useState(0);

  // Fetch business data
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.getBusinessBySlug(slug as string),
    enabled: !!slug,
  });

  // Get the selected service
  const selectedService = business?.services?.find(s => s.id === serviceId);

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

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      return api.createBusinessBooking({
        businessServiceId: serviceId as string,
        employeeId: selectedEmployee!,
        scheduledAt,
      });
    },
    onSuccess: () => {
      setBookingSuccess(true);
      success('Réservation confirmée !');
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de la réservation');
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

    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });

    if (dateStr === todayStr) {
      return { weekday: "Aujourd'hui", dayNum, month, isToday: true };
    }
    if (dateStr === tomorrowStr) {
      return { weekday: "Demain", dayNum, month, isToday: false };
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
    }
  };

  const goToNextWeek = () => {
    setDirection(1);
    setCalendarWeekOffset(prev => prev + 1);
  };

  // Get header text
  const headerText = useMemo(() => {
    const start = new Date(calendarDates[0]);
    const end = new Date(calendarDates[6]);

    const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
    const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`;
    }
    return `${startMonth.slice(0, 3)} - ${endMonth.slice(0, 3)} ${year}`;
  }, [calendarDates]);

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

  if (businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!business || !selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Service non trouvé</h1>
          <p className="text-muted-foreground mb-4">Ce service n'existe pas.</p>
          <Link href={`/business/${slug}`}>
            <Button>Retour</Button>
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
            <h1 className="text-2xl font-bold mb-2">Réservation confirmée !</h1>
            <p className="text-muted-foreground mb-8">
              Vous recevrez un email de confirmation avec tous les détails.
            </p>

            <div className="bg-muted rounded-xl p-4 mb-8 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prestation</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Heure</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium">Total</span>
                <span className="font-bold text-primary">{formatPrice(selectedService.priceCents)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={() => router.push('/mes-reservations')}
              >
                Voir mes réservations
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                size="lg"
                onClick={() => router.push(`/business/${slug}`)}
              >
                Retour à {business.name}
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
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/business/${slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à {business.name}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{selectedService.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {selectedService.durationMinutes} min
                </span>
                <span className="font-semibold text-primary">
                  {formatPrice(selectedService.priceCents)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Choisissez un intervenant
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* "Pas de préférence" option */}
            {employeesForService.length > 1 && (
              <button
                onClick={() => {
                  // Select the first available employee as default
                  setSelectedEmployee(employeesForService[0]?.id || null);
                  setSelectedDate('');
                  setSelectedTime('');
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                  !selectedEmployee
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-sm">Pas de préférence</span>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                  selectedEmployee === employee.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">
                    {employee.firstName} {employee.lastName}
                  </p>
                  {employee.role && (
                    <p className="text-xs text-muted-foreground">{employee.role}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Choisissez une date et un horaire</h2>
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
                    <div className="grid grid-cols-7 divide-x divide-border">
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
                                  Indisponible
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
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

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
        priceCents={selectedService.priceCents}
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
                    {new Date(selectedDate).toLocaleDateString('fr-FR', {
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
                <span className="font-bold text-primary">
                  {formatPrice(selectedService.priceCents)}
                </span>
              </div>

              {!user ? (
                <div className="flex gap-3 w-full sm:w-auto">
                  <Link href="/auth/login" className="flex-1 sm:flex-none">
                    <Button className="w-full rounded-full" size="lg">
                      Se connecter
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
                  Confirmer la réservation
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
