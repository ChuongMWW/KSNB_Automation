// Kết nối Neon qua HTTP (chạy được cả ở Node function lẫn Edge middleware)
import { neon } from '@neondatabase/serverless';

let _sql;
export async function q(text, params = []) {
  if (globalThis.__KSNB_TEST_DB__) return (await globalThis.__KSNB_TEST_DB__.query(text, params)).rows;
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('Thiếu biến môi trường DATABASE_URL');
    _sql = neon(url);
  }
  return _sql.query(text, params);
}

export async function ensureSchema() {
  await q(`CREATE TABLE IF NOT EXISTS ksnb_users (
    id            SERIAL PRIMARY KEY,
    code          TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 0,
    failed_count  INTEGER NOT NULL DEFAULT 0,
    locked_until  TIMESTAMPTZ,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}
