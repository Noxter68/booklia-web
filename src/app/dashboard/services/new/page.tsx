'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, Gift, Search, MapPin, Loader2, Navigation, Rocket, FileText, Euro, Calendar, Info, Plus } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-picker';
import { TimeRangePicker } from '@/components/ui/time-picker';
import { Helper } from '@/components/ui/helper';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ServiceKind, Urgency, Recurrence, Category, WeekDay, ServiceStatus } from '@/types';
import Link from 'next/link';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type PricingType = 'HOURLY' | 'FIXED';

interface FormData {
  kind: ServiceKind | null;
  categoryId: string | null;
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  pricingType: PricingType;
  isVariablePrice: boolean;
  urgency: Urgency;
  isRecurring: boolean;
  recurrence: Recurrence;
  deadlineAt: string | null;
  // Duration & Availability
  durationMinutes: number | null;
  availableDays: WeekDay[];
  availableFromTime: string | null;
  availableToTime: string | null;
  availableFromDate: string | null;
  availableToDate: string | null;
  status: ServiceStatus;
}

const steps = [
  { number: 1, title: 'Type', description: 'Offre ou demande' },
  { number: 2, title: 'Catégorie', description: 'Choisir une catégorie' },
  { number: 3, title: 'Détails', description: 'Titre et description' },
  { number: 4, title: 'Tarifs', description: 'Prix et options' },
  { number: 5, title: 'Disponibilités', description: 'Durée et horaires' },
  { number: 6, title: 'Publication', description: 'Publier ou brouillon' },
];

const WEEK_DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Lundi', short: 'Lun' },
  { value: 'TUESDAY', label: 'Mardi', short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
  { value: 'THURSDAY', label: 'Jeudi', short: 'Jeu' },
  { value: 'FRIDAY', label: 'Vendredi', short: 'Ven' },
  { value: 'SATURDAY', label: 'Samedi', short: 'Sam' },
  { value: 'SUNDAY', label: 'Dimanche', short: 'Dim' },
];

