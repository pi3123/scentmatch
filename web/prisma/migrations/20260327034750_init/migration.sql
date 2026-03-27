-- CreateTable
CREATE TABLE "fragrances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "year" INTEGER,
    "gender" TEXT,
    "rating_value" REAL,
    "rating_count" INTEGER,
    "main_accords" TEXT,
    "longevity_votes" TEXT,
    "sillage_votes" TEXT,
    "image_url" TEXT
);

-- CreateTable
CREATE TABLE "notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "fragrance_notes" (
    "fragrance_id" INTEGER NOT NULL,
    "note_id" INTEGER NOT NULL,
    "layer" TEXT NOT NULL,

    PRIMARY KEY ("fragrance_id", "note_id"),
    CONSTRAINT "fragrance_notes_fragrance_id_fkey" FOREIGN KEY ("fragrance_id") REFERENCES "fragrances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fragrance_notes_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "preferred_tone" TEXT NOT NULL DEFAULT 'casual',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_collection" (
    "user_id" TEXT NOT NULL,
    "fragrance_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rating" INTEGER,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "fragrance_id"),
    CONSTRAINT "user_collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_collection_fragrance_id_fkey" FOREIGN KEY ("fragrance_id") REFERENCES "fragrances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "note_preferences" (
    "user_id" TEXT NOT NULL,
    "note_id" INTEGER NOT NULL,
    "preference" TEXT NOT NULL,
    "source" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "note_id"),
    CONSTRAINT "note_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "note_preferences_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "notes_name_key" ON "notes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
