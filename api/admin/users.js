import bcrypt from 'bcryptjs';
import { q } from '../../lib/db.js';
import { currentUser, json, readJson, normCode } from '../../lib/auth.js';

async function admin(request) {
  const u = await currentUser(request, q);
  if (!u) return [null, json({ error: 'Chưa đăng nhập' }, 401)];
  if (!u.is_admin) return [null, json({ error: 'Chỉ quản trị được dùng chức năng này' }, 403)];
  return [u, null];
}

export async function GET(request) {
  const [, err] = await admin(request); if (err) return err;
  const rows = await q('SELECT id, code, full_name, is_admin, active, last_login, created_at FROM ksnb_users ORDER BY code');
  return json({ users: rows });
}

// Thêm user (một hoặc nhiều): { users: [{code, full_name, password, is_admin}] }
export async function POST(request) {
  const [, err] = await admin(request); if (err) return err;
  const body = await readJson(request);
  const list = Array.isArray(body.users) ? body.users : [body];
  const created = [], errors = [];
  for (const it of list) {
    const c = normCode(it.code);
    const pw = String(it.password || '');
    if (!c) { errors.push('Thiếu mã user'); continue; }
    if (pw.length < 6) { errors.push(`${c}: mật khẩu tối thiểu 6 ký tự`); continue; }
    const exists = await q('SELECT 1 FROM ksnb_users WHERE code = $1', [c]);
    if (exists.length) { errors.push(`${c}: đã tồn tại`); continue; }
    await q('INSERT INTO ksnb_users (code, full_name, password_hash, is_admin) VALUES ($1, $2, $3, $4)',
      [c, String(it.full_name || '').trim(), await bcrypt.hash(pw, 10), !!it.is_admin]);
    created.push(c);
  }
  return json({ created, errors }, errors.length && !created.length ? 400 : 200);
}

// Sửa user: { id, full_name?, active?, is_admin?, password? }
export async function PATCH(request) {
  const [me, err] = await admin(request); if (err) return err;
  const b = await readJson(request);
  const id = Number(b.id);
  const [u] = await q('SELECT * FROM ksnb_users WHERE id = $1', [id]);
  if (!u) return json({ error: 'Không tìm thấy user' }, 404);
  if (id === me.id && (b.active === false || b.is_admin === false)) return json({ error: 'Không thể tự khoá / tự bỏ quyền quản trị của chính mình' }, 400);
  let bump = false;
  if (typeof b.full_name === 'string') await q('UPDATE ksnb_users SET full_name = $2 WHERE id = $1', [id, b.full_name.trim()]);
  if (typeof b.is_admin === 'boolean') { await q('UPDATE ksnb_users SET is_admin = $2 WHERE id = $1', [id, b.is_admin]); bump = true; }
  if (typeof b.active === 'boolean') { await q('UPDATE ksnb_users SET active = $2, failed_count = 0, locked_until = NULL WHERE id = $1', [id, b.active]); bump = true; }
  if (b.password) {
    if (String(b.password).length < 6) return json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, 400);
    await q('UPDATE ksnb_users SET password_hash = $2, failed_count = 0, locked_until = NULL WHERE id = $1', [id, await bcrypt.hash(String(b.password), 10)]);
    bump = true;
  }
  if (bump && id !== me.id) await q('UPDATE ksnb_users SET token_version = token_version + 1 WHERE id = $1', [id]);
  return json({ ok: true });
}

export async function DELETE(request) {
  const [me, err] = await admin(request); if (err) return err;
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (id === me.id) return json({ error: 'Không thể xoá chính mình' }, 400);
  await q('DELETE FROM ksnb_users WHERE id = $1', [id]);
  return json({ ok: true });
}
