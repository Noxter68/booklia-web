'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, User, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { Service, PeopleImage } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
}

// Helper to get the best avatar URL (first image or avatarUrl fallback)
function getProviderAvatarUrl(profile?: { avatarUrl?: string; images?: PeopleImage[] }): string | undefined {
  if (profile?.images && profile.images.length > 0) {
    return profile.images[0].url;
  }
  return profile?.avatarUrl;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const isBoosted = service.boostedUntil && new Date(service.boostedUntil) > new Date();
  const providerName = service.createdBy?.profile?.displayName || 'Utilisateur';
  const providerCity = service.createdBy?.profile?.city || service.city;
  const rating = service.createdBy?.reputation?.ratingAvg5;
  const ratingCount = service.createdBy?.reputation?.ratingCount || 0;
  const avatarUrl = getProviderAvatarUrl(service.createdBy?.profile);

  return (
    <Link href={`/service/${service.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="h-full bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col"
      >
        {/* Header: Badges + Price */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              service.kind === 'OFFER'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
            </span>
            {isBoosted && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gold-soft text-primary flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Sponsorisé
              </span>
            )}
            {service.isRecurring && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Récurrent
              </span>
            )}
          </div>

          <div className="text-right shrink-0">
            {service.priceCents ? (
              <span className="text-lg font-bold text-primary">
                {formatPrice(service.priceCents)}{service.pricingType === 'HOURLY' && '/h'}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">À définir</span>
            )}
          </div>
        </div>

        {/* Title - fixed 2 lines */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-snug min-h-10">
          {service.title}
        </h3>

        {/* Description - fixed 2 lines */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-10">
          {service.description || 'Aucune description disponible'}
        </p>

        {/* Provider info + Location */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <span className="font-medium text-foreground truncate max-w-24">{providerName}</span>
          </div>
          {providerCity && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{providerCity}</span>
              </span>
            </>
          )}
        </div>

        {/* Footer: Rating */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
          {rating && ratingCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({ratingCount} avis)</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Pas encore d'avis</span>
          )}

          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>
    </Link>
  );
}
