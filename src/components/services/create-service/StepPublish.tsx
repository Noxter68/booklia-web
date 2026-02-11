'use client';

/**
 * Step 6: Publication
 * User reviews summary and chooses to publish or save as draft
 */
import { motion } from 'framer-motion';
import { Check, ChevronRight, Rocket, FileText, Loader2, MapPin } from 'lucide-react';
import { ServiceFormData, WEEK_DAYS } from './types';
import { formatDuration, formatTime, formatDateFr, getUrgencyLabel, getDaysLabel } from './utils';

interface StepPublishProps {
  formData: ServiceFormData;
  isLoading: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export function StepPublish({ formData, isLoading, onPublish, onSaveDraft }: StepPublishProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Votre annonce est prête !</h2>
        <p className="text-muted-foreground">Vérifiez les informations avant de continuer</p>
      </div>

      {/* Summary */}
      <SummaryCard formData={formData} />

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PublishCard onClick={onPublish} disabled={isLoading} />
        <DraftCard onClick={onSaveDraft} disabled={isLoading} />
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

// ============================================
// Sub-components
// ============================================

function SummaryCard({ formData }: { formData: ServiceFormData }) {
  const daysLabel = getDaysLabel(formData.availableDays);

  return (
    <div className="bg-muted/30 rounded-xl p-5 mb-6">
      <h3 className="font-semibold mb-4">Récapitulatif</h3>
      <div className="space-y-3 text-sm">
        {/* Type */}
        <SummaryRow label="Type">
          {formData.kind === 'OFFER' ? 'Offre de service' : 'Demande de service'}
        </SummaryRow>

        {/* Title */}
        <SummaryRow label="Titre">{formData.title}</SummaryRow>

        {/* Location */}
        {formData.city && (
          <SummaryRow label="Localisation">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {formData.city}
            </span>
          </SummaryRow>
        )}

        {/* Price */}
        <SummaryRow label="Tarif">
          {formData.priceCents ? (
            <>
              {(formData.priceCents / 100).toFixed(0)}€
              {formData.pricingType === 'HOURLY' && '/h'}
              <span className="text-muted-foreground text-xs ml-1">
                ({formData.pricingType === 'HOURLY' ? 'horaire' : 'forfait'})
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Non défini</span>
          )}
        </SummaryRow>

        {/* Urgency */}
        <SummaryRow label="Délai">{getUrgencyLabel(formData.urgency)}</SummaryRow>

        {/* Recurrence */}
        <SummaryRow label="Récurrence">
          {formData.isRecurring ? (
            <>
              {formData.recurrence === 'WEEKLY' && 'Hebdomadaire'}
              {formData.recurrence === 'BIWEEKLY' && 'Bi-hebdomadaire'}
              {formData.recurrence === 'MONTHLY' && 'Mensuel'}
            </>
          ) : (
            'Ponctuel'
          )}
        </SummaryRow>

        {/* Duration */}
        {formData.durationMinutes && (
          <SummaryRow label="Durée">{formatDuration(formData.durationMinutes)}</SummaryRow>
        )}

        {/* Days */}
        {daysLabel && <SummaryRow label="Jours">{daysLabel}</SummaryRow>}

        {/* Time */}
        {(formData.availableFromTime || formData.availableToTime) && (
          <SummaryRow label="Horaires" noBorder={!formData.availableFromDate && !formData.availableToDate}>
            {formData.availableFromTime && formatTime(formData.availableFromTime)}
            {formData.availableFromTime && formData.availableToTime && ' - '}
            {formData.availableToTime && formatTime(formData.availableToTime)}
          </SummaryRow>
        )}

        {/* Period */}
        {(formData.availableFromDate || formData.availableToDate) && (
          <SummaryRow label="Période" noBorder>
            {formData.availableFromDate && formatDateFr(formData.availableFromDate)}
            {formData.availableFromDate && formData.availableToDate && ' → '}
            {formData.availableToDate && formatDateFr(formData.availableToDate)}
          </SummaryRow>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  children,
  noBorder = false,
}: {
  label: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div className={`flex justify-between ${noBorder ? '' : 'pb-3 border-b border-border'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function PublishCard({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
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
  );
}

function DraftCard({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
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
  );
}
