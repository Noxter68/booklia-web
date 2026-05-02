'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

interface FaqItem {
  q: string;
  a: ReactNode;
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // Rich-text answers can embed <invite> for /auth/request-invite links.
  const richAnswer = (key: string) =>
    t.rich(key, {
      invite: (chunks) => (
        <Link href="/auth/request-invite" className="text-primary underline hover:opacity-80">
          {chunks}
        </Link>
      ),
    });

  const faq: FaqItem[] = [
    { q: t('faq1Q'), a: richAnswer('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: richAnswer('faq5A') },
    { q: t('faq6Q'), a: t('faq6A') },
    { q: t('faq7Q'), a: t('faq7A') },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">{t('title')}</h1>
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact info */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <a
              href="mailto:contact@booklia.org"
              className="flex items-start gap-4 p-5 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{t('email')}</div>
                <div className="text-primary font-medium wrap-break-word">contact@booklia.org</div>
                <div className="text-sm text-muted-foreground mt-1">{t('emailDesc')}</div>
              </div>
            </a>
            <div className="flex items-start gap-4 p-5 bg-surface border border-border rounded-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{t('location')}</div>
                <div className="text-primary font-medium">{t('locationValue')}</div>
                <div className="text-sm text-muted-foreground mt-1">{t('locationDesc')}</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              {t('faqTitle')}
            </h2>
            <div className="space-y-3">
              {faq.map((item, idx) => (
                <FaqAccordion
                  key={idx}
                  question={item.q}
                  answer={item.a}
                  isOpen={openIdx === idx}
                  onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqAccordion({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-sm sm:text-base">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
