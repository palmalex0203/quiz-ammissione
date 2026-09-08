-- CreateTable
CREATE TABLE "AttemptSubjectStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    CONSTRAINT "AttemptSubjectStat_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AttemptSubjectStat_subject_idx" ON "AttemptSubjectStat"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptSubjectStat_attemptId_subject_key" ON "AttemptSubjectStat"("attemptId", "subject");
