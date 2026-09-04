(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher) return;
    const root = launcher.closest('.nji-chatbot');

    launcher.querySelector('svg')?.remove();
    launcher.querySelectorAll('.nji-chatbot__mascot-stage,.nji-chatbot__launcher-character,.nji-chatbot__idle-fx').forEach((el) => el.remove());

    const stage = document.createElement('span');
    stage.className = 'nji-chatbot__mascot-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `
      <img class="nji-chatbot__mascot-base" src="assets/images/chatbot-kun.webp?v=10-stable-parts" alt="" />
      <img class="nji-chatbot__mascot-overlay nji-chatbot__body-overlay" src="assets/images/chatbot-kun.webp?v=10-stable-parts" alt="" />
      <img class="nji-chatbot__mascot-overlay nji-chatbot__arm-overlay nji-chatbot__arm-overlay--left" src="assets/images/chatbot-kun.webp?v=10-stable-parts" alt="" />
      <img class="nji-chatbot__mascot-overlay nji-chatbot__arm-overlay nji-chatbot__arm-overlay--right" src="assets/images/chatbot-kun.webp?v=10-stable-parts" alt="" />
      <span class="nji-chatbot__lid nji-chatbot__lid--left"></span>
      <span class="nji-chatbot__lid nji-chatbot__lid--right"></span>
      <span class="nji-chatbot__mouth"><i></i></span>
      <span class="nji-chatbot__zzz nji-chatbot__zzz--1">Z</span>
      <span class="nji-chatbot__zzz nji-chatbot__zzz--2">ZZ</span>
      <span class="nji-chatbot__zzz nji-chatbot__zzz--3">ZZZ</span>
    `;
    launcher.prepend(stage);

    const oldStyle = document.querySelector('style[data-nji-chatbot-character-style]');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.setAttribute('data-nji-chatbot-character-style', '');
    style.textContent = `
      .nji-chatbot{--nji-bg:#fff!important;--nji-panel:#fff!important;--nji-line:#e3e8ef!important;--nji-text:#13243b!important;--nji-muted:#6d7b8d!important;--nji-accent:#245fae!important;color:#13243b!important}
      .nji-chatbot__launcher{width:207px!important;height:207px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;transform:none!important}
      .nji-chatbot__launcher:hover{transform:none!important}
      .nji-chatbot__launcher-label{z-index:30;right:222px!important}
      .nji-chatbot__mascot-stage{position:absolute;inset:0;display:block;z-index:2;overflow:visible;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.22))}
      .nji-chatbot__mascot-base,.nji-chatbot__mascot-overlay{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none;user-select:none;-webkit-user-drag:none}
      .nji-chatbot__mascot-base{z-index:1}
      .nji-chatbot__body-overlay{z-index:2;clip-path:polygon(14% 36%,21% 24%,34% 16%,50% 13%,67% 17%,80% 27%,88% 41%,91% 58%,86% 73%,74% 84%,59% 90%,43% 90%,28% 85%,18% 74%,12% 58%);transform-origin:52% 78%;animation:njiBreath 3.6s cubic-bezier(.45,0,.55,1) infinite;opacity:.96}
      .nji-chatbot__arm-overlay--left{z-index:6;clip-path:polygon(0 22%,12% 20%,23% 28%,29% 40%,27% 53%,18% 63%,6% 64%,0 55%);transform-origin:24% 48%;opacity:0}
      .nji-chatbot__arm-overlay--right{z-index:3;clip-path:polygon(79% 47%,91% 49%,100% 58%,100% 81%,93% 87%,82% 78%,78% 64%);transform-origin:82% 60%;opacity:0}
      .nji-chatbot__lid{position:absolute;z-index:10;width:13.5%;height:17%;border-radius:55%;background:linear-gradient(180deg,#fff64b 0%,#ffe51d 55%,#ffd51a 100%);opacity:0;transform:scaleY(0);transform-origin:center top}
      .nji-chatbot__lid--left{left:31.5%;top:31%;rotate:-4deg}.nji-chatbot__lid--right{left:64%;top:32%;rotate:3deg}
      .nji-chatbot__mouth{position:absolute;z-index:11;left:42%;top:44%;width:20%;height:16%;border-radius:48% 48% 54% 54%;background:linear-gradient(#4b170e,#6c2018 58%,#2d0d0a);border:1px solid rgba(80,32,18,.35);opacity:0;transform:scale(.35,.2);transform-origin:center;overflow:hidden}
      .nji-chatbot__mouth i{position:absolute;left:16%;right:16%;bottom:8%;height:44%;border-radius:50%;background:linear-gradient(#ff8e7b,#ff6758)}
      .nji-chatbot__zzz{position:absolute;z-index:14;color:#17365f;font-weight:900;line-height:1;opacity:0;text-shadow:0 2px 7px rgba(255,255,255,.95)}
      .nji-chatbot__zzz--1{font-size:14px;right:16%;top:18%}.nji-chatbot__zzz--2{font-size:17px;right:8%;top:10%}.nji-chatbot__zzz--3{font-size:20px;right:-1%;top:2%}
      @keyframes njiBreath{0%,100%{transform:scale(1)}45%{transform:scale(1.008,1.012)}62%{transform:scale(1.004,1.006)}}
      .nji-chatbot__mascot-stage.is-wave .nji-chatbot__arm-overlay--left{opacity:1;animation:njiArmWave 1.8s cubic-bezier(.34,1.45,.64,1) 1}
      @keyframes njiArmWave{0%,100%{transform:rotate(0)}15%{transform:rotate(-20deg)}32%{transform:rotate(16deg)}49%{transform:rotate(-14deg)}66%{transform:rotate(11deg)}82%{transform:rotate(-5deg)}}
      .nji-chatbot__mascot-stage.is-blink .nji-chatbot__lid{opacity:1;animation:njiBlink .62s cubic-bezier(.4,0,.2,1) 1}
      @keyframes njiBlink{0%,18%,82%,100%{transform:scaleY(0)}42%,58%{transform:scaleY(1)}}
      .nji-chatbot__mascot-stage.is-yawn .nji-chatbot__lid{opacity:1;animation:njiYawnEyes 2.2s ease-in-out 1}
      .nji-chatbot__mascot-stage.is-yawn .nji-chatbot__mouth{opacity:1;animation:njiYawnMouth 2.2s cubic-bezier(.34,1.1,.64,1) 1}
      .nji-chatbot__mascot-stage.is-yawn .nji-chatbot__body-overlay{animation:njiYawnBody 2.2s cubic-bezier(.34,1.1,.64,1) 1}
      @keyframes njiYawnEyes{0%,100%{transform:scaleY(0)}24%,76%{transform:scaleY(.72)}45%,62%{transform:scaleY(1)}}
      @keyframes njiYawnMouth{0%,100%{transform:scale(.35,.2)}28%{transform:scale(.75,.7)}48%,64%{transform:scale(1.05,1.18)}82%{transform:scale(.68,.56)}}
      @keyframes njiYawnBody{0%,100%{transform:scale(1)}25%{transform:scale(.995,1.01)}50%{transform:scale(1.012,1.035)}72%{transform:scale(1.006,1.018)}}
      .nji-chatbot__mascot-stage.is-sleep .nji-chatbot__lid{opacity:1;animation:njiSleepEyes 3.6s ease-in-out 1}
      .nji-chatbot__mascot-stage.is-sleep .nji-chatbot__body-overlay{animation:njiSleepBody 3.6s cubic-bezier(.45,0,.55,1) 1}
      .nji-chatbot__mascot-stage.is-sleep .nji-chatbot__zzz--1{animation:njiZ 3.6s .55s ease-out 1}.nji-chatbot__mascot-stage.is-sleep .nji-chatbot__zzz--2{animation:njiZ 3.6s 1.15s ease-out 1}.nji-chatbot__mascot-stage.is-sleep .nji-chatbot__zzz--3{animation:njiZ 3.6s 1.75s ease-out 1}
      @keyframes njiSleepEyes{0%,100%{transform:scaleY(0)}16%,86%{transform:scaleY(1)}}
      @keyframes njiSleepBody{0%,100%{transform:scale(1)}25%{transform:scale(1.005,1.014)}50%{transform:scale(.998,.99)}75%{transform:scale(1.006,1.015)}}
      @keyframes njiZ{0%{opacity:0;transform:translate(0,7px) scale(.7)}18%,58%{opacity:1;transform:translate(3px,-2px) scale(1)}82%,100%{opacity:0;transform:translate(8px,-12px) scale(1.12)}}

      .nji-chatbot__panel{bottom:225px!important;background:#fff!important;border:1px solid #dce4ee!important;color:#13243b!important;box-shadow:0 24px 68px rgba(10,31,58,.24)!important;overflow:visible!important;isolation:isolate}
      .nji-chatbot__panel::after{content:'';position:absolute;right:72px;bottom:-15px;width:30px;height:30px;background:#fff;border-right:1px solid #dce4ee;border-bottom:1px solid #dce4ee;transform:rotate(45deg);z-index:-1}
      .nji-chatbot__head{background:#fff!important;border-bottom:1px solid #e3e8ef!important;border-radius:22px 22px 0 0}.nji-chatbot__eyebrow{color:#245fae!important}.nji-chatbot__title{color:#13243b!important}.nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{background:#f1f4f8!important;color:#13243b!important}.nji-chatbot__body{background:#fff!important;color:#13243b!important}.nji-chatbot__bubble{background:#f2f5f9!important;border-color:#e1e7ef!important;color:#1b2d45!important}.nji-chatbot__row.is-user .nji-chatbot__bubble{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__choice{background:#fff!important;border-color:#bfd0e6!important;color:#18314f!important}.nji-chatbot__choice small{color:#6f7f92!important}.nji-chatbot__action{background:#f2f5f9!important;border-color:#dce4ee!important;color:#17365f!important}.nji-chatbot__action.is-primary{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__inputbar{background:#fff!important;border-top:1px solid #e3e8ef!important}.nji-chatbot__input{background:#fff!important;border-color:#cbd6e4!important;color:#13243b!important}.nji-chatbot__send{background:#17365f!important;color:#fff!important}.nji-chatbot__foot{background:#fff!important;color:#8491a1!important;border-radius:0 0 22px 22px}.back-to-top{right:252px!important}
      @media(max-width:640px){.nji-chatbot{right:12px!important;bottom:12px!important}.nji-chatbot__launcher{width:98px!important;height:98px!important}.nji-chatbot__mascot-stage{filter:drop-shadow(0 8px 12px rgba(0,0,0,.2))}.nji-chatbot__panel{bottom:120px!important;border-radius:18px!important}.nji-chatbot__panel::after{right:38px;bottom:-12px;width:24px;height:24px}.nji-chatbot__head{border-radius:18px 18px 0 0}.nji-chatbot__foot{border-radius:0 0 18px 18px}.back-to-top{right:126px!important}}
      @media(prefers-reduced-motion:reduce){.nji-chatbot__body-overlay,.nji-chatbot__arm-overlay,.nji-chatbot__lid,.nji-chatbot__mouth,.nji-chatbot__zzz{animation:none!important}}
    `;
    document.head.appendChild(style);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const classes = ['is-wave','is-blink','is-yawn','is-sleep'];
    const actions = [
      { cls:'is-blink', ms:700 },
      { cls:'is-blink', ms:700 },
      { cls:'is-wave', ms:1900 },
      { cls:'is-yawn', ms:2300 },
      { cls:'is-sleep', ms:3800 }
    ];
    let timer = 0;
    let finish = 0;

    const clear = () => {
      classes.forEach((c) => stage.classList.remove(c));
      if (finish) { clearTimeout(finish); finish = 0; }
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      if (reduced.matches) return;
      timer = setTimeout(run, 6000 + Math.random() * 8000);
    };
    const run = () => {
      timer = 0;
      if (document.hidden || root?.classList.contains('is-open') || reduced.matches) { schedule(); return; }
      clear();
      const a = actions[Math.floor(Math.random() * actions.length)];
      stage.classList.add(a.cls);
      finish = setTimeout(() => { clear(); schedule(); }, a.ms);
    };
    launcher.addEventListener('click', () => { clear(); schedule(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clear(); if (timer) { clearTimeout(timer); timer = 0; } }
      else schedule();
    });
    schedule();
  });

  document.head.appendChild(core);
})();