export default function NewServicePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    kind: null,
    categoryId: null,
    title: '',
    description: '',
    city: '',
    latitude: null,
    longitude: null,
    priceMinCents: null,
    priceMaxCents: null,
    pricingType: 'HOURLY',
    isVariablePrice: false,
    urgency: 'FLEXIBLE',
    isRecurring: false,
    recurrence: 'ONE_TIME',
    deadlineAt: null,
    durationMinutes: null,
    availableDays: [],
    availableFromTime: null,
    availableToTime: null,
    availableFromDate: null,
    availableToDate: null,
    status: 'DRAFT',
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FormData>) => api.createService({
      ...data,
      city: data.city || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      priceMinCents: data.priceMinCents || undefined,
      priceMaxCents: data.priceMaxCents || undefined,
      deadlineAt: data.deadlineAt || undefined,
      durationMinutes: data.durationMinutes || undefined,
      availableDays: data.availableDays?.length ? data.availableDays : undefined,
      availableFromTime: data.availableFromTime || undefined,
      availableToTime: data.availableToTime || undefined,
      availableFromDate: data.availableFromDate || undefined,
      availableToDate: data.availableToDate || undefined,
      status: data.status,
    } as never),
    onSuccess: (service, variables) => {
      if (variables.status === 'PUBLISHED') {
        success('Votre annonce est maintenant en ligne !');
        router.push(`/service/${service.id}`);
      } else {
        success('Brouillon enregistré avec succès');
        router.push('/dashboard/services');
      }
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Erreur lors de la création');
    },
  });

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.kind !== null;
      case 2:
        return formData.categoryId !== null;
      case 3:
        return formData.title.trim().length >= 5 && formData.description.trim().length >= 20;
      case 4:
        return formData.kind === 'OFFER' || (formData.priceMinCents && formData.priceMinCents > 0);
      case 5:
        return true; // Disponibilités optionnelles
      case 6:
        return true; // Publication choice always valid
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 6 && canProceed()) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = (publishNow: boolean) => {
    if (!canProceed()) return;
    const status: ServiceStatus = publishNow ? 'PUBLISHED' : 'DRAFT';
    createMutation.mutate({ ...formData, status } as Partial<FormData>);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Connectez-vous</h1>
        <p className="text-muted-foreground mb-4">
          Vous devez être connecté pour créer un service.
        </p>
        <Link href="/auth/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Créer un service</h1>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px]">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.number ? 'var(--primary)' : 'var(--muted)',
                    color: step >= s.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm"
                >
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </motion.div>
                <span className="text-xs mt-2 text-center hidden sm:block">
                  <span className="font-medium">{s.title}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s.number ? 'var(--primary)' : 'var(--border)',
                  }}
                  className="h-0.5 w-8 sm:w-16 mx-1"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <StepType kind={formData.kind} onChange={(kind) => updateForm({ kind })} />
              )}
              {step === 2 && (
                <StepCategory
                  categories={categories || []}
                  loading={categoriesLoading}
                  selectedId={formData.categoryId}
                  onChange={(categoryId) => updateForm({ categoryId })}
                />
              )}
              {step === 3 && (
                <StepDetails
                  title={formData.title}
                  description={formData.description}
                  city={formData.city}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
              {step === 4 && (
                <StepPricing
                  formData={formData}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
              {step === 5 && (
                <StepAvailability
                  formData={formData}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
              {step === 6 && (
                <StepPublish
                  formData={formData}
                  isLoading={createMutation.isPending}
                  onPublish={() => handleSubmit(true)}
                  onSaveDraft={() => handleSubmit(false)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>

        {step < 6 && (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Type Selection
function StepType({
  kind,
  onChange,
}: {
  kind: ServiceKind | null;
  onChange: (kind: ServiceKind) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Quel type de service ?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('OFFER')}
          className={`p-6 rounded-xl border-2 text-left transition-colors cursor-pointer ${
            kind === 'OFFER'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            kind === 'OFFER' ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Gift className={`w-6 h-6 ${kind === 'OFFER' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <h3 className="font-semibold mb-1">Je propose un service</h3>
          <p className="text-sm text-muted-foreground">
            Vous avez une compétence ou du temps à offrir
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('REQUEST')}
          className={`p-6 rounded-xl border-2 text-left transition-colors cursor-pointer ${
            kind === 'REQUEST'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            kind === 'REQUEST' ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Search className={`w-6 h-6 ${kind === 'REQUEST' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <h3 className="font-semibold mb-1">Je cherche un service</h3>
          <p className="text-sm text-muted-foreground">
            Vous avez besoin d&apos;aide pour quelque chose
          </p>
        </motion.button>
      </div>
    </div>
  );
}

// Step 2: Category Selection
function StepCategory({
  categories,
  loading,
  selectedId,
  onChange,
}: {
  categories: Category[];
  loading: boolean;
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (loading) {
    return <PageLoader text="Chargement des catégories..." />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Choisissez une catégorie</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {categories.map((category) => (
          <div key={category.id}>
            <motion.button
              onClick={() => {
                if (category.children?.length) {
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  );
                } else {
                  onChange(category.id);
                }
              }}
              className={`w-full p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedId === category.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                {category.children?.length ? (
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      expandedCategory === category.id ? 'rotate-90' : ''
                    }`}
                  />
                ) : null}
              </div>
            </motion.button>

            <AnimatePresence>
              {expandedCategory === category.id && category.children?.length && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-4 mt-2 space-y-2"
                >
                  {category.children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ x: 4 }}
                      onClick={() => onChange(child.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedId === child.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {child.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 3: Title & Description & Location
function StepDetails({
  title,
  description,
  city,
  latitude,
  longitude,
  onChange,
}: {
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (updates: { title?: string; description?: string; city?: string; latitude?: number | null; longitude?: number | null }) => void;
}) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        onChange({ latitude: lat, longitude: lng });

        // Try to reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '';
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
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Vous avez refusé la géolocalisation');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Position non disponible');
            break;
          case error.TIMEOUT:
            setLocationError('Délai d\'attente dépassé');
            break;
          default:
            setLocationError('Erreur de géolocalisation');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const clearLocation = () => {
    onChange({ latitude: null, longitude: null, city: '' });
    setLocationError(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Décrivez votre service</h2>

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
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 5 caractères
        </p>
      </div>

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
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 20 caractères
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          <MapPin className="w-4 h-4 inline mr-1" />
          Localisation
        </label>

        <div className="space-y-3">
          {/* City input */}
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
                latitude && longitude
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {locationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {latitude && longitude ? 'Localisé' : 'Me localiser'}
            </button>
          </div>

          {/* Location status */}
          {latitude && longitude && (
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
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
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

          {locationError && (
            <p className="text-xs text-destructive">{locationError}</p>
          )}

          <p className="text-xs text-muted-foreground">
            La localisation permet aux utilisateurs de trouver votre service plus facilement
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 4: Pricing & Options
function StepPricing({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const urgencyOptions: { value: Urgency; label: string; description: string }[] = [
    { value: 'FLEXIBLE', label: 'Flexible', description: 'Pas de contrainte de temps particulière' },
    { value: 'SOON', label: 'Sous 7 jours', description: 'À réaliser dans la semaine' },
    { value: 'URGENT', label: 'Urgent', description: 'Besoin immédiat, dans les 24-48h' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Tarifs et options</h2>

      {/* Pricing Type */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Type de tarification</label>
          <Helper content="Choisissez si vous facturez à l'heure ou au forfait pour l'ensemble de la prestation." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ pricingType: 'HOURLY' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.pricingType === 'HOURLY'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                formData.pricingType === 'HOURLY' ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Clock className={`w-5 h-5 ${formData.pricingType === 'HOURLY' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="font-medium">Tarif horaire</div>
                <div className="text-xs text-muted-foreground">Prix par heure</div>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ pricingType: 'FIXED' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.pricingType === 'FIXED'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                formData.pricingType === 'FIXED' ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Euro className={`w-5 h-5 ${formData.pricingType === 'FIXED' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="font-medium">Forfait</div>
                <div className="text-xs text-muted-foreground">Prix fixe global</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">
            {formData.pricingType === 'HOURLY' ? 'Tarif horaire' : 'Prix du forfait'}
            {formData.kind === 'REQUEST' && <span className="text-destructive ml-1">*</span>}
          </label>
          <Helper content={
            formData.pricingType === 'HOURLY'
              ? "Indiquez votre tarif à l'heure. Si votre prix varie, cochez l'option ci-dessous."
              : "Indiquez le prix total de votre prestation."
          } />
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Prix minimum</label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.priceMinCents ? formData.priceMinCents / 100 : ''}
                  onChange={(e) => onChange({ priceMinCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
                  placeholder="0"
                  min={0}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  €{formData.pricingType === 'HOURLY' ? '/h' : ''}
                </span>
              </div>
            </div>
            {formData.isVariablePrice && (
              <>
                <div className="text-muted-foreground self-end pb-2">—</div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Prix maximum</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.priceMaxCents ? formData.priceMaxCents / 100 : ''}
                      onChange={(e) => onChange({ priceMaxCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
                      placeholder="0"
                      min={0}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      €{formData.pricingType === 'HOURLY' ? '/h' : ''}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Variable price checkbox */}
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVariablePrice}
              onChange={(e) => onChange({ isVariablePrice: e.target.checked, priceMaxCents: e.target.checked ? formData.priceMaxCents : null })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-sm">
              Prix variable selon la prestation
            </span>
          </label>
        </div>

        {formData.kind === 'REQUEST' && !formData.priceMinCents && (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Un budget minimum est requis pour les demandes
          </p>
        )}
      </div>

      {/* Urgency */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Délai souhaité</label>
          <Helper content="Indiquez dans quel délai vous souhaitez que la prestation soit réalisée." />
        </div>
        <div className="space-y-2">
          {urgencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ urgency: option.value })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                formData.urgency === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.urgency === option.value
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}>
                  {formData.urgency === option.value && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recurring */}
      <div>
        <label className="text-sm font-medium mb-3 block">Récurrence</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ isRecurring: false, recurrence: 'ONE_TIME' })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              !formData.isRecurring
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium">Ponctuel</div>
            <div className="text-xs text-muted-foreground">Une seule fois</div>
          </button>
          <button
            type="button"
            onClick={() => onChange({ isRecurring: true })}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              formData.isRecurring
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium">Récurrent</div>
            <div className="text-xs text-muted-foreground">Plusieurs séances</div>
          </button>
        </div>

        <AnimatePresence>
          {formData.isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 grid grid-cols-3 gap-2"
            >
              {(['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as Recurrence[]).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => onChange({ recurrence: rec })}
                  className={`px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
                    formData.recurrence === rec
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {rec === 'WEEKLY' && 'Chaque semaine'}
                  {rec === 'BIWEEKLY' && 'Toutes les 2 sem.'}
                  {rec === 'MONTHLY' && 'Chaque mois'}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 5: Duration & Availability
function StepAvailability({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('');

  const DURATION_PRESETS = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1h' },
    { value: 90, label: '1h30' },
    { value: 120, label: '2h' },
    { value: 180, label: '3h' },
    { value: 240, label: '4h' },
  ];

  const isPresetDuration = DURATION_PRESETS.some(p => p.value === formData.durationMinutes);

  const toggleDay = (day: WeekDay) => {
    const currentDays = formData.availableDays;
    if (currentDays.includes(day)) {
      onChange({ availableDays: currentDays.filter((d) => d !== day) });
    } else {
      onChange({ availableDays: [...currentDays, day] });
    }
  };

  const selectAllWeekdays = () => {
    onChange({ availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] });
  };

  const selectWeekend = () => {
    onChange({ availableDays: ['SATURDAY', 'SUNDAY'] });
  };

  const selectAllDays = () => {
    onChange({ availableDays: WEEK_DAYS.map((d) => d.value) });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const handleCustomDurationConfirm = () => {
    const value = parseInt(customDurationInput);
    if (value > 0) {
      onChange({ durationMinutes: value });
      setShowCustomDuration(false);
      setCustomDurationInput('');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Durée et disponibilités</h2>

      {/* Duration */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium">Durée de la prestation</label>
          <Helper content="Indiquez la durée estimée de votre prestation. Laissez vide si elle est variable." position="right" />
        </div>

        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                onChange({ durationMinutes: formData.durationMinutes === preset.value ? null : preset.value });
                setShowCustomDuration(false);
              }}
              className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                formData.durationMinutes === preset.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom duration - show badge if active, otherwise show + button */}
          {formData.durationMinutes && !isPresetDuration ? (
            <button
              type="button"
              onClick={() => {
                onChange({ durationMinutes: null });
                setShowCustomDuration(false);
              }}
              className="px-5 py-3 rounded-xl border-2 border-primary bg-primary/10 text-primary text-sm font-medium transition-all cursor-pointer"
            >
              {formatDuration(formData.durationMinutes)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomDuration(!showCustomDuration)}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                showCustomDuration
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Custom duration input popover */}
        <AnimatePresence>
          {showCustomDuration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                <label className="text-sm font-medium mb-3 block">Durée personnalisée</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    placeholder="Ex: 45, 90, 180..."
                    min={1}
                    className="w-40"
                    autoFocus
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCustomDurationConfirm}
                    disabled={!customDurationInput || parseInt(customDurationInput) <= 0}
                    className="rounded-lg"
                  >
                    Valider
                  </Button>
                </div>
                {customDurationInput && parseInt(customDurationInput) > 0 && (
                  <p className="text-sm text-primary mt-2">
                    = {formatDuration(parseInt(customDurationInput))}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Available Days */}
      <div>
        <label className="text-sm font-medium mb-3 block">Jours de disponibilité</label>

        {/* Quick selections */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            type="button"
            onClick={selectAllWeekdays}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Semaine
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            type="button"
            onClick={selectWeekend}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Week-end
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            type="button"
            onClick={selectAllDays}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Tous
          </button>
          {formData.availableDays.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={() => onChange({ availableDays: [] })}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Effacer
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`w-14 h-14 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                formData.availableDays.includes(day.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Plage horaire</label>
          <Helper content="Les créneaux pendant lesquels vous êtes disponible pour cette prestation." />
        </div>
        <TimeRangePicker
          startTime={formData.availableFromTime}
          endTime={formData.availableToTime}
          onChange={(range) => onChange({
            availableFromTime: range.start,
            availableToTime: range.end,
          })}
          step={30}
        />
      </div>

      {/* Date Range */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Période de disponibilité</label>
          <Helper content="Si votre service n'est disponible que pendant une période limitée, indiquez-la ici." />
        </div>
        <DateRangePicker
          startDate={formData.availableFromDate ? new Date(formData.availableFromDate) : undefined}
          endDate={formData.availableToDate ? new Date(formData.availableToDate) : undefined}
          onChange={(range) => onChange({
            availableFromDate: range.start ? range.start.toISOString().split('T')[0] : null,
            availableToDate: range.end ? range.end.toISOString().split('T')[0] : null,
          })}
          minDate={new Date()}
          startPlaceholder="Début"
          endPlaceholder="Fin"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Laissez vide si toujours disponible
        </p>
      </div>
    </div>
  );
}

// Step 6: Publish or Save as Draft
function StepPublish({
  formData,
  isLoading,
  onPublish,
  onSaveDraft,
}: {
  formData: FormData;
  isLoading: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getUrgencyLabel = (urgency: Urgency) => {
    switch (urgency) {
      case 'FLEXIBLE': return 'Flexible';
      case 'SOON': return 'Sous 7 jours';
      case 'URGENT': return 'Urgent';
    }
  };

  const getDaysLabel = () => {
    if (formData.availableDays.length === 0) return null;
    if (formData.availableDays.length === 7) return 'Tous les jours';
    if (formData.availableDays.length === 5 &&
        formData.availableDays.includes('MONDAY') &&
        formData.availableDays.includes('FRIDAY')) return 'Semaine';
    if (formData.availableDays.length === 2 &&
        formData.availableDays.includes('SATURDAY') &&
        formData.availableDays.includes('SUNDAY')) return 'Week-end';
    return formData.availableDays.map(d => WEEK_DAYS.find(w => w.value === d)?.short).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Votre annonce est prête !</h2>
        <p className="text-muted-foreground">
          Vérifiez les informations avant de continuer
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-muted/30 rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Récapitulatif</h3>
        <div className="space-y-3 text-sm">
          {/* Type & Title */}
          <div className="flex justify-between items-start pb-3 border-b border-border">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Type</span>
              <div className="font-medium">{formData.kind === 'OFFER' ? 'Offre de service' : 'Demande de service'}</div>
            </div>
          </div>

          <div className="pb-3 border-b border-border">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Titre</span>
            <div className="font-medium">{formData.title}</div>
          </div>

          {/* Location */}
          {formData.city && (
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Localisation</span>
              <span className="font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {formData.city}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex justify-between pb-3 border-b border-border">
            <span className="text-muted-foreground">Tarif</span>
            <span className="font-medium">
              {formData.priceMinCents ? (
                <>
                  {(formData.priceMinCents / 100).toFixed(0)}€
                  {formData.priceMaxCents && formData.isVariablePrice && ` - ${(formData.priceMaxCents / 100).toFixed(0)}€`}
                  {formData.pricingType === 'HOURLY' && '/h'}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({formData.pricingType === 'HOURLY' ? 'horaire' : 'forfait'})
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Non défini</span>
              )}
            </span>
          </div>

          {/* Urgency */}
          <div className="flex justify-between pb-3 border-b border-border">
            <span className="text-muted-foreground">Délai</span>
            <span className="font-medium">{getUrgencyLabel(formData.urgency)}</span>
          </div>

          {/* Recurrence */}
          <div className="flex justify-between pb-3 border-b border-border">
            <span className="text-muted-foreground">Récurrence</span>
            <span className="font-medium">
              {formData.isRecurring ? (
                <>
                  {formData.recurrence === 'WEEKLY' && 'Hebdomadaire'}
                  {formData.recurrence === 'BIWEEKLY' && 'Bi-hebdomadaire'}
                  {formData.recurrence === 'MONTHLY' && 'Mensuel'}
                </>
              ) : (
                'Ponctuel'
              )}
            </span>
          </div>

          {/* Duration */}
          {formData.durationMinutes && (
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Durée</span>
              <span className="font-medium">{formatDuration(formData.durationMinutes)}</span>
            </div>
          )}

          {/* Days */}
          {getDaysLabel() && (
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Jours</span>
              <span className="font-medium">{getDaysLabel()}</span>
            </div>
          )}

          {/* Time */}
          {(formData.availableFromTime || formData.availableToTime) && (
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Horaires</span>
              <span className="font-medium">
                {formData.availableFromTime && formatTime(formData.availableFromTime)}
                {formData.availableFromTime && formData.availableToTime && ' - '}
                {formData.availableToTime && formatTime(formData.availableToTime)}
              </span>
            </div>
          )}

          {/* Period */}
          {(formData.availableFromDate || formData.availableToDate) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Période</span>
              <span className="font-medium">
                {formData.availableFromDate && formatDate(formData.availableFromDate)}
                {formData.availableFromDate && formData.availableToDate && ' → '}
                {formData.availableToDate && formatDate(formData.availableToDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPublish}
          disabled={isLoading}
          className="p-6 rounded-xl border-2 border-primary bg-primary/5 text-left transition-colors cursor-pointer hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Publier maintenant</h3>
          <p className="text-sm text-muted-foreground">
            Votre annonce sera immédiatement visible par tous les utilisateurs
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium">
            Mettre en ligne
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSaveDraft}
          disabled={isLoading}
          className="p-6 rounded-xl border-2 border-border text-left transition-colors cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Enregistrer en brouillon</h3>
          <p className="text-sm text-muted-foreground">
            Vous pourrez modifier et publier votre annonce plus tard depuis votre tableau de bord
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-muted-foreground text-sm font-medium">
            Sauvegarder
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Création en cours...
        </div>
      )}
    </div>
  );
}
