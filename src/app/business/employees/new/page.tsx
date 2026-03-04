'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  Scissors,
  Camera,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { BusinessService } from '@/types';

type Step = 1 | 2 | 3;

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  avatarUrl: string;
  availabilities: Availability[];
  serviceIds: string[];
}

const steps = [
  { number: 1, title: 'Identité', icon: User },
  { number: 2, title: 'Disponibilités', icon: Calendar },
  { number: 3, title: 'Services', icon: Scissors },
];

const WEEK_DAYS = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    avatarUrl: '',
    availabilities: [],
    serviceIds: [],
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createEmployee({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        role: formData.role || undefined,
        bio: formData.bio || undefined,
        availabilities: formData.availabilities.length > 0 ? formData.availabilities : undefined,
        serviceIds: formData.serviceIds.length > 0 ? formData.serviceIds : undefined,
      }),
    onSuccess: () => {
      success('Employé ajouté avec succès !');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      router.push('/business/dashboard');
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de la création');
    },
  });

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName.trim().length >= 2 && formData.lastName.trim().length >= 2;
      case 2:
        return true; // Disponibilités optionnelles
      case 3:
        return true; // Services optionnels
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 3 && canProceed()) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await api.uploadFile(file, 'avatar');
      updateForm({ avatarUrl: result.url });
      success('Photo uploadée');
    } catch {
      showError('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  if (authLoading || businessLoading) {
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
          Vous devez être connecté pour ajouter un employé.
        </p>
        <Link href="/auth/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Pas de business</h1>
        <p className="text-muted-foreground mb-4">
          Vous devez d&apos;abord créer votre business.
        </p>
        <Link href="/business/setup">
          <Button>Créer mon business</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/business/dashboard">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nouvel employé</h1>
          <p className="text-muted-foreground text-sm">
            Ajoutez un membre à votre équipe
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.number ? 'var(--primary)' : 'var(--muted)',
                    color: step >= s.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {step > s.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </motion.div>
                <span className="text-xs mt-2 font-medium hidden sm:block">
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s.number ? 'var(--primary)' : 'var(--border)',
                  }}
                  className="h-0.5 w-12 sm:w-24 mx-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <StepIdentity
                formData={formData}
                onChange={(updates) => updateForm(updates)}
                onAvatarUpload={handleAvatarUpload}
                isUploadingAvatar={isUploadingAvatar}
                avatarInputRef={avatarInputRef}
              />
            )}
            {step === 2 && (
              <StepAvailability
                availabilities={formData.availabilities}
                onChange={(availabilities) => updateForm({ availabilities })}
              />
            )}
            {step === 3 && (
              <StepServices
                services={business.services || []}
                selectedIds={formData.serviceIds}
                onChange={(serviceIds) => updateForm({ serviceIds })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2 rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>

        {step < 3 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2 rounded-full">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createMutation.isPending}
            isLoading={createMutation.isPending}
            className="rounded-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Ajouter l&apos;employé
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Identity & Contact
function StepIdentity({
  formData,
  onChange,
  onAvatarUpload,
  isUploadingAvatar,
  avatarInputRef,
}: {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onAvatarUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        {/* Avatar upload */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={onAvatarUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-xl font-bold mb-1">Informations de l&apos;employé</h2>
        <p className="text-muted-foreground text-sm">
          Renseignez les informations de base
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Prénom *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Jean"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Nom *</label>
          <Input
            value={formData.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Dupont"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          <Briefcase className="w-4 h-4 inline mr-1" />
          Poste / Rôle
        </label>
        <Input
          value={formData.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Ex: Coiffeur senior, Esthéticienne..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="jean@exemple.fr"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Phone className="w-4 h-4 inline mr-1" />
            Téléphone
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              const formatted = digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
              onChange({ phone: formatted });
            }}
            placeholder="06 12 34 56 78"
            maxLength={14}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Bio / Description</label>
        <textarea
          value={formData.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="Quelques mots sur cet employé..."
          rows={3}
          className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>
    </div>
  );
}

// Step 2: Availability
function StepAvailability({
  availabilities,
  onChange,
}: {
  availabilities: Availability[];
  onChange: (availabilities: Availability[]) => void;
}) {
  const toggleDay = (dayOfWeek: number) => {
    const existing = availabilities.find((a) => a.dayOfWeek === dayOfWeek);
    if (existing) {
      onChange(availabilities.filter((a) => a.dayOfWeek !== dayOfWeek));
    } else {
      onChange([
        ...availabilities,
        { dayOfWeek, startTime: '09:00', endTime: '18:00' },
      ]);
    }
  };

  const updateTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    onChange(
      availabilities.map((a) =>
        a.dayOfWeek === dayOfWeek ? { ...a, [field]: value } : a
      )
    );
  };

  const selectWeekdays = () => {
    const weekdays = [1, 2, 3, 4, 5].map((day) => ({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
    }));
    onChange(weekdays);
  };

  const selectAllDays = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
    }));
    onChange(allDays);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">Disponibilités</h2>
        <p className="text-muted-foreground text-sm">
          Définissez les horaires de travail (optionnel)
        </p>
      </div>

      {/* Quick selections */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={selectWeekdays}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          Semaine (Lun-Ven)
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          onClick={selectAllDays}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          Tous les jours
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          onClick={() => onChange([])}
          className="text-xs text-muted-foreground hover:underline cursor-pointer"
        >
          Effacer
        </button>
      </div>

      {/* Days grid */}
      <div className="space-y-3">
        {WEEK_DAYS.filter(d => d.value !== 0).map((day) => {
          const availability = availabilities.find((a) => a.dayOfWeek === day.value);
          const isActive = !!availability;

          return (
            <div
              key={day.value}
              className={`p-4 rounded-xl border transition-colors ${
                isActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleDay(day.value)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={`font-medium ${isActive ? '' : 'text-muted-foreground'}`}>
                    {day.label}
                  </span>
                </button>

                {isActive && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={availability.startTime}
                      onChange={(e) => updateTime(day.value, 'startTime', e.target.value)}
                      className="w-28 h-9 text-sm"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="time"
                      value={availability.endTime}
                      onChange={(e) => updateTime(day.value, 'endTime', e.target.value)}
                      className="w-28 h-9 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Sunday at the end */}
        {(() => {
          const sunday = WEEK_DAYS.find(d => d.value === 0)!;
          const availability = availabilities.find((a) => a.dayOfWeek === 0);
          const isActive = !!availability;

          return (
            <div
              className={`p-4 rounded-xl border transition-colors ${
                isActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleDay(0)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={`font-medium ${isActive ? '' : 'text-muted-foreground'}`}>
                    {sunday.label}
                  </span>
                </button>

                {isActive && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={availability.startTime}
                      onChange={(e) => updateTime(0, 'startTime', e.target.value)}
                      className="w-28 h-9 text-sm"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="time"
                      value={availability.endTime}
                      onChange={(e) => updateTime(0, 'endTime', e.target.value)}
                      className="w-28 h-9 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Step 3: Services Assignment
function StepServices({
  services,
  selectedIds,
  onChange,
}: {
  services: BusinessService[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggleService = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(services.map((s) => s.id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">Services</h2>
        <p className="text-muted-foreground text-sm">
          Quels services cet employé peut-il réaliser ? (optionnel)
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Vous n&apos;avez pas encore de services
          </p>
          <Link href="/business/services/new">
            <Button variant="outline" className="rounded-full">
              Créer un service
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Quick selections */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Tous les services
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => onChange([])}
              className="text-xs text-muted-foreground hover:underline cursor-pointer"
            >
              Aucun
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {services.map((service) => {
              const isSelected = selectedIds.includes(service.id);

              return (
                <motion.button
                  key={service.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleService(service.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <span className="font-medium">{service.name}</span>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(service.priceCents / 100).toFixed(0)} € • {service.durationMinutes} min
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
