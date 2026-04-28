'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  Users,
  FileText,
  Globe,
  Heart,
  UsersRound,
  ArrowRight,
  Sparkles,
  Check,
  Quote,
  Search,
  Shield,
  Zap,
  TrendingUp,
  Mail,
  Bell,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

// Stock photography per category (Unsplash, license-free).
// Kept as URLs (no next/image) to match the rest of the codebase.
const CATEGORY_IMAGES = [
  {
    key: 'hair',
    image:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'barber',
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'nails',
    image:
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'beauty',
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'wellness',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
  },
];

export default function LandingPage() {
  const t = useTranslations('landing');
  const heroRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <div className="bg-background">
      {/* ======================================================
          HERO
          ====================================================== */}
      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-border/50"
      >
        {/* Soft gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-rose-50 via-amber-50 to-white" />
          <div className="absolute -top-40 -right-40 w-150 h-150 bg-rose-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-150 h-150 bg-amber-200/40 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Text column */}
            <motion.div
              style={{ y: heroParallax, opacity: heroOpacity }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/80 backdrop-blur border border-border/50 text-xs font-medium text-foreground/80"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {t('hero.badge')}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-foreground"
              >
                {t('hero.title1')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">{t('hero.titleAccent')}</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
                    className="absolute left-0 bottom-1 h-3 sm:h-4 w-full bg-amber-200/70 z-0 origin-left rounded-sm"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl lg:max-w-none"
              >
                {t('hero.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
              >
                <Link href="/auth/request-invite">
                  <Button size="lg" className="rounded-full px-7 h-12 text-base">
                    {t('hero.ctaPrimary')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-7 h-12 text-base bg-white/80 backdrop-blur"
                  >
                    {t('hero.ctaSecondary')}
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5 justify-center lg:justify-start"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {t('hero.noCard')}
              </motion.p>
            </motion.div>

            {/* Visual column: dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
              className="relative"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================================
          TRUST BAR — categories with images
          ====================================================== */}
      <section className="py-16 sm:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={t('trustBar.title')}
            subtitle={t('trustBar.subtitle')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-10 max-w-6xl mx-auto">
            {CATEGORY_IMAGES.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative aspect-4/5 rounded-2xl overflow-hidden cursor-default shadow-sm hover:shadow-xl transition-shadow"
              >
                <img
                  src={cat.image}
                  alt={t(`trustBar.categories.${cat.key}` as 'trustBar.categories.hair')}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="text-white font-semibold text-sm sm:text-base drop-shadow-md">
                    {t(`trustBar.categories.${cat.key}` as 'trustBar.categories.hair')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          SHOWCASE 1 — Booking 24/7
          ====================================================== */}
      <ShowcaseSection
        id="booking247"
        eyebrow={t('showcase.booking.eyebrow')}
        title={t('showcase.booking.title')}
        description={t('showcase.booking.description')}
        bullets={[
          t('showcase.booking.bullet1'),
          t('showcase.booking.bullet2'),
          t('showcase.booking.bullet3'),
        ]}
        accent="rose"
        reverse={false}
        visual={<Booking247Mockup />}
      />

      {/* ======================================================
          SHOWCASE 2 — Client files
          ====================================================== */}
      <ShowcaseSection
        id="client-files"
        eyebrow={t('showcase.clients.eyebrow')}
        title={t('showcase.clients.title')}
        description={t('showcase.clients.description')}
        bullets={[
          t('showcase.clients.bullet1'),
          t('showcase.clients.bullet2'),
          t('showcase.clients.bullet3'),
        ]}
        accent="emerald"
        reverse
        visual={<ClientFileMockup />}
      />

      {/* ======================================================
          SHOWCASE 3 — Multi-employee
          ====================================================== */}
      <ShowcaseSection
        id="multi-employee"
        eyebrow={t('showcase.team.eyebrow')}
        title={t('showcase.team.title')}
        description={t('showcase.team.description')}
        bullets={[
          t('showcase.team.bullet1'),
          t('showcase.team.bullet2'),
          t('showcase.team.bullet3'),
        ]}
        accent="indigo"
        reverse={false}
        visual={<MultiEmployeeMockup />}
      />

      {/* ======================================================
          SHOWCASE 4 — Email reminders
          ====================================================== */}
      <ShowcaseSection
        id="reminders"
        eyebrow={t('showcase.reminders.eyebrow')}
        title={t('showcase.reminders.title')}
        description={t('showcase.reminders.description')}
        bullets={[
          t('showcase.reminders.bullet1'),
          t('showcase.reminders.bullet2'),
          t('showcase.reminders.bullet3'),
        ]}
        accent="amber"
        reverse
        visual={<RemindersMockup />}
      />

      {/* ======================================================
          FEATURES
          ====================================================== */}
      <section id="features" className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={t('features.title')}
            subtitle={t('features.subtitle')}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 max-w-6xl mx-auto">
            {[
              {
                key: 'agenda',
                icon: Calendar,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
              },
              {
                key: 'crm',
                icon: Users,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
              },
              {
                key: 'invoicing',
                icon: FileText,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
              },
              {
                key: 'booking',
                icon: Globe,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                border: 'border-rose-100',
              },
              {
                key: 'referral',
                icon: Heart,
                color: 'text-pink-600',
                bg: 'bg-pink-50',
                border: 'border-pink-100',
              },
              {
                key: 'team',
                icon: UsersRound,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                border: 'border-indigo-100',
              },
            ].map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="group relative bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} ${f.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`features.${f.key}.title` as 'features.agenda.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`features.${f.key}.desc` as 'features.agenda.desc')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS — closed-beta onboarding
          ====================================================== */}
      <section id="how" className="py-20 sm:py-28 bg-linear-to-b from-rose-50/40 to-transparent border-y border-border/50">
        <div className="container mx-auto px-4">
          <SectionHeader title={t('how.title')} subtitle={t('how.subtitle')} />

          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            {(
              [
                { step: 1, icon: MessageCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
                { step: 2, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-100' },
                { step: 3, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              ] as const
            ).map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative bg-surface border border-border rounded-2xl p-6"
              >
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                  {s.step}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4 mt-2`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`how.step${s.step}.title` as 'how.step1.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`how.step${s.step}.desc` as 'how.step1.desc')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHY BOOKLIA — split layout
          ====================================================== */}
      <section id="why" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-150 bg-rose-100/40 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Visual side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <WhyBookliaVisual />
            </motion.div>

            {/* Text side */}
            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4 }}
              >
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-medium mb-4">
                  {t('why.badge')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  {t('why.title')}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-8">
                  {t('why.subtitle')}
                </p>
              </motion.div>

              <div className="space-y-3">
                {(
                  [
                    { key: 'allInOne', icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-100' },
                    { key: 'noFees', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { key: 'french', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { key: 'fast', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
                  ] as const
                ).map((item, i) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                    className="group flex gap-4 p-5 bg-white border border-border rounded-2xl hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`shrink-0 w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t(`why.${item.key}.title` as 'why.allInOne.title')}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(`why.${item.key}.desc` as 'why.allInOne.desc')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          TESTIMONIAL
          ====================================================== */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <motion.figure
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-surface border border-border rounded-3xl p-8 sm:p-12 text-center relative"
          >
            <Quote className="absolute top-6 left-6 w-8 h-8 text-rose-200" />
            <blockquote className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed">
              “{t('testimonial.quote')}”
            </blockquote>
            <figcaption className="mt-6 flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-rose-200 to-amber-200 flex items-center justify-center font-semibold text-foreground">
                {t('testimonial.author')[0]}
              </div>
              <span className="text-sm font-semibold mt-2">
                {t('testimonial.author')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('testimonial.role')}
              </span>
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ======================================================
          FINAL CTA — dark
          ====================================================== */}
      <section className="py-20 sm:py-28 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-rose-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('finalCta.title')}
            </h2>
            <p className="text-base sm:text-lg text-background/70 mb-8">
              {t('finalCta.subtitle')}
            </p>
            <Link href="/auth/request-invite">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base bg-background text-foreground hover:bg-background/90"
              >
                {t('finalCta.cta')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          CLIENT FOOTER LINK
          ====================================================== */}
      <section className="py-8 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {t('clientFooter.label')}
          </span>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            <Search className="w-4 h-4" />
            {t('clientFooter.cta')}
          </Link>
        </div>
      </section>
    </div>
  );
}

// ======================================================
// SHARED SUBCOMPONENTS
// ======================================================

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4 }}
      className="text-center max-w-2xl mx-auto"
    >
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 text-base sm:text-lg text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}

function DashboardMockup() {
  const t = useTranslations('landing.mockup');

  const bookings = [
    {
      service: t('sample1Service'),
      client: t('sample1Client'),
      time: t('sample1Time'),
      color: 'bg-rose-100 border-rose-200 text-rose-700',
    },
    {
      service: t('sample2Service'),
      client: t('sample2Client'),
      time: t('sample2Time'),
      color: 'bg-amber-100 border-amber-200 text-amber-700',
    },
    {
      service: t('sample3Service'),
      client: t('sample3Client'),
      time: t('sample3Time'),
      color: 'bg-blue-100 border-blue-200 text-blue-700',
    },
  ];

  return (
    <div className="relative">
      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl shadow-rose-900/10 border border-border/40 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{t('todayTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('bookingsCount')}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700">
              {t('liveBadge')}
            </span>
          </div>
        </div>

        {/* Bookings list */}
        <div className="p-4 space-y-2">
          {bookings.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${b.color}`}
            >
              <span className="font-semibold text-sm w-12">{b.time}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-foreground">
                  {b.service}
                </p>
                <p className="text-xs opacity-70 truncate">{b.client}</p>
              </div>
              <Check className="w-4 h-4 shrink-0" />
            </motion.div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="px-6 py-4 border-t border-border/50 grid grid-cols-2 gap-4 bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">{t('newClients')}</p>
            <p className="text-lg font-bold mt-0.5">+12</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('completionRate')}</p>
            <p className="text-lg font-bold mt-0.5">94%</p>
          </div>
        </div>
      </motion.div>

      {/* Floating revenue card */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute -bottom-6 -left-6 sm:-left-10 bg-white rounded-2xl shadow-xl shadow-rose-900/10 border border-border/40 p-4 hidden sm:block"
      >
        <p className="text-xs text-muted-foreground">{t('revenue')}</p>
        <p className="text-2xl font-bold mt-1">€842</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          +18%
        </div>
      </motion.div>

      {/* Floating notification bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="absolute -top-4 -right-4 sm:-right-8 bg-white rounded-2xl shadow-xl shadow-rose-900/10 border border-border/40 p-3 hidden sm:flex items-center gap-2"
      >
        <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
          <Heart className="w-4 h-4 text-rose-500" />
        </div>
        <div>
          <p className="text-xs font-semibold">Karine P.</p>
          <p className="text-[10px] text-muted-foreground">+1 nouveau RDV</p>
        </div>
      </motion.div>
    </div>
  );
}

// ======================================================
// SHOWCASE SECTION (reusable layout: text + visual)
// ======================================================

type AccentColor = 'rose' | 'emerald' | 'indigo' | 'amber';

const ACCENT_STYLES: Record<
  AccentColor,
  { eyebrow: string; check: string; glow: string }
> = {
  rose: {
    eyebrow: 'bg-rose-100 text-rose-700',
    check: 'text-rose-500',
    glow: 'bg-rose-200/50',
  },
  emerald: {
    eyebrow: 'bg-emerald-100 text-emerald-700',
    check: 'text-emerald-500',
    glow: 'bg-emerald-200/50',
  },
  indigo: {
    eyebrow: 'bg-indigo-100 text-indigo-700',
    check: 'text-indigo-500',
    glow: 'bg-indigo-200/50',
  },
  amber: {
    eyebrow: 'bg-amber-100 text-amber-700',
    check: 'text-amber-500',
    glow: 'bg-amber-200/50',
  },
};

function ShowcaseSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  accent,
  reverse,
  visual,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  accent: AccentColor;
  reverse: boolean;
  visual: React.ReactNode;
}) {
  const styles = ACCENT_STYLES[accent];
  return (
    <section
      id={id}
      className="py-20 sm:py-28 relative overflow-hidden border-b border-border/50"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className={`absolute ${reverse ? '-left-40' : '-right-40'} top-1/2 -translate-y-1/2 w-150 h-150 ${styles.glow} rounded-full blur-3xl opacity-60`}
        />
      </div>
      <div className="container mx-auto px-4">
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto ${
            reverse ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className={`inline-block px-3 py-1 rounded-full ${styles.eyebrow} text-xs font-medium mb-4`}
            >
              {eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
            <ul className="space-y-3">
              {bullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3 text-sm sm:text-base text-foreground/80"
                >
                  <Check
                    className={`w-5 h-5 ${styles.check} shrink-0 mt-0.5`}
                  />
                  <span>{bullet}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ======================================================
// SHOWCASE 1: Booking 24/7 mockup
// ======================================================

function Booking247Mockup() {
  return (
    <div className="relative">
      <div className="bg-white rounded-3xl shadow-2xl shadow-rose-900/10 border border-border/40 overflow-hidden">
        {/* Browser chrome */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 bg-muted/30">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="flex-1 ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-border/40 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span className="truncate">booklia.fr/em-institut</span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-rose-200 to-amber-200" />
            <div>
              <p className="font-semibold">EM Institut</p>
              <p className="text-xs text-muted-foreground">
                Esthétique · Paris 9
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Prendre rendez-vous</p>
              <div className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                <Clock className="w-3 h-3" />
                23h47
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'].map(
                (slot, i) => (
                  <motion.button
                    key={slot}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className={`py-2 rounded-lg text-xs font-medium border ${
                      i === 2
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-white text-foreground border-border'
                    }`}
                  >
                    {slot}
                  </motion.button>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              Réservation confirmée en 30 secondes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SHOWCASE 2: Client file mockup
// ======================================================

function ClientFileMockup() {
  return (
    <div className="relative">
      <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-900/10 border border-border/40 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border/50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-200 to-amber-200 flex items-center justify-center text-xl font-bold text-foreground">
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Sophie Mercier</p>
            <p className="text-xs text-muted-foreground">
              Cliente depuis 2 ans
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            VIP
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border/50">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold">24</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              RDV
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold">€1840</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              CA
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">100%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              Honoré
            </p>
          </div>
        </div>

        {/* History */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Historique récent
          </p>
          <div className="space-y-2">
            {[
              { svc: 'Coupe & couleur', date: '12 mars', emp: 'Camille' },
              { svc: 'Brushing', date: '28 février', emp: 'Léa' },
              { svc: 'Coloration', date: '14 février', emp: 'Camille' },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.svc}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.date} · avec {b.emp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
          <p className="font-semibold mb-0.5">Note privée</p>
          <p className="opacity-80">
            Allergique aux parfums forts. Préfère les produits bio.
          </p>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SHOWCASE 3: Multi-employee agenda mockup
// ======================================================

function MultiEmployeeMockup() {
  const employees = [
    { name: 'Camille', color: 'bg-rose-100 border-rose-200 text-rose-700' },
    { name: 'Léa', color: 'bg-amber-100 border-amber-200 text-amber-700' },
    { name: 'Karine', color: 'bg-blue-100 border-blue-200 text-blue-700' },
  ];

  // [employeeIndex, slotIndex (0-5), label]
  const slots: Array<[number, number, string]> = [
    [0, 0, 'Sophie M.'],
    [0, 2, 'Marie D.'],
    [1, 1, 'Léa B.'],
    [1, 3, 'Anna R.'],
    [2, 0, 'Karine P.'],
    [2, 4, 'Julie F.'],
  ];

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-900/10 border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <p className="font-semibold text-sm">Vendredi 12 avril</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <UsersRound className="w-3.5 h-3.5" />
          {employees.length} employés
        </div>
      </div>

      {/* Employee columns */}
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {employees.map((emp, empIdx) => (
          <div key={emp.name} className="p-3">
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-md ${emp.color} text-center mb-2`}
            >
              {emp.name}
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, slotIdx) => {
                const booking = slots.find(
                  ([e, s]) => e === empIdx && s === slotIdx,
                );
                const startHour = 9 + slotIdx;
                return (
                  <motion.div
                    key={slotIdx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05 * (empIdx * 6 + slotIdx),
                    }}
                    className={`min-h-9 rounded-md px-2 py-1.5 text-[10px] flex items-center gap-1 ${
                      booking
                        ? `${emp.color} border font-medium`
                        : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <span className="opacity-60 shrink-0">
                      {String(startHour).padStart(2, '0')}h
                    </span>
                    {booking && (
                      <span className="truncate">{booking[2]}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// SHOWCASE 4: Email reminders mockup
// ======================================================

function RemindersMockup() {
  return (
    <div className="relative">
      {/* Phone-like email card */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-amber-900/10 border border-border/40 overflow-hidden max-w-md mx-auto">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Boîte de réception</span>
          </div>
          <span className="text-[10px] text-muted-foreground">il y a 2 min</span>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-200 to-amber-200 flex items-center justify-center text-sm font-bold shrink-0">
              EM
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">EM Institut</p>
              <p className="text-xs text-muted-foreground">
                Rappel : votre rendez-vous est demain
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
            <p className="text-sm font-medium mb-2">Demain à 14h00</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Soin du visage hydratant
              </p>
              <p className="flex items-center gap-2">
                <UsersRound className="w-3.5 h-3.5 text-amber-600" />
                Avec Camille
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Durée : 60 min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              <Check className="w-3 h-3" />
              Envoyé automatiquement
            </span>
          </div>
        </div>
      </div>

      {/* Floating bell */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute -top-4 -right-2 sm:-right-4 bg-white rounded-2xl shadow-xl border border-border/40 p-3 hidden sm:flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-semibold">+ 12 rappels</p>
          <p className="text-[10px] text-muted-foreground">cette semaine</p>
        </div>
      </motion.div>
    </div>
  );
}

// ======================================================
// WHY BOOKLIA — synthetic visual
// ======================================================

function WhyBookliaVisual() {
  return (
    <div className="relative">
      {/* Background card showing fake stats over time */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-rose-900/10 border border-border/40 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Tableau de bord
            </p>
            <p className="text-lg font-bold mt-0.5">Votre salon en chiffres</p>
          </div>
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
            <TrendingUp className="w-3 h-3" />
            +24%
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-2 h-32 mb-6">
          {[40, 55, 48, 70, 62, 85, 92].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * i, ease: 'easeOut' }}
              className={`flex-1 rounded-t-md ${
                i >= 5 ? 'bg-rose-400' : 'bg-rose-200'
              }`}
            />
          ))}
        </div>

        {/* Mini KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              RDV / sem.
            </p>
            <p className="text-lg font-bold mt-0.5">142</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Nouveaux
            </p>
            <p className="text-lg font-bold mt-0.5 text-emerald-600">+18</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Honoré
            </p>
            <p className="text-lg font-bold mt-0.5">96%</p>
          </div>
        </div>
      </div>

      {/* Floating "Sans frais cachés" badge */}
      <motion.div
        initial={{ opacity: 0, y: 10, rotate: 5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 4 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute -bottom-4 -right-2 sm:-right-4 bg-white rounded-2xl shadow-xl border border-border/40 px-4 py-2 flex items-center gap-2 hidden sm:flex"
      >
        <Shield className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-semibold">0% commission</span>
      </motion.div>
    </div>
  );
}
