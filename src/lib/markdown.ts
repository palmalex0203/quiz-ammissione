import { marked } from "marked";

marked.use({ gfm: true });

/**
 * Trasforma in HTML il markdown degli appunti.
 *
 * Prima di passarlo al convertitore si neutralizza il carattere "<": gli appunti
 * non contengono HTML, e così non può entrarne nemmeno per sbaglio o per copia e
 * incolla da una pagina web. Il ">" resta intatto, altrimenti si romperebbero le
 * citazioni in blocco, che negli appunti sono i riquadri "Cosa ti chiedono".
 */
export function renderMarkdown(source: string): string {
  const html = marked.parse(source.replace(/</g, "&lt;"), { async: false });

  // Una tabella di quattro colonne non ci sta in un telefono: invece di schiacciarla
  // o di far scorrere tutta la pagina di lato, la si chiude in un riquadro che
  // scorre per conto suo.
  return ancoraTitoli(html)
    .replace(/<table>/g, '<div class="prose-table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

/**
 * Un'ancora per ogni capitolo, ricavata dal titolo.
 *
 * Il convertitore non le mette: senza, l'indice laterale non avrebbe un posto
 * dove saltare. Si usa il testo del titolo e non un contatore, così il
 * collegamento resta valido anche se un capitolo viene spostato — e cambia solo
 * se viene riscritto, che è il momento in cui è giusto che cambi.
 */
function ancoraTitoli(html: string): string {
  const usati = new Map<string, number>();

  return html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_intero, contenuto: string) => {
    const base = ancora(testoSemplice(contenuto));
    const visto = usati.get(base) ?? 0;
    usati.set(base, visto + 1);
    // Due capitoli con lo stesso titolo non devono avere la stessa ancora:
    // il secondo diventa "titolo-2".
    const id = visto === 0 ? base : `${base}-${visto + 1}`;
    return `<h2 id="${id}">${contenuto}</h2>`;
  });
}

const testoSemplice = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

/** Da "3. Il Sistema Internazionale" a "3-il-sistema-internazionale". */
function ancora(testo: string): string {
  return (
    testo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "capitolo"
  );
}

export type VoceIndice = { id: string; titolo: string };

/**
 * I capitoli di un appunto già convertito, per l'indice laterale. Si leggono
 * dall'HTML e non dal markdown, così le ancore sono per forza le stesse che
 * stanno nella pagina.
 */
export function indiceDi(html: string): VoceIndice[] {
  const voci: VoceIndice[] = [];
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    voci.push({ id: m[1], titolo: testoSemplice(m[2]) });
  }
  return voci;
}

// Prima riga utile del testo, per l'anteprima nell'elenco.
export function excerpt(source: string, max = 160): string {
  const line = source
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith("**Indice**"));
  if (!line) return "";
  const plain = line.replace(/[*_`>#]/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}
