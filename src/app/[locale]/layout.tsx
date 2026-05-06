import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import "../globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Booklia — L'app tout-en-un pour les indépendants",
    template: "%s | Booklia",
  },
  description:
    "Réservations, fiches clients, factures, comptabilité — Booklia centralise tout ce dont les indépendants et petites équipes ont besoin pour gérer leur activité au quotidien.",
  keywords: [
    "logiciel réservation",
    "agenda en ligne",
    "prise de rendez-vous",
    "gestion de rendez-vous",
    "logiciel esthétique",
    "logiciel coiffure",
    "comptabilité auto-entrepreneur",
    "booking software",
    "SaaS réservation",
    "Booklia",
  ],
  authors: [{ name: "Booklia" }],
  creator: "Booklia",
  metadataBase: new URL("https://booklia.org"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://booklia.org",
    siteName: "Booklia",
    title: "Booklia — L'app tout-en-un pour les indépendants",
    description:
      "Réservations, fiches clients, factures, comptabilité — tout centralisé pour gérer ton activité au quotidien.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Booklia — L'app tout-en-un pour les indépendants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Booklia — L'app tout-en-un pour les indépendants",
    description:
      "Réservations, fiches clients, factures, comptabilité — tout centralisé pour gérer ton activité au quotidien.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ConditionalLayout>{children}</ConditionalLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
