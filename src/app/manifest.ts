import type { MetadataRoute } from "next";

/*
 * Rende il simulatore installabile sulla schermata iniziale del telefono: icona
 * propria e apertura a tutto schermo, senza la barra degli indirizzi.
 *
 * start_url è "/" perché la pagina iniziale smista già da sola: chi non ha fatto
 * l'accesso finisce sul login, gli altri nella loro area.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Profor — Simulatore Ufficiale",
    // Sotto l'icona lo spazio è poco: un nome lungo verrebbe troncato.
    short_name: "Simulatore",
    description:
      "Simulazioni ed esercitazioni per i test di ammissione: Professioni Sanitarie e Semestre filtro.",
    lang: "it",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf6",
    theme_color: "#ffffff",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android ritaglia l'icona in una forma sua: questa ha il marchio più piccolo
      // e il fondo esteso, così non ne taglia via i bordi.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
