import type { Metadata, Viewport } from "next";
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
  description:
    "Simulazioni ed esercitazioni per i test di ammissione: Professioni Sanitarie e Semestre filtro",
  applicationName: "Simulatore",
  // Installato sulla schermata iniziale dell'iPhone: si apre a tutto schermo e
  // l'etichetta sotto l'icona è corta, perché lì lo spazio è poco.
  appleWebApp: { capable: true, title: "Simulatore", statusBarStyle: "default" },
};

// Tinta della barra di stato quando l'app è aperta a tutto schermo: uguale alla
// barra in alto della pagina, così le due non si vedono attaccate.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1813" },
  ],
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
