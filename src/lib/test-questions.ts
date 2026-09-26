import { prisma } from "@/lib/prisma";

/*
 * Le domande di un test, in ordine, comunque il test le tenga.
 *
 * Un test può tenerle in due modi, e il resto del programma non deve saperlo:
 *
 *  - i test scritti dall'insegnante (e la banca dati stessa) possiedono le proprie
 *    domande: Question.testId punta al test;
 *  - i test generati per lo studente le prendono in prestito dalla banca dati
 *    attraverso TestQuestion, che ne registra solo il riferimento e la posizione.
 *
 * Il secondo modo esiste per non riempire il database di copie: una simulazione
 * generata scriveva ~60 domande e ~300 opzioni (~175 KB) che restavano lì per
 * sempre; adesso scrive 60 righe minuscole. Vedi prisma/schema.prisma.
 */

export type TestQuestionRow = {
  id: string;
  subject: string;
  topic: string | null;
  text: string;
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
};

const optionSelect = {
  orderBy: { order: "asc" },
  select: { id: true, text: true, isCorrect: true, order: true },
} as const;

/**
 * Le domande del test, nell'ordine in cui vanno mostrate.
 *
 * Le due forme si chiedono insieme (una sola andata e ritorno verso il database)
 * e si tiene quella che ha risposto: un test usa l'una o l'altra, mai entrambe.
 */
export async function testQuestions(testId: string): Promise<TestQuestionRow[]> {
  const [pescate, proprie] = await Promise.all([
    prisma.testQuestion.findMany({
      where: { testId },
      orderBy: { order: "asc" },
      select: {
        question: {
          select: { id: true, subject: true, topic: true, text: true, options: optionSelect },
        },
      },
    }),
    prisma.question.findMany({
      where: { testId },
      orderBy: { order: "asc" },
      select: { id: true, subject: true, topic: true, text: true, options: optionSelect },
    }),
  ]);

  return pescate.length > 0 ? pescate.map((p) => p.question) : proprie;
}

/**
 * Quante domande ha il test, senza caricarle. Per la stessa ragione di sopra si
 * sommano i due conteggi: uno dei due è sempre zero.
 */
export async function testQuestionCount(testId: string): Promise<number> {
  const [pescate, proprie] = await Promise.all([
    prisma.testQuestion.count({ where: { testId } }),
    prisma.question.count({ where: { testId } }),
  ]);
  return pescate + proprie;
}

/**
 * Forma da passare a `_count` quando si elencano dei test, e come leggerla.
 * Serve perché nell'elenco il numero di domande arriva insieme al resto.
 */
export const questionCountSelect = { questions: true, pescate: true } as const;

export function questionCountOf(counts: { questions: number; pescate: number }): number {
  return counts.questions + counts.pescate;
}

/**
 * A che posizione sta ogni domanda dentro il test: serve a rimettere in ordine le
 * risposte di un tentativo.
 *
 * Non basta `Question.order`, perché una domanda presa in prestito porta con sé la
 * posizione che ha nella banca dati, non quella che ha in questo test.
 */
export async function testQuestionOrder(testId: string): Promise<Map<string, number>> {
  const [pescate, proprie] = await Promise.all([
    prisma.testQuestion.findMany({ where: { testId }, select: { questionId: true, order: true } }),
    prisma.question.findMany({ where: { testId }, select: { id: true, order: true } }),
  ]);

  return pescate.length > 0
    ? new Map(pescate.map((p) => [p.questionId, p.order]))
    : new Map(proprie.map((q) => [q.id, q.order]));
}
