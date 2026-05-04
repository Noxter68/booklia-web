import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d’Utilisation — Booklia',
  description:
    'Conditions générales d’utilisation de la plateforme Booklia, dédiée aux professionnels de la beauté et du bien-être.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Conditions Générales d’Utilisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : 2 mai 2026
          </p>
        </header>

        <article className="prose prose-sm sm:prose-base max-w-none">
          <Section title="1. Objet">
            <p>
              Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») ont
              pour objet de définir les modalités et conditions dans lesquelles{' '}
              <strong>Booklia</strong> (ci-après « la Plateforme ») met à disposition
              ses services aux professionnels de la beauté et du bien-être (ci-après
              les « Pros ») et à leurs clients (ci-après les « Clients »).
            </p>
            <p>
              En accédant à la Plateforme et en l’utilisant, l’utilisateur accepte
              sans réserve les présentes CGU.
            </p>
          </Section>

          <Section title="2. Mentions légales">
            <p>
              <strong>Éditeur :</strong> David Planchon, micro-entrepreneur
              <br />
              <strong>SIRET :</strong> [À COMPLÉTER]
              <br />
              <strong>Siège social :</strong> Bartenheim, Alsace, France
              <br />
              <strong>Email :</strong>{' '}
              <a href="mailto:contact@booklia.org" className="text-primary hover:underline">
                contact@booklia.org
              </a>
              <br />
              <strong>Responsable de publication :</strong> David Planchon
            </p>
            <p>
              <strong>Hébergement :</strong>
              <br />— Frontend : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA
              91723, USA
              <br />— Backend & base de données : Railway Corp., 2261 Market Street
              #4382, San Francisco, CA 94114, USA
            </p>
          </Section>

          <Section title="3. Définition du service">
            <p>
              Booklia est une plateforme de mise en relation entre des
              professionnels de la beauté et du bien-être (coiffeurs, esthéticiennes,
              instituts, etc.) et leurs clients. La Plateforme permet :
            </p>
            <ul>
              <li>
                Aux Pros : de gérer leur agenda, leur catalogue de prestations, leur
                clientèle et leur facturation.
              </li>
              <li>
                Aux Clients : de rechercher un Pro, de prendre rendez-vous en ligne
                et de gérer leurs réservations.
              </li>
            </ul>
            <p>
              Booklia agit en qualité d’intermédiaire technique. La Plateforme n’est
              partie à aucune relation contractuelle entre un Pro et un Client.
            </p>
          </Section>

          <Section title="4. Création de compte">
            <p>
              <strong>Pour les Clients :</strong> l’inscription est libre et
              gratuite. Elle nécessite la fourniture d’une adresse email valide,
              d’un nom, d’un mot de passe et d’une date de naissance.
            </p>
            <p>
              <strong>Pour les Pros :</strong> l’inscription se fait sur demande,
              après une démonstration de la Plateforme. Un compte est ensuite créé
              par un administrateur Booklia sous 48 heures.
            </p>
            <p>
              L’utilisateur s’engage à fournir des informations exactes, à les
              maintenir à jour, et à conserver la confidentialité de ses
              identifiants. Tout usage du compte est réputé fait par son titulaire.
            </p>
          </Section>

          <Section title="5. Obligations des utilisateurs">
            <p>
              <strong>Les Pros s’engagent à :</strong>
            </p>
            <ul>
              <li>
                Fournir des informations exactes et à jour sur leur établissement,
                leurs prestations et leurs tarifs.
              </li>
              <li>
                Respecter les rendez-vous confirmés et prévenir les Clients en cas
                d’imprévu dans un délai raisonnable.
              </li>
              <li>
                Disposer des qualifications, autorisations et assurances
                professionnelles requises pour exercer leur activité.
              </li>
              <li>Ne pas utiliser la Plateforme à des fins illicites ou frauduleuses.</li>
            </ul>
            <p>
              <strong>Les Clients s’engagent à :</strong>
            </p>
            <ul>
              <li>Honorer les rendez-vous pris ou les annuler dans un délai raisonnable.</li>
              <li>Respecter les conditions du Pro (politique d’annulation, retards, etc.).</li>
              <li>Régler les prestations consommées selon les modalités du Pro.</li>
            </ul>
          </Section>

          <Section title="6. Tarifs et abonnements">
            <p>
              L’accès à Booklia est <strong>gratuit pour les Clients</strong>.
            </p>
            <p>
              Les Pros souscrivent à une <strong>offre payante</strong> dont les
              modalités leur sont communiquées lors de la démonstration et avant la
              création du compte. Aucun prélèvement n’est effectué sans
              consentement préalable.
            </p>
          </Section>

          <Section title="7. Paiement entre Client et Pro">
            <p>
              À ce jour, Booklia <strong>n’intègre pas de système de paiement en
              ligne</strong> entre Clients et Pros. Le paiement de la prestation se
              fait directement entre le Client et le Pro, selon les modalités
              définies par ce dernier (espèces, carte bancaire en boutique, etc.).
            </p>
          </Section>

          <Section title="8. Annulation et modification de rendez-vous">
            <p>
              Le Client peut annuler ou modifier un rendez-vous depuis son espace
              personnel, dans les délais et conditions fixés par le Pro. Toute
              annulation tardive ou absence (« no-show ») peut être enregistrée
              dans l’historique du Client et impacter sa réputation auprès des
              Pros.
            </p>
          </Section>

          <Section title="9. Suppression de compte">
            <p>
              Tout utilisateur peut demander la suppression de son compte en
              écrivant à{' '}
              <a href="mailto:contact@booklia.org" className="text-primary hover:underline">
                contact@booklia.org
              </a>
              . La suppression entraîne l’effacement des données personnelles dans
              les conditions prévues par la Politique de Confidentialité.
            </p>
            <p>
              Booklia se réserve le droit de suspendre ou supprimer un compte en
              cas de manquement aux présentes CGU, après mise en demeure restée
              sans effet (sauf en cas de gravité justifiant une suspension
              immédiate).
            </p>
          </Section>

          <Section title="10. Propriété intellectuelle">
            <p>
              Les éléments de la Plateforme (interface, design, code, marques,
              logos) sont la propriété exclusive de Booklia ou de ses partenaires.
              Toute reproduction ou exploitation sans autorisation préalable est
              interdite.
            </p>
            <p>
              Les contenus publiés par les Pros (descriptions, photos) restent leur
              propriété ; ils accordent à Booklia une licence non exclusive
              d’utilisation pour les besoins de la Plateforme.
            </p>
          </Section>

          <Section title="11. Limitation de responsabilité">
            <p>
              Booklia agit en qualité d’hébergeur technique. Sa responsabilité ne
              saurait être engagée :
            </p>
            <ul>
              <li>
                Pour la qualité, la sécurité ou la légalité des prestations
                fournies par les Pros.
              </li>
              <li>
                Pour les désaccords ou litiges entre un Client et un Pro, qui
                relèvent exclusivement de leur relation contractuelle.
              </li>
              <li>
                Pour les interruptions de service liées à la maintenance, à des
                cas de force majeure ou à des défaillances de tiers (hébergeur,
                opérateurs).
              </li>
            </ul>
            <p>
              Booklia met en œuvre les meilleurs efforts pour assurer la
              disponibilité et la sécurité de la Plateforme, sans garantie de
              continuité absolue.
            </p>
          </Section>

          <Section title="12. Données personnelles">
            <p>
              Le traitement des données personnelles est encadré par la{' '}
              <a href="/legal/privacy" className="text-primary hover:underline">
                Politique de Confidentialité
              </a>
              , qui fait partie intégrante des présentes CGU.
            </p>
          </Section>

          <Section title="13. Modification des CGU">
            <p>
              Booklia se réserve le droit de modifier les présentes CGU à tout
              moment. Les utilisateurs sont informés des modifications par email ou
              via une notification sur la Plateforme. La poursuite de
              l’utilisation après modification vaut acceptation.
            </p>
          </Section>

          <Section title="14. Droit applicable et juridiction">
            <p>
              Les présentes CGU sont soumises au droit français. À défaut de
              résolution amiable, tout litige sera porté devant les tribunaux
              compétents du ressort du siège social de l’éditeur.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous
              écrire à :{' '}
              <a href="mailto:contact@booklia.org" className="text-primary hover:underline">
                contact@booklia.org
              </a>
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3">{title}</h2>
      <div className="text-sm sm:text-base text-foreground/80 space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
