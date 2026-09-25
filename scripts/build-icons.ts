/*
 * Genera le icone del sito e dell'app installabile: la "o" a serratura del logo
 * Profor, bianca, su fondo arancione.
 *
 * Il simbolo è ridisegnato in vettoriale invece di essere ritagliato dal logo:
 * dentro public/profor-logo.png occupa 76x71 pixel, e ingrandito a 512 avrebbe i
 * bordi sfocati. Le misure qui sotto sono prese da quel disegno, pixel per pixel,
 * quindi la forma è la stessa ma resta nitida a qualsiasi dimensione.
 *
 * Da rieseguire dopo aver modificato questo file:  npx tsx scripts/build-icons.ts
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const BRAND = "#ea5b17";

/*
 * La serratura in una griglia di 76: cerchio esterno pieno, foro al centro e uno
 * spicchio tolto in basso, che si allarga scendendo fino a tagliare il cerchio.
 * Le due gambe finiscono così a punta, come nel logo.
 */
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 76">
  <mask id="serratura">
    <rect width="76" height="76" fill="black"/>
    <circle cx="38" cy="38" r="38" fill="white"/>
    <circle cx="38" cy="38" r="19" fill="black"/>
    <polygon points="34.1,45 41.9,45 53.8,76 22.2,76" fill="black"/>
  </mask>
  <rect width="76" height="76" fill="white" mask="url(#serratura)"/>
</svg>`;

function mark(size: number): Buffer {
  return Buffer.from(MARK.replace("<svg ", `<svg width="${size}" height="${size}" `));
}

// Quadrato arancione con gli angoli arrotondati, come l'icona di un'app.
function background(size: number, radiusRatio: number): Buffer {
  const r = Math.round(size * radiusRatio);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BRAND}"/>
     </svg>`
  );
}

async function icon(size: number, opts: { markRatio: number; radiusRatio: number }): Promise<Buffer> {
  return sharp(background(size, opts.radiusRatio))
    .composite([{ input: mark(Math.round(size * opts.markRatio)), gravity: "centre" }])
    .png()
    .toBuffer();
}

// Un .ico non è altro che dei PNG in un contenitore: è quello che i browser
// chiedono su /favicon.ico, e sharp da solo non lo sa scrivere.
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // riservato
  header.writeUInt16LE(1, 2); // tipo: icona
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries: Buffer[] = [];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // larghezza (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // altezza
    entry.writeUInt16LE(1, 4); // piani
    entry.writeUInt16LE(32, 6); // bit per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  // Schermata iniziale dell'iPhone: iOS arrotonda già gli angoli per conto suo.
  writeFileSync("src/app/apple-icon.png", await icon(180, { markRatio: 0.56, radiusRatio: 0.22 }));
  console.log("Scritta src/app/apple-icon.png (180)");

  for (const size of [192, 512]) {
    writeFileSync(`public/icon-${size}.png`, await icon(size, { markRatio: 0.56, radiusRatio: 0.22 }));
    console.log(`Scritta public/icon-${size}.png`);
  }

  // Android ritaglia l'icona in una forma sua (cerchio, goccia...): il fondo copre
  // tutto il quadrato e il simbolo sta più al centro, così non ne taglia i bordi.
  writeFileSync("public/icon-maskable-512.png", await icon(512, { markRatio: 0.42, radiusRatio: 0 }));
  console.log("Scritta public/icon-maskable-512.png");

  // Scheda del browser: qui il simbolo va più grande, altrimenti a 16 pixel sparisce.
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map(async (size) => ({ size, png: await icon(size, { markRatio: 0.76, radiusRatio: 0.16 }) }))
  );
  writeFileSync("src/app/favicon.ico", ico(pngs));
  console.log(`Scritta src/app/favicon.ico (${sizes.join(", ")})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
