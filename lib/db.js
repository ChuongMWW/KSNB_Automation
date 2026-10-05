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
  await q(`CREATE TABLE IF NOT EXISTS ksnb_files (
    id           SERIAL PRIMARY KEY,
    cat          TEXT NOT NULL,
    filename     TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data_b64     TEXT NOT NULL,
    size_bytes   INTEGER NOT NULL DEFAULT 0,
    title        TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    grp          TEXT NOT NULL DEFAULT '',
    uploaded_by  TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cat, filename)
  )`);
}

// Các mục (thư mục) được phép thêm quy trình mới
export const CATS = {
  'CE_Gia_dung': 'CE & Gia dụng',
  'Tho_DMX': 'Thợ ĐMX',
  'ICT/Android': 'ICT Android',
  'ICT/IOS': 'ICT iOS (Apple)',
  'ICT/Windows': 'ICT Windows',
};
export const TYPES = {
  html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

// Tên file an toàn: bỏ dấu tiếng Việt, khoảng trắng -> _
export function cleanName(name) {
  const base = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/\s+/g, '_').replace(/[^A-Za-z0-9_.-]/g, '').replace(/_+/g, '_').replace(/^[._-]+/, '');
  return base;
}
