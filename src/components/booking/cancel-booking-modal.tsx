'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Ban,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';

interface CancelBookingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: CancelBookingModalProps) {
  const t = useTranslations('cancelBooking');
  const tc = useTranslations('common');

  // Calculate if this is a late cancellation (< 24h before scheduled time)
  const { isLateCancellation, hoursRemaining } = useMemo(() => {
    if (!booking.scheduledAt || booking.status !== 'ACCEPTED') {
      return { isLateCancellation: false, hoursRemaining: null };
    }

    const now = new Date();
    const scheduledTime = new Date(booking.scheduledAt);
    const hoursUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      isLateCancellation: hoursUntil < 24 && hoursUntil > 0,
      hoursRemaining: Math.max(0, Math.floor(hoursUntil)),
    };
  }, [booking.scheduledAt, booking.status]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('title')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Service info */}
            <div className="bg-muted/30 rounded-xl p-4">
              <p className="font-medium">{booking.businessService?.name || tc('prestation')}</p>
              {booking.businessService?.business?.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.businessService.business.name}
                </p>
              )}
              {booking.scheduledAt && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(booking.scheduledAt).toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    {new Date(booking.scheduledAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground">
              {t('message')}
            </p>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-border/50 flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              variant={isLateCancellation ? 'destructive' : 'default'}
              className="flex-1 rounded-xl"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              {t('confirm')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
