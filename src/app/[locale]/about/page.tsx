'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Shield, Sparkles, Target, Handshake } from 'lucide-react';
import { useTranslations } from 'next-intl';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function AboutPage() {
  const t = useTranslations('about');

  const values = [
    {
      icon: Shield,
      title: t('values.trust'),
      description: t('values.trustDesc'),
    },
    {
      icon: Users,
      title: t('values.community'),
      description: t('values.communityDesc'),
    },
    {
      icon: Heart,
      title: t('values.kindness'),
      description: t('values.kindnessDesc'),
    },
    {
      icon: Sparkles,
      title: t('values.simplicity'),
      description: t('values.simplicityDesc'),
    },
  ];

  const team = [
    {
      name: 'L\'equipe Booklia',
      role: 'Fondateurs',
      description: 'Une equipe passionnee par l\'economie collaborative et les connexions humaines.',
    },
  ];

  return (
    <div className="min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t('intro')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Target className="w-4 h-4" />
                {t('mission.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('mission.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('mission.description1')}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('mission.description2')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-linear-to-r from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
              <div className="relative bg-surface border border-border rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Handshake className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">+1000</div>
                    <div className="text-muted-foreground">{t('mission.servicesExchanged')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-sm text-muted-foreground">{t('mission.satisfaction')}</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">{t('mission.activeMembers')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('values.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('values.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="bg-background rounded-2xl p-6 shadow-sm border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              {t('story.title')}
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t('story.p1')}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t('story.p2')}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t('story.p3')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
