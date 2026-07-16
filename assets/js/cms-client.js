(() => {
  'use strict';
  const config = window.NEXTJI_CMS_CONFIG || {};
  const fallback = () => [...(window.NEXTJI_NEWS_DATA || [])];
  const storageKey = 'nextji-cms-cache-v1';

  const normalize = (row) => ({
    id: String(row.id || row.slug || '').trim(),
    date: String(row.date || '').slice(0, 10),
    category: String(row.category || 'お知らせ').trim(),
    title: String(row.title || '').trim(),
    excerpt: String(row.excerpt || row.summary || '').trim(),
    image: String(row.image || row.thumbnail || 'assets/images/company-logo.png').trim(),
    body: Array.isArray(row.body)
      ? row.body
      : String(row.body || row.content || '').split(/\n{2,}/).map(v => v.trim()).filter(Boolean),
    tags: Array.isArray(row.tags) ? row.tags : String(row.tags || '').split(',').map(v => v.trim()).filter(Boolean),
    status: String(row.status || row.publish || '公開').trim()
  });

  const published = (item) => item.status !== '非公開' && item.status !== '下書き' && item.id && item.title;

  async function fetchArticles(force = false) {
    const endpoint = String(config.endpoint || '').trim();
    const maxAge = Math.max(1, Number(config.cacheMinutes || 5)) * 60 * 1000;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (cached && Date.now() - cached.savedAt < maxAge && Array.isArray(cached.items)) return cached.items;
      } catch (_) {}
    }
    if (!endpoint) return fallback().map(normalize).filter(published);
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${endpoint}${separator}action=articles&t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`CMS HTTP ${response.status}`);
      const payload = await response.json();
      const items = (Array.isArray(payload) ? payload : payload.articles || []).map(normalize).filter(published);
      localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), items }));
      return items;
    } catch (error) {
      console.warn('[NEXTJI CMS] Googleスプレッドシートの取得に失敗しました。', error);
      if (config.useLocalFallback !== false) return fallback().map(normalize).filter(published);
      return [];
    }
  }

  window.NextJICMS = { fetchArticles, clearCache: () => localStorage.removeItem(storageKey) };
})();
