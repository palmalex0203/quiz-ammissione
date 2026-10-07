import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const pool = await prisma.test.findMany({
    where: { kind: "POOL", track: "PROFESSIONI_SANITARIE" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  let tMc = 0, tLunga = 0, tOk = 0, tNo = 0, tNd = 0;
  const tPos = [0, 0, 0, 0, 0];

  for (const t of pool) {
    const q = await prisma.question.findMany({
      where: { testId: t.id, type: "MULTIPLE_CHOICE" },
      select: { options: { select: { text: true, isCorrect: true }, orderBy: { order: "asc" } } },
    });
    if (q.length === 0) continue;
    let lunga = 0, ok = 0, no = 0, nd = 0;
    const pos = [0, 0, 0, 0, 0];
    for (const d of q) {
      const i = d.options.findIndex((o) => o.isCorrect);
      if (i < 0) continue;
      if (i < 5) { pos[i]++; tPos[i]++; }
      const L = d.options.map((o) => o.text.trim().length);
      if (L[i] === Math.max(...L)) { lunga++; tLunga++; }
      ok += L[i]; tOk += L[i];
      L.forEach((n, j) => { if (j !== i) { no += n; nd++; tNo += n; tNd++; } });
    }
    tMc += q.length;
    const media = Math.round(ok / q.length), mediaNo = Math.round(no / nd);
    console.log(
      `${t.title.replace("Banca domande - ", "").padEnd(34)} ${String(q.length).padStart(4)} MC` +
      ` — giusta più lunga ${String(Math.round(lunga * 100 / q.length)).padStart(3)}%` +
      ` — ${String(media).padStart(3)} contro ${String(mediaNo).padStart(3)} car. (${(media / mediaNo).toFixed(2)})` +
      ` — A ${Math.round(pos[0] * 100 / q.length)}%`
    );
  }

  const media = tOk / tMc, mediaNo = tNo / tNd;
  console.log(`\nTOTALE ${tMc} domande a scelta multipla`);
  console.log(`la giusta è la più lunga: ${Math.round(tLunga * 100 / tMc)}%   (i fascicoli veri 37%)`);
  console.log(`lunghezza media: ${Math.round(media)} contro ${Math.round(mediaNo)} caratteri — rapporto ${(media / mediaNo).toFixed(2)}   (i fascicoli veri 1,13)`);
  console.log(`posizione: ${tPos.map((n, i) => `${String.fromCharCode(65 + i)} ${Math.round(n * 100 / tMc)}%`).join("  ")}`);
}
main().finally(() => prisma.$disconnect());
