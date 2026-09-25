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
  return marked.parse(source.replace(/</g, "&lt;"), { async: false });
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
