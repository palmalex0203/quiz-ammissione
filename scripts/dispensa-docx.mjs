/**
 * Converte una dispensa in Word (.docx) nel markdown degli appunti.
 *
 * Le dispense del docente sono scritte in Word con titoli, tabelle, riquadri
 * colorati («Concetto chiave», «Attenzione all'esame»…) e figure. Il sito legge
 * gli appunti in markdown, quindi qui si traduce:
 *
 *   Titolo 1 / 2 / 3          → ## / ### / ####
 *   elenchi                   → - oppure 1.
 *   grassetto, corsivo        → **…**, *…*
 *   apici e pedici            → caratteri Unicode (10⁻³, CO₂)
 *   tabella a una colonna     → riquadro (citazione con l'etichetta in grassetto)
 *   tabella a più colonne     → tabella markdown
 *   immagine                  → file in public/appunti/<cartella>/ e ![testo](…)
 *
 * Tutto quello che precede il primo Titolo 1 (la copertina) e l'indice di Word
 * vengono saltati: la pagina dell'appunto ha già titolo e indice suoi.
 *
 * Il risultato va riletto: è un punto di partenza, non un file da caricare alla
 * cieca. La testata (codice, percorso, materia, titolo) si aggiunge a mano.
 *
 * Uso:
 *   node scripts/dispensa-docx.mjs <cartella-docx-estratta> <cartella-immagini> > appunto.md
 *     <cartella-docx-estratta>  il .docx già decompresso (è uno zip)
 *     <cartella-immagini>       es. sf-bio-01-l01 → public/appunti/sf-bio-01-l01/
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [radice, cartellaImmagini] = process.argv.slice(2);
if (!radice || !cartellaImmagini) {
  console.error("Uso: node scripts/dispensa-docx.mjs <docx-estratto> <cartella-immagini>");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Un lettore XML minimo: basta per il documento di Word, che è XML regolare.
// ---------------------------------------------------------------------------
function parseXml(xml) {
  const radice = { name: "#root", attrs: {}, children: [] };
  const pila = [radice];
  const re = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)|<\?[^>]*\?>|<!--[\s\S]*?-->/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const cima = pila[pila.length - 1];
    if (m[5] !== undefined) {
      cima.children.push({ name: "#text", text: decodifica(m[5]) });
      continue;
    }
    if (!m[2]) continue;
    if (m[1]) {
      pila.pop();
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = decodifica(a[2]);
    const nodo = { name: m[2], attrs, children: [] };
    cima.children.push(nodo);
    if (!m[4]) pila.push(nodo);
  }
  return radice;
}

const decodifica = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, "\n")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

const figli = (n, nome) => (n.children ?? []).filter((c) => c.name === nome);
const figlio = (n, nome) => (n.children ?? []).find((c) => c.name === nome);
function* discendenti(n, nome) {
  for (const c of n.children ?? []) {
    if (c.name === nome) yield c;
    yield* discendenti(c, nome);
  }
}

// ---------------------------------------------------------------------------
// Collegamenti alle immagini e formati degli elenchi.
// ---------------------------------------------------------------------------
const rels = {};
for (const r of readFileSync(join(radice, "word/_rels/document.xml.rels"), "utf8").matchAll(
  /Id="([^"]+)"[^>]*Target="([^"]+)"/g
)) {
  rels[r[1]] = r[2];
}

const formatoElenco = {}; // numId → "bullet" | "decimal" | …
const percorsoNumerazione = join(radice, "word/numbering.xml");
if (existsSync(percorsoNumerazione)) {
  const num = parseXml(readFileSync(percorsoNumerazione, "utf8"));
  const numbering = figlio(num, "w:numbering");
  const astratti = {};
  for (const a of figli(numbering, "w:abstractNum")) {
    const lvl0 = figli(a, "w:lvl").find((l) => l.attrs["w:ilvl"] === "0");
    astratti[a.attrs["w:abstractNumId"]] = figlio(lvl0, "w:numFmt")?.attrs["w:val"] ?? "bullet";
  }
  for (const n of figli(numbering, "w:num")) {
    formatoElenco[n.attrs["w:numId"]] = astratti[figlio(n, "w:abstractNumId").attrs["w:val"]];
  }
}

// ---------------------------------------------------------------------------
// Testo di un paragrafo, con grassetto, corsivo, apici e pedici.
// ---------------------------------------------------------------------------
const APICI = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻", "−": "⁻", "+": "⁺", n: "ⁿ", "(": "⁽", ")": "⁾" };
const PEDICI = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉", "-": "₋", "+": "₊", "(": "₍", ")": "₎" };

const attivo = (rPr, nome) => {
  const n = rPr && figlio(rPr, nome);
  return !!n && n.attrs["w:val"] !== "0" && n.attrs["w:val"] !== "false";
};

const immagini = []; // { rid, alt }

function pezziDelParagrafo(p) {
  const pezzi = []; // { testo, b, i } oppure { img }
  const visita = (nodo) => {
    for (const c of nodo.children ?? []) {
      if (c.name === "w:r") {
        const rPr = figlio(c, "w:rPr");
        const b = attivo(rPr, "w:b");
        const i = attivo(rPr, "w:i");
        const va = rPr && figlio(rPr, "w:vertAlign")?.attrs["w:val"];
        for (const x of c.children) {
          if (x.name === "w:t") {
            let t = x.children.map((y) => y.text ?? "").join("");
            if (va === "superscript") t = [...t].map((ch) => APICI[ch] ?? ch).join("");
            if (va === "subscript") t = [...t].map((ch) => PEDICI[ch] ?? ch).join("");
            pezzi.push({ testo: t, b, i });
          } else if (x.name === "w:tab") pezzi.push({ testo: " ", b: false, i: false });
          else if (x.name === "w:br") pezzi.push({ testo: "\n", b: false, i: false });
          else if (x.name === "w:drawing") {
            const blip = [...discendenti(x, "a:blip")][0];
            const docPr = [...discendenti(x, "wp:docPr")][0];
            if (blip) pezzi.push({ img: blip.attrs["r:embed"], alt: docPr?.attrs.descr ?? "" });
          }
        }
      } else if (c.name === "w:hyperlink" || c.name === "w:ins" || c.name === "w:smartTag" || c.name === "w:sdt" || c.name === "w:sdtContent") {
        visita(c);
      }
    }
  };
  visita(p);
  return pezzi;
}

// Unisce i pezzi con lo stesso formato e mette i segni del markdown, tenendo gli
// spazi fuori dagli asterischi (altrimenti il markdown non li riconosce).
// Il corsivo sta dentro il grassetto («**come *sapiens* in *Homo sapiens*?**»):
// prima si raggruppano i pezzi per grassetto, poi dentro ogni gruppo per corsivo.
// Uno spazio da solo non spezza un gruppo.
const avvolgi = (t, segno) => {
  if (!t.trim()) return t;
  const [, prima, centro, dopo] = /^(\s*)([\s\S]*?)(\s*)$/.exec(t);
  return `${prima}${segno}${centro}${segno}${dopo}`;
};

function raggruppa(pezzi, chiave) {
  const gruppi = [];
  for (const p of pezzi) {
    const u = gruppi[gruppi.length - 1];
    const val = p.testo.trim() ? p[chiave] : u?.val ?? p[chiave];
    if (u && u.val === val) u.pezzi.push(p);
    else gruppi.push({ val, pezzi: [p] });
  }
  return gruppi;
}

function formatta(pezzi) {
  const testuali = pezzi.filter((p) => !p.img).map((p) => ({ ...p, testo: p.testo.replace(/\*/g, "\\*") }));
  return raggruppa(testuali, "b")
    .map((g) => {
      const dentro = raggruppa(g.pezzi, "i")
        .map((h) => {
          const t = h.pezzi.map((p) => p.testo).join("");
          return h.val ? avvolgi(t, "*") : t;
        })
        .join("");
      return g.val ? avvolgi(dentro, "**") : dentro;
    })
    .join("")
    .replace(/[  ]{2,}/g, " ")
    .trim();
}

