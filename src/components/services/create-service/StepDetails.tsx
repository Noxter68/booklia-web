'use client';

/**
 * Step 3: Service Details
 * User enters title, description, and location
 */
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface StepDetailsProps {
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (updates: {
    title?: string;
    description?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => void;
}

export function StepDetails({ title, description, city, latitude, longitude, onChange }: StepDetailsProps) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChange({ latitude: lat, longitude: lng });

        // Try reverse geocoding to get city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          const data = await res.json();
          const cityName =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            '';
          if (cityName) {
            onChange({ latitude: lat, longitude: lng, city: cityName });
          }
        } catch {
          // Ignore reverse geocoding errors
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]: 'Vous avez refusé la géolocalisation',
          [error.POSITION_UNAVAILABLE]: 'Position non disponible',
          [error.TIMEOUT]: "Délai d'attente dépassé",
        };
        setLocationError(messages[error.code] || 'Erreur de géolocalisation');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const clearLocation = () => {
    onChange({ latitude: null, longitude: null, city: '' });
    setLocationError(null);
  };

  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Décrivez votre service</h2>

      {/* Title */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Titre <span className="text-muted-foreground">({title.length}/100)</span>
        </label>
        <Input
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Cours de guitare pour débutants"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">Minimum 5 caractères</p>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Description <span className="text-muted-foreground">({description.length}/2000)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décrivez votre service en détail : ce que vous proposez, votre expérience, les conditions..."
          maxLength={2000}
          rows={6}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">Minimum 20 caractères</p>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          <MapPin className="w-4 h-4 inline mr-1" />
          Localisation
        </label>

        <div className="space-y-3">
          <div className="relative">
            <Input
              value={city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Votre ville"
              className="pr-24"
            />
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                hasLocation
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {locationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {hasLocation ? 'Localisé' : 'Me localiser'}
            </button>
          </div>

          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{city || 'Position détectée'}</p>
                  <p className="text-xs text-muted-foreground">
                    {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                Effacer
              </button>
            </motion.div>
          )}

          {locationError && <p className="text-xs text-destructive">{locationError}</p>}

          <p className="text-xs text-muted-foreground">
            La localisation permet aux utilisateurs de trouver votre service plus facilement
          </p>
        </div>
      </div>
    </div>
  );
}
