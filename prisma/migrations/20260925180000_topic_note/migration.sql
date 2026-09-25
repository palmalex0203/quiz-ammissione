-- Appunti di ripasso per argomento.
CREATE TABLE "TopicNote" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopicNote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TopicNote_topic_key" ON "TopicNote"("topic");
CREATE INDEX "TopicNote_track_idx" ON "TopicNote"("track");
CREATE INDEX "TopicNote_isPublished_idx" ON "TopicNote"("isPublished");
