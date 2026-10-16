import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";

/**
 * I contatti dell'open day in CSV, per portarli altrove: un foglio di calcolo,
 * un gestionale, una lista da chiamare.
 *
 * Protetto come tutte le pagine dell'insegnante: `requireTeacher` rimanda al
 * login chi non lo è. Sono dati personali di studenti, in buona parte
 * minorenni — un indirizzo che li restituisce in chiaro senza controllo
 * sarebbe la fuga di dati più banale che esista.
 */

/** Una cella di CSV. Le virgolette raddoppiate, perché è così che si scappano. */
function cella(v: unknown): string {
  if (v === null || v === undefined) return "";
  const t = String(v);
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

const giorno = (d: Date | null) => (d ? d.toLocaleString("it-IT") : "");

export async function GET() {
  await requireTeacher();

  const contatti = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      nome: true,
      email: true,
      telefono: true,
      createdAt: true,
      postoDiretta: true,
      simulazioneIniziataIl: true,
      completataIl: true,
      punteggio: true,
      consensoMarketing: true,
      scuola: true,
      anno: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
    },
  });

  const intestazione = [
    "Nome",
    "Email",
    "Telefono",
    "Lasciato il",
    "Iscritto alla diretta",
    "Simulazione iniziata",
    "Simulazione finita",
    "Punteggio",
    "Consenso marketing",
    "Scuola",
    "Anno",
    "Sorgente",
    "Mezzo",
    "Campagna",
  ];

  const righe = contatti.map((c) =>
    [
      c.nome,
      c.email,
      c.telefono,
      giorno(c.createdAt),
      c.postoDiretta ? "sì" : "no",
      giorno(c.simulazioneIniziataIl),
      giorno(c.completataIl),
      c.punteggio ?? "",
      c.consensoMarketing ? "sì" : "no",
      c.scuola,
      c.anno,
      c.utmSource,
      c.utmMedium,
      c.utmCampaign,
    ].map(cella).join(";")
  );

  // Punto e virgola come separatore e BOM in testa: è quello che serve perché
  // Excel in italiano apra il file nelle colonne giuste invece di ammucchiare
  // tutto nella prima, e perché le lettere accentate non si rompano.
  const csv = "﻿" + [intestazione.join(";"), ...righe].join("\r\n");
  const oggi = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="contatti-open-day-${oggi}.csv"`,
      // Sono dati personali: non devono restare in nessuna cache lungo la strada.
      "cache-control": "no-store",
    },
  });
}
