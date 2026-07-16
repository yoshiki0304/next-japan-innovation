(() => {
 const root=document.querySelector('[data-news-detail]'); if(!root)return;
 const data=window.NEXTJI_NEWS_DATA||[]; const id=new URLSearchParams(location.search).get('id');
 const item=data.find(x=>x.id===id)||data[0]; const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
 if(!item){root.innerHTML='<p>記事が見つかりませんでした。</p>';return;}
 document.title=`${item.title}｜株式会社Next Japan Innovation`;
 const related=data.filter(x=>x.id!==item.id).sort((a,b)=>Number(b.category===item.category)-Number(a.category===item.category)).slice(0,3);
 const shareUrl=encodeURIComponent(location.href), shareTitle=encodeURIComponent(item.title);
 root.innerHTML=`<div class="news-detail__breadcrumb"><a href="index.html">HOME</a><span>/</span><a href="column.html">NEWS</a><span>/</span><span>${esc(item.title)}</span></div><div class="news-detail__meta"><time datetime="${item.date}">${item.date.replaceAll('-','.')}</time><span>${esc(item.category)}</span></div><h1>${esc(item.title)}</h1><div class="news-detail__image"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div><div class="news-detail__body">${(item.body||[]).map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="news-share"><span>SHARE</span><a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}">X</a><a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}">Facebook</a><button type="button" data-copy-url>URLをコピー</button></div><section class="related-news"><h2>RELATED NEWS</h2><div class="related-news__grid">${related.map(x=>`<a class="related-news__card" href="news-detail.html?id=${encodeURIComponent(x.id)}"><time>${x.date.replaceAll('-','.')}</time><h3>${esc(x.title)}</h3></a>`).join('')}</div></section>`;
 root.querySelector('[data-copy-url]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(location.href);e.currentTarget.textContent='コピーしました';}catch{}});
})();
