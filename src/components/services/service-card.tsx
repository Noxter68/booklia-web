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
  const coverUrl = service.createdBy?.profile?.coverUrl;

  return (
    <Link href={`/service/${service.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="h-72 bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col"
      >
        {/* Cover image (if exists) */}
        {coverUrl && (
          <div className="h-24 relative">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Badges on cover */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                service.kind === 'OFFER'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}>
                {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
              </span>
              {isBoosted && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/90 text-white flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Price on cover */}
            {service.priceCents && (
              <span className="absolute top-2 right-2 text-sm font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                {formatPrice(service.priceCents)}{service.pricingType === 'HOURLY' && '/h'}
              </span>
            )}

            {/* Avatar overlay */}
            <div className="absolute -bottom-4 left-3">
              <div className="w-9 h-9 bg-surface border-2 border-surface rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`p-4 flex flex-col flex-1 ${coverUrl ? 'pt-6' : ''}`}>
          {/* Header without cover */}
          {!coverUrl && (
            <div className="flex items-start justify-between gap-2 mb-2">
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
          )}

          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-2 leading-snug mb-1">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {service.description || 'Aucune description disponible'}
          </p>

          {/* Provider info + Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
            {!coverUrl && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
            )}
            <span className="font-medium text-foreground truncate max-w-20">{providerName}</span>
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
          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
            {rating && ratingCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({ratingCount})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Pas encore d'avis</span>
            )}

            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
