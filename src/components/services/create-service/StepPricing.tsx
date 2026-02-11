'use client';

/**
 * Step 4: Pricing & Options
 * User sets price, urgency, and recurrence options
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Euro, Check, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Helper } from '@/components/ui/helper';
import { Urgency, Recurrence } from '@/types';
import { ServiceFormData, PricingType } from './types';

interface StepPricingProps {
  formData: ServiceFormData;
  onChange: (updates: Partial<ServiceFormData>) => void;
}

const URGENCY_OPTIONS: { value: Urgency; label: string; description: string }[] = [
  { value: 'FLEXIBLE', label: 'Flexible', description: 'Pas de contrainte de temps particulière' },
  { value: 'SOON', label: 'Sous 7 jours', description: 'À réaliser dans la semaine' },
  { value: 'URGENT', label: 'Urgent', description: 'Besoin immédiat, dans les 24-48h' },
];

export function StepPricing({ formData, onChange }: StepPricingProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Tarifs et options</h2>

      {/* Pricing Type */}
      <PricingTypeSelector
        value={formData.pricingType}
        onChange={(pricingType) => onChange({ pricingType })}
      />

      {/* Price */}
      <PriceInput
        priceCents={formData.priceCents}
        pricingType={formData.pricingType}
        isRequest={formData.kind === 'REQUEST'}
        onChange={(priceCents) => onChange({ priceCents })}
      />

      {/* Urgency */}
      <UrgencySelector value={formData.urgency} onChange={(urgency) => onChange({ urgency })} />

      {/* Recurrence */}
      <RecurrenceSelector
        isRecurring={formData.isRecurring}
        recurrence={formData.recurrence}
        onChange={onChange}
      />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function PricingTypeSelector({
  value,
  onChange,
}: {
  value: PricingType;
  onChange: (v: PricingType) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Type de tarification</label>
        <Helper content="Choisissez si vous facturez à l'heure ou au forfait pour l'ensemble de la prestation." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PricingTypeCard
          type="HOURLY"
          selected={value === 'HOURLY'}
          icon={Clock}
          title="Tarif horaire"
          subtitle="Prix par heure"
          onClick={() => onChange('HOURLY')}
        />
        <PricingTypeCard
          type="FIXED"
          selected={value === 'FIXED'}
          icon={Euro}
          title="Forfait"
          subtitle="Prix fixe global"
          onClick={() => onChange('FIXED')}
        />
      </div>
    </div>
  );
}

function PricingTypeCard({
  selected,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  type: PricingType;
  selected: boolean;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-primary/20' : 'bg-muted'}`}>
          <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function PriceInput({
  priceCents,
  pricingType,
  isRequest,
  onChange,
}: {
  priceCents: number | null;
  pricingType: PricingType;
  isRequest: boolean;
  onChange: (v: number | null) => void;
}) {
  const label = pricingType === 'HOURLY' ? 'Tarif horaire' : 'Prix du forfait';
  const helperText =
    pricingType === 'HOURLY'
      ? "Indiquez votre tarif à l'heure."
      : 'Indiquez le prix total de votre prestation.';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">
          {label}
          {isRequest && <span className="text-destructive ml-1">*</span>}
        </label>
        <Helper content={helperText} />
      </div>

      <div className="bg-muted/30 rounded-xl p-4">
        <div className="relative max-w-xs">
          <Input
            type="number"
            value={priceCents ? priceCents / 100 : ''}
            onChange={(e) => onChange(e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
            placeholder="0"
            min={0}
            className="pr-12 text-lg"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            €{pricingType === 'HOURLY' ? '/h' : ''}
          </span>
        </div>
      </div>

      {isRequest && !priceCents && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Un budget est requis pour les demandes
        </p>
      )}
    </div>
  );
}

function UrgencySelector({ value, onChange }: { value: Urgency; onChange: (v: Urgency) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Délai souhaité</label>
        <Helper content="Indiquez dans quel délai vous souhaitez que la prestation soit réalisée." />
      </div>
      <div className="space-y-2">
        {URGENCY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              value === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value === option.value ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {value === option.value && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecurrenceSelector({
  isRecurring,
  recurrence,
  onChange,
}: {
  isRecurring: boolean;
  recurrence: Recurrence;
  onChange: (updates: Partial<ServiceFormData>) => void;
}) {
  const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
    { value: 'WEEKLY', label: 'Chaque semaine' },
    { value: 'BIWEEKLY', label: 'Toutes les 2 sem.' },
    { value: 'MONTHLY', label: 'Chaque mois' },
  ];

  return (
    <div>
      <label className="text-sm font-medium mb-3 block">Récurrence</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ isRecurring: false, recurrence: 'ONE_TIME' })}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            !isRecurring ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="font-medium">Ponctuel</div>
          <div className="text-xs text-muted-foreground">Une seule fois</div>
        </button>
        <button
          type="button"
          onClick={() => onChange({ isRecurring: true })}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            isRecurring ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="font-medium">Récurrent</div>
          <div className="text-xs text-muted-foreground">Plusieurs séances</div>
        </button>
      </div>

      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 grid grid-cols-3 gap-2"
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ recurrence: opt.value })}
                className={`px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
                  recurrence === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
