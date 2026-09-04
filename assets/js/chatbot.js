(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
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
    img.src = 'assets/images/chatbot-kun.webp?v=5-white-bubble';

    const oldStyle = document.querySelector('style[data-nji-chatbot-character-style]');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.setAttribute('data-nji-chatbot-character-style', '');
    style.textContent = `
      .nji-chatbot{
        --nji-bg:#ffffff!important;
        --nji-panel:#ffffff!important;
        --nji-line:#e3e8ef!important;
        --nji-text:#13243b!important;
        --nji-muted:#6d7b8d!important;
        --nji-accent:#245fae!important;
        color:#13243b!important;
      }
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

      .nji-chatbot__panel{
        bottom:225px!important;
        background:#fff!important;
        border:1px solid #dce4ee!important;
        color:#13243b!important;
        box-shadow:0 24px 68px rgba(10,31,58,.24)!important;
        overflow:visible!important;
        isolation:isolate;
      }
      .nji-chatbot__panel::after{
        content:'';
        position:absolute;
        right:72px;
        bottom:-15px;
        width:30px;
        height:30px;
        background:#fff;
        border-right:1px solid #dce4ee;
        border-bottom:1px solid #dce4ee;
        transform:rotate(45deg);
        z-index:-1;
      }
      .nji-chatbot__head{
        background:#fff!important;
        border-bottom:1px solid #e3e8ef!important;
        border-radius:22px 22px 0 0;
      }
      .nji-chatbot__eyebrow{color:#245fae!important}
      .nji-chatbot__title{color:#13243b!important}
      .nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{
        background:#f1f4f8!important;
        color:#13243b!important;
      }
      .nji-chatbot__close:hover{background:#e7edf5!important}
      .nji-chatbot__body{
        background:#fff!important;
        color:#13243b!important;
      }
      .nji-chatbot__body::-webkit-scrollbar-thumb{background:#c9d2df!important}
      .nji-chatbot__bubble{
        background:#f2f5f9!important;
        border-color:#e1e7ef!important;
        color:#1b2d45!important;
      }
      .nji-chatbot__row.is-user .nji-chatbot__bubble{
        background:#17365f!important;
        border-color:#17365f!important;
        color:#fff!important;
      }
      .nji-chatbot__typing i{background:#8090a3!important}
      .nji-chatbot__choice{
        background:#fff!important;
        border-color:#bfd0e6!important;
        color:#18314f!important;
        box-shadow:0 2px 7px rgba(20,45,74,.04);
      }
      .nji-chatbot__choice:hover{
        background:#f3f7fc!important;
        border-color:#6d9bd2!important;
      }
      .nji-chatbot__choice small{color:#6f7f92!important}
      .nji-chatbot__action{
        background:#f2f5f9!important;
        border-color:#dce4ee!important;
        color:#17365f!important;
      }
      .nji-chatbot__action.is-primary{
        background:#17365f!important;
        border-color:#17365f!important;
        color:#fff!important;
      }
      .nji-chatbot__inputbar{
        background:#fff!important;
        border-top:1px solid #e3e8ef!important;
      }
      .nji-chatbot__input{
        background:#fff!important;
        border-color:#cbd6e4!important;
        color:#13243b!important;
        box-shadow:none!important;
      }
      .nji-chatbot__input::placeholder{color:#8795a6!important}
      .nji-chatbot__input:focus{
        border-color:#4d83c4!important;
        box-shadow:0 0 0 3px rgba(77,131,196,.12)!important;
      }
      .nji-chatbot__send{
        background:#17365f!important;
        color:#fff!important;
      }
      .nji-chatbot__foot{
        background:#fff!important;
        color:#8491a1!important;
        border-radius:0 0 22px 22px;
      }
      .nji-chatbot__launcher-label{right:222px!important}
      .back-to-top{right:252px!important}

      @media (max-width:640px){
        .nji-chatbot{right:12px!important;bottom:12px!important}
        .nji-chatbot__launcher{width:98px!important;height:98px!important}
        .nji-chatbot__launcher-character{filter:drop-shadow(0 8px 12px rgba(0,0,0,.22))}
        .nji-chatbot__panel{
          bottom:120px!important;
          border-radius:18px!important;
        }
        .nji-chatbot__panel::after{
          right:38px;
          bottom:-12px;
          width:24px;
          height:24px;
        }
        .nji-chatbot__head{border-radius:18px 18px 0 0}
        .nji-chatbot__foot{border-radius:0 0 18px 18px}
        .back-to-top{right:126px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
