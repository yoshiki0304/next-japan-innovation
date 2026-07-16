(() => {
  'use strict';
  const grid = document.querySelector('[data-column-grid]');
  if (!grid) return;
  const status = document.querySelector('[data-column-status]');
  const setup = document.querySelector('[data-column-setup]');
  const modal = document.querySelector('[data-column-modal]');
  const modalContent = document.querySelector('[data-column-modal-content]');
  const config = window.NEXTJI_COLUMN_CONFIG || {};
  const blogUrl = String(config.blogUrl || '').replace(/\/$/, '');
  const maxPosts = Number(config.maxPosts) || 12;
  const isConfigured = blogUrl && !blogUrl.includes('YOUR-BLOG-NAME');

  const stripHtml = (html = '') => {
    const el = document.createElement('div'); el.innerHTML = html;
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const firstImage = (entry) => {
    if (entry.media$thumbnail?.url) return entry.media$thumbnail.url.replace(/\/s72-c\//, '/s1200/');
    const el = document.createElement('div'); el.innerHTML = entry.content?.$t || '';
    return el.querySelector('img')?.src || 'assets/images/service-data.webp';
  };
  const formatDate = (value) => new Intl.DateTimeFormat('ja-JP', {year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
  const escapeHtml = (s='') => s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const openPost = (entry) => {
    const title = entry.title?.$t || 'コラム';
    const date = formatDate(entry.published?.$t || Date.now());
    const labels = (entry.category || []).map(c => c.term).filter(Boolean);
    modalContent.innerHTML = `<p class="column-modal__date">${date}</p><h2>${escapeHtml(title)}</h2>${labels.length ? `<div class="column-modal__labels">${labels.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}<div class="column-modal__body">${entry.content?.$t || ''}</div>`;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  };
  document.querySelectorAll('[data-column-close]').forEach(el => el.addEventListener('click', () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) modal.querySelector('[data-column-close]').click(); });

  window.nextjiColumnFeed = (data) => {
    const entries = data?.feed?.entry || [];
    status.hidden = true;
    if (!entries.length) { status.hidden = false; status.textContent = '現在、公開中の記事はありません。'; return; }
    entries.slice(0,maxPosts).forEach((entry, i) => {
      const card = document.createElement('article');
      card.className = 'column-card reveal is-visible';
      const title = entry.title?.$t || 'コラム';
      const excerpt = stripHtml(entry.content?.$t || '').slice(0, 110);
      const labels = (entry.category || []).map(c => c.term).filter(Boolean).slice(0,2);
      card.innerHTML = `<button type="button" class="column-card__button"><div class="column-card__image"><img src="${firstImage(entry)}" alt="${escapeHtml(title)}" loading="lazy"></div><div class="column-card__body"><div class="column-card__meta"><time>${formatDate(entry.published?.$t || Date.now())}</time>${labels.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(excerpt)}${excerpt.length >= 110 ? '…':''}</p><span class="column-card__more">READ MORE <i>↗</i></span></div></button>`;
      card.querySelector('button').addEventListener('click', () => openPost(entry));
      grid.appendChild(card);
    });
  };

  if (!isConfigured) {
    status.textContent = 'コラム連携を設定すると、Bloggerの投稿がここに自動表示されます。';
    setup.hidden = false;
    return;
  }
  const script = document.createElement('script');
  script.src = `${blogUrl}/feeds/posts/default?alt=json-in-script&max-results=${encodeURIComponent(maxPosts)}&callback=nextjiColumnFeed`;
  script.onerror = () => { status.textContent = '記事を読み込めませんでした。Bloggerの公開設定とURLをご確認ください。'; setup.hidden = false; };
  document.head.appendChild(script);
})();
