-- Two additions, each covering a distinct moment in a task's life that had no
-- home. Both additive, so code running the previous build is unaffected.
--
--   workedExample  before the work   "here is one that is already right"
--   TaskQuestion   during the work   "still going, but what did you mean"
--
-- BLOCKED already covers "I have stopped and I need you", and a question is
-- explicitly not that.

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "workedExample" TEXT;

-- CreateTable
CREATE TABLE "TaskQuestion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "askedById" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskQuestion_taskId_idx" ON "TaskQuestion"("taskId");

-- CreateIndex
CREATE INDEX "TaskQuestion_answeredAt_idx" ON "TaskQuestion"("answeredAt");

-- AddForeignKey
ALTER TABLE "TaskQuestion" ADD CONSTRAINT "TaskQuestion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskQuestion" ADD CONSTRAINT "TaskQuestion_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskQuestion" ADD CONSTRAINT "TaskQuestion_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
