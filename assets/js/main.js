/* =========================================================================
   main.js — shared across every page
   Handles: mobile nav, data loading, card rendering, category tiles,
   footer year, and small formatting helpers.
   No build step, no dependencies.
   ========================================================================= */

const SITE = {
  dataPath: () => (document.body.dataset.root || '') + 'data/articles.json',
};

/** Resolve a relative asset/link path against the page's declared root. */
function withRoot(path) {
  const root = document.body.dataset.root || '';
  return root + path;
}

/** Fetch and cache article metadata for the current page load. */
let _articlesCache = null;
async function loadArticles() {
  if (_articlesCache) return _articlesCache;
  const res = await fetch(SITE.dataPath());
  if (!res.ok) throw new Error('Could not load article index');
  const data = await res.json();
  data.sort((a, b) => new Date(b.date) - new Date(a.date));
  _articlesCache = data;
  return data;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const DIFFICULTY_DOT = { Easy: 'low', Medium: 'med', Hard: 'high', Critical: 'crit' };

/** Build the DOM for a single article card. `variant` = 'default' | 'featured' */
function renderCard(article, variant = 'default') {
  const el = document.createElement('article');
  el.className = 'article-card bracket-frame' + (variant === 'featured' ? ' featured-card' : '');
  const dot = DIFFICULTY_DOT[article.difficulty] || 'med';
  const href = withRoot(`articles/${article.slug}/index.html`);

  el.innerHTML = `
    <div class="thumb"><img src="${withRoot(article.thumbnail)}" alt="" loading="lazy" width="480" height="270"></div>
    <div class="meta-row">
      <span class="cat-pill">${escapeHtml(article.category)}</span>
      <span class="platform">${escapeHtml(article.platform)}</span>
    </div>
    <h3><a href="${href}">${escapeHtml(article.title)}</a></h3>
    <p class="desc">${escapeHtml(article.description)}</p>
    <div class="footer-row">
      <span><span class="status-dot ${dot}"></span>${escapeHtml(article.difficulty)} · ${escapeHtml(article.readingTime)}</span>
      <span>${formatDate(article.date)}</span>
    </div>
  `;
  return el;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/** Populate #featured-grid and #latest-grid on the homepage. */
async function renderHomeGrids() {
  const featuredGrid = document.getElementById('featured-grid');
  const latestGrid = document.getElementById('latest-grid');
  if (!featuredGrid && !latestGrid) return;

  try {
    const articles = await loadArticles();
    if (featuredGrid) {
      const featured = articles.filter(a => a.featured).slice(0, 2);
      featured.forEach(a => featuredGrid.appendChild(renderCard(a, 'featured')));
    }
    if (latestGrid) {
      articles.slice(0, 6).forEach(a => latestGrid.appendChild(renderCard(a)));
    }
  } catch (e) {
    console.error(e);
  }
}

/** Populate #category-grid with a live count per category. */
async function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  try {
    const articles = await loadArticles();
    const counts = {};
    articles.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
    const descriptions = {
      'Network Forensics': 'Packet captures, flow analysis, and reconstructing what happened on the wire.',
      'DFIR': 'Digital forensics and incident response, from first triage to root cause.',
      'Threat Hunting': 'Proactive searches for the activity your alerts didn\u2019t catch.',
      'Incident Response': 'Playbooks and post-incident notes from live and simulated engagements.',
      'Malware Analysis': 'Static and dynamic breakdowns of samples, loaders, and droppers.',
      'Web Security': 'Application-layer vulnerabilities and how they get exploited in practice.',
      'Active Directory': 'Domain attack paths, Kerberos abuse, and the detections that catch them.',
      'Cloud Security': 'Misconfigurations and identity issues across cloud environments.',
      'SOC': 'Process, tooling, and triage notes from the analyst seat.',
    };
    Object.keys(counts).sort().forEach(cat => {
      const tile = document.createElement('a');
      tile.className = 'cat-tile bracket-frame';
      tile.href = withRoot(`search.html?category=${encodeURIComponent(cat)}`);
      tile.innerHTML = `
        <span class="count mono-label">${counts[cat]} article${counts[cat] === 1 ? '' : 's'}</span>
        <h3>${escapeHtml(cat)}</h3>
        <p style="margin:0;color:var(--text-dim);font-size:13px;">${escapeHtml(descriptions[cat] || '')}</p>
      `;
      grid.appendChild(tile);
    });
  } catch (e) {
    console.error(e);
  }
}

/** Mobile hamburger nav */
function initNavToggle() {
  const btn = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

/** Cmd/Ctrl+K jumps to the search page from anywhere. */
function initSearchShortcut() {
  const btn = document.querySelector('.nav-search-btn');
  if (btn) btn.addEventListener('click', () => { window.location.href = withRoot('search.html'); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.location.href = withRoot('search.html');
    }
  });
}

function setFooterYear() {
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initSearchShortcut();
  setFooterYear();
  renderHomeGrids();
  renderCategoryGrid();
});
