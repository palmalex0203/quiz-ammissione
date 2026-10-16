"use server";

/**
 * Le scritture della pagina pubblica dell'open day.
 *
 * Il principio che guida tutto: **il contatto si salva prima che succeda
 * qualunque altra cosa**. Chi lascia nome, telefono ed email è già un contatto
 * utile, anche se poi non si iscrive, anche se molla la simulazione alla
 * quinta domanda su novantatré. Chi abbandona a metà è anzi quello da
 * richiamare per primo, perché ha provato ed è rimasto a bocca asciutta.
 *
 * Attenzione: queste funzioni sono raggiungibili con una POST diretta, non solo
 * dai moduli della pagina, e qui non c'è nessun login a fare da filtro — la
 * pagina è pubblica apposta. Quindi ogni campo si convalida e si tronca.
 */

import { prisma } from "@/lib/prisma";
import { appelloValido, correggi, type Esito, type RispostaData, TOTALE } from "@/lib/openday";

const MAX = { nome: 80, email: 160, telefono: 30, utm: 120, testo: 40 };

function pulisci(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ").slice(0, max);
  return t.length > 0 ? t : null;
}

// Controllo volutamente permissivo: serve a scartare gli errori di battitura,
// non a decidere chi ha un indirizzo valido.
function emailValida(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
}

function guasto(dove: string, e: unknown): string {
  console.error(`[openday] ${dove}:`, e);
  return "Qualcosa non ha funzionato dalla nostra parte. Riprova fra un attimo.";
}

type Anagrafica = {
  nome: unknown;
  email: unknown;
  telefono: unknown;
  utm?: { source?: unknown; medium?: unknown; campaign?: unknown };
};

type Pulita = { nome: string; email: string; telefono: string | null; utm: Record<string, string | null> };

function convalida(dati: Anagrafica): Pulita | string {
  const nome = pulisci(dati.nome, MAX.nome);
  const email = pulisci(dati.email, MAX.email)?.toLowerCase() ?? null;
  const telefono = pulisci(dati.telefono, MAX.telefono);

  if (!nome) return "Manca il nome.";
  if (!email || !emailValida(email)) return "L'indirizzo email non sembra giusto.";

  return {
    nome,
    email,
    telefono,
    utm: {
      utmSource: pulisci(dati.utm?.source, MAX.utm),
      utmMedium: pulisci(dati.utm?.medium, MAX.utm),
      utmCampaign: pulisci(dati.utm?.campaign, MAX.utm),
    },
  };
}

export type RisultatoIscrizione = { ok: true; leadId: string; postiRimasti: number } | { ok: false; errore: string };

/**
 * Chi si iscrive all'open day. Il posto è assegnato subito: il contatto c'è,
 * e il resto sono dettagli che si possono chiedere dopo.
 */
export async function iscrivitiAllOpenDay(dati: Anagrafica, postiTotali: number): Promise<RisultatoIscrizione> {
  const d = convalida(dati);
  if (typeof d === "string") return { ok: false, errore: d };

  try {
    const lead = await prisma.lead.upsert({
      where: { email: d.email },
      create: {
        nome: d.nome,
        email: d.email,
        telefono: d.telefono,
        percorso: "SEMESTRE_FILTRO",
        postoDiretta: true,
        postoDirettaIl: new Date(),
        ...d.utm,
      },
      // Un telefono vuoto non cancella quello che la persona aveva già lasciato.
      update: {
        nome: d.nome,
        postoDiretta: true,
        postoDirettaIl: new Date(),
        ...(d.telefono ? { telefono: d.telefono } : {}),
      },
      select: { id: true },
    });

    const presi = await prisma.lead.count({ where: { postoDiretta: true } });
    return { ok: true, leadId: lead.id, postiRimasti: Math.max(0, postiTotali - presi) };
  } catch (e) {
    return { ok: false, errore: guasto("iscrizione", e) };
  }
}

export type RisultatoAvvio = { ok: true; leadId: string } | { ok: false; errore: string };

/**
 * Chi comincia la simulazione. Il contatto si scrive **adesso**, prima della
 * prima domanda: sono 93 domande e più di due ore, e la maggior parte non
 * arriverà in fondo. Se aspettassimo la consegna perderemmo proprio loro.
 */
