-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "fragrances" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "year" INTEGER,
    "gender" TEXT,
    "rating_value" DOUBLE PRECISION,
    "rating_count" INTEGER,
    "main_accords" JSONB,
    "longevity_votes" JSONB,
    "sillage_votes" JSONB,
    "image_url" TEXT,

    CONSTRAINT "fragrances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fragrance_notes" (
    "fragrance_id" INTEGER NOT NULL,
    "note_id" INTEGER NOT NULL,
    "layer" TEXT NOT NULL,

    CONSTRAINT "fragrance_notes_pkey" PRIMARY KEY ("fragrance_id","note_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "preferred_tone" TEXT NOT NULL DEFAULT 'casual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collection" (
    "user_id" TEXT NOT NULL,
    "fragrance_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rating" INTEGER,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_collection_pkey" PRIMARY KEY ("user_id","fragrance_id")
);

-- CreateTable
CREATE TABLE "note_preferences" (
    "user_id" TEXT NOT NULL,
    "note_id" INTEGER NOT NULL,
    "preference" TEXT NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "note_preferences_pkey" PRIMARY KEY ("user_id","note_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notes_name_key" ON "notes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- AddForeignKey
ALTER TABLE "fragrance_notes" ADD CONSTRAINT "fragrance_notes_fragrance_id_fkey" FOREIGN KEY ("fragrance_id") REFERENCES "fragrances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fragrance_notes" ADD CONSTRAINT "fragrance_notes_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_fragrance_id_fkey" FOREIGN KEY ("fragrance_id") REFERENCES "fragrances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_preferences" ADD CONSTRAINT "note_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_preferences" ADD CONSTRAINT "note_preferences_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
