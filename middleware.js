// Vercel Routing Middleware: chặn mọi trang/ảnh khi chưa đăng nhập
import { verifySession, signSession, getCookie, sessionCookie, clearCookie, RECHECK_SECONDS } from './lib/auth.js';
import { q } from './lib/db.js';

export const config = {
  // Bỏ qua: API, trang đăng nhập, trang khởi tạo admin, favicon
  matcher: ['/((?!api/|login|setup|favicon\\.ico).*)'],
};

function next(headers) {
  const h = new Headers(headers || {});
  h.set('x-middleware-next', '1');
  return new Response(null, { headers: h });
}

function deny(request, clear) {
  const url = new URL(request.url);
  const isPage = (request.headers.get('accept') || '').includes('text/html');
  const headers = new Headers({ 'cache-control': 'no-store' });
  if (clear) headers.append('set-cookie', clearCookie());
  if (isPage) {
    headers.set('location', '/login.html?next=' + encodeURIComponent(url.pathname + url.search));
    return new Response(null, { status: 302, headers });
  }
  return new Response('Unauthorized', { status: 401, headers });
}

export default async function middleware(request) {
  const token = getCookie(request);
  const s = await verifySession(token);
  if (!s) return deny(request, !!token);

  const now = Math.floor(Date.now() / 1000);
  if (now - (s.chk || 0) < RECHECK_SECONDS) return next();

  // Đến hạn kiểm tra lại: user còn hoạt động & chưa đổi mật khẩu/đăng xuất mọi nơi?
  try {
    const rows = await q('SELECT id, code, full_name, is_admin, active, token_version FROM ksnb_users WHERE id = $1', [s.uid]);
    const u = rows[0];
    if (!u || !u.active || u.token_version !== s.tv) return deny(request, true);
    return next({ 'set-cookie': sessionCookie(await signSession(u)) });
  } catch (e) {
    // DB tạm lỗi: vẫn cho xem với phiên hợp lệ, lần sau kiểm tra lại
    return next();
  }
}
