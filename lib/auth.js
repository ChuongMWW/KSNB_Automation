import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'ksnb_session';
export const SESSION_DAYS = 30;
// Bao lâu middleware kiểm tra lại DB một lần (để khoá user / đổi mật khẩu có hiệu lực nhanh)
export const RECHECK_SECONDS = Number(process.env.AUTH_RECHECK_SECONDS || 300);

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET chưa đặt hoặc quá ngắn (>= 16 ký tự)');
  return new TextEncoder().encode(s);
}

export async function signSession(u) {
  return new SignJWT({ uid: u.id, code: u.code, name: u.full_name, adm: !!u.is_admin, tv: u.token_version, chk: Math.floor(Date.now() / 1000) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token) {
  if (!token) return null;
  try { return (await jwtVerify(token, key(), { algorithms: ['HS256'] })).payload; }
  catch { return null; }
}

export function getCookie(request, name = COOKIE) {
  const h = request.headers.get('cookie') || '';
  for (const part of h.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
  });
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

// Dùng trong API: lấy user hiện tại (kiểm tra lại DB để chắc chắn còn hoạt động)
export async function currentUser(request, q) {
  const s = await verifySession(getCookie(request));
  if (!s) return null;
  const rows = await q('SELECT id, code, full_name, is_admin, active, token_version FROM ksnb_users WHERE id = $1', [s.uid]);
  const u = rows[0];
  if (!u || !u.active || u.token_version !== s.tv) return null;
  return u;
}

export function normCode(c) { return String(c || '').trim().toUpperCase(); }
