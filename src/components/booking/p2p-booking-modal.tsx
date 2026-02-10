'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  kind: 'OFFER' | 'REQUEST';
  priceCents?: number;
  pricingType?: string;
  availableDays?: string[];
  availableFromTime?: string;
  availableToTime?: string;
  createdBy?: {
    profile?: {
      displayName?: string;
    };
  };
}

interface P2PBookingModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

const DAY_TO_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export function P2PBookingModal({ service, isOpen, onClose }: P2PBookingModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'datetime' | 'contact' | 'confirm'>('datetime');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  const createBookingMutation = useMutation({
    mutationFn: (data: {
      serviceId: string;
      scheduledAt?: string;
      notes?: string;
      requesterPhone?: string;
      requesterAddress?: string;
    }) => api.createBooking(data),
    onSuccess: () => {
      success('Demande envoyée !');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onClose();
      resetForm();
    },
    onError: () => {
      showError('Erreur lors de l\'envoi de la demande');
    },
  });

  const resetForm = () => {
    setStep('datetime');
    setSelectedDate('');
    setSelectedTime('');
    setPhone('');
    setAddress('');
    setMessage('');
    setWeekOffset(0);
  };

  // Generate available dates based on service availableDays
  const weekDates = useMemo(() => {
    const dates: { date: string; dayName: string; dayNum: number; available: boolean }[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Map day index to day name
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayName = dayNames[dayOfWeek];

      // Check if this day is available
      const available = !service.availableDays?.length || service.availableDays.includes(dayName);

      dates.push({
        date: dateStr,
        dayName: DAY_LABELS[dayName] || dayName,
        dayNum: date.getDate(),
        available,
      });
    }

    return dates;
  }, [weekOffset, service.availableDays]);

  // Generate time slots based on service availability
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startTime = service.availableFromTime || '08:00';
    const endTime = service.availableToTime || '18:00';

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    return slots;
  }, [service.availableFromTime, service.availableToTime]);

  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return "Auj.";
    if (dateStr === tomorrowStr) return "Dem.";

    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  };

  const headerText = useMemo(() => {
    if (weekDates.length === 0) return '';
    const start = new Date(weekDates[0].date);
    const end = new Date(weekDates[6].date);

    const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
    const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`;
    }
    return `${startMonth.slice(0, 3)} - ${endMonth.slice(0, 3)} ${year}`;
  }, [weekDates]);

  const handleSubmit = () => {
    const scheduledAt = selectedDate && selectedTime
      ? new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      : undefined;

    createBookingMutation.mutate({
      serviceId: service.id,
      scheduledAt,
      notes: message || undefined,
      requesterPhone: phone || undefined,
      requesterAddress: address || undefined,
    });
  };

  const canProceedFromDateTime = selectedDate && selectedTime;
  const canProceedFromContact = phone.trim().length > 0;

  const priceDisplay = service.priceCents
    ? `${formatPrice(service.priceCents)}${service.pricingType === 'HOURLY' ? '/h' : ''}`
    : 'Prix à définir';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold">
                {service.kind === 'OFFER' ? 'Réserver ce service' : 'Proposer vos services'}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-1">{service.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 py-3 border-b border-border bg-muted/30">
            {[
              { key: 'datetime', label: 'Date & heure' },
              { key: 'contact', label: 'Contact' },
              { key: 'confirm', label: 'Confirmation' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    step === s.key
                      ? 'bg-primary text-primary-foreground'
                      : i < ['datetime', 'contact', 'confirm'].indexOf(step)
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < ['datetime', 'contact', 'confirm'].indexOf(step) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      i < ['datetime', 'contact', 'confirm'].indexOf(step)
                        ? 'bg-success'
                        : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[50vh]">
            <AnimatePresence mode="wait">
              {step === 'datetime' && (
                <motion.div
                  key="datetime"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Sélectionnez une date et un horaire</span>
                  </div>

                  {/* Week Navigation */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                      disabled={weekOffset === 0}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        weekOffset === 0
                          ? 'text-muted-foreground/30 cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80 text-foreground cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium">{headerText}</span>
                    <button
                      onClick={() => setWeekOffset(weekOffset + 1)}
                      className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((day) => {
                      const isSelected = selectedDate === day.date;
                      const today = new Date().toISOString().split('T')[0];
                      const isToday = day.date === today;

                      return (
                        <button
                          key={day.date}
                          onClick={() => day.available && setSelectedDate(day.date)}
                          disabled={!day.available}
                          className={`py-2 rounded-lg text-center transition-all ${
                            !day.available
                              ? 'text-muted-foreground/40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted cursor-pointer'
                          }`}
                        >
                          <div className={`text-[10px] uppercase ${isToday && !isSelected ? 'text-primary font-semibold' : ''}`}>
                            {formatDayHeader(day.date)}
                          </div>
                          <div className={`text-sm font-medium ${isToday && !isSelected ? 'text-primary' : ''}`}>
                            {day.dayNum}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Horaire</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTime === time
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 cursor-pointer'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 'contact' && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Votre numéro de téléphone sera visible uniquement si le prestataire accepte votre demande.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Téléphone <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Adresse (optionnel)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la Paix, 75001 Paris"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      Message (optionnel)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre besoin, posez des questions..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-bold text-lg">Vérifiez votre demande</h3>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Service</span>
                      <span className="text-sm font-medium">{service.title}</span>
                    </div>
                    {selectedDate && selectedTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Date & heure</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedDate).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          à {selectedTime}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Téléphone</span>
                      <span className="text-sm font-medium">{phone}</span>
                    </div>
                    {address && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Adresse</span>
                        <span className="text-sm font-medium line-clamp-1">{address}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Prix indicatif</span>
                      <span className="text-lg font-bold text-primary">{priceDisplay}</span>
                    </div>
                  </div>

                  {message && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Votre message</p>
                      <p className="text-sm">{message}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border bg-muted/20">
            <div className="flex gap-3">
              {step !== 'datetime' && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    if (step === 'contact') setStep('datetime');
                    if (step === 'confirm') setStep('contact');
                  }}
                >
                  Retour
                </Button>
              )}
              {step === 'datetime' && (
                <Button
                  className="flex-1 rounded-xl"
                  disabled={!canProceedFromDateTime}
                  onClick={() => setStep('contact')}
                >
                  Continuer
                </Button>
              )}
              {step === 'contact' && (
                <Button
                  className="flex-1 rounded-xl"
                  disabled={!canProceedFromContact}
                  onClick={() => setStep('confirm')}
                >
                  Continuer
                </Button>
              )}
              {step === 'confirm' && (
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleSubmit}
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
