// Hiển thị các quy trình đã tải lên (lưu trong Neon) vào trang danh mục & trang chủ.
(function () {
  if (location.protocol === 'file:') return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const CATS = ['CE_Gia_dung', 'Tho_DMX', 'ICT/Android', 'ICT/IOS', 'ICT/Windows', 'Giao_hang_lap_dat', 'Bao_duong_dinh_ky', 'Xay_dung_bao_tri'];
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const cat = CATS.find(c => path === '/' + c + '/');
  const isHome = path === '/' ;
  if (!cat && !isHome) return;

  fetch('/api/docs' + (cat ? '?cat=' + encodeURIComponent(cat) : ''), { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !d.docs || !d.docs.length) return;
      if (cat) renderCategory(d.docs); else renderHome(d.docs);
    }).catch(() => {});

  function renderCategory(docs) {
    const box = document.getElementById('docContainer'); if (!box) return;
    box.querySelectorAll('.ksnb-empty').forEach(e => e.remove());
    const defName = box.dataset.defaultGroup || '🆕 Quy trình bổ sung';
    let extra = null;
    for (const doc of docs) {
      const groups = [...box.querySelectorAll('.category-group')];
      let g = doc.grp && groups.find(x => norm(x.querySelector('.category-header')?.textContent) === norm(doc.grp));
      if (!g && doc.grp) {
        g = document.createElement('div'); g.className = 'category-group'; g.dataset.ksnbExtra = '1';
        g.innerHTML = `<div class="category-header">${esc(doc.grp)}</div><div class="doc-list"></div>`;
        box.appendChild(g);
      }
      if (!g) {
        if (!extra) {
          extra = document.createElement('div'); extra.className = 'category-group'; extra.dataset.ksnbExtra = '1';
          extra.innerHTML = `<div class="category-header">${esc(defName)}</div><div class="doc-list"></div>`;
          box.appendChild(extra);
        }
        g = extra;
      }
      const list = g.querySelector('.doc-list') || g;
      list.querySelectorAll('.empty-placeholder').forEach(e => e.remove());
      const a = document.createElement('a');
      a.className = 'doc-item'; a.href = doc.filename;
      a.dataset.search = (doc.title + ' ' + doc.description + ' ' + doc.filename).toLowerCase();
      a.innerHTML = `<div class="doc-info"><div class="doc-icon">📄</div><div>
        <span class="doc-tag">Mới cập nhật</span><h3>${esc(doc.title || doc.filename)}</h3>${doc.description ? `<p>${esc(doc.description)}</p>` : ''}
        </div></div><div class="doc-btn">Xem quy trình →</div>`;
      list.appendChild(a);
    }
    // Ô tìm kiếm có sẵn chỉ biết các nhóm lúc tải trang -> tự lọc thêm các nhóm mới tạo
    const search = document.getElementById('search');
    if (search) search.addEventListener('input', () => {
      const k = search.value.trim().toLowerCase();
      box.querySelectorAll('.category-group[data-ksnb-extra]').forEach(g => {
        let n = 0;
        g.querySelectorAll('.doc-item').forEach(it => {
          const show = !k || (it.innerText + ' ' + (it.dataset.search || '')).toLowerCase().includes(k);
          it.style.display = show ? 'flex' : 'none'; if (show) n++;
        });
        g.style.display = n ? 'block' : 'none';
      });
      const nr = document.getElementById('noResult');
      if (nr && k && [...box.querySelectorAll('.doc-item')].some(x => x.style.display !== 'none')) nr.style.display = 'none';
    });
  }

  function renderHome(docs) {
    for (const doc of docs) {
      const top = document.querySelector(`a.card-top[href="${doc.cat}/index.html"]`);
      const ul = top && top.closest('.card') && top.closest('.card').querySelector('.sublist');
      if (!ul) continue;
      const li = document.createElement('li');
      li.innerHTML = `<a href="${esc(doc.cat)}/${esc(doc.filename)}"><span class="arrow">→</span> ${esc(doc.title || doc.filename)} <span class="tag-new">Mới</span></a>`;
      const all = [...ul.children].reverse().find(x => x.querySelector(`a[href="${doc.cat}/index.html"]`));
      ul.insertBefore(li, all || null);
      const card = top.closest('.card');
      card.dataset.search = (card.dataset.search || '') + ' ' + (doc.title || '').toLowerCase();
    }
  }
})();
