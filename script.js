(function () {
  const feed = document.getElementById('feed');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sortSelect');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const totalCountEl = document.getElementById('totalCount');
  const toTopBtn = document.getElementById('toTop');
  const toolbar = document.getElementById('toolbar');

  totalCountEl.textContent = MARTYRS.length;

  // Stable id per record = its original position in the sheet. Used for
  // routing (#/<id>) so every entry is its own separate, linkable page.
  MARTYRS.forEach((m, i) => { m.id = i; });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function imageUrl(value) {
    const markdownImage = String(value).match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
    return markdownImage ? markdownImage[1] : value;
  }

  function sortRecords(list, mode) {
    const arr = list.slice();
    if (mode === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (mode === 'month') {
      arr.sort((a, b) => (a.monthIdx - b.monthIdx) || (a.day - b.day));
    }
    return arr;
  }

  function matches(m, q) {
    if (!q) return true;
    const hay = [m.name, m.date, ...m.points.map(p => p.k + ' ' + p.v)]
      .join(' ')
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  }

  function miniCardHTML(m) {
    return `
      <article class="mini-card" data-id="${m.id}" tabindex="0" role="button" aria-label="افتح سيرة ${escapeHtml(m.name)}">
        <div class="mini-thumb">
          <img src="${escapeHtml(imageUrl(m.image))}" alt="" loading="lazy" onerror="this.parentElement.classList.add('img-fallback')">
        </div>
        <div class="mini-name">${escapeHtml(m.name)}</div>
        <div class="mini-date">${escapeHtml(m.date)}</div>
      </article>
    `;
  }

  function fullCardHTML(m) {
    const pointsHTML = m.points.map(p => `
      <div class="point-row">
        <div class="point-badge"><span>${escapeHtml(p.k)}</span></div>
        <span class="dot"></span>
        <div class="point-bubble"><p>${escapeHtml(p.v)}</p></div>
      </div>
    `).join('');

    return `
      <article class="card">
        <div class="card-header">
          <div class="card-banner">
            <h2 class="card-title">${escapeHtml(m.name)}</h2>
            <span class="card-date">${escapeHtml(m.date)}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-image">
            <img src="${escapeHtml(imageUrl(m.image))}" alt="${escapeHtml(m.name)}" loading="lazy"
                 onerror="this.parentElement.classList.add('img-fallback')">
          </div>
          <div class="card-points">
            ${pointsHTML}
          </div>
        </div>
      </article>
    `;
  }

  function renderList() {
    toolbar.classList.remove('hidden');
    const q = searchInput.value.trim();
    const mode = sortSelect.value;
    let list = MARTYRS.filter(m => matches(m, q));
    list = sortRecords(list, mode);

    if (list.length === 0) {
      feed.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      feed.innerHTML = `<div class="list-grid">${list.map(miniCardHTML).join('')}</div>`;
      feed.querySelectorAll('.mini-card').forEach(el => {
        const go = () => { location.hash = '#/' + el.dataset.id; };
        el.addEventListener('click', go);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
        });
      });
    }

    resultCount.textContent = q
      ? `عرض ${list.length} من ${MARTYRS.length}`
      : `${MARTYRS.length} سيرة`;

    document.title = 'شهداء النيروز — أسماء وسير';
  }

  function renderDetail(id) {
    const m = MARTYRS.find(r => r.id === id);
    if (!m) { location.hash = ''; return; }

    toolbar.classList.add('hidden');
    emptyState.classList.add('hidden');

    const idx = MARTYRS.indexOf(m);
    const prevId = MARTYRS[(idx - 1 + MARTYRS.length) % MARTYRS.length].id;
    const nextId = MARTYRS[(idx + 1) % MARTYRS.length].id;

    feed.innerHTML = `
      <div class="detail-nav">
        <a class="back-link" href="#" id="backLink">→ كل السير</a>
        <span class="nav-position">${idx + 1} من ${MARTYRS.length}</span>
        <div class="nav-btns">
          <button class="nav-btn" id="prevBtn">السابق</button>
          <button class="nav-btn" id="nextBtn">التالي</button>
        </div>
      </div>
      ${fullCardHTML(m)}
    `;

    document.getElementById('backLink').addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = '';
    });
    document.getElementById('prevBtn').addEventListener('click', () => { location.hash = '#/' + prevId; });
    document.getElementById('nextBtn').addEventListener('click', () => { location.hash = '#/' + nextId; });

    document.title = m.name + ' — شهداء النيروز';
    window.scrollTo(0, 0);
  }

  function route() {
    const hash = location.hash;
    const m = hash.match(/^#\/(\d+)$/);
    if (m) {
      renderDetail(Number(m[1]));
    } else {
      renderList();
    }
  }

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderList, 120);
  });
  sortSelect.addEventListener('change', renderList);

  window.addEventListener('hashchange', route);

  window.addEventListener('scroll', () => {
    toTopBtn.classList.toggle('visible', window.scrollY > 500);
  });
  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  route();
})();
