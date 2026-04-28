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
  Scissors,
  Hand,
  Flower2,
  Search,
  Shield,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

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
                <Link href="/auth/register">
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
          TRUST BAR — categories
          ====================================================== */}
      <section className="py-12 sm:py-16 border-b border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
            {t('trustBar.title')}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-3xl mx-auto">
            {[
              { key: 'hair', icon: Scissors },
              { key: 'barber', icon: Scissors },
              { key: 'nails', icon: Hand },
              { key: 'beauty', icon: Sparkles },
              { key: 'massage', icon: Heart },
              { key: 'spa', icon: Flower2 },
            ].map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <cat.icon className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">
                  {t(`trustBar.categories.${cat.key}` as 'trustBar.categories.hair')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
          HOW IT WORKS
          ====================================================== */}
      <section id="how" className="py-20 sm:py-28 bg-linear-to-b from-rose-50/40 to-transparent border-y border-border/50">
        <div className="container mx-auto px-4">
          <SectionHeader title={t('how.title')} subtitle={t('how.subtitle')} />

          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            {[1, 2, 3].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative bg-surface border border-border rounded-2xl p-6"
              >
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <h3 className="text-lg font-semibold mb-2 mt-2">
                  {t(`how.step${step}.title` as 'how.step1.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`how.step${step}.desc` as 'how.step1.desc')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHY BOOKLIA
          ====================================================== */}
      <section id="why" className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <SectionHeader title={t('why.title')} subtitle={t('why.subtitle')} />

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-12 max-w-4xl mx-auto">
            {[
              { key: 'allInOne', icon: Sparkles },
              { key: 'noFees', icon: TrendingUp },
              { key: 'french', icon: Shield },
              { key: 'fast', icon: Zap },
            ].map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex gap-4 p-6 bg-surface border border-border rounded-2xl"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-foreground" />
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
      </section>

      {/* ======================================================
          PRICING TEASER
          ====================================================== */}
      <section className="py-20 sm:py-28 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-medium mb-6">
              {t('pricing.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-base sm:text-lg text-background/70 mb-8">
              {t('pricing.subtitle')}
            </p>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base bg-background text-foreground hover:bg-background/90"
              >
                {t('pricing.cta')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-background/60">{t('pricing.detail')}</p>
          </motion.div>
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
          FINAL CTA
          ====================================================== */}
      <section className="py-20 sm:py-28 border-t border-border/50">
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
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              {t('finalCta.subtitle')}
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="rounded-full px-8 h-12 text-base">
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
