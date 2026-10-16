/**
 * I dati dell'open day, tutti in un posto solo perché cambiano all'ultimo momento
 * e devono poterli cambiare anche senza leggere il resto del codice.
 */
/** Segnaposto dei dati che mancano ancora. Chi compila li sostituisce. */
const DA_DEFINIRE = "DA DEFINIRE";

type Privacy = { titolare: string; email: string; urlInformativa: string };

const PRIVACY: Privacy = {
  /**
   * Il nome con cui l'ente si presenta. Per l'informativa vera serve però
   * l'identificazione completa del titolare — ragione sociale, sede, partita
   * IVA o codice fiscale — che non è ancora stata fornita.
   */
  titolare: "Profor — ente di formazione",
  /** Indirizzo a cui si esercitano i diritti sui dati (accesso, cancellazione). */
  email: "proforentediformazione@gmail.com",
  urlInformativa: "",
};

export const EVENTO = {
  titolo: "Open day — Preparazione al semestre filtro",
  /**
   * Il titolo grande della pagina, spezzato in due righe perché è così che va
   * composto: il tipo di evento sopra, di cosa parla sotto, tutti e due grossi.
   */
  titoloGrande: { riga1: "Open day", riga2: "Semestre filtro" },
  /** La frase che apre la pagina. Deve dire una cosa vera, non incoraggiare. */
  slogan: "Nessuno lo supera per caso.",
  data: "martedì 27 ottobre 2026",
  dataBreve: "27 ottobre",
  ora: "16:30",
  durata: "due ore",
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
    /**
     * Vuoto **per scelta**: il collegamento non va in pagina. Lo mandiamo noi
     * a chi si è prenotato, per email e su WhatsApp. Un indirizzo di riunione
     * scritto su una pagina pubblica se lo prende chiunque passi di lì, e chi
     * entra senza essersi registrato occupa un posto senza lasciare un nome.
     * Se un giorno la diretta diventa aperta a tutti, basta metterlo qui e il
     * bottone "Entra nella diretta" si riaccende da solo.
     */
    url: "",
  },

  /**
   * Il recapito per chi non vuole né prenotarsi né fare la prova adesso: ha una
   * domanda sul corso e vuole che gli risponda una persona.
   */
  whatsapp: {
    /** Come si scrive per chi lo legge. */
    numero: "+39 081 18549192",
    /** Solo cifre col prefisso internazionale: è il formato che vuole wa.me. */
    cifre: "3908118549192",
    /** Il messaggio già pronto nella chat, così sappiamo da dove arriva. */
    messaggio: "Ciao! Vorrei informazioni sul corso di preparazione al semestre filtro.",
  },

  /** I posti sono limitati davvero: la diretta si apre solo a chi si è registrato. */
  postiTotali: 300,

  /**
   * Da compilare prima di pubblicare: senza il titolare del trattamento indicato
   * per nome l'informativa non è valida, e qui si raccolgono dati di minorenni.
   */
  privacy: PRIVACY,
} as const;

/** Vero quando mancano ancora dati obbligatori: la pagina lo dice invece di
 *  fingere che sia tutto pronto. */
export function datiMancanti(): string[] {
  const mancano: string[] = [];
  // L'indirizzo della diretta non è fra questi: non va in pagina per scelta,
  // vedi il commento su `diretta.url`.
  if (EVENTO.privacy.titolare === DA_DEFINIRE) mancano.push("il titolare del trattamento");
  if (EVENTO.privacy.email === DA_DEFINIRE) mancano.push("l'email per i diritti privacy");
  return mancano;
}
