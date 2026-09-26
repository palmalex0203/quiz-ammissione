-- I test generati richiamano le domande della banca dati invece di copiarle.
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TestQuestion_testId_questionId_key" ON "TestQuestion"("testId", "questionId");
CREATE INDEX "TestQuestion_testId_idx" ON "TestQuestion"("testId");
CREATE INDEX "TestQuestion_questionId_idx" ON "TestQuestion"("questionId");

ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_testId_fkey"
    FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
