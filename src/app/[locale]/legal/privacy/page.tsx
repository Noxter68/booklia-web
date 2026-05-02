import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Booklia',
  description:
    'Politique de confidentialité et traitement des données personnelles sur la plateforme Booklia.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : 2 mai 2026
          </p>
        </header>

        <article className="prose prose-sm sm:prose-base max-w-none">
          <Section title="1. Préambule">
            <p>
              Booklia attache une importance fondamentale à la protection des
              données personnelles de ses utilisateurs. La présente politique
              décrit comment nous collectons, utilisons et protégeons ces
              données, dans le respect du Règlement Général sur la Protection des
              Données (RGPD — Règlement UE 2016/679) et de la loi française
              Informatique et Libertés.
            </p>
          </Section>

          <Section title="2. Responsable du traitement">
            <p>
              Le responsable du traitement des données est :
            </p>
            <p>
              <strong>David Planchon</strong>, micro-entrepreneur
              <br />
              Bartenheim, Alsace, France
              <br />
              Email :{' '}
              <a href="mailto:contact@booklia.org" className="text-primary hover:underline">
                contact@booklia.org
              </a>
            </p>
          </Section>

          <Section title="3. Données collectées">
            <p>Nous collectons uniquement les données nécessaires au fonctionnement de la Plateforme :</p>
            <p>
              <strong>Données de compte (Clients & Pros) :</strong>
            </p>
            <ul>
              <li>Nom, prénom</li>
              <li>Adresse email</li>
              <li>Mot de passe (chiffré et jamais stocké en clair)</li>
              <li>Date de naissance (Clients uniquement)</li>
              <li>Préférence de langue</li>
            </ul>
            <p>
              <strong>Données métier (Pros) :</strong>
            </p>
            <ul>
              <li>Nom de l’établissement, adresse, téléphone</li>
              <li>Catalogue de prestations, tarifs, horaires</li>
              <li>Informations de facturation (raison sociale, SIRET, TVA)</li>
              <li>Informations comptables saisies par le Pro</li>
            </ul>
            <p>
              <strong>Données métier (Clients) :</strong>
            </p>
            <ul>
              <li>Téléphone, adresse (facultatifs)</li>
              <li>Historique des rendez-vous et notes éventuelles du Pro</li>
            </ul>
            <p>
              <strong>Données techniques :</strong>
            </p>
            <ul>
              <li>Adresse IP, journaux serveur (à des fins de sécurité et debug)</li>
              <li>Identifiants de session (authentification)</li>
            </ul>
            <p>
              Booklia <strong>n’utilise pas d’outils d’analytics</strong>{' '}
              (Google Analytics, Meta Pixel, etc.) à ce jour. Si cela évolue,
              cette politique sera mise à jour et le consentement adéquat sera
              demandé.
            </p>
          </Section>

          <Section title="4. Finalités du traitement">
            <p>Vos données sont utilisées pour :</p>
            <ul>
              <li>Créer et gérer votre compte</li>
              <li>Permettre la prise et la gestion de rendez-vous</li>
              <li>Permettre aux Pros de gérer leur activité (clients, factures, comptabilité)</li>
              <li>Vous envoyer les emails essentiels au service (confirmation, rappel, modification de RDV)</li>
              <li>Assurer la sécurité de la Plateforme et prévenir la fraude</li>
              <li>Répondre à vos demandes de support</li>
            </ul>
            <p>
              <strong>Aucune donnée n’est utilisée à des fins commerciales ou
              publicitaires</strong>, et aucune donnée n’est revendue à des tiers.
            </p>
          </Section>

          <Section title="5. Base légale">
            <p>Les traitements sont fondés sur :</p>
            <ul>
              <li>
                <strong>L’exécution du contrat :</strong> pour tout ce qui est
                nécessaire au fonctionnement du compte et des rendez-vous.
              </li>
              <li>
                <strong>L’intérêt légitime :</strong> pour la sécurité, la
                prévention de la fraude et l’amélioration du service.
              </li>
              <li>
                <strong>L’obligation légale :</strong> pour la conservation des
                données comptables et fiscales.
              </li>
            </ul>
          </Section>

          <Section title="6. Destinataires des données">
            <p>
              Vos données sont accessibles uniquement aux personnes habilitées
              chez Booklia et à nos sous-traitants techniques :
            </p>
            <ul>
              <li>
                <strong>Vercel</strong> (hébergement frontend, USA — DPA & SCC en
                vigueur)
              </li>
              <li>
                <strong>Railway</strong> (hébergement backend & base de données,
                USA — DPA & SCC en vigueur)
              </li>
              <li>
                <strong>Resend</strong> (envoi des emails transactionnels)
              </li>
            </ul>
            <p>
              Aucun transfert de données n’est réalisé en dehors de ce cadre
              technique strict.
            </p>
          </Section>

          <Section title="7. Durée de conservation">
            <p>
              <strong>Compte actif :</strong> vos données sont conservées tant
              que votre compte est actif.
            </p>
            <p>
              <strong>Après suppression du compte :</strong> vos données
              personnelles sont effacées sous 30 jours, à l’exception des
              données de facturation conservées pendant 10 ans pour répondre aux
              obligations comptables et fiscales (Code de commerce, art. L123-22).
            </p>
            <p>
              <strong>Logs techniques :</strong> conservés 12 mois maximum.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Booklia utilise uniquement des <strong>cookies strictement
              nécessaires</strong> au fonctionnement du service (authentification,
              préférences). Aucun cookie publicitaire ou de mesure d’audience
              n’est déposé sans votre consentement explicite.
            </p>
            <p>
              Si nous ajoutons à l’avenir des outils nécessitant des cookies
              additionnels (ex : Sentry pour la surveillance des erreurs), un
              bandeau de consentement vous sera présenté pour accepter ou
              refuser ces dépôts.
            </p>
          </Section>

          <Section title="9. Vos droits">
            <p>
              Conformément au RGPD, vous disposez des droits suivants sur vos
              données personnelles :
            </p>
            <ul>
              <li>
                <strong>Droit d’accès :</strong> obtenir une copie de vos
                données.
              </li>
              <li>
                <strong>Droit de rectification :</strong> corriger des données
                inexactes.
              </li>
              <li>
                <strong>Droit à l’effacement :</strong> demander la suppression
                de vos données (sauf obligations légales contraires).
              </li>
              <li>
                <strong>Droit d’opposition :</strong> vous opposer à un
                traitement fondé sur l’intérêt légitime.
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> récupérer vos données
                dans un format structuré.
              </li>
              <li>
                <strong>Droit à la limitation du traitement.</strong>
              </li>
              <li>
                <strong>Droit de retirer votre consentement</strong> à tout
                moment, sans remettre en cause la licéité des traitements
                antérieurs.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez-nous à :{' '}
              <a href="mailto:contact@booklia.org" className="text-primary hover:underline">
                contact@booklia.org
              </a>
              . Nous répondons dans un délai maximum d’un mois.
            </p>
            <p>
              En cas de désaccord, vous pouvez introduire une réclamation auprès
              de la CNIL :{' '}
              <a
                href="https://www.cnil.fr/fr/plaintes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.cnil.fr/fr/plaintes
              </a>
              .
            </p>
          </Section>

          <Section title="10. Sécurité">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données : chiffrement TLS de toutes
              les communications, hash des mots de passe (bcrypt), accès
              restreint aux données, sauvegardes régulières.
            </p>
          </Section>

          <Section title="11. Modifications">
            <p>
              La présente politique peut être modifiée pour s’adapter aux
              évolutions du service ou de la réglementation. La version en
              vigueur est toujours accessible à cette adresse, avec la date de
              dernière mise à jour mentionnée en tête.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Pour toute question relative à vos données personnelles :{' '}
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
