PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS techniques (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artworks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT UNIQUE NOT NULL,
  artist          TEXT NOT NULL,
  title           TEXT NOT NULL,
  year            INTEGER,
  category        TEXT NOT NULL CHECK (category IN ('original','engraving','reproduction')),
  materials       TEXT,
  height          REAL,
  width           REAL,
  description     TEXT,
  series          TEXT,
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','sold','not_for_sale')),
  price           REAL,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  featured        INTEGER NOT NULL DEFAULT 0,

  sheet_height    REAL,
  sheet_width     REAL,
  image_height    REAL,
  image_width     REAL,
  edition         INTEGER,
  copy_number     TEXT,
  signed          TEXT,

  original_title  TEXT,
  repro_type      TEXT,
  print_material  TEXT,

  meta_title      TEXT,
  meta_description TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artwork_techniques (
  artwork_id   INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  technique_id INTEGER NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  PRIMARY KEY (artwork_id, technique_id)
);

CREATE TABLE IF NOT EXISTS artwork_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS repro_sizes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  price      REAL
);

CREATE TABLE IF NOT EXISTS pages (
  key        TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_status   ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_images_artwork    ON artwork_images(artwork_id, sort_order);