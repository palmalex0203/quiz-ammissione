import { DEFAULT_TRACK, TRACKS, type Scoring } from "@/lib/tracks";

export type GradableQuestion = {
  id: string;
  options: { id: string; isCorrect: boolean }[];
};

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
};

export type AnswerOutcome = "CORRECT" | "INCORRECT" | "OMITTED";

export type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
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
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

  let score = 0;
  const maxScore = questions.length * scoring.correct;

  const results: GradedAnswer[] = questions.map((question) => {
    const selectedOptionId = answerByQuestion.get(question.id) ?? null;
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptionId != null && selectedOptionId === correctOption?.id;

    let outcome: AnswerOutcome;
    if (selectedOptionId == null) {
      outcome = "OMITTED";
      score += scoring.omitted;
    } else if (isCorrect) {
      outcome = "CORRECT";
      score += scoring.correct;
    } else {
      outcome = "INCORRECT";
      score += scoring.incorrect;
    }

    return { questionId: question.id, selectedOptionId, isCorrect, outcome };
  });

  // Evita rumore da virgola mobile (es. 51.900000000000006)
  score = Math.round(score * 100) / 100;

  return { score, maxScore: Math.round(maxScore * 100) / 100, results };
}
