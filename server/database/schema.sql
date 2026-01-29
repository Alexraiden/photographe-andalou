PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collections (
  id                    TEXT PRIMARY KEY,
  slug                  TEXT NOT NULL UNIQUE,
  name_es               TEXT NOT NULL DEFAULT '',
  name_en               TEXT NOT NULL DEFAULT '',
  name_fr               TEXT NOT NULL DEFAULT '',
  description_es        TEXT NOT NULL DEFAULT '',
  description_en        TEXT NOT NULL DEFAULT '',
  description_fr        TEXT NOT NULL DEFAULT '',
  cover_image_src       TEXT DEFAULT '',
  cover_image_placeholder TEXT DEFAULT '',
  cover_image_alt_es    TEXT DEFAULT '',
  cover_image_alt_en    TEXT DEFAULT '',
  cover_image_alt_fr    TEXT DEFAULT '',
  image_count           INTEGER DEFAULT 0,
  layout                TEXT DEFAULT 'grid' CHECK(layout IN ('cinematic','grid','masonry','horizontal-scroll')),
  featured              INTEGER DEFAULT 0,
  sort_order            INTEGER DEFAULT 0,
  location              TEXT DEFAULT '',
  year_range            TEXT DEFAULT '',
  tags                  TEXT DEFAULT '[]',
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS images (
  id                TEXT PRIMARY KEY,
  collection_id     TEXT NOT NULL,
  title_es          TEXT NOT NULL DEFAULT '',
  title_en          TEXT NOT NULL DEFAULT '',
  title_fr          TEXT NOT NULL DEFAULT '',
  description_es    TEXT NOT NULL DEFAULT '',
  description_en    TEXT NOT NULL DEFAULT '',
  description_fr    TEXT NOT NULL DEFAULT '',
  file_full         TEXT DEFAULT '',
  file_large        TEXT DEFAULT '',
  file_medium       TEXT DEFAULT '',
  file_small        TEXT DEFAULT '',
  file_thumb        TEXT DEFAULT '',
  file_placeholder  TEXT DEFAULT '',
  original_filename TEXT DEFAULT '',
  width             INTEGER DEFAULT 0,
  height            INTEGER DEFAULT 0,
  aspect_ratio      TEXT DEFAULT '4:3',
  camera            TEXT DEFAULT '',
  lens              TEXT DEFAULT '',
  settings          TEXT DEFAULT '',
  location          TEXT DEFAULT '',
  photo_date        TEXT DEFAULT '',
  tags              TEXT DEFAULT '[]',
  sort_order        INTEGER DEFAULT 0,
  featured          INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_collection ON images(collection_id);
CREATE INDEX IF NOT EXISTS idx_images_featured ON images(featured);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(featured);
CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_images_sort ON images(sort_order);
