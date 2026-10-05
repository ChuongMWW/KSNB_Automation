// Quản trị: tải lên / ghi đè / xoá file quy trình (HTML, ảnh, PDF) vào các mục có sẵn
import { q, ensureSchema, CATS, TYPES, cleanName } from '../../lib/db.js';
import { currentUser, json, readJson } from '../../lib/auth.js';

const MAX_BYTES = 3 * 1024 * 1024; // giới hạn body 4.5MB của Vercel (base64 ~ +33%)

async function admin(request) {
  const u = await currentUser(request, q);
  if (!u) return [null, json({ error: 'Chưa đăng nhập' }, 401)];
  if (!u.is_admin) return [null, json({ error: 'Chỉ quản trị được dùng chức năng này' }, 403)];
  await ensureSchema();
  return [u, null];
}


export async function GET(request) {
  const [, err] = await admin(request); if (err) return err;
  const rows = await q('SELECT id, cat, filename, content_type, size_bytes, title, description, grp, uploaded_by, updated_at FROM ksnb_files ORDER BY cat, created_at');
  return json({ files: rows, cats: CATS });
}

// { cat, filename, data_b64, title?, description?, grp?, overwrite? }
export async function POST(request) {
  const [me, err] = await admin(request); if (err) return err;
  const b = await readJson(request);
  if (!CATS[b.cat]) return json({ error: 'Mục không hợp lệ' }, 400);
  const filename = cleanName(b.filename);
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (!filename || !TYPES[ext] || filename === 'index.html') return json({ error: 'Tên file không hợp lệ (chỉ nhận .html, ảnh png/jpg/gif/webp/svg, pdf; không được đặt tên index.html)' }, 400);
  const data = String(b.data_b64 || '');
  const size = Math.floor(data.length * 3 / 4);
  if (!data) return json({ error: 'File rỗng' }, 400);
  if (size > MAX_BYTES) return json({ error: 'File quá lớn (tối đa 3 MB). Hãy nén ảnh hoặc tách nhỏ.' }, 413);
  const isHtml = ext === 'html' || ext === 'htm';
  let title = String(b.title || '').trim();
  if (isHtml && !title) {
    const m = Buffer.from(data, 'base64').toString('utf8').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    title = m ? m[1].replace(/\s+/g, ' ').trim() : filename;
  }
  const [ex] = await q('SELECT id FROM ksnb_files WHERE cat = $1 AND filename = $2', [b.cat, filename]);
  if (ex && !b.overwrite) return json({ error: `File ${filename} đã có trong mục này`, exists: true }, 409);
  if (ex) {
    await q(`UPDATE ksnb_files SET content_type=$2, data_b64=$3, size_bytes=$4, title=$5, description=$6, grp=$7, uploaded_by=$8, updated_at=NOW() WHERE id=$1`,
      [ex.id, TYPES[ext], data, size, title, String(b.description || '').trim(), String(b.grp || '').trim(), me.code]);
  } else {
    await q(`INSERT INTO ksnb_files (cat, filename, content_type, data_b64, size_bytes, title, description, grp, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [b.cat, filename, TYPES[ext], data, size, title, String(b.description || '').trim(), String(b.grp || '').trim(), me.code]);
  }
  return json({ ok: true, filename, url: `/${b.cat}/${filename}`, replaced: !!ex });
}

// Sửa thông tin hiển thị: { id, title?, description?, grp? }
export async function PATCH(request) {
  const [, err] = await admin(request); if (err) return err;
  const b = await readJson(request);
  for (const k of ['title', 'description', 'grp']) {
    if (typeof b[k] === 'string') await q(`UPDATE ksnb_files SET ${k} = $2, updated_at = NOW() WHERE id = $1`, [Number(b.id), b[k].trim()]);
  }
  return json({ ok: true });
}

export async function DELETE(request) {
  const [, err] = await admin(request); if (err) return err;
  await q('DELETE FROM ksnb_files WHERE id = $1', [Number(new URL(request.url).searchParams.get('id'))]);
  return json({ ok: true });
}
