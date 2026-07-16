(() => {
  'use strict';
  const root = document.querySelector('[data-news-detail]');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  const escapeHtml = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  root.innerHTML = '<p class="news-loading">記事を読み込んでいます。</p>';
  (window.NextJICMS?.fetchArticles ? window.NextJICMS.fetchArticles() : Promise.resolve(window.NEXTJI_NEWS_DATA || [])).then(items => {
    const item = items.find(v => String(v.id) === String(id));
    if (!item) { root.innerHTML = '<h1>記事が見つかりません</h1><p><a href="column.html">NEWS一覧へ戻る</a></p>'; return; }
    document.title = `${item.title}｜株式会社Next Japan Innovation`;
    const paragraphs = (item.body || []).map(p => `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('');
    root.innerHTML = `<div class="news-detail__meta"><time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date).replaceAll('-','.')}</time><span>${escapeHtml(item.category)}</span></div>
      <h1>${escapeHtml(item.title)}</h1><p class="news-detail__lead">${escapeHtml(item.excerpt)}</p>
      <figure><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></figure>
      <div class="news-detail__body">${paragraphs}</div>`;
  }).catch(() => { root.innerHTML = '<p>記事を取得できませんでした。</p>'; });
})();
