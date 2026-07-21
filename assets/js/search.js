/* =========================================================================
   search.js — client-side search, runs only on search.html
   Matches on title, platform, category, tags, and description.
   No backend, no build step.
   ========================================================================= */

(function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const chipsWrap = document.getElementById('filter-chips');
  if (!input || !results) return;

  let allArticles = [];
  let activeCategory = null;

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('category');
  const initialQuery = params.get('q');

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${q})`, 'ig'), '<mark>$1</mark>');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function matches(article, query) {
    if (activeCategory && article.category !== activeCategory) return false;
    if (!query) return true;
    const haystack = [
      article.title, article.platform, article.category, article.description,
      ...(article.tags || []),
    ].join(' ').toLowerCase();
    return query.toLowerCase().split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
  }

  function render() {
    const query = input.value.trim();
    const matched = allArticles.filter(a => matches(a, query));
    results.innerHTML = '';

    if (matched.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = 'No results. Try a different keyword, platform, or category.';
      results.appendChild(empty);
      return;
    }

    matched.forEach(a => {
      const row = document.createElement('a');
      row.className = 'result-row';
      row.href = withRoot(`articles/${a.slug}/index.html`);
      row.innerHTML = `
        <div>
          <h3>${highlight(a.title, query)}</h3>
          <p>${highlight(a.description, query)}</p>
        </div>
        <div class="result-meta">${escapeHtml(a.category)} · ${escapeHtml(a.platform)}</div>
      `;
      results.appendChild(row);
    });
  }

  function renderChips() {
    const categories = [...new Set(allArticles.map(a => a.category))].sort();
    chipsWrap.innerHTML = '';
    const allChip = makeChip('All', null);
    chipsWrap.appendChild(allChip);
    categories.forEach(cat => chipsWrap.appendChild(makeChip(cat, cat)));
    updateChipState();
  }

  function makeChip(label, value) {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.value = value ?? '';
    btn.addEventListener('click', () => {
      activeCategory = value;
      updateChipState();
      render();
    });
    return btn;
  }

  function updateChipState() {
    chipsWrap.querySelectorAll('.filter-chip').forEach(chip => {
      const isActive = (chip.dataset.value || null) === activeCategory;
      chip.setAttribute('aria-pressed', String(isActive));
    });
  }

  loadArticles().then(data => {
    allArticles = data;
    renderChips();
    if (initialCategory) activeCategory = initialCategory;
    if (initialQuery) input.value = initialQuery;
    updateChipState();
    render();
    input.focus({ preventScroll: true });
  });

  input.addEventListener('input', render);
})();
