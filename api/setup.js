// Tạo bảng + admin đầu tiên. Chỉ chạy được khi chưa có user nào, và phải nhập đúng AUTH_SECRET.
import bcrypt from 'bcryptjs';
import { q, ensureSchema } from '../lib/db.js';
import { json, readJson, normCode } from '../lib/auth.js';

export async function GET() {
  await ensureSchema();
  const [{ n }] = await q('SELECT COUNT(*)::int AS n FROM ksnb_users');
  return json({ needs_setup: n === 0 });
}

export async function POST(request) {
  const { secret, code, full_name, password } = await readJson(request);
  if (!process.env.AUTH_SECRET || secret !== process.env.AUTH_SECRET) return json({ error: 'Mã khởi tạo (AUTH_SECRET) không đúng' }, 403);
  const c = normCode(code);
  if (!c || !password || String(password).length < 6) return json({ error: 'Nhập mã user và mật khẩu (tối thiểu 6 ký tự)' }, 400);
  await ensureSchema();
  const [{ n }] = await q('SELECT COUNT(*)::int AS n FROM ksnb_users');
  if (n > 0) return json({ error: 'Đã khởi tạo rồi. Vào trang đăng nhập.' }, 409);
  const hash = await bcrypt.hash(String(password), 10);
  await q('INSERT INTO ksnb_users (code, full_name, password_hash, is_admin) VALUES ($1, $2, $3, TRUE)', [c, String(full_name || '').trim(), hash]);
  return json({ ok: true });
}
