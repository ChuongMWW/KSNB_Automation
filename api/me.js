import { q } from '../lib/db.js';
import { currentUser, json } from '../lib/auth.js';
export async function GET(request) {
  const u = await currentUser(request, q);
  if (!u) return json({ error: 'Chưa đăng nhập' }, 401);
  return json({ code: u.code, name: u.full_name, is_admin: u.is_admin });
}
