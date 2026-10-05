import bcrypt from 'bcryptjs';
import { q } from '../lib/db.js';
import { currentUser, json, readJson, signSession, sessionCookie } from '../lib/auth.js';
export async function POST(request) {
  const u = await currentUser(request, q);
  if (!u) return json({ error: 'Chưa đăng nhập' }, 401);
  const { old_password, new_password } = await readJson(request);
  if (!new_password || String(new_password).length < 6) return json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' }, 400);
  const [row] = await q('SELECT password_hash FROM ksnb_users WHERE id = $1', [u.id]);
  if (!(await bcrypt.compare(String(old_password || ''), row.password_hash))) return json({ error: 'Mật khẩu hiện tại không đúng' }, 400);
  const hash = await bcrypt.hash(String(new_password), 10);
  const [nu] = await q('UPDATE ksnb_users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1 RETURNING id, code, full_name, is_admin, token_version', [u.id, hash]);
  // Đăng xuất các thiết bị khác, giữ phiên hiện tại
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await signSession(nu)) });
}
