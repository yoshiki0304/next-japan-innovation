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

    const root = launcher.closest('.nji-chatbot');
    launcher.querySelector('svg')?.remove();

    let img = launcher.querySelector('.nji-chatbot__launcher-character');
    if (!img) {
      img = document.createElement('img');
      img.className = 'nji-chatbot__launcher-character';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      launcher.prepend(img);
    }

    let fx = launcher.querySelector('.nji-chatbot__idle-fx');
    if (!fx) {
      fx = document.createElement('span');
      fx.className = 'nji-chatbot__idle-fx';
      fx.setAttribute('aria-hidden', 'true');
      launcher.appendChild(fx);
    }

    img.addEventListener('load', () => {
      if (img.dataset.backgroundRemoved === 'true') return;
      removeConnectedWhiteBackground(img);
    }, { once: false });
    img.src = 'assets/images/chatbot-kun.webp?v=6-idle-animation';

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
        transform-origin:50% 82%;
        animation:njiMascotFloat 4.8s ease-in-out infinite;
        will-change:transform;
      }
      .nji-chatbot__idle-fx{
        position:absolute;
        right:-2px;
        top:-8px;
        z-index:3;
        min-width:54px;
        min-height:24px;
        padding:4px 7px;
        border-radius:999px;
        background:rgba(255,255,255,.96);
        color:#17365f;
        font-size:13px;
        font-weight:900;
        line-height:1.2;
        letter-spacing:.03em;
        text-align:center;
        box-shadow:0 8px 22px rgba(10,31,58,.16);
        opacity:0;
        transform:translateY(5px) scale(.9);
        pointer-events:none;
        transition:opacity .18s ease,transform .18s ease;
      }
      .nji-chatbot__launcher.has-idle-fx .nji-chatbot__idle-fx{opacity:1;transform:none}
      .nji-chatbot__launcher-label{z-index:4}
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
      .nji-chatbot__launcher.is-wave .nji-chatbot__launcher-character{animation:njiMascotWave 1.7s ease-in-out 1!important}
      .nji-chatbot__launcher.is-yawn .nji-chatbot__launcher-character{animation:njiMascotYawn 2.2s ease-in-out 1!important}
      .nji-chatbot__launcher.is-sleep .nji-chatbot__launcher-character{animation:njiMascotSleep 3.2s ease-in-out 1!important}
      .nji-chatbot__launcher.is-blink .nji-chatbot__launcher-character{animation:njiMascotBlink .68s ease-in-out 1!important}

      @keyframes njiMascotFloat{
        0%,100%{transform:translateY(0) rotate(-.5deg)}
        50%{transform:translateY(-7px) rotate(.5deg)}
      }
      @keyframes njiMascotWave{
        0%,100%{transform:translateY(0) rotate(0)}
        18%{transform:translateY(-5px) rotate(-7deg)}
        36%{transform:translateY(-3px) rotate(7deg)}
        54%{transform:translateY(-5px) rotate(-6deg)}
        72%{transform:translateY(-2px) rotate(5deg)}
      }
      @keyframes njiMascotYawn{
        0%,100%{transform:translateY(0) scale(1)}
        24%{transform:translateY(3px) scale(1.035,.965)}
        50%{transform:translateY(5px) scale(1.06,.94)}
        76%{transform:translateY(2px) scale(1.02,.98)}
      }
      @keyframes njiMascotSleep{
        0%{transform:translateY(0) rotate(0) scale(1)}
        18%,72%{transform:translateY(7px) rotate(4deg) scale(.985)}
        45%{transform:translateY(9px) rotate(5deg) scale(.975)}
        100%{transform:translateY(0) rotate(0) scale(1)}
      }
      @keyframes njiMascotBlink{
        0%,34%,66%,100%{transform:scaleY(1)}
        48%,52%{transform:scaleY(.94) translateY(3px)}
      }

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
      .nji-chatbot__head{background:#fff!important;border-bottom:1px solid #e3e8ef!important;border-radius:22px 22px 0 0}
      .nji-chatbot__eyebrow{color:#245fae!important}
      .nji-chatbot__title{color:#13243b!important}
      .nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{background:#f1f4f8!important;color:#13243b!important}
      .nji-chatbot__close:hover{background:#e7edf5!important}
      .nji-chatbot__body{background:#fff!important;color:#13243b!important}
      .nji-chatbot__body::-webkit-scrollbar-thumb{background:#c9d2df!important}
      .nji-chatbot__bubble{background:#f2f5f9!important;border-color:#e1e7ef!important;color:#1b2d45!important}
      .nji-chatbot__row.is-user .nji-chatbot__bubble{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__typing i{background:#8090a3!important}
      .nji-chatbot__choice{background:#fff!important;border-color:#bfd0e6!important;color:#18314f!important;box-shadow:0 2px 7px rgba(20,45,74,.04)}
      .nji-chatbot__choice:hover{background:#f3f7fc!important;border-color:#6d9bd2!important}
      .nji-chatbot__choice small{color:#6f7f92!important}
      .nji-chatbot__action{background:#f2f5f9!important;border-color:#dce4ee!important;color:#17365f!important}
      .nji-chatbot__action.is-primary{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__inputbar{background:#fff!important;border-top:1px solid #e3e8ef!important}
      .nji-chatbot__input{background:#fff!important;border-color:#cbd6e4!important;color:#13243b!important;box-shadow:none!important}
      .nji-chatbot__input::placeholder{color:#8795a6!important}
      .nji-chatbot__input:focus{border-color:#4d83c4!important;box-shadow:0 0 0 3px rgba(77,131,196,.12)!important}
      .nji-chatbot__send{background:#17365f!important;color:#fff!important}
      .nji-chatbot__foot{background:#fff!important;color:#8491a1!important;border-radius:0 0 22px 22px}
      .nji-chatbot__launcher-label{right:222px!important}
      .back-to-top{right:252px!important}

      @media (max-width:640px){
        .nji-chatbot{right:12px!important;bottom:12px!important}
        .nji-chatbot__launcher{width:98px!important;height:98px!important}
        .nji-chatbot__launcher-character{filter:drop-shadow(0 8px 12px rgba(0,0,0,.22));animation-duration:4.4s}
        .nji-chatbot__idle-fx{right:-3px;top:-13px;min-width:46px;font-size:11px;padding:3px 6px}
        .nji-chatbot__panel{bottom:120px!important;border-radius:18px!important}
        .nji-chatbot__panel::after{right:38px;bottom:-12px;width:24px;height:24px}
        .nji-chatbot__head{border-radius:18px 18px 0 0}
        .nji-chatbot__foot{border-radius:0 0 18px 18px}
        .back-to-top{right:126px!important}
      }

      @media (prefers-reduced-motion:reduce){
        .nji-chatbot__launcher-character{animation:none!important}
        .nji-chatbot__idle-fx{display:none!important}
      }
    `;
    document.head.appendChild(style);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const actionClasses = ['is-wave', 'is-yawn', 'is-sleep', 'is-blink'];
    const actions = [
      { name: 'is-blink', duration: 700, text: '' },
      { name: 'is-blink', duration: 700, text: '' },
      { name: 'is-wave', duration: 1750, text: '♪' },
      { name: 'is-yawn', duration: 2250, text: 'ふぁ〜…' },
      { name: 'is-sleep', duration: 3250, text: '…ZZZ' }
    ];
    let actionTimer = 0;
    let finishTimer = 0;

    const clearAction = () => {
      actionClasses.forEach((name) => launcher.classList.remove(name));
      launcher.classList.remove('has-idle-fx');
      fx.textContent = '';
      if (finishTimer) {
        window.clearTimeout(finishTimer);
        finishTimer = 0;
      }
    };

    const scheduleNextAction = () => {
      if (actionTimer) window.clearTimeout(actionTimer);
      if (reducedMotion.matches) return;
      const delay = 6000 + Math.random() * 8000;
      actionTimer = window.setTimeout(runRandomAction, delay);
    };

    const runRandomAction = () => {
      actionTimer = 0;
      if (reducedMotion.matches || document.hidden || root?.classList.contains('is-open')) {
        scheduleNextAction();
        return;
      }

      clearAction();
      const action = actions[Math.floor(Math.random() * actions.length)];
      launcher.classList.add(action.name);
      if (action.text) {
        fx.textContent = action.text;
        launcher.classList.add('has-idle-fx');
      }

      finishTimer = window.setTimeout(() => {
        clearAction();
        scheduleNextAction();
      }, action.duration);
    };

    launcher.addEventListener('click', () => {
      clearAction();
      scheduleNextAction();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearAction();
        if (actionTimer) {
          window.clearTimeout(actionTimer);
          actionTimer = 0;
        }
      } else {
        scheduleNextAction();
      }
    });

    reducedMotion.addEventListener?.('change', () => {
      clearAction();
      scheduleNextAction();
    });

    scheduleNextAction();
  });

  document.head.appendChild(core);
})();
