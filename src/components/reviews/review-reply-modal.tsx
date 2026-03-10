'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Star, MessageCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Review } from '@/types';

interface ReviewReplyModalProps {
  review: Review | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewReplyModal({ review, onClose, onSuccess }: ReviewReplyModalProps) {
  const [reply, setReply] = useState('');
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Initialize reply with existing reply when review changes
  useEffect(() => {
    if (review) {
      setReply(review.reply || '');
    }
  }, [review]);

  const replyMutation = useMutation({
    mutationFn: () => api.replyToReview(review!.id, reply.trim()),
    onSuccess: () => {
      success('Réponse envoyée !');
      queryClient.invalidateQueries({ queryKey: ['business-reviews'] });
      setReply('');
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de l\'envoi de la réponse');
    },
  });

  if (!review) return null;

  const authorName = review.author?.name || 'Client';
  const stars = review.score;

  const handleSubmit = () => {
    if (!reply.trim()) {
      showError('Veuillez écrire une réponse');
      return;
    }
    replyMutation.mutate();
  };

  return (
    <AnimatePresence>
      {review && (
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
            className="bg-surface rounded-2xl p-6 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Répondre à l'avis
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original review */}
            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{authorName}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  "{review.comment}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Reply form */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Votre réponse
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Répondez à cet avis de manière professionnelle..."
                className="w-full px-4 py-3 border border-border rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {reply.length}/500
              </p>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Conseil :</strong> Restez professionnel et remerciez le client pour son retour.
                Une réponse bien rédigée renforce la confiance des futurs clients.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleSubmit}
                disabled={!reply.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  'Envoi...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {review.reply ? 'Modifier' : 'Répondre'}
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
