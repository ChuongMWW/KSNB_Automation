import { clearCookie } from '../lib/auth.js';
export function GET() {
  return new Response(null, { status: 302, headers: { location: '/login.html', 'set-cookie': clearCookie(), 'cache-control': 'no-store' } });
}
export const POST = GET;
