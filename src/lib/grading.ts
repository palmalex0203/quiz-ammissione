export type GradableQuestion = {
  id: string;
  points: number;
  options: { id: string; isCorrect: boolean }[];
};

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
};

export type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
};

export function gradeAttempt(questions: GradableQuestion[], answers: SubmittedAnswer[]) {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

  let score = 0;
  let maxScore = 0;

  const results: GradedAnswer[] = questions.map((question) => {
    maxScore += question.points;
    const selectedOptionId = answerByQuestion.get(question.id) ?? null;
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptionId != null && selectedOptionId === correctOption?.id;
    if (isCorrect) score += question.points;
    return { questionId: question.id, selectedOptionId, isCorrect };
  });

  return { score, maxScore, results };
}
