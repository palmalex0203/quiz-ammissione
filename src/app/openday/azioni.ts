"use server";

/**
 * Le tre scritture della pagina pubblica dell'open day.
 *
 * Attenzione: queste funzioni sono raggiungibili con una POST diretta, non solo
 * dai moduli della pagina, e qui non c'è nessun login a fare da filtro — la
 * pagina è pubblica apposta. Quindi ogni campo si convalida e si tronca, e non si
 * accetta niente che arrivi dal browser senza guardarlo.
 */

import { prisma } from "@/lib/prisma";
import { correggi, type Esito, type RispostaData, TOTALE } from "@/lib/openday";

const MAX = { nome: 80, email: 160, telefono: 30, scuola: 120, anno: 40, utm: 120 };

/**
 * Un guasto del database non deve arrivare al browser come eccezione: il
 * componente resterebbe in attesa per sempre, col bottone bloccato su "un
 * attimo". Qui si registra l'errore vero nei log del server e si restituisce una
 * frase che una persona può leggere.
 */
function guasto(dove: string, e: unknown): string {
  console.error(`[openday] ${dove}:`, e);
  return "Qualcosa non ha funzionato dalla nostra parte. Riprova fra un attimo.";
}

function pulisci(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ").slice(0, max);
  return t.length > 0 ? t : null;
}

// Controllo volutamente permissivo: serve a scartare gli errori di battitura, non
// a decidere chi ha un indirizzo valido. Le liste di domini ammessi fanno più
// danni che altro.
function emailValida(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
}

export type RisultatoRegistrazione = { ok: true; leadId: string } | { ok: false; errore: string };

export async function registra(dati: {
  nome: unknown;
  email: unknown;
  percorso: unknown;
  utm?: { source?: unknown; medium?: unknown; campaign?: unknown };
}): Promise<RisultatoRegistrazione> {
  const nome = pulisci(dati.nome, MAX.nome);
  const email = pulisci(dati.email, MAX.email)?.toLowerCase() ?? null;
  const percorso = dati.percorso === "SEMESTRE_FILTRO" ? "SEMESTRE_FILTRO" : "PROFESSIONI_SANITARIE";

  if (!nome) return { ok: false, errore: "Manca il nome." };
  if (!email || !emailValida(email)) return { ok: false, errore: "L'indirizzo email non sembra giusto." };

  const utm = {
    utmSource: pulisci(dati.utm?.source, MAX.utm),
    utmMedium: pulisci(dati.utm?.medium, MAX.utm),
    utmCampaign: pulisci(dati.utm?.campaign, MAX.utm),
  };

  try {
    // Chi torna una seconda volta non crea un doppione: aggiorna la sua riga. I
    // dati della campagna si scrivono solo la prima volta, altrimenti l'ultima
    // visita cancellerebbe l'inserzione che l'aveva portato qui davvero.
    const lead = await prisma.lead.upsert({
      where: { email },
      create: { nome, email, percorso, ...utm },
      update: { nome, percorso },
      select: { id: true },
    });
    return { ok: true, leadId: lead.id };
  } catch (e) {
    return { ok: false, errore: guasto("registra", e) };
  }
}

export type RisultatoConsegna = { ok: true; esito: Esito } | { ok: false; errore: string };

export async function consegna(leadId: unknown, risposte: unknown): Promise<RisultatoConsegna> {
  const id = pulisci(leadId, 40);
  if (!id) return { ok: false, errore: "Registrazione non trovata." };
  if (!Array.isArray(risposte) || risposte.length === 0 || risposte.length > TOTALE) {
    return { ok: false, errore: "Risposte non valide." };
  }

  const pulite: RispostaData[] = [];
  for (const r of risposte) {
    const questionId = pulisci((r as RispostaData)?.questionId, 60);
    const optionId = pulisci((r as RispostaData)?.optionId, 60);
    if (questionId) pulite.push({ questionId, optionId });
  }
  if (pulite.length === 0) return { ok: false, errore: "Risposte non valide." };

  // La correzione non dipende dal database: si fa prima, così resta valida anche
  // se il salvataggio va storto.
  const esito = correggi(pulite);

  try {
    await prisma.lead.update({
      where: { id },
      data: {
        completataIl: new Date(),
        punteggio: esito.punti,
        risposte: esito.dettaglio,
      },
    });
  } catch (e) {
    // Il risultato si mostra lo stesso. Chi ha appena svolto dodici domande non
    // deve perderle per un intoppo nostro, e il contatto ce l'abbiamo già dal
    // primo passaggio: si perde il punteggio, non la persona.
    guasto("consegna", e);
  }

  return { ok: true, esito };
}

export type RisultatoProfilo = { ok: true; postiRimasti: number } | { ok: false; errore: string };

export async function completaProfilo(
  leadId: unknown,
  dati: {
    telefono?: unknown;
    scuola?: unknown;
    anno?: unknown;
    consensoMarketing?: unknown;
    postoDiretta?: unknown;
  },
  postiTotali: number
): Promise<RisultatoProfilo> {
  const id = pulisci(leadId, 40);
  if (!id) return { ok: false, errore: "Registrazione non trovata." };

  const consenso = dati.consensoMarketing === true;
  const posto = dati.postoDiretta === true;

  try {
    await prisma.lead.update({
      where: { id },
      data: {
        telefono: pulisci(dati.telefono, MAX.telefono),
        scuola: pulisci(dati.scuola, MAX.scuola),
        anno: pulisci(dati.anno, MAX.anno),
        consensoMarketing: consenso,
        consensoIl: consenso ? new Date() : null,
        postoDiretta: posto,
        postoDirettaIl: posto ? new Date() : null,
      },
    });

    const presi = await prisma.lead.count({ where: { postoDiretta: true } });
    return { ok: true, postiRimasti: Math.max(0, postiTotali - presi) };
  } catch (e) {
    return { ok: false, errore: guasto("completaProfilo", e) };
  }
}
