(() => {
  'use strict';
  const list = document.querySelector('[data-news-list]');
  if (!list) return;
  const search = document.querySelector('[data-news-search]');
  const categoryWrap = document.querySelector('[data-news-categories]');
  const pagination = document.querySelector('[data-news-pagination]');
  const all = [...(window.NEXTJI_NEWS_DATA || [])].sort((a,b)=>b.date.localeCompare(a.date));
  const perPage = 4;
  let activeCategory = 'すべて';
  let query = '';
  let page = 1;

  const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatDate = value => value.replaceAll('-','.');
  const filtered = () => all.filter(item => {
    const categoryOK = activeCategory === 'すべて' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    const textOK = !q || `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(q);
    return categoryOK && textOK;
  });

  function render(){
    const items = filtered();
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    if (page > totalPages) page = totalPages;
    const shown = items.slice((page-1)*perPage, page*perPage);
    list.innerHTML = shown.length ? shown.map((item,i)=>`<article class="news-row reveal is-visible" style="--news-index:${i}">
      <a href="news-detail.html?id=${encodeURIComponent(item.id)}" class="news-row__link">
        <div class="news-row__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
        <div class="news-row__meta"><time datetime="${item.date}">${formatDate(item.date)}</time><span>${escapeHtml(item.category)}</span></div>
        <div class="news-row__copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt)}</p></div>
        <span class="news-row__arrow" aria-hidden="true">↗</span>
      </a>
    </article>`).join('') : '<p class="news-empty">該当する記事はありません。</p>';
    pagination.innerHTML = Array.from({length:totalPages},(_,i)=>i+1).map(n=>`<button type="button" class="${n===page?'is-active':''}" data-page="${n}" aria-label="${n}ページ目">${n}</button>`).join('');
    pagination.hidden = items.length <= perPage;
  }

  categoryWrap?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-category]'); if(!btn) return;
    categoryWrap.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active'); activeCategory=btn.dataset.category; page=1; render();
  });
  search?.addEventListener('input', e=>{ query=e.target.value; page=1; render(); });
  pagination?.addEventListener('click', e=>{ const btn=e.target.closest('[data-page]'); if(!btn)return; page=Number(btn.dataset.page); render(); list.scrollIntoView({behavior:'smooth',block:'start'}); });
  render();
})();
