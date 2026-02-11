'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            <h2 className="text-lg font-bold">Annuler la réservation</h2>
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
              <p className="font-medium">{booking.service?.title || booking.businessService?.name || 'Réservation'}</p>
              {booking.businessService?.business?.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  chez {booking.businessService.business.name}
                </p>
              )}
              {booking.scheduledAt && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    à{' '}
                    {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Warning for late cancellation */}
            {isLateCancellation ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                      Annulation tardive
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Cette réservation est prévue dans moins de 24 heures
                      {hoursRemaining !== null && hoursRemaining > 0 && (
                        <span className="font-medium"> ({hoursRemaining}h restantes)</span>
                      )}.
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                      Annuler à ce stade peut être décevant pour la personne qui vous attendait.
                      Une annulation tardive sera notée sur votre profil.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Annulation sans pénalité</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.status === 'PENDING' ? (
                        <>Cette réservation n'a pas encore été acceptée. Vous pouvez l'annuler librement.</>
                      ) : (
                        <>Vous êtes à plus de 24h de la date prévue. Vous pouvez annuler sans pénalité.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <p className="text-sm text-muted-foreground">
              {isLateCancellation ? (
                <>
                  Nous comprenons que des imprévus arrivent, mais les annulations répétées à moins de 24h
                  affectent la confiance que les prestataires peuvent vous accorder.
                </>
              ) : (
                <>
                  L'autre partie sera notifiée de votre annulation. Vous pourrez toujours refaire une
                  demande plus tard si vous le souhaitez.
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-border/50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isLoading}
            >
              Garder la réservation
            </Button>
            <Button
              variant={isLateCancellation ? 'destructive' : 'default'}
              className="flex-1 rounded-xl"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  {isLateCancellation ? 'Annuler quand même' : 'Confirmer'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
