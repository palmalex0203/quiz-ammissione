/*
 * I test generati prendono un titolo con la data attaccata in fondo:
 * "Ripasso errori - 07/10/2026, 19:06". Va bene per distinguerli nel database,
 * ma messo così com'è nell'intestazione di una pagina diventa un titolo in
 * carattere grande per metà fatto di cifre, e nelle liste strette la data —
 * cioè l'unica cosa che distingue due righe uguali — è proprio quella che il
 * troncamento mangia per prima.
 *
 * Qui il titolo si separa in nome e momento, così ogni pagina decide dove
 * metterli. I titoli scritti a mano dal docente non hanno la data in coda e
 * tornano indietro interi.
 */
const CODA_CON_DATA = /^(.*) - (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}(?::\d{2})?)$/;

export type TitoloTest = { nome: string; quando: string | null };

export function titoloTest(titolo: string): TitoloTest {
  const trovato = CODA_CON_DATA.exec(titolo.trim());
  if (!trovato) return { nome: titolo, quando: null };
  return { nome: trovato[1], quando: trovato[2] };
}
