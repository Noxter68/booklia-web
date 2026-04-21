'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Booking, ReviewType } from '@/types';

interface ReviewFormModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewFormModal({ booking, onClose, onSuccess }: ReviewFormModalProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('review');
  const tc = useTranslations('common');

  const reviewType: ReviewType = 'REVIEW_PROVIDER';

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.createReview({
        bookingId: booking!.id,
        type: reviewType,
        score,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      success(t('success'));
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['business-reviews'] });
      setScore(0);
      setComment('');
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      showError(err.message || t('error'));
    },
  });

  if (!booking) return null;

  const serviceName = booking.businessService?.name || tc('prestation');
  const targetName = booking.businessService?.business?.name || booking.provider?.name || '';

  const handleSubmit = () => {
    if (score === 0) {
      showError(t('rating'));
      return;
    }
    createReviewMutation.mutate();
  };

  return (
    <AnimatePresence>
      {booking && (
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
            className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t('title')}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Service info */}
            <div className="mb-6">
              <p className="font-medium">{targetName}</p>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            </div>

            {/* Star rating */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">{t('rating')}</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverScore(i)}
                    onMouseLeave={() => setHoverScore(0)}
                    onClick={() => setScore(i)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        i <= (hoverScore || score)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                {t('comment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('commentPlaceholder')}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
              >
                {tc('cancel')}
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleSubmit}
                disabled={score === 0 || createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? (
                  tc('loading')
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('submit')}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
