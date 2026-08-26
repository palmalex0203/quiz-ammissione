-- AlterTable
ALTER TABLE "Question" ADD COLUMN "topic" TEXT;

-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");
