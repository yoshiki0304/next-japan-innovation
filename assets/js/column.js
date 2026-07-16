(() => {
  'use strict';
  const list = document.querySelector('[data-news-list]');
  if (!list) return;
  const search = document.querySelector('[data-news-search]');
  const categoryWrap = document.querySelector('[data-news-categories]');
  const pagination = document.querySelector('[data-news-pagination]');
  const perPage = 6;
  let all = [];
  let activeCategory = 'すべて';
  let query = '';
  let page = 1;

  const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatDate = value => String(value || '').replaceAll('-','.');
  const filtered = () => all.filter(item => {
    const categoryOK = activeCategory === 'すべて' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    const textOK = !q || `${item.title} ${item.excerpt} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase().includes(q);
    return categoryOK && textOK;
  });

  function buildCategories(){
    if (!categoryWrap) return;
    const categories = ['すべて', ...new Set(all.map(v => v.category).filter(Boolean))];
    categoryWrap.innerHTML = categories.map(name => `<button class="${name===activeCategory?'is-active':''}" type="button" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
  }

  function render(){
    const items = filtered();
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    if (page > totalPages) page = totalPages;
    const shown = items.slice((page-1)*perPage, page*perPage);
    list.innerHTML = shown.length ? shown.map((item,i)=>`<article class="news-row is-visible" style="--news-index:${i}">
      <a href="news-detail.html?id=${encodeURIComponent(item.id)}" class="news-row__link">
        <div class="news-row__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
        <div class="news-row__meta"><time datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time><span>${escapeHtml(item.category)}</span></div>
        <div class="news-row__copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt)}</p></div>
        <span class="news-row__arrow" aria-hidden="true">↗</span>
      </a>
    </article>`).join('') : '<p class="news-empty">該当する記事はありません。</p>';
    pagination.innerHTML = Array.from({length:totalPages},(_,i)=>i+1).map(n=>`<button type="button" class="${n===page?'is-active':''}" data-page="${n}" aria-label="${n}ページ目">${n}</button>`).join('');
    pagination.hidden = items.length <= perPage;
    if (window.gsap && window.ScrollTrigger) {
      gsap.fromTo(list.querySelectorAll('.news-row'), {x:-50, opacity:0}, {x:0, opacity:1, duration:.75, stagger:.08, ease:'power3.out', overwrite:true});
    }
  }

  categoryWrap?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-category]'); if(!btn) return;
    categoryWrap.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active'); activeCategory=btn.dataset.category; page=1; render();
  });
  search?.addEventListener('input', e=>{ query=e.target.value; page=1; render(); });
  pagination?.addEventListener('click', e=>{ const btn=e.target.closest('[data-page]'); if(!btn)return; page=Number(btn.dataset.page); render(); list.scrollIntoView({behavior:'smooth',block:'start'}); });

  list.innerHTML = '<p class="news-loading">記事を読み込んでいます。</p>';
  (window.NextJICMS?.fetchArticles ? window.NextJICMS.fetchArticles() : Promise.resolve(window.NEXTJI_NEWS_DATA || []))
    .then(items => { all = [...items].sort((a,b)=>String(b.date).localeCompare(String(a.date))); buildCategories(); render(); })
    .catch(() => { list.innerHTML = '<p class="news-empty">記事を取得できませんでした。</p>'; });
})();
