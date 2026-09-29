-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_messages_project_id_area_created_at_idx"
ON "ai_chat_messages"("project_id", "area", "created_at");

-- AddForeignKey
ALTER TABLE "ai_chat_messages"
ADD CONSTRAINT "ai_chat_messages_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
