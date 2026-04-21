'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Save,
  Camera,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { BusinessService, Employee, EmployeeAvailability } from '@/types';
import { useTranslations } from 'next-intl';

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

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('employeeForm');
  const tc = useTranslations('common');

  const steps = [
    { number: 1, title: t('stepIdentity'), icon: User },
    { number: 2, title: t('stepAvailability'), icon: Calendar },
    { number: 3, title: t('stepServices'), icon: Scissors },
  ];

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
  const [initialized, setInitialized] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => api.getEmployee(employeeId),
    enabled: !!employeeId && !!user,
  });

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
  });

  // Initialiser le formulaire avec les donnees de l'employe
  useEffect(() => {
    if (employee && !initialized) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        bio: employee.bio || '',
        avatarUrl: employee.avatarUrl || '',
        availabilities: employee.availabilities?.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })) || [],
        serviceIds: employee.services?.map((s) => s.businessService.id) || [],
      });
      setInitialized(true);
    }
  }, [employee, initialized]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateEmployee(employeeId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        availabilities: formData.availabilities.length > 0 ? formData.availabilities : undefined,
        serviceIds: formData.serviceIds,
      }),
    onSuccess: () => {
      success(t('editSuccess'));
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      router.push('/business/dashboard');
    },
    onError: (err: Error) => {
      showError(err.message || t('error'));
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
        return true;
      case 3:
        return true;
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
    updateMutation.mutate();
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await api.uploadFile(file, 'avatar');
      updateForm({ avatarUrl: result.url });
      success(t('photoUploaded'));
    } catch {
      showError(t('photoUploadError'));
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  if (authLoading || businessLoading || employeeLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text={tc('loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('loginRequired')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('loginRequiredEditDesc')}
        </p>
        <Link href="/auth/login">
          <Button>{t('loginButton')}</Button>
        </Link>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('noBusiness')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('noBusinessDesc')}
        </p>
        <Link href="/business/setup">
          <Button>{t('createBusiness')}</Button>
        </Link>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('employeeNotFound')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('employeeNotFoundDesc')}
        </p>
        <Link href="/business/dashboard">
          <Button>{t('backToDashboard')}</Button>
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
          <h1 className="text-2xl font-bold">{t('editTitle')}</h1>
          <p className="text-muted-foreground text-sm">
            {employee.firstName} {employee.lastName}
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
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => setStep(s.number as Step)}
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
          {tc('back')}
        </Button>

        {step < 3 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2 rounded-full">
            {tc('next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || updateMutation.isPending}
            isLoading={updateMutation.isPending}
            className="rounded-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {tc('save')}
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
  const t = useTranslations('employeeForm');

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
        <h2 className="text-xl font-bold mb-1">{t('editIdentityTitle')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('editIdentitySubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">{t('firstName')} *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Jean"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">{t('lastName')} *</label>
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
          {t('role')}
        </label>
        <Input
          value={formData.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder={t('rolePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Mail className="w-4 h-4 inline mr-1" />
            {t('email')}
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
            {t('phone')}
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
        <label className="text-sm font-medium mb-2 block">{t('bio')}</label>
        <textarea
          value={formData.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder={t('bioPlaceholder')}
          rows={3}
          className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>
    </div>
  );
}

// Step 2: Availability (multi-slot per day)
function StepAvailability({
  availabilities,
  onChange,
}: {
  availabilities: Availability[];
  onChange: (availabilities: Availability[]) => void;
}) {
  const t = useTranslations('employeeForm');

  const dayLabels: Record<number, string> = {
    0: t('sunday'),
    1: t('monday'),
    2: t('tuesday'),
    3: t('wednesday'),
    4: t('thursday'),
    5: t('friday'),
    6: t('saturday'),
  };

  // All slots for a given weekday, sorted by startTime
  const slotsFor = (day: number) =>
    availabilities
      .filter((a) => a.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const addSlot = (day: number) => {
    const existing = slotsFor(day);
    // Default: same as last slot, or 9-18 if first
    const last = existing[existing.length - 1];
    onChange([
      ...availabilities,
      {
        dayOfWeek: day,
        startTime: last ? last.endTime : '09:00',
        endTime: last ? '18:00' : '18:00',
      },
    ]);
  };

  const removeSlotAt = (day: number, indexWithinDay: number) => {
    const daySlots = slotsFor(day);
    const target = daySlots[indexWithinDay];
    if (!target) return;
    // Remove the matching entry — match by reference since we already sorted
    let removed = false;
    onChange(
      availabilities.filter((a) => {
        if (
          !removed &&
          a.dayOfWeek === day &&
          a.startTime === target.startTime &&
          a.endTime === target.endTime
        ) {
          removed = true;
          return false;
        }
        return true;
      }),
    );
  };

  const updateSlot = (
    day: number,
    indexWithinDay: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    const daySlots = slotsFor(day);
    const target = daySlots[indexWithinDay];
    if (!target) return;
    let updated = false;
    onChange(
      availabilities.map((a) => {
        if (
          !updated &&
          a.dayOfWeek === day &&
          a.startTime === target.startTime &&
          a.endTime === target.endTime
        ) {
          updated = true;
          return { ...a, [field]: value };
        }
        return a;
      }),
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

  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday-first, Sunday last

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">{t('availabilityTitle')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('editAvailabilitySubtitle')}
        </p>
      </div>

      {/* Quick selections */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={selectWeekdays}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          {t('weekdays')}
        </button>
        <span className="text-muted-foreground">-</span>
        <button
          onClick={selectAllDays}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          {t('allDays')}
        </button>
        <span className="text-muted-foreground">-</span>
        <button
          onClick={() => onChange([])}
          className="text-xs text-muted-foreground hover:underline cursor-pointer"
        >
          {t('clearDays')}
        </button>
      </div>

      {/* Days list with multi-slot support */}
      <div className="space-y-3">
        {dayOrder.map((day) => {
          const daySlots = slotsFor(day);
          const isActive = daySlots.length > 0;
          return (
            <div
              key={day}
              className={`p-4 rounded-xl border transition-colors ${
                isActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="shrink-0 pt-1.5">
                  <span
                    className={`font-medium ${
                      isActive ? '' : 'text-muted-foreground'
                    }`}
                  >
                    {dayLabels[day]}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  {daySlots.map((slot, i) => (
                    <div
                      key={`${day}-${i}`}
                      className="flex items-center gap-2 justify-end"
                    >
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(day, i, 'startTime', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(day, i, 'endTime', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlotAt(day, i)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        aria-label="Retirer cette plage"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isActive ? 'Ajouter une plage' : 'Activer ce jour'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
  const t = useTranslations('employeeForm');

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
        <h2 className="text-xl font-bold mb-1">{t('servicesTitle')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('editServicesSubtitle')}
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {t('noServices')}
          </p>
          <Link href="/business/services/new">
            <Button variant="outline" className="rounded-full">
              {t('createService')}
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
              {t('allServices')}
            </button>
            <span className="text-muted-foreground">-</span>
            <button
              onClick={() => onChange([])}
              className="text-xs text-muted-foreground hover:underline cursor-pointer"
            >
              {t('none')}
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
                      {(service.priceCents / 100).toFixed(0)} EUR - {service.durationMinutes} min
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
