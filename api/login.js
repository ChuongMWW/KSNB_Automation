import bcrypt from 'bcryptjs';
import { q, ensureSchema } from '../lib/db.js';
import { signSession, sessionCookie, json, readJson, normCode } from '../lib/auth.js';

const MAX_FAIL = 5, LOCK_MIN = 10;
// Hash giả để thời gian phản hồi giống nhau khi mã user không tồn tại
const DUMMY = '$2a$10$kjAJ9m2Mj0SDDuqq6Ytd8uYHLbsOSnJyydwbSDhvsX9FqR1hBrH.e';

export async function POST(request) {
  const { code, password } = await readJson(request);
  const c = normCode(code);
  if (!c || !password) return json({ error: 'Nhập mã user và mật khẩu' }, 400);
  await ensureSchema();
  const rows = await q('SELECT * FROM ksnb_users WHERE code = $1', [c]);
  const u = rows[0];
  if (u && u.locked_until && new Date(u.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(u.locked_until) - new Date()) / 60000);
    return json({ error: `Sai mật khẩu quá nhiều lần. Thử lại sau ${mins} phút.` }, 429);
  }
  const ok = await bcrypt.compare(String(password), u ? u.password_hash : DUMMY);
  if (!u || !ok) {
    if (u) {
      const fc = u.failed_count + 1;
      if (fc >= MAX_FAIL) await q(`UPDATE ksnb_users SET failed_count = 0, locked_until = NOW() + INTERVAL '${LOCK_MIN} minutes' WHERE id = $1`, [u.id]);
      else await q('UPDATE ksnb_users SET failed_count = $2 WHERE id = $1', [u.id, fc]);
    }
    return json({ error: 'Mã user hoặc mật khẩu không đúng' }, 401);
  }
  if (!u.active) return json({ error: 'Tài khoản đã bị khoá. Liên hệ quản trị.' }, 403);
  await q('UPDATE ksnb_users SET failed_count = 0, locked_until = NULL, last_login = NOW() WHERE id = $1', [u.id]);
  const token = await signSession(u);
  return json({ ok: true, name: u.full_name, is_admin: u.is_admin }, 200, { 'set-cookie': sessionCookie(token) });
}