const stileDi = (p) => figlio(figlio(p, "w:pPr") ?? {}, "w:pStyle")?.attrs["w:val"] ?? "";
const elencoDi = (p) => {
  const numPr = figlio(figlio(p, "w:pPr") ?? {}, "w:numPr");
  if (!numPr) return null;
  const id = figlio(numPr, "w:numId")?.attrs["w:val"];
  const livello = Number(figlio(numPr, "w:ilvl")?.attrs["w:val"] ?? 0);
  if (!id || id === "0") return null;
  return { formato: formatoElenco[id] ?? "bullet", livello };
};

// ---------------------------------------------------------------------------
// Blocchi.
// ---------------------------------------------------------------------------
function immagine(pezzo) {
  const file = rels[pezzo.img];
  const n = immagini.length + 1;
  const nome = `fig${String(n).padStart(2, "0")}.webp`;
  immagini.push({ origine: join(radice, "word", file), nome });
  // Il testo alternativo di Word ripete la didascalia: basta la prima riga.
  const alt = (pezzo.alt.split("\n").pop() || `Figura ${n}`).replace(/[[\]]/g, "");
  return `![${alt}](/appunti/${cartellaImmagini}/${nome})`;
}

function paragrafo(p, numerati) {
  const stile = stileDi(p);
  const pezzi = pezziDelParagrafo(p);
  const blocchi = pezzi.filter((x) => x.img).map(immagine);
  const testo = formatta(pezzi);
  if (!testo) return blocchi;

  if (/^TOC/i.test(stile)) return [];
  const titolo = /^(?:Heading|Titolo)\s*(\d)$/i.exec(stile);
  if (titolo) {
    const livello = Math.min(Number(titolo[1]) + 1, 4);
    return [...blocchi, `${"#".repeat(livello)} ${testo.replace(/\*\*/g, "")}`];
  }

  // Le didascalie stanno sotto le figure: in corsivo, come una nota.
  if (/^\**Figura \d+\./.test(testo)) return [...blocchi, `*${testo.replace(/\*/g, "")}*`];

  const el = elencoDi(p);
  if (el) {
    const rientro = "  ".repeat(el.livello);
    if (el.formato === "decimal") {
      numerati.n = (numerati.n ?? 0) + 1;
      return [...blocchi, `${rientro}${numerati.n}. ${testo}`];
    }
    return [...blocchi, `${rientro}- ${testo}`];
  }
  numerati.n = 0;
  return [...blocchi, testo];
}

