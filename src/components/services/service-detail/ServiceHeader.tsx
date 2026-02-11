'use client';

/**
 * Service Header Component
 * Displays title, badges, meta info, and price
 */
import { motion } from 'framer-motion';
import { Calendar, MapPin, Star, Zap, Euro } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { Service } from '@/types';
import { URGENCY_CONFIG, RECURRENCE_LABELS } from './constants';

interface ServiceHeaderProps {
  service: Service;
  avgRating: string | null;
  reviewCount: number;
}

export function ServiceHeader({ service, avgRating, reviewCount }: ServiceHeaderProps) {
  const isBoosted = service.boostedUntil && new Date(service.boostedUntil) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">{service.title}</h1>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge
          variant={service.kind === 'OFFER' ? 'default' : 'secondary'}
          className="text-sm px-3 py-1 rounded-full"
        >
          {service.kind === 'OFFER' ? 'Offre de service' : 'Recherche'}
        </Badge>

        {isBoosted && (
          <Badge variant="outline" className="bg-gold-soft text-primary border-primary/20 rounded-full">
            <Zap className="w-3 h-3 mr-1" />
            Sponsorisé
          </Badge>
        )}

        {service.urgency && URGENCY_CONFIG[service.urgency as keyof typeof URGENCY_CONFIG] && (
          <Badge
            variant="outline"
            className={`rounded-full ${URGENCY_CONFIG[service.urgency as keyof typeof URGENCY_CONFIG].color}`}
          >
            {URGENCY_CONFIG[service.urgency as keyof typeof URGENCY_CONFIG].label}
          </Badge>
        )}

        {service.category && (
          <Badge variant="outline" className="rounded-full">
            {service.category.name}
          </Badge>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        {service.city && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {service.city}
          </span>
        )}
        {avgRating && (
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-foreground">{avgRating}</span>
            <span>({reviewCount} avis)</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Publié le {formatDate(service.createdAt)}
        </span>
      </div>

      {/* Price */}
      {service.priceCents && (
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-soft">
          <Euro className="w-5 h-5 text-primary" />
          <span className="text-xl font-bold text-primary">
            {formatPrice(service.priceCents)}
            {service.pricingType === 'HOURLY' && '/h'}
          </span>
          {service.isRecurring && (
            <span className="text-sm text-muted-foreground">
              / {RECURRENCE_LABELS[service.recurrence || 'ONE_TIME']?.toLowerCase()}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
