// Genera le icone dell'app installabile a partire da src/app/apple-icon.png,
// l'unico marchio quadrato che abbiamo. Da rieseguire se cambia il logo:
//   npx tsx scripts/build-icons.ts
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = "src/app/apple-icon.png";
const OUT = "public";

async function main() {
  mkdirSync(OUT, { recursive: true });

  // Colore di fondo preso dall'icona stessa, così l'icona mascherata di Android
  // e lo sfondo dell'avvio restano identici al marchio.
  const { data } = await sharp(SOURCE).extract({ left: 90, top: 8, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const background = { r: data[0], g: data[1], b: data[2], alpha: 1 };
  console.log(`Fondo: rgb(${data[0]}, ${data[1]}, ${data[2]})`);

  for (const size of [192, 512]) {
    await sharp(SOURCE)
      .resize(size, size, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(`${OUT}/icon-${size}.png`);
    console.log(`Scritta ${OUT}/icon-${size}.png`);
  }

  // Versione "maskable": Android ritaglia l'icona in una forma sua (cerchio,
  // goccia...), quindi il marchio va rimpicciolito e il fondo esteso a tutto il
  // quadrato, altrimenti gli angoli vengono tagliati via.
  const SAFE = 512 * 0.72;
  const mark = await sharp(SOURCE).resize(Math.round(SAFE), Math.round(SAFE), { kernel: "lanczos3" }).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(`${OUT}/icon-maskable-512.png`);
  console.log(`Scritta ${OUT}/icon-maskable-512.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