const etichettaRiquadro = (t) => {
  // «ATTENZIONE ALL'ESAME · Nessuna proprietà…» → «Attenzione all'esame · Nessuna proprietà…»
  const [testa, ...resto] = t.replace(/\*\*/g, "").split(" · ");
  const bella = testa === testa.toUpperCase() ? testa.charAt(0) + testa.slice(1).toLowerCase() : testa;
  return [bella, ...resto].join(" · ");
};

function tabella(tbl) {
  const righe = figli(tbl, "w:tr").map((tr) =>
    figli(tr, "w:tc").map((tc) => {
      const numerati = {};
      return figli(tc, "w:p").flatMap((p) => paragrafo(p, numerati));
    })
  );
  const colonne = Math.max(...righe.map((r) => r.length));

  if (colonne === 1) {
    // Riquadro: la prima riga è l'etichetta, il resto è il contenuto.
    const righeTesto = righe.flatMap((r) => r[0]).filter(Boolean);
    if (righeTesto.length === 0) return [];
    const [prima, ...resto] = righeTesto;
    const corpo = resto.length > 0 ? [`**${etichettaRiquadro(prima)}**`, ...resto] : [prima];
    return [corpo.map((b) => b.split("\n").map((l) => `> ${l}`).join("\n")).join("\n>\n")];
  }

  const cella = (blocchi) =>
    blocchi
      .map((b) => b.replace(/^[-\d.]+\s+/, "").replace(/\n/g, " "))
      .join("; ")
      .replace(/\|/g, "\\|") || " ";
  const md = righe.map((r) => {
    const celle = Array.from({ length: colonne }, (_, i) => cella(r[i] ?? []));
    return `| ${celle.join(" | ")} |`;
  });
  md.splice(1, 0, `|${" --- |".repeat(colonne)}`);
  return [md.join("\n")];
}

// ---------------------------------------------------------------------------
// Documento.
// ---------------------------------------------------------------------------
const doc = parseXml(readFileSync(join(radice, "word/document.xml"), "utf8"));
const body = figlio(figlio(doc, "w:document"), "w:body");

const blocchi = [];
let iniziato = false;
const numerati = {};
for (const nodo of body.children) {
  if (nodo.name === "w:p") {
    if (!iniziato && /^(?:Heading|Titolo)\s*1$/i.test(stileDi(nodo))) iniziato = true;
    if (!iniziato) continue;
    blocchi.push(...paragrafo(nodo, numerati));
  } else if (nodo.name === "w:tbl" && iniziato) {
    numerati.n = 0;
    blocchi.push(...tabella(nodo));
  }
}

// Le righe di elenco consecutive restano attaccate; tutto il resto si separa.
let out = "";
for (let i = 0; i < blocchi.length; i++) {
  const b = blocchi[i];
  const elenco = (x) => /^\s*(?:-|\d+\.) /.test(x ?? "");
  out += i === 0 ? b : (elenco(b) && elenco(blocchi[i - 1]) ? "\n" : "\n\n") + b;
}
process.stdout.write(out + "\n");

// Le immagini: in WebP e al massimo 1600 px di larghezza, abbastanza per uno
// schermo largo e molto più leggere dei PNG di Word.
const destinazione = join("public/appunti", cartellaImmagini);
mkdirSync(destinazione, { recursive: true });
for (const { origine, nome } of immagini) {
  await sharp(origine)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(join(destinazione, nome));
}
console.error(`${blocchi.length} blocchi, ${immagini.length} immagini in ${destinazione}`);
