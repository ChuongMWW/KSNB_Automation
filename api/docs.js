// Danh sách quy trình HTML đã tải lên (để trang danh mục & trang chủ tự hiển thị)
import { q, ensureSchema, CATS } from '../lib/db.js';
import { currentUser, json } from '../lib/auth.js';

export async function GET(request) {
  if (!(await currentUser(request, q))) return json({ error: 'Chưa đăng nhập' }, 401);
  await ensureSchema();
  const cat = new URL(request.url).searchParams.get('cat');
  const rows = cat && CATS[cat]
    ? await q(`SELECT cat, filename, title, description, grp, updated_at FROM ksnb_files WHERE cat = $1 AND content_type LIKE 'text/html%' ORDER BY created_at`, [cat])
    : await q(`SELECT cat, filename, title, description, grp, updated_at FROM ksnb_files WHERE content_type LIKE 'text/html%' ORDER BY created_at`);
  return json({ docs: rows });
}
