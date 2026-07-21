/* =========================================================================
   article.js — runs on individual article pages only
   Builds the table of contents from real headings, wires up copy-code
   buttons, and renders prev/next + related cards from articles.json.
   ========================================================================= */

(function () {
  const content = document.querySelector('.article-content');
  if (!content) return;

  buildToc();
  wireCopyButtons();
  wireRelatedNav();
})();

function buildToc() {
  const tocList = document.getElementById('toc-list');
  const content = document.querySelector('.article-content');
  if (!tocList || !content) return;

  const headings = content.querySelectorAll('h2, h3');
  if (headings.length === 0) {
    document.querySelector('.toc')?.remove();
    return;
  }

  headings.forEach((h, i) => {
    if (!h.id) h.id = slugify(h.textContent) || `section-${i}`;
    const li = document.createElement('li');
    if (h.tagName === 'H3') li.className = 'toc-h3';
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    li.appendChild(a);
    tocList.appendChild(li);
  });

  const links = [...tocList.querySelectorAll('a')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-90px 0px -70% 0px' });

  headings.forEach(h => observer.observe(h));
}

function slugify(text) {
  return (text || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function wireCopyButtons() {
  document.querySelectorAll('.code-block').forEach(block => {
    const btn = block.querySelector('.copy-btn');
    const code = block.querySelector('pre');
    if (!btn || !code) return;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1600);
      } catch (e) {
        console.error('Copy failed', e);
      }
    });
  });
}

async function wireRelatedNav() {
  const prevSlot = document.getElementById('prev-article');
  const nextSlot = document.getElementById('next-article');
  const relatedSlot = document.getElementById('related-grid');
  if (!prevSlot && !nextSlot && !relatedSlot) return;

  const slug = document.body.dataset.slug;
  try {
    const articles = await loadArticles();
    const idx = articles.findIndex(a => a.slug === slug);
    const current = articles[idx];

    if (prevSlot) renderNavLink(prevSlot, articles[idx + 1], 'Previous');
    if (nextSlot) renderNavLink(nextSlot, articles[idx - 1], 'Next');

    if (relatedSlot && current) {
      const related = articles
        .filter(a => a.slug !== slug && (a.category === current.category || a.tags.some(t => current.tags.includes(t))))
        .slice(0, 3);
      related.forEach(a => relatedSlot.appendChild(renderCard(a)));
    }
  } catch (e) {
    console.error(e);
  }
}

function renderNavLink(slot, article, label) {
  if (!article) { slot.style.visibility = 'hidden'; return; }
  const isNext = label === 'Next';
  slot.className = isNext ? 'next' : '';
  slot.innerHTML = `
    <div class="dir">${isNext ? 'Next \u2192' : '\u2190 Previous'}</div>
    <strong>${article.title}</strong>
  `;
  slot.href = withRoot(`articles/${article.slug}/index.html`);
}
