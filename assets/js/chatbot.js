(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=7-transparent-mascot', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  const removeConnectedWhiteBackground = (img) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const isBackground = (p) => {
        const i = p * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return min >= 224 && (max - min) <= 24;
      };

      const push = (p) => {
        if (p < 0 || p >= w * h || visited[p] || !isBackground(p)) return;
        visited[p] = 1;
        queue[tail++] = p;
      };

      for (let x = 0; x < w; x++) {
        push(x);
        push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        push(y * w);
        push(y * w + w - 1);
      }

      while (head < tail) {
        const p = queue[head++];
        const x = p % w;
        const y = (p / w) | 0;
        if (x > 0) push(p - 1);
        if (x + 1 < w) push(p + 1);
        if (y > 0) push(p - w);
        if (y + 1 < h) push(p + w);
      }

      for (let p = 0; p < visited.length; p++) {
        if (!visited[p]) continue;
        data[p * 4 + 3] = 0;
      }

      ctx.putImageData(imageData, 0, 0);
      img.src = canvas.toDataURL('image/png');
      img.dataset.backgroundRemoved = 'true';
    } catch (error) {
      console.warn('chatBOT mascot background removal skipped:', error);
    }
  };

  core.addEventListener('load', () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher) return;

    launcher.querySelector('svg')?.remove();

    let img = launcher.querySelector('.nji-chatbot__launcher-character');
    if (!img) {
      img = document.createElement('img');
      img.className = 'nji-chatbot__launcher-character';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      launcher.prepend(img);
    }

    img.addEventListener('load', () => {
      if (img.dataset.backgroundRemoved === 'true') return;
      removeConnectedWhiteBackground(img);
    }, { once: false });
    img.src = 'assets/images/chatbot-kun.webp?v=4-cutout';

    const oldStyle = document.querySelector('style[data-nji-chatbot-character-style]');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.setAttribute('data-nji-chatbot-character-style', '');
    style.textContent = `
      .nji-chatbot__launcher-character{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        object-fit:contain;
        object-position:center bottom;
        border-radius:0;
        pointer-events:none;
        z-index:1;
        filter:drop-shadow(0 14px 18px rgba(0,0,0,.24));
      }
      .nji-chatbot__launcher-label{z-index:2}
      .nji-chatbot__launcher{
        width:207px!important;
        height:207px!important;
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        overflow:visible!important;
      }
      .nji-chatbot__launcher:hover{transform:translateY(-5px) scale(1.03)!important}
      .nji-chatbot__panel{bottom:225px!important}
      .nji-chatbot__launcher-label{right:222px!important}
      .back-to-top{right:252px!important}
      @media (max-width:640px){
        .nji-chatbot{right:12px!important;bottom:12px!important}
        .nji-chatbot__launcher{width:98px!important;height:98px!important}
        .nji-chatbot__launcher-character{filter:drop-shadow(0 8px 12px rgba(0,0,0,.22))}
        .nji-chatbot__panel{bottom:120px!important}
        .back-to-top{right:126px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
