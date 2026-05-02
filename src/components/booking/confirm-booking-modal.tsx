'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

interface ConfirmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  businessName: string;
  serviceName: string;
  employeeName: string;
  address: string;
  city: string;
  date: string;
  time: string;
  durationMinutes: number;
  priceCents: number;
  /** When set, replaces the formatted priceCents with this label
   *  (e.g. "Sur devis" / "Gratuit" for non-FIXED services). */
  priceLabel?: string;
  /** Pre-surcharge total — when set, displayed struck-through next to priceCents. */
  originalPriceCents?: number;
  /** Threshold (in weeks) of the loyalty tier that triggered the surcharge. */
  loyaltySurchargeNote?: number;
  selectedOptions?: { name: string; priceCents: number }[];
}

export function ConfirmBookingModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  businessName,
  serviceName,
  employeeName,
  address,
  city,
  date,
  time,
  durationMinutes,
  priceCents,
  priceLabel,
  originalPriceCents,
  loyaltySurchargeNote,
  selectedOptions,
}: ConfirmBookingModalProps) {
  if (!isOpen) return null;

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const fullAddress = [address, city].filter(Boolean).join(', ');

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
            <h2 className="text-lg font-bold">Confirmer la réservation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Recap */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    chez {businessName}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Avec <strong>{employeeName}</strong></span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="capitalize">{formattedDate}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{time} &middot; {durationMinutes} min</span>
                </div>

                {fullAddress && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{fullAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Options recap */}
            {selectedOptions && selectedOptions.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Options
                </p>
                <ul className="space-y-1.5 text-sm">
                  {selectedOptions.map((opt, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{opt.name}</span>
                      <span className="text-primary font-medium">
                        +{formatPrice(opt.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price */}
            <div className="bg-primary/5 rounded-xl px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <div className="flex items-center gap-2">
                  {originalPriceCents !== undefined && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(originalPriceCents)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-primary">
                    {priceLabel ?? formatPrice(priceCents)}
                  </span>
                </div>
              </div>
              {loyaltySurchargeNote !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Tarif majoré : plus de {loyaltySurchargeNote} semaines depuis votre dernier rendez-vous.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-border/50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isLoading}
            >
              Modifier
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réservation...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
