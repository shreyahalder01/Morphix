CREATE TABLE IF NOT EXISTS render_history (
  id          TEXT PRIMARY KEY,
  style       TEXT NOT NULL,
  fps         INTEGER NOT NULL DEFAULT 24,
  status      TEXT NOT NULL DEFAULT 'pending',
  progress    INTEGER NOT NULL DEFAULT 0,
  source_path TEXT,
  output_path TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id                   TEXT PRIMARY KEY,
  status               TEXT NOT NULL DEFAULT 'pending',
  progress             INTEGER NOT NULL DEFAULT 0,
  message              TEXT,
  style_key            TEXT NOT NULL,
  fps                  INTEGER NOT NULL DEFAULT 24,
  strength             DOUBLE PRECISION,
  prompt               TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_file_name   TEXT,
  output_file_name     TEXT,
  output_storage_path  TEXT,
  poster_storage_path  TEXT,
  provider             TEXT,
  provider_job_id      TEXT,
  original_url         TEXT,
  output_url           TEXT,
  download_url         TEXT,
  poster_url           TEXT,
  error                TEXT,
  original_storage_path TEXT
);

CREATE INDEX IF NOT EXISTS render_history_status_idx ON render_history (status);
CREATE INDEX IF NOT EXISTS render_history_created_idx ON render_history (created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_created_idx ON jobs (created_at DESC);
