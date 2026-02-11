'use client';

/**
 * Create Service Page
 *
 * Multi-step wizard for creating a new P2P service listing.
 * Uses modular step components for maintainability.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ServiceStatus } from '@/types';

import {
  Step,
  ServiceFormData,
  INITIAL_FORM_DATA,
  canProceed,
  Stepper,
  StepType,
  StepCategory,
  StepDetails,
  StepPricing,
  StepAvailability,
  StepPublish,
} from '@/components/services/create-service';

export default function NewServicePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM_DATA);

  // Fetch categories for step 2
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<ServiceFormData>) =>
      api.createService({
        ...data,
        city: data.city || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        priceCents: data.priceCents || undefined,
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

  // Form helpers
  const updateForm = (updates: Partial<ServiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (step < 6 && canProceed(step, formData)) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = (publishNow: boolean) => {
    if (!canProceed(step, formData)) return;
    const status: ServiceStatus = publishNow ? 'PUBLISHED' : 'DRAFT';
    createMutation.mutate({ ...formData, status });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Connectez-vous</h1>
        <p className="text-muted-foreground mb-4">Vous devez être connecté pour créer un service.</p>
        <Link href="/auth/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Créer un service</h1>

      {/* Progress stepper */}
      <Stepper currentStep={step} />

      {/* Step content */}
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
              {step === 1 && <StepType kind={formData.kind} onChange={(kind) => updateForm({ kind })} />}

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
                  onChange={updateForm}
                />
              )}

              {step === 4 && <StepPricing formData={formData} onChange={updateForm} />}

              {step === 5 && <StepAvailability formData={formData} onChange={updateForm} />}

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

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={prevStep} disabled={step === 1} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>

        {step < 6 && (
          <Button onClick={nextStep} disabled={!canProceed(step, formData)} className="gap-2">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