export async function iniziaSimulazione(dati: Anagrafica, appello: unknown): Promise<RisultatoAvvio> {
  const d = convalida(dati);
  if (typeof d === "string") return { ok: false, errore: d };
  if (!appelloValido(appello)) return { ok: false, errore: "Prova non valida." };

  try {
    const lead = await prisma.lead.upsert({
      where: { email: d.email },
      create: {
        nome: d.nome,
        email: d.email,
        telefono: d.telefono,
        percorso: "SEMESTRE_FILTRO",
        simulazioneIniziataIl: new Date(),
        ...d.utm,
      },
      // Chi rifà la simulazione riparte: la data dell'ultimo avvio è quella che
      // interessa, e il punteggio vecchio non va tenuto accanto a una prova nuova.
      update: {
        nome: d.nome,
        simulazioneIniziataIl: new Date(),
        completataIl: null,
        punteggio: null,
        risposte: undefined,
        ...(d.telefono ? { telefono: d.telefono } : {}),
      },
      select: { id: true },
    });

    return { ok: true, leadId: lead.id };
  } catch (e) {
    return { ok: false, errore: guasto("avvio simulazione", e) };
  }
}

export type RisultatoPrenotazione =
  | { ok: true; giaPrenotato: boolean; postiRimasti: number }
  | { ok: false; errore: string };

/**
 * Il posto all'open day preso con un clic da chi ha appena finito la prova.
 *
 * I dati li ha già lasciati prima di cominciare, quindi non c'è niente da
 * chiedere di nuovo: rimettere davanti un modulo con gli stessi tre campi, a
 * una persona che ha appena fatto due ore di esame, è il modo migliore per
 * perderla. Qui si aggiorna la riga che esiste già.
 *
 * È idempotente: chi era già iscritto non perde il posto né lo prende due
 * volte, e la risposta dice quale dei due casi era.
 */
export async function prenotaDopoLaProva(
  leadId: unknown,
  postiTotali: unknown
): Promise<RisultatoPrenotazione> {
  const id = pulisci(leadId, 40);
  if (!id) return { ok: false, errore: "Registrazione non trovata." };

  // Arriva dal browser, quindi non ci si fida: serve solo a scrivere quanti
  // posti restano, non a decidere se darne uno.
  const totali = typeof postiTotali === "number" && Number.isFinite(postiTotali) ? postiTotali : 0;

  try {
    const prima = await prisma.lead.findUnique({ where: { id }, select: { postoDiretta: true } });
    if (!prima) return { ok: false, errore: "Registrazione non trovata." };

    if (!prima.postoDiretta) {
      await prisma.lead.update({
        where: { id },
        data: { postoDiretta: true, postoDirettaIl: new Date() },
      });
    }

    const presi = await prisma.lead.count({ where: { postoDiretta: true } });
    return {
      ok: true,
      giaPrenotato: prima.postoDiretta,
      postiRimasti: Math.max(0, totali - presi),
    };
  } catch (e) {
    return { ok: false, errore: guasto("prenotazione dopo la prova", e) };
  }
}

export type RisultatoConsegna = { ok: true; esito: Esito } | { ok: false; errore: string };

export async function consegna(
  leadId: unknown,
  appello: unknown,
  risposte: unknown
): Promise<RisultatoConsegna> {
  const id = pulisci(leadId, 40);
  if (!id) return { ok: false, errore: "Registrazione non trovata." };
  if (!appelloValido(appello)) return { ok: false, errore: "Prova non valida." };
  if (!Array.isArray(risposte) || risposte.length > TOTALE) {
    return { ok: false, errore: "Risposte non valide." };
  }

  const pulite: RispostaData[] = [];
  for (const r of risposte) {
    const questionId = pulisci((r as RispostaData)?.questionId, 60);
    if (!questionId) continue;
    pulite.push({
      questionId,
      optionId: pulisci((r as RispostaData)?.optionId, 60),
      testo: pulisci((r as RispostaData)?.testo, MAX.testo),
    });
  }

  // La correzione non dipende dal database: si fa prima, così resta valida
  // anche se il salvataggio va storto.
  const esito = correggi(appello, pulite);

  try {
    await prisma.lead.update({
      where: { id },
      data: {
        completataIl: new Date(),
        punteggio: esito.punti,
        risposte: { appello, prove: esito.prove },
      },
    });
  } catch (e) {
    // Il risultato si mostra lo stesso: chi ha appena svolto due ore di prova
    // non deve perderla per un intoppo nostro, e il contatto ce l'abbiamo già
    // dall'avvio.
    guasto("consegna", e);
  }

  return { ok: true, esito };
}
