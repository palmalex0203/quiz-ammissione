import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENTO } from "@/lib/open-day-evento";

/*
 * L'immagine che compare quando il link dell'open day viene incollato su
 * WhatsApp, Instagram, Facebook o in una mail.
 *
 * Non è un vezzo: la pagina è sponsorizzata, e un link senza anteprima arriva
 * come una riga di testo grigia in mezzo a una chat. Chi lo riceve non capisce
 * di cosa si tratta e non lo apre — sono clic pagati e buttati.
 *
 * È disegnata qui e non è un file PNG messo in /public per un motivo pratico:
 * data, ora e titolo li prende da `open-day-evento.ts`, gli stessi della
 * pagina. Se si sposta l'evento, l'anteprima si aggiorna da sola invece di
 * restare indietro di un mese senza che nessuno se ne accorga.
 *
 * Il carattere è lo stesso dei titoli del sito, e sta in `assets/font/` dentro
 * il repository invece di essere scaricato mentre si compila: un giorno che
 * Google Fonts non risponde, il sito deve pubblicarsi lo stesso. Bricolage
 * Grotesque è sotto licenza SIL Open Font, che permette di tenerlo qui.
 */

export const alt = `${EVENTO.titoloGrande.riga1} — ${EVENTO.titoloGrande.riga2}, ${EVENTO.data}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* I colori sono scritti per esteso: qui non arrivano le variabili del foglio
   di stile, e l'immagine è una sola — non ha un tema chiaro e uno scuro. */
const SFONDO = "#fffaf6";
const ARANCIO = "#bd420c";
const INCHIOSTRO = "#2a1d14";
const SMORZATO = "#6b584b";

export default async function Image() {
  const quando = `${EVENTO.dataBreve}, ore ${EVENTO.ora}`;
  const logo = await readFile(join(process.cwd(), "public", "profor-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const carattere = await readFile(join(process.cwd(), "assets", "font", "BricolageGrotesque-ExtraBold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: SFONDO,
          fontFamily: "Bricolage",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 72px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={251} height={84} />

          <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
            <div
              style={{
                fontSize: 104,
                fontWeight: 800,
                color: ARANCIO,
                lineHeight: 1,
                letterSpacing: -4,
              }}
            >
              {EVENTO.titoloGrande.riga1}
            </div>
            <div
              style={{
                fontSize: 104,
                fontWeight: 800,
                color: INCHIOSTRO,
                lineHeight: 1,
                letterSpacing: -4,
              }}
            >
              {EVENTO.titoloGrande.riga2}
            </div>
          </div>

          <div style={{ fontSize: 40, fontWeight: 600, color: SMORZATO, marginTop: 30 }}>
            {EVENTO.slogan}
          </div>
        </div>

        {/* La striscia scura in fondo: le tre cose che servono per decidere se
            aprire il link — quando, che è in diretta, che non si paga. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            background: INCHIOSTRO,
            color: SFONDO,
            padding: "28px 72px",
            fontSize: 30,
          }}
        >
          {/* Una stringa sola e non tre pezzi: Satori pretende
              display:flex da qualunque riquadro con più di un figlio, e qui
              il riquadro è solo una riga di testo. */}
          <div style={{ fontWeight: 700 }}>{quando}</div>
          <div style={{ opacity: 0.45 }}>·</div>
          <div>In diretta</div>
          <div style={{ opacity: 0.45 }}>·</div>
          <div>Simulazione ufficiale gratuita</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Bricolage", data: carattere, style: "normal", weight: 800 }],
    }
  );
}
