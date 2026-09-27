-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pen_name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '작가',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "cover_storage_key" TEXT,
    "platform" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genre" TEXT NOT NULL,
    "custom_genre" TEXT,
    "total_episodes" INTEGER NOT NULL,
    "current_episode" INTEGER NOT NULL DEFAULT 0,
    "cadence" TEXT NOT NULL,
    "weekly_hours" DOUBLE PRECISION NOT NULL,
    "avg_cuts" INTEGER NOT NULL,
    "color_mode" TEXT NOT NULL,
    "bg_complexity" TEXT NOT NULL,
    "has_assistant" BOOLEAN NOT NULL DEFAULT false,
    "logline" TEXT NOT NULL,
    "conflict" TEXT NOT NULL,
    "next_deadline" TIMESTAMP(3) NOT NULL,
    "completion_date" TIMESTAMP(3),
    "status" TEXT,
    "custom_status" TEXT,
    "success_rate" INTEGER NOT NULL,
    "risk_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "role_group" TEXT,
    "personality" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "speech_style" TEXT NOT NULL,
    "taboo" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "storage_key" TEXT,
    "gender" TEXT,
    "age" TEXT,
    "origin" TEXT,
    "occupation" TEXT,
    "likes" TEXT,
    "dislikes" TEXT,
    "backstory" TEXT,
    "relationships" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "hook" TEXT NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreshadows" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keyword" TEXT,
    "importance" TEXT,
    "appear_ep" INTEGER NOT NULL,
    "resolve_ep" INTEGER,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foreshadows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreshadow_characters" (
    "foreshadow_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,

    CONSTRAINT "foreshadow_characters_pkey" PRIMARY KEY ("foreshadow_id","character_id")
);

-- CreateTable
CREATE TABLE "story_acts" (
    "project_id" TEXT NOT NULL,
    "act1" TEXT NOT NULL,
    "act2" TEXT NOT NULL,
    "act3" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_acts_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "world_settings" (
    "project_id" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "main_places" TEXT NOT NULL,
    "world_rules" TEXT NOT NULL,
    "organizations" TEXT NOT NULL,
    "culture" TEXT NOT NULL,
    "technology_or_magic" TEXT NOT NULL,
    "mood_tone" TEXT NOT NULL,
    "forbidden_settings" TEXT NOT NULL,
    "research_notes" TEXT,
    "reference_sources" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_settings_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "world_place_references" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "memo" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_place_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_boards" (
    "project_id" TEXT NOT NULL,
    "nodes_json" JSONB NOT NULL DEFAULT '[]',
    "connections_json" JSONB NOT NULL DEFAULT '[]',
    "notes_json" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_boards_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "ai_usage_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_user_id_updated_at_idx" ON "projects"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "characters_project_id_idx" ON "characters"("project_id");

-- CreateIndex
CREATE INDEX "characters_project_id_role_group_idx" ON "characters"("project_id", "role_group");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_project_id_number_key" ON "episodes"("project_id", "number");

-- CreateIndex
CREATE INDEX "foreshadows_project_id_idx" ON "foreshadows"("project_id");

-- CreateIndex
CREATE INDEX "world_place_references_project_id_idx" ON "world_place_references"("project_id");

-- CreateIndex
CREATE INDEX "todos_project_id_idx" ON "todos"("project_id");

-- CreateIndex
CREATE INDEX "timeline_items_project_id_idx" ON "timeline_items"("project_id");

-- CreateIndex
CREATE INDEX "ai_usage_events_user_id_created_at_idx" ON "ai_usage_events"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreshadows" ADD CONSTRAINT "foreshadows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreshadow_characters" ADD CONSTRAINT "foreshadow_characters_foreshadow_id_fkey" FOREIGN KEY ("foreshadow_id") REFERENCES "foreshadows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreshadow_characters" ADD CONSTRAINT "foreshadow_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_acts" ADD CONSTRAINT "story_acts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_settings" ADD CONSTRAINT "world_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_place_references" ADD CONSTRAINT "world_place_references_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_boards" ADD CONSTRAINT "relationship_boards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
