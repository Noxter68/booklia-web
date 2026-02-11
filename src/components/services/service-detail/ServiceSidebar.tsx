'use client';

/**
 * Service Sidebar Component
 * Displays author info, actions, and reviews (desktop)
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Shield,
  MessageCircle,
  Share2,
  Heart,
  CheckCircle,
  Edit3,
  Pause,
  Play,
  User,
  Quote,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Service, Review, Booking } from '@/types';
import { ReviewCard } from './ReviewCard';

interface ServiceSidebarProps {
  service: Service;
  isOwner: boolean;
  user: { id: string } | null;
  existingBooking?: Booking;
  reviews: Review[] | undefined;
  onBookingClick: () => void;
}

export function ServiceSidebar({
  service,
  isOwner,
  user,
  existingBooking,
  reviews,
  onBookingClick,
}: ServiceSidebarProps) {
  const profile = service.createdBy?.profile;
  const reputation = service.createdBy?.reputation;
  const avgRating = reputation?.ratingAvg5 ? reputation.ratingAvg5.toFixed(1) : null;
  const reviewCount = reputation?.ratingCount || 0;

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-4">
        {/* Author Card */}
        <AuthorCard
          service={service}
          profile={profile}
          reputation={reputation}
          isOwner={isOwner}
          user={user}
          existingBooking={existingBooking}
          onBookingClick={onBookingClick}
        />

        {/* Reviews Card - Desktop */}
        <ReviewsCard reviews={reviews} avgRating={avgRating} reviewCount={reviewCount} userId={service.createdByUserId} />
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function AuthorCard({
  service,
  profile,
  reputation,
  isOwner,
  user,
  existingBooking,
  onBookingClick,
}: {
  service: Service;
  profile: any;
  reputation: any;
  isOwner: boolean;
  user: { id: string } | null;
  existingBooking?: Booking;
  onBookingClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden"
    >
      {/* Author Header */}
      <div className="p-6 bg-gradient-to-br from-gold-soft to-muted">
        <Link href={`/profile/${service.createdByUserId}`} className="block">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white shadow-lg flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.displayName || 'Utilisateur'}</p>
              {profile?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Rating */}
      {reputation && (
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-lg">{reputation.ratingAvg5?.toFixed(1) || '0.0'}</span>
            <span className="text-muted-foreground text-sm">({reputation.ratingCount || 0} avis)</span>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
            <Shield className="w-3 h-3 text-green-500" />
            Identité vérifiée
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
            <MessageCircle className="w-3 h-3 text-primary" />
            Répond rapidement
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        {!isOwner ? (
          <VisitorActions
            user={user}
            existingBooking={existingBooking}
            serviceKind={service.kind}
            onBookingClick={onBookingClick}
          />
        ) : (
          <OwnerActions service={service} />
        )}
      </div>
    </motion.div>
  );
}

function VisitorActions({
  user,
  existingBooking,
  serviceKind,
  onBookingClick,
}: {
  user: { id: string } | null;
  existingBooking?: Booking;
  serviceKind: string;
  onBookingClick: () => void;
}) {
  if (!user) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Connectez-vous pour contacter ce prestataire</p>
        <Link href="/auth/login" className="block">
          <Button className="w-full rounded-xl" size="lg">
            Se connecter
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-3">
          Pas encore inscrit ?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    );
  }

  if (existingBooking) {
    return (
      <div className="text-center p-4 bg-muted/50 rounded-xl">
        <p className="text-sm font-medium text-muted-foreground">
          {existingBooking.status === 'PENDING'
            ? 'Demande en attente de réponse'
            : existingBooking.status === 'ACCEPTED'
            ? 'Réservation acceptée'
            : 'Mission en cours'}
        </p>
        <Link href="/dashboard" className="text-xs text-primary hover:underline mt-1 inline-block">
          Voir dans mon dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <Button className="w-full rounded-xl" size="lg" onClick={onBookingClick}>
        <Send className="w-4 h-4 mr-2" />
        {serviceKind === 'OFFER' ? 'Réserver' : 'Proposer mes services'}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl">
          <Heart className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl">
          <Share2 className="w-4 h-4 mr-2" />
          Partager
        </Button>
      </div>
    </>
  );
}

function OwnerActions({ service }: { service: Service }) {
  return (
    <>
      <Link href={`/dashboard/services/${service.id}/edit`} className="block">
        <Button variant="outline" className="w-full rounded-xl">
          <Edit3 className="w-4 h-4 mr-2" />
          Modifier l'annonce
        </Button>
      </Link>
      {service.status === 'PUBLISHED' ? (
        <Button variant="outline" className="w-full rounded-xl">
          <Pause className="w-4 h-4 mr-2" />
          Mettre en pause
        </Button>
      ) : (
        <Button className="w-full rounded-xl">
          <Play className="w-4 h-4 mr-2" />
          Publier
        </Button>
      )}
      <Button variant="outline" className="w-full rounded-xl">
        <Share2 className="w-4 h-4 mr-2" />
        Partager
      </Button>
    </>
  );
}

function ReviewsCard({
  reviews,
  avgRating,
  reviewCount,
  userId,
}: {
  reviews: Review[] | undefined;
  avgRating: string | null;
  reviewCount: number;
  userId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="hidden lg:block bg-surface border border-border rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Star className="w-5 h-5" />
          Avis
        </h3>
        {avgRating && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg">{avgRating}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
        )}
      </div>

      {avgRating && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i <= Math.round(parseFloat(avgRating)) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{reviewCount} avis</span>
        </div>
      )}

      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-6">
          <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun avis</p>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
          {reviews.slice(0, 5).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {reviews && reviews.length > 5 && (
        <Link
          href={`/profile/${userId}`}
          className="block text-center text-sm text-primary font-medium mt-4 pt-4 border-t border-border hover:underline"
        >
          Voir tous les avis ({reviews.length})
        </Link>
      )}
    </motion.div>
  );
}
