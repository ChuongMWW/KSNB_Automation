// Phục vụ file quy trình đã tải lên (lưu trong Neon). Được gọi qua rewrite trong vercel.json
// khi URL /<mục>/<file> không có file tĩnh tương ứng.
import { q, ensureSchema, CATS } from '../lib/db.js';
import { currentUser } from '../lib/auth.js';

export async function GET(request) {
  const u = new URL(request.url);
  const cat = u.searchParams.get('cat') || '', file = u.searchParams.get('file') || '';
  const notFound = () => new Response('<!doctype html><meta charset="utf-8"><title>404</title><p style="font-family:sans-serif;padding:40px">Không tìm thấy tài liệu. <a href="/index.html">Về trang chủ</a></p>',
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  if (!CATS[cat]) return notFound();
  if (!(await currentUser(request, q))) {
    return new Response(null, { status: 302, headers: { location: '/login.html?next=' + encodeURIComponent(`/${cat}/${file}`) } });
  }
  await ensureSchema();
  const [f] = await q('SELECT content_type, data_b64 FROM ksnb_files WHERE cat = $1 AND filename = $2', [cat, file]);
  if (!f) return notFound();
  let body = Buffer.from(f.data_b64, 'base64');
  if (f.content_type.startsWith('text/html')) {
    let html = body.toString('utf8');
    if (!html.includes('auth-bar.js')) {
      const tag = '<script src="/auth-bar.js" defer></script>';
      const i = html.toLowerCase().lastIndexOf('</body>');
      html = i >= 0 ? html.slice(0, i) + tag + html.slice(i) : html + tag;
    }
    body = Buffer.from(html, 'utf8');
  }
  return new Response(body, { headers: { 'content-type': f.content_type, 'cache-control': 'private, no-cache' } });
}
export const HEAD = GET;
