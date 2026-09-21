import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

// Figtree per il testo, Bricolage Grotesque per titoli e numeri in evidenza.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profor - Simulatore Ufficiale",
  description: "Piattaforma per simulazioni dei test di ammissione alle Professioni Sanitarie",
  // Etichetta sotto l'icona quando il sito viene salvato sulla schermata iniziale
  // del telefono: lì lo spazio è poco e un titolo lungo verrebbe troncato.
  appleWebApp: { title: "Simulatore" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${figtree.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
