import { DEFAULT_TRACK, TRACKS, type Scoring } from "@/lib/tracks";
import { isCompletionBlank, isCompletionCorrect } from "@/lib/completion";

export type GradableQuestion = {
  id: string;
  // Assente nei test vecchi e nelle chiamate che non la passano: si tratta come
  // scelta multipla, che è quello che erano tutte le domande prima.
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO";
  options: { id: string; isCorrect: boolean; text?: string }[];
};

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  // Il testo scritto nelle domande a completamento.
  typedAnswer?: string | null;
};

export type AnswerOutcome = "CORRECT" | "INCORRECT" | "OMITTED";

export type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  typedAnswer: string | null;
  isCorrect: boolean;
  outcome: AnswerOutcome;
};

// Ogni percorso ha il suo punteggio (vedi src/lib/tracks.ts). Quando non viene
// indicato si usa quello di Professioni Sanitarie, il percorso storico: i test
// creati prima dell'introduzione dei percorsi appartengono tutti a quello.
export const DEFAULT_SCORING: Scoring = TRACKS[DEFAULT_TRACK].scoring;

export function gradeAttempt(
  questions: GradableQuestion[],
  answers: SubmittedAnswer[],
  scoring: Scoring = DEFAULT_SCORING
) {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  let score = 0;
  const maxScore = questions.length * scoring.correct;

  const results: GradedAnswer[] = questions.map((question) => {
    const data = answerByQuestion.get(question.id);
    const selectedOptionId = data?.selectedOptionId ?? null;
    const typedAnswer = data?.typedAnswer ?? null;

    const { data: risposta, corretta } = valuta(question, selectedOptionId, typedAnswer);

    let outcome: AnswerOutcome;
    if (!risposta) {
      outcome = "OMITTED";
      score += scoring.omitted;
    } else if (corretta) {
      outcome = "CORRECT";
      score += scoring.correct;
    } else {
      outcome = "INCORRECT";
      score += scoring.incorrect;
    }

    return { questionId: question.id, selectedOptionId, typedAnswer, isCorrect: corretta, outcome };
  });

  // Evita rumore da virgola mobile (es. 51.900000000000006)
  score = Math.round(score * 100) / 100;

  return { score, maxScore: Math.round(maxScore * 100) / 100, results };
}

// `data` dice se la risposta è stata data (altrimenti è omessa, che non toglie
// punti), `corretta` se è giusta. Le due cose si decidono diversamente a seconda
// che la domanda sia a scelta multipla o a completamento.
function valuta(
  question: GradableQuestion,
  selectedOptionId: string | null,
  typedAnswer: string | null
): { data: boolean; corretta: boolean } {
  if (question.type === "COMPLETAMENTO") {
    if (isCompletionBlank(typedAnswer)) return { data: false, corretta: false };
    const ammesse = question.options.filter((o) => o.isCorrect).map((o) => o.text ?? "");
    return { data: true, corretta: isCompletionCorrect(typedAnswer, ammesse) };
  }

  if (selectedOptionId == null) return { data: false, corretta: false };
  const correctOption = question.options.find((o) => o.isCorrect);
  return { data: true, corretta: selectedOptionId === correctOption?.id };
}
