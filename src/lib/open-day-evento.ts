/**
 * I dati dell'open day, tutti in un posto solo perché cambiano all'ultimo momento
 * e devono poterli cambiare anche senza leggere il resto del codice.
 */
export const EVENTO = {
  data: "martedì 27 ottobre 2026",
  dataBreve: "27 ottobre",
  ora: "16:30",
  /** Quando inizia davvero, per il conto alla rovescia e per il promemoria. */
  inizio: new Date("2026-10-27T16:30:00+01:00"),

  /**
   * Teams non si lascia incorporare in una pagina: blocca l'inserimento in iframe
   * e rimanda a teams.microsoft.com o all'app. Finché la piattaforma è questa, la
   * diretta è un bottone che porta fuori; se si passa a YouTube o Vimeo basta
   * mettere "incorporato" e l'indirizzo del lettore, e il video compare qui dentro.
   */
  diretta: {
    modo: "collegamento" as "collegamento" | "incorporato",
    piattaforma: "Microsoft Teams",
    /** Indirizzo della diretta. Vuoto = il bottone resta spento. */
    url: "",
  },

  /** I posti sono limitati davvero: la diretta si apre solo a chi si è registrato. */
  postiTotali: 300,

  /**
   * Da compilare prima di pubblicare: senza il titolare del trattamento indicato
   * per nome l'informativa non è valida, e qui si raccolgono dati di minorenni.
   */
  privacy: {
    /**
     * Qui va il nome con cui l'ente si presenta. Per l'informativa vera serve
     * però l'identificazione completa del titolare — ragione sociale, sede,
     * partita IVA o codice fiscale — che non è ancora stata fornita: finché
     * manca, l'informativa non è completa.
     */
    titolare: "Profor — ente di formazione",
    /** Indirizzo a cui si esercitano i diritti sui dati (accesso, cancellazione). */
    email: "DA DEFINIRE",
    urlInformativa: "",
  },
} as const;

/** Vero quando mancano ancora dati obbligatori: la pagina lo dice invece di
 *  fingere che sia tutto pronto. */
export function datiMancanti(): string[] {
  const mancano: string[] = [];
  if (!EVENTO.diretta.url) mancano.push("l'indirizzo della diretta");
  if (EVENTO.privacy.titolare === "DA DEFINIRE") mancano.push("il titolare del trattamento");
  if (EVENTO.privacy.email === "DA DEFINIRE") mancano.push("l'email per i diritti privacy");
  return mancano;
}
