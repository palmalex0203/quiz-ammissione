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

export const POINTS_CORRECT = 1.5;
export const POINTS_INCORRECT = -0.4;
export const POINTS_OMITTED = 0;

export function gradeAttempt(questions: GradableQuestion[], answers: SubmittedAnswer[]) {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

  let score = 0;
  const maxScore = questions.length * POINTS_CORRECT;

  const results: GradedAnswer[] = questions.map((question) => {
    const selectedOptionId = answerByQuestion.get(question.id) ?? null;
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptionId != null && selectedOptionId === correctOption?.id;

    let outcome: AnswerOutcome;
    if (selectedOptionId == null) {
      outcome = "OMITTED";
      score += POINTS_OMITTED;
    } else if (isCorrect) {
      outcome = "CORRECT";
      score += POINTS_CORRECT;
    } else {
      outcome = "INCORRECT";
      score += POINTS_INCORRECT;
    }

    return { questionId: question.id, selectedOptionId, isCorrect, outcome };
  });

  // Evita rumore da virgola mobile (es. 51.900000000000006)
  score = Math.round(score * 100) / 100;

  return { score, maxScore, results };
}
