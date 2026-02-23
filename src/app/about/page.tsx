'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Shield, Sparkles, Target, Handshake } from 'lucide-react';

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
  const values = [
    {
      icon: Shield,
      title: 'Confiance',
      description: 'Notre système de réputation garantit des échanges transparents et sécurisés entre tous les membres.',
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Nous croyons en la force du collectif et encourageons les connexions humaines authentiques.',
    },
    {
      icon: Heart,
      title: 'Bienveillance',
      description: 'Chaque interaction est une opportunité d\'entraide et de partage de compétences.',
    },
    {
      icon: Sparkles,
      title: 'Simplicité',
      description: 'Une plateforme intuitive où trouver ou proposer un service ne prend que quelques clics.',
    },
  ];

  const team = [
    {
      name: 'L\'équipe Sidely',
      role: 'Fondateurs',
      description: 'Une équipe passionnée par l\'économie collaborative et les connexions humaines.',
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
              Qui sommes-nous ?
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Sidely est née d'une idée simple : faciliter les échanges de services entre particuliers
              dans un cadre de confiance. Nous croyons que chacun possède des compétences
              précieuses à partager.
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
                Notre mission
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Connecter les talents locaux
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Nous avons créé Sidely pour répondre à un besoin simple : permettre à chacun
                de trouver facilement de l'aide pour ses projets du quotidien, tout en
                offrant aux talents locaux une plateforme pour valoriser leurs compétences.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Notre système de réputation unique, basé sur l'expérience et la confiance,
                garantit des échanges sereins et encourage l'excellence.
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
                    <div className="text-muted-foreground">Services échangés</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-sm text-muted-foreground">Satisfaction</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">Membres actifs</div>
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
              Nos valeurs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Les principes qui guident chacune de nos actions
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
              Notre histoire
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Sidely est née d'un constat simple : dans notre quotidien, nous avons souvent besoin
                d'aide pour des tâches variées - du bricolage aux cours particuliers, du jardinage
                à l'aide informatique. Et autour de nous, des personnes talentueuses seraient ravies
                de proposer leurs services.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Nous avons voulu créer un espace où ces connexions se font naturellement, dans un
                cadre de confiance. Notre système de réputation innovant, inspiré des mécaniques
                de progression des jeux vidéo, rend l'expérience engageante tout en garantissant
                la qualité des échanges.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Aujourd'hui, Sidely grandit grâce à vous, notre communauté. Chaque service échangé
                renforce notre conviction : ensemble, nous pouvons créer une économie locale plus
                humaine et solidaire.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
