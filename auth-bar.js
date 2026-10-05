// Thanh tài khoản nhỏ góc trên phải: tên user, đổi mật khẩu, quản lý user (admin), đăng xuất.
(function () {
  if (location.protocol === 'file:' || window.__ksnbAuthBar) return;
  window.__ksnbAuthBar = 1;
  fetch('/api/me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(me => {
    if (!me) return;
    const css = `#ksnb-ab{position:fixed;bottom:16px;left:16px;z-index:99999;font:13px "Segoe UI",Roboto,sans-serif}
#ksnb-ab .b{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.96);border:1px solid #dce3ee;border-radius:999px;padding:5px 12px 5px 6px;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer;color:#172033}
#ksnb-ab .av{width:24px;height:24px;border-radius:50%;background:#12358f;color:#ffd200;display:grid;place-items:center;font-weight:800;font-size:12px}
#ksnb-ab .m{display:none;position:absolute;left:0;bottom:40px;background:#fff;border:1px solid #dce3ee;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);min-width:200px;overflow:hidden}
#ksnb-ab.open .m{display:block}
#ksnb-ab .m div{padding:10px 14px;color:#667085;border-bottom:1px solid #eef1f6}
#ksnb-ab .m a{display:block;padding:10px 14px;color:#172033;text-decoration:none}
#ksnb-ab .m a:hover{background:#f3f6fb}
@media print{#ksnb-ab{display:none}}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'ksnb-ab';
    const nm = (me.name || me.code).replace(/[<>&"]/g, '');
    el.innerHTML = `<div class="b"><span class="av">${(nm[0] || '?').toUpperCase()}</span><span>${me.code.replace(/[<>&"]/g, '')}</span></div>
      <div class="m"><div>${nm}</div>
      <a href="#" data-k="pw">🔑 Đổi mật khẩu</a>
      ${me.is_admin ? '<a href="/admin.html">⚙️ Quản trị (quy trình &amp; user)</a>' : ''}
      <a href="/api/logout">🚪 Đăng xuất</a></div>`;
    document.body.appendChild(el);
    el.querySelector('.b').onclick = e => { e.stopPropagation(); el.classList.toggle('open'); };
    document.addEventListener('click', () => el.classList.remove('open'));
    el.querySelector('[data-k=pw]').onclick = async e => {
      e.preventDefault();
      const o = prompt('Mật khẩu hiện tại:'); if (o === null) return;
      const n = prompt('Mật khẩu mới (≥ 6 ký tự):'); if (!n) return;
      if (prompt('Nhập lại mật khẩu mới:') !== n) return alert('Hai lần nhập không khớp');
      const r = await fetch('/api/change-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ old_password: o, new_password: n }) });
      const d = await r.json().catch(() => ({}));
      alert(r.ok ? 'Đã đổi mật khẩu. Các thiết bị khác sẽ bị đăng xuất.' : (d.error || 'Lỗi'));
    };
  }).catch(() => {});
})();
