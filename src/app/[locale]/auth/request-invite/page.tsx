'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

function formatPhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '').slice(0, 15);
  if (digits.length === 0) return hasPlus ? '+' : '';
  const pairs = digits.match(/.{1,2}/g) ?? [];
  return (hasPlus ? '+' : '') + pairs.join(' ');
}

export default function RequestInvitePage() {
  const t = useTranslations('requestInvite');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.createInviteRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      }),
    onSuccess: () => {
      setDone(true);
      setErrorMessage(null);
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 429) setErrorMessage(t('rateLimit'));
      else setErrorMessage(t('error'));
    },
  });

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    phone.trim().length >= 6 &&
    !mutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-amber-50 to-white relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-150 h-150 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-150 h-150 bg-amber-200/40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-20 relative">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToHome')}
          </Link>

          {done ? <SuccessCard /> : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl shadow-xl shadow-rose-900/5 border border-border/50 p-6 sm:p-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-rose-50 border border-rose-100 text-xs font-medium text-rose-700">
                <Sparkles className="w-3.5 h-3.5" />
                {t('title')}
              </div>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                {t('subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label={t('firstName')}
                    value={firstName}
                    onChange={setFirstName}
                    placeholder={t('placeholderFirstName')}
                    icon={<User className="w-4 h-4 text-muted-foreground" />}
                    autoFocus
                    autoComplete="given-name"
                  />
                  <Field
                    label={t('lastName')}
                    value={lastName}
                    onChange={setLastName}
                    placeholder={t('placeholderLastName')}
                    autoComplete="family-name"
                  />
                </div>
                <Field
                  label={t('email')}
                  value={email}
                  onChange={setEmail}
                  placeholder={t('placeholderEmail')}
                  icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  type="email"
                  autoComplete="email"
                />
                <Field
                  label={t('phone')}
                  value={phone}
                  onChange={(v) => setPhone(formatPhone(v))}
                  placeholder={t('placeholderPhone')}
                  icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                />

                {errorMessage && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-full h-12 text-base mt-2"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {t('submit')}
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  {t('noSpam')}
                </p>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessCard() {
  const t = useTranslations('requestInvite');
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-3xl shadow-xl shadow-rose-900/5 border border-border/50 p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-8 h-8 text-emerald-600" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-3">{t('thanksTitle')}</h2>
      <p className="text-base text-muted-foreground mb-8 leading-relaxed">
        {t('thanksSubtitle')}
      </p>
      <Link href="/">
        <Button variant="outline" className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToHome')}
        </Button>
      </Link>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  autoFocus,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'px-3'} pr-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors`}
        />
      </div>
    </div>
  );
}
