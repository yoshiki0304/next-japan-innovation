(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  const makeTransparentSource = (img) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || !img.naturalWidth || !img.naturalHeight) return img.src;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const isWhiteBackground = (p) => {
        const i = p * 4;
        if (data[i + 3] === 0) return true;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return min >= 224 && max - min <= 24;
      };

      const push = (p) => {
        if (p < 0 || p >= w * h || visited[p] || !isWhiteBackground(p)) return;
        visited[p] = 1;
        queue[tail++] = p;
      };

      for (let x = 0; x < w; x += 1) {
        push(x);
        push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y += 1) {
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

      for (let p = 0; p < visited.length; p += 1) {
        if (visited[p]) data[p * 4 + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('chatBOT mascot background removal skipped:', error);
      return img.src;
    }
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  core.addEventListener('load', () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher) return;

    const root = launcher.closest('.nji-chatbot');
    launcher.querySelector('svg')?.remove();
    launcher.querySelectorAll('.nji-chatbot__launcher-character,.nji-chatbot__idle-fx,.nji-chatbot__mascot-stage').forEach((node) => node.remove());

    const stage = document.createElement('span');
    stage.className = 'nji-chatbot__mascot-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `
      <span class="nji-chatbot__mascot-torso">
        <img class="nji-chatbot__mascot-part nji-chatbot__mascot-antenna" alt="" />
        <img class="nji-chatbot__mascot-part nji-chatbot__mascot-rays" alt="" />
        <img class="nji-chatbot__mascot-part nji-chatbot__mascot-arm nji-chatbot__mascot-arm--right" alt="" />
        <img class="nji-chatbot__mascot-part nji-chatbot__mascot-body" alt="" />
        <img class="nji-chatbot__mascot-part nji-chatbot__mascot-arm nji-chatbot__mascot-arm--left" alt="" />
        <span class="nji-chatbot__eye-lid nji-chatbot__eye-lid--left"></span>
        <span class="nji-chatbot__eye-lid nji-chatbot__eye-lid--right"></span>
        <span class="nji-chatbot__yawn-mouth"><i></i></span>
      </span>
      <img class="nji-chatbot__mascot-part nji-chatbot__mascot-foot nji-chatbot__mascot-foot--left" alt="" />
      <img class="nji-chatbot__mascot-part nji-chatbot__mascot-foot nji-chatbot__mascot-foot--right" alt="" />
      <span class="nji-chatbot__sleep-z nji-chatbot__sleep-z--1">Z</span>
      <span class="nji-chatbot__sleep-z nji-chatbot__sleep-z--2">ZZ</span>
      <span class="nji-chatbot__sleep-z nji-chatbot__sleep-z--3">ZZZ</span>
    `;
    launcher.prepend(stage);

    const parts = [...stage.querySelectorAll('.nji-chatbot__mascot-part')];
    const bodyPart = stage.querySelector('.nji-chatbot__mascot-body');
    const leftArm = stage.querySelector('.nji-chatbot__mascot-arm--left');
    const rightArm = stage.querySelector('.nji-chatbot__mascot-arm--right');
    const antenna = stage.querySelector('.nji-chatbot__mascot-antenna');
    const torso = stage.querySelector('.nji-chatbot__mascot-torso');
    const lids = [...stage.querySelectorAll('.nji-chatbot__eye-lid')];
    const yawnMouth = stage.querySelector('.nji-chatbot__yawn-mouth');
    const zItems = [...stage.querySelectorAll('.nji-chatbot__sleep-z')];

    const source = new Image();
    source.decoding = 'async';
    source.onload = () => {
      const src = makeTransparentSource(source);
      parts.forEach((part) => {
        part.src = src;
      });
    };
    source.src = 'assets/images/chatbot-kun.webp?v=9-part-mascot';

    const oldStyle = document.querySelector('style[data-nji-chatbot-character-style]');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.setAttribute('data-nji-chatbot-character-style', '');
    style.textContent = `
      .nji-chatbot{
        --nji-bg:#fff!important;
        --nji-panel:#fff!important;
        --nji-line:#e3e8ef!important;
        --nji-text:#13243b!important;
        --nji-muted:#6d7b8d!important;
        --nji-accent:#245fae!important;
        color:#13243b!important;
      }
      .nji-chatbot__launcher{
        width:207px!important;
        height:207px!important;
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        overflow:visible!important;
        transform:none!important;
      }
      .nji-chatbot__launcher:hover{transform:none!important}
      .nji-chatbot__launcher-label{z-index:20;right:222px!important}

      .nji-chatbot__mascot-stage{
        position:absolute;
        inset:0;
        z-index:1;
        display:block;
        pointer-events:none;
        overflow:visible;
        filter:drop-shadow(0 14px 18px rgba(0,0,0,.22));
      }
      .nji-chatbot__mascot-torso{position:absolute;inset:0;display:block;transform-origin:52% 82%}
      .nji-chatbot__mascot-part{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;-webkit-user-drag:none}
      .nji-chatbot__mascot-body{
        z-index:5;
        clip-path:polygon(13% 42%,17% 28%,26% 18%,39% 13%,55% 12%,69% 17%,80% 27%,88% 41%,91% 58%,86% 73%,75% 84%,60% 90%,43% 90%,28% 85%,18% 75%,12% 60%);
        transform-origin:52% 82%;
        animation:njiBodyBreath 3.2s cubic-bezier(.45,0,.55,1) infinite;
      }
      .nji-chatbot__mascot-arm--left{
        z-index:8;
        clip-path:polygon(0 27%,10% 25%,20% 31%,27% 42%,26% 53%,18% 61%,7% 62%,0 55%);
        transform-origin:22% 48%;
      }
      .nji-chatbot__mascot-arm--right{
        z-index:4;
        clip-path:polygon(81% 50%,91% 52%,100% 60%,100% 79%,94% 84%,84% 77%,80% 65%);
        transform-origin:83% 62%;
      }
      .nji-chatbot__mascot-antenna{
        z-index:3;
        clip-path:polygon(53% 0,76% 0,76% 24%,53% 24%);
        transform-origin:62% 21%;
      }
      .nji-chatbot__mascot-rays{z-index:2;clip-path:polygon(76% 7%,100% 7%,100% 42%,76% 42%)}
      .nji-chatbot__mascot-foot--left{z-index:2;clip-path:polygon(10% 76%,45% 76%,45% 100%,10% 100%);transform-origin:30% 86%}
      .nji-chatbot__mascot-foot--right{z-index:2;clip-path:polygon(54% 76%,89% 76%,89% 100%,54% 100%);transform-origin:70% 86%}

      .nji-chatbot__eye-lid{
        position:absolute;
        z-index:12;
        width:13.5%;
        height:18%;
        border-radius:52% 52% 48% 48%;
        background:linear-gradient(180deg,#fff844 0%,#ffe81a 50%,#ffd811 100%);
        box-shadow:inset 0 1px 5px rgba(255,255,255,.32);
        transform:scaleY(0);
        transform-origin:center top;
        opacity:0;
      }
      .nji-chatbot__eye-lid--left{left:31.5%;top:30.5%;rotate:-4deg}
      .nji-chatbot__eye-lid--right{left:64.2%;top:31.5%;rotate:3deg}
      .nji-chatbot__yawn-mouth{
        position:absolute;
        z-index:13;
        left:42%;
        top:43%;
        width:20%;
        height:16%;
        border-radius:48% 48% 52% 52%;
        background:linear-gradient(180deg,#4b170e 0%,#6d1d15 55%,#32100c 100%);
        border:1px solid rgba(91,40,16,.45);
        opacity:0;
        transform:scale(.45,.25);
        transform-origin:center;
        overflow:hidden;
      }
      .nji-chatbot__yawn-mouth i{position:absolute;left:16%;right:16%;bottom:8%;height:43%;border-radius:50% 50% 45% 45%;background:linear-gradient(#ff8c79,#ff6859)}
      .nji-chatbot__sleep-z{
        position:absolute;
        z-index:16;
        right:4%;
        top:4%;
        color:#17365f;
        font-weight:900;
        line-height:1;
        opacity:0;
        text-shadow:0 2px 7px rgba(255,255,255,.9);
        pointer-events:none;
      }
      .nji-chatbot__sleep-z--1{font-size:14px;right:15%;top:18%}
      .nji-chatbot__sleep-z--2{font-size:17px;right:7%;top:10%}
      .nji-chatbot__sleep-z--3{font-size:20px;right:-2%;top:1%}
      @keyframes njiBodyBreath{
        0%,100%{transform:scale(1,1)}
        45%{transform:scale(1.008,1.012)}
        62%{transform:scale(1.004,1.006)}
      }
      .nji-chatbot__mascot-stage.is-body-special .nji-chatbot__mascot-body{animation:none}

      .nji-chatbot__panel{
        bottom:225px!important;
        background:#fff!important;
        border:1px solid #dce4ee!important;
        color:#13243b!important;
        box-shadow:0 24px 68px rgba(10,31,58,.24)!important;
        overflow:visible!important;
        isolation:isolate;
      }
      .nji-chatbot__panel::after{content:'';position:absolute;right:72px;bottom:-15px;width:30px;height:30px;background:#fff;border-right:1px solid #dce4ee;border-bottom:1px solid #dce4ee;transform:rotate(45deg);z-index:-1}
      .nji-chatbot__head{background:#fff!important;border-bottom:1px solid #e3e8ef!important;border-radius:22px 22px 0 0}
      .nji-chatbot__eyebrow{color:#245fae!important}.nji-chatbot__title{color:#13243b!important}.nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{background:#f1f4f8!important;color:#13243b!important}.nji-chatbot__close:hover{background:#e7edf5!important}
      .nji-chatbot__body{background:#fff!important;color:#13243b!important}.nji-chatbot__body::-webkit-scrollbar-thumb{background:#c9d2df!important}
      .nji-chatbot__bubble{background:#f2f5f9!important;border-color:#e1e7ef!important;color:#1b2d45!important}
      .nji-chatbot__row.is-user .nji-chatbot__bubble{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__typing i{background:#8090a3!important}
      .nji-chatbot__choice{background:#fff!important;border-color:#bfd0e6!important;color:#18314f!important;box-shadow:0 2px 7px rgba(20,45,74,.04)}
      .nji-chatbot__choice:hover{background:#f3f7fc!important;border-color:#6d9bd2!important}.nji-chatbot__choice small{color:#6f7f92!important}
      .nji-chatbot__action{background:#f2f5f9!important;border-color:#dce4ee!important;color:#17365f!important}.nji-chatbot__action.is-primary{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__inputbar{background:#fff!important;border-top:1px solid #e3e8ef!important}.nji-chatbot__input{background:#fff!important;border-color:#cbd6e4!important;color:#13243b!important;box-shadow:none!important}
      .nji-chatbot__input::placeholder{color:#8795a6!important}.nji-chatbot__input:focus{border-color:#4d83c4!important;box-shadow:0 0 0 3px rgba(77,131,196,.12)!important}
      .nji-chatbot__send{background:#17365f!important;color:#fff!important}.nji-chatbot__foot{background:#fff!important;color:#8491a1!important;border-radius:0 0 22px 22px}
      .back-to-top{right:252px!important}

      @media(max-width:640px){
        .nji-chatbot{right:12px!important;bottom:12px!important}
        .nji-chatbot__launcher{width:98px!important;height:98px!important}
        .nji-chatbot__mascot-stage{filter:drop-shadow(0 8px 12px rgba(0,0,0,.2))}
        .nji-chatbot__panel{bottom:120px!important;border-radius:18px!important}
        .nji-chatbot__panel::after{right:38px;bottom:-12px;width:24px;height:24px}
        .nji-chatbot__head{border-radius:18px 18px 0 0}.nji-chatbot__foot{border-radius:0 0 18px 18px}
        .nji-chatbot__sleep-z--1{font-size:10px}.nji-chatbot__sleep-z--2{font-size:12px}.nji-chatbot__sleep-z--3{font-size:14px}
        .back-to-top{right:126px!important}
      }
      @media(prefers-reduced-motion:reduce){.nji-chatbot__mascot-body{animation:none!important}.nji-chatbot__sleep-z{display:none!important}}
    `;
    document.head.appendChild(style);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let actionTimer = 0;
    let isPerforming = false;
    let lastAction = '';

    const animate = (element, keyframes, options) => {
      if (!element || reducedMotion.matches) return Promise.resolve();
      const motion = element.animate(keyframes, { fill: 'both', ...options });
      return motion.finished.catch(() => {}).finally(() => motion.cancel());
    };

    const blink = async (hold = 80) => {
      await Promise.all(lids.map((lid) => animate(lid, [
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'scaleY(.15)', offset: .18 },
        { opacity: 1, transform: 'scaleY(1)', offset: .42 },
        { opacity: 1, transform: 'scaleY(1)', offset: .58 },
        { opacity: 1, transform: 'scaleY(.18)', offset: .82 },
        { opacity: 0, transform: 'scaleY(0)' }
      ], { duration: 300 + hold, easing: 'cubic-bezier(.34,1.56,.64,1)' })));
    };

    const wave = async () => {
      await animate(leftArm, [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-5deg)', offset: .1 },
        { transform: 'rotate(14deg)', offset: .28 },
        { transform: 'rotate(-12deg)', offset: .46 },
        { transform: 'rotate(12deg)', offset: .64 },
        { transform: 'rotate(-7deg)', offset: .82 },
        { transform: 'rotate(0deg)' }
      ], { duration: 1450, easing: 'cubic-bezier(.22,1,.36,1)' });
    };

    const yawn = async () => {
      stage.classList.add('is-body-special');
      try {
        await Promise.all([
          animate(bodyPart, [
            { transform: 'scale(1,1) translateY(0)' },
            { transform: 'scale(.995,1.01) translateY(1px)', offset: .18 },
            { transform: 'scale(1.018,1.045) translateY(-3px)', offset: .55 },
            { transform: 'scale(1.008,1.018) translateY(-1px)', offset: .82 },
            { transform: 'scale(1,1) translateY(0)' }
          ], { duration: 2250, easing: 'cubic-bezier(.16,1,.3,1)' }),
          animate(antenna, [
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(-3deg)', offset: .28 },
            { transform: 'rotate(4deg)', offset: .58 },
            { transform: 'rotate(0deg)' }
          ], { duration: 2250, easing: 'cubic-bezier(.2,.8,.2,1)' }),
          ...lids.map((lid) => animate(lid, [
            { opacity: 0, transform: 'scaleY(0)' },
            { opacity: 1, transform: 'scaleY(.78)', offset: .2 },
            { opacity: 1, transform: 'scaleY(.88)', offset: .62 },
            { opacity: 0, transform: 'scaleY(0)' }
          ], { duration: 2250, easing: 'cubic-bezier(.22,1,.36,1)' })),
          animate(yawnMouth, [
            { opacity: 0, transform: 'scale(.45,.25)' },
            { opacity: 1, transform: 'scale(.75,.5)', offset: .18 },
            { opacity: 1, transform: 'scale(1.08,1.14)', offset: .48 },
            { opacity: 1, transform: 'scale(1,1)', offset: .7 },
            { opacity: 0, transform: 'scale(.55,.35)' }
          ], { duration: 2250, easing: 'cubic-bezier(.16,1,.3,1)' })
        ]);
      } finally {
        stage.classList.remove('is-body-special');
      }
    };

    const doSleep = async () => {
      stage.classList.add('is-body-special');
      const lidMotions = lids.map((lid) => lid.animate([
        { opacity: 0, transform: 'scaleY(0)' },
        { opacity: 1, transform: 'scaleY(1)', offset: .14 },
        { opacity: 1, transform: 'scaleY(1)', offset: .86 },
        { opacity: 0, transform: 'scaleY(0)' }
      ], { duration: 3600, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }));
      const torsoMotion = torso.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(2px) scale(1.003,1.012)', offset: .28 },
        { transform: 'translateY(0) scale(1)', offset: .52 },
        { transform: 'translateY(2px) scale(1.004,1.013)', offset: .76 },
        { transform: 'translateY(0) scale(1)' }
      ], { duration: 3600, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
      const rightArmMotion = rightArm.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(2deg)', offset: .5 },
        { transform: 'rotate(0deg)' }
      ], { duration: 1800, iterations: 2, easing: 'ease-in-out', fill: 'both' });
      const zMotions = zItems.map((z, index) => z.animate([
        { opacity: 0, transform: 'translate(0,5px) scale(.8)' },
        { opacity: 1, transform: 'translate(4px,-4px) scale(1)', offset: .35 },
        { opacity: 0, transform: 'translate(10px,-14px) scale(1.08)' }
      ], { duration: 1200, delay: 500 + index * 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }));
      await sleep(3650);
      [...lidMotions, torsoMotion, rightArmMotion, ...zMotions].forEach((motion) => motion.cancel());
      stage.classList.remove('is-body-special');
    };

    const actions = [
      { name: 'blink', run: () => blink(60) },
      { name: 'blink2', run: async () => { await blink(40); await sleep(120); await blink(40); } },
      { name: 'wave', run: wave },
      { name: 'yawn', run: yawn },
      { name: 'sleep', run: doSleep }
    ];

    const scheduleNext = () => {
      if (actionTimer) window.clearTimeout(actionTimer);
      if (reducedMotion.matches) return;
      const delay = 6000 + Math.random() * 8000;
      actionTimer = window.setTimeout(runRandom, delay);
    };

    const runRandom = async () => {
      actionTimer = 0;
      if (isPerforming || document.hidden || root?.classList.contains('is-open') || reducedMotion.matches) {
        scheduleNext();
        return;
      }
      const pool = actions.filter((item) => item.name !== lastAction);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      lastAction = chosen.name;
      isPerforming = true;
      try {
        await chosen.run();
      } finally {
        isPerforming = false;
        scheduleNext();
      }
    };

    launcher.addEventListener('click', () => {
      if (actionTimer) window.clearTimeout(actionTimer);
      scheduleNext();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (actionTimer) window.clearTimeout(actionTimer);
        actionTimer = 0;
      } else {
        scheduleNext();
      }
    });

    if (root) {
      const observer = new MutationObserver(() => {
        if (root.classList.contains('is-open')) {
          if (actionTimer) window.clearTimeout(actionTimer);
          actionTimer = 0;
        } else if (!isPerforming) {
          scheduleNext();
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    reducedMotion.addEventListener?.('change', () => {
      if (reducedMotion.matches) {
        if (actionTimer) window.clearTimeout(actionTimer);
        actionTimer = 0;
      } else {
        scheduleNext();
      }
    });

    scheduleNext();
  });

  document.head.appendChild(core);
})();
