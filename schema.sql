CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('file', 'text', 'url')),
  content_enc TEXT NOT NULL,
  iv TEXT NOT NULL,
  mime_type TEXT,
  original_name TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expires ON shares(expires_at);
