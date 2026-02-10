'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Booking, BookingStatus, BookingComment } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import Link from 'next/link';

interface BookingDetailModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  role: 'provider' | 'requester';
  onAccept?: () => void;
  onReject?: (message?: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELED: 'Annulee',
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

export function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  role,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: BookingDetailModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const { joinBookingRoom, leaveBookingRoom, onBookingComment } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Join booking room for real-time updates
  useEffect(() => {
    if (isOpen) {
      joinBookingRoom(booking.id);
      return () => {
        leaveBookingRoom(booking.id);
      };
    }
  }, [isOpen, booking.id, joinBookingRoom, leaveBookingRoom]);

  // Listen for real-time comments (filtered by bookingId in the context)
  useEffect(() => {
    const unsubscribe = onBookingComment(booking.id, (comment: BookingComment) => {
      // Add the new comment to the cache
      queryClient.setQueryData(
        ['booking-comments', booking.id],
        (oldData: { booking: Booking; comments: BookingComment[] } | undefined) => {
          if (!oldData) return oldData;
          // Check if comment already exists to avoid duplicates
          const exists = oldData.comments.some((c) => c.id === comment.id);
          if (exists) return oldData;
          return {
            ...oldData,
            comments: [...oldData.comments, comment],
          };
        }
      );
      // Scroll to bottom after new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return unsubscribe;
  }, [booking.id, onBookingComment, queryClient]);

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['booking-comments', booking.id],
    queryFn: () => api.getBookingComments(booking.id),
    enabled: isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.addBookingComment(booking.id, content),
    onSuccess: (newComment: BookingComment) => {
      setNewComment('');
      // Add the comment to the cache immediately for the sender
      // (The receiver will get it via WebSocket)
      queryClient.setQueryData(
        ['booking-comments', booking.id],
        (oldData: { booking: Booking; comments: BookingComment[] } | undefined) => {
          if (!oldData) return oldData;
          // Check if already exists (WebSocket might have added it)
          const exists = oldData.comments.some((c) => c.id === newComment.id);
          if (exists) return oldData;
          return {
            ...oldData,
            comments: [...oldData.comments, newComment],
          };
        }
      );
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: () => showError('Erreur lors de l\'envoi du message'),
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const handleReject = () => {
    if (onReject) {
      onReject(rejectMessage || undefined);
    }
    setShowRejectModal(false);
    setRejectMessage('');
  };

  const otherParty = role === 'provider' ? booking.requester : booking.provider;
  const otherPartyLabel = role === 'provider' ? 'Demandeur' : 'Prestataire';

  // Show phone only if provider AND booking is ACCEPTED or later
  const canSeePhone = role === 'provider' &&
    ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) &&
    booking.requesterPhone;

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
          className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border/50 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                  {booking.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                  {booking.status === 'ACCEPTED' && <CheckCircle className="w-3.5 h-3.5" />}
                  {booking.status === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
                  {booking.status === 'CANCELED' && <XCircle className="w-3.5 h-3.5" />}
                  {statusLabels[booking.status]}
                </span>
              </div>
              <Link
                href={`/service/${booking.serviceId}`}
                className="text-lg font-bold hover:text-primary transition-colors flex items-center gap-1"
                onClick={onClose}
              >
                {booking.service?.title}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Info Section */}
            <div className="p-5 space-y-4 border-b border-border/50">
              {/* Other party */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {otherParty?.profile?.avatarUrl ? (
                    <img src={otherParty.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{otherPartyLabel}</p>
                  <p className="font-semibold">{otherParty?.profile?.displayName || 'Anonyme'}</p>
                </div>
              </div>

              {/* Date */}
              {booking.scheduledAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date prevue</p>
                    <p className="font-medium">
                      {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      a{' '}
                      {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone (only for provider when accepted) */}
              {canSeePhone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-success-soft flex items-center justify-center">
                    <Phone className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telephone</p>
                    <a href={`tel:${booking.requesterPhone}`} className="font-medium text-success hover:underline">
                      {booking.requesterPhone}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {booking.requesterAddress && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{booking.requesterAddress}</p>
                  </div>
                </div>
              )}

              {/* Price */}
              {booking.agreedPriceCents && (
                <div className="bg-primary/5 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Prix convenu</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(booking.agreedPriceCents)}</p>
                </div>
              )}

              {/* Initial message */}
              {booking.notes && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Message initial</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}

              {/* Rejection message */}
              {booking.status === 'CANCELED' && booking.rejectionMessage && role === 'requester' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Motif du refus</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{booking.rejectionMessage}</p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Messages</h3>
                {commentsData?.comments && commentsData.comments.length > 0 && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {commentsData.comments.length}
                  </span>
                )}
              </div>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : commentsData?.comments && commentsData.comments.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {commentsData.comments.map((comment: BookingComment) => {
                    const isMe = comment.authorId === (role === 'provider' ? booking.providerId : booking.requesterId);
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                            {new Date(comment.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun message pour le moment
                </p>
              )}

              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ecrire un message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0"
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'PENDING' && role === 'provider' && (
            <div className="p-5 border-t border-border/50 flex gap-3">
              <Button
                className="flex-1 rounded-xl"
                onClick={onAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Accepter
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowRejectModal(true)}
                disabled={isRejecting}
              >
                <Ban className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </div>
          )}
        </motion.div>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold mb-2">Refuser cette demande ?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Vous pouvez ajouter un message pour expliquer votre refus (optionnel).
                </p>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Ex: Je ne suis pas disponible a cette date..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none mb-4"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    {isRejecting ? 'Refus...' : 'Refuser'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
