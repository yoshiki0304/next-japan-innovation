(() => {
  'use strict';

  const init = () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher || launcher.dataset.mascotReady === '1') return;
    launcher.dataset.mascotReady = '1';

    const root = launcher.closest('.nji-chatbot');

    launcher.querySelector('svg')?.remove();
    launcher.querySelectorAll('.nji-chatbot__mascot-stage,.nji-chatbot__launcher-character,.nji-chatbot__idle-fx,.nji-chatbot__part').forEach((el) => el.remove());

    const stage = document.createElement('span');
    stage.className = 'nji-chatbot__mascot-stage';
    stage.setAttribute('aria-hidden', 'true');

    const motion = document.createElement('span');
    motion.className = 'nji-chatbot__mascot-motion';

    const img = document.createElement('img');
    img.className = 'nji-chatbot__static-mascot';
    img.src = 'assets/images/chatbot-static.png?v=1-static-baseline';
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;

    motion.appendChild(img);
    stage.appendChild(motion);
    launcher.prepend(stage);

    document.querySelector('style[data-nji-chatbot-character-style]')?.remove();
    const style = document.createElement('style');
    style.dataset.njiChatbotCharacterStyle = '';
    style.textContent = `
      .nji-chatbot{
        --nji-bg:#fff!important;--nji-panel:#fff!important;--nji-line:#e3e8ef!important;
        --nji-text:#13243b!important;--nji-muted:#6d7b8d!important;--nji-accent:#245fae!important;
        color:#13243b!important;right:22px!important;bottom:22px!important;overflow:visible!important;
      }
      .nji-chatbot__launcher{
        position:relative!important;width:207px!important;height:207px!important;padding:0!important;
        border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;
        overflow:visible!important;transform:none!important;
      }
      .nji-chatbot__launcher:hover{transform:none!important}
      .nji-chatbot__mascot-stage{
        position:absolute!important;inset:0!important;width:207px!important;height:207px!important;
        overflow:visible!important;pointer-events:none!important;z-index:2!important;transform:none!important;
      }
      .nji-chatbot__mascot-motion{
        display:block!important;position:absolute!important;inset:0!important;width:207px!important;height:207px!important;
        overflow:visible!important;transform:none;transform-origin:50% 78%;will-change:transform;
      }
      .nji-chatbot__static-mascot{
        display:block!important;position:absolute!important;inset:0!important;width:207px!important;height:207px!important;
        object-fit:contain!important;object-position:center!important;max-width:none!important;max-height:none!important;
        transform:none!important;filter:drop-shadow(0 14px 18px rgba(0,0,0,.22));
        user-select:none!important;-webkit-user-drag:none!important;
      }
      .nji-chatbot__launcher-label{z-index:40;right:222px!important}
      .nji-chatbot__panel{
        bottom:225px!important;
        height:min(620px,calc(100dvh - 249px))!important;
        max-height:calc(100dvh - 249px)!important;
        min-height:280px;
        display:flex!important;
        flex-direction:column!important;
        background:#fff!important;border:1px solid #dce4ee!important;color:#13243b!important;
        box-shadow:0 24px 68px rgba(10,31,58,.24)!important;
        overflow:hidden!important;isolation:isolate;
      }
      .nji-chatbot__head{flex:0 0 auto!important;background:#fff!important;border-bottom:1px solid #e3e8ef!important;border-radius:22px 22px 0 0}
      .nji-chatbot__body{
        flex:1 1 0!important;
        min-height:0!important;
        height:auto!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior-y:contain!important;
        -webkit-overflow-scrolling:touch;
        background:#fff!important;color:#13243b!important;
      }
      .nji-chatbot__inputbar{flex:0 0 auto!important;background:#fff!important;border-top:1px solid #e3e8ef!important}
      .nji-chatbot__foot{flex:0 0 auto!important;background:#fff!important;color:#8491a1!important;border-radius:0 0 22px 22px}
      .nji-chatbot__panel::after{content:'';position:absolute;right:72px;bottom:-15px;width:30px;height:30px;background:#fff;border-right:1px solid #dce4ee;border-bottom:1px solid #dce4ee;transform:rotate(45deg);z-index:-1}
      .nji-chatbot__eyebrow{color:#245fae!important}.nji-chatbot__title{color:#13243b!important}.nji-chatbot__status{color:#6d7b8d!important}
      .nji-chatbot__close{background:#f1f4f8!important;color:#13243b!important}.nji-chatbot__bubble{background:#f2f5f9!important;border-color:#e1e7ef!important;color:#1b2d45!important}.nji-chatbot__row.is-user .nji-chatbot__bubble{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__choice{background:#fff!important;border-color:#bfd0e6!important;color:#18314f!important}.nji-chatbot__choice small{color:#6f7f92!important}.nji-chatbot__action{background:#f2f5f9!important;border-color:#dce4ee!important;color:#17365f!important}.nji-chatbot__action.is-primary{background:#17365f!important;border-color:#17365f!important;color:#fff!important}
      .nji-chatbot__input{background:#fff!important;border-color:#cbd6e4!important;color:#13243b!important}.nji-chatbot__send{background:#17365f!important;color:#fff!important}.back-to-top{right:252px!important}
      @media(max-width:640px){
        .nji-chatbot{right:14px!important;bottom:14px!important;overflow:visible!important}
        .nji-chatbot__launcher,.nji-chatbot__mascot-stage,.nji-chatbot__mascot-motion{width:98px!important;height:98px!important}
        .nji-chatbot__static-mascot{width:98px!important;height:98px!important;filter:drop-shadow(0 8px 12px rgba(0,0,0,.2))}
        .nji-chatbot__panel{
          bottom:120px!important;
          height:min(620px,calc(100dvh - 140px))!important;
          max-height:calc(100dvh - 140px)!important;
          min-height:260px;
          border-radius:18px!important;
        }
        .nji-chatbot__panel::after{right:38px;bottom:-12px;width:24px;height:24px}
        .nji-chatbot__head{border-radius:18px 18px 0 0}.nji-chatbot__foot{border-radius:0 0 18px 18px}.back-to-top{right:126px!important}
      }
      @media(max-height:560px) and (min-width:641px){
        .nji-chatbot__panel{min-height:220px;height:calc(100dvh - 237px)!important;max-height:calc(100dvh - 237px)!important}
        .nji-chatbot__head{padding-top:12px!important;padding-bottom:10px!important}
        .nji-chatbot__inputbar{padding-top:8px!important;padding-bottom:8px!important}
        .nji-chatbot__foot{display:none!important}
      }
    `;
    document.head.appendChild(style);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let breath = null;

    const stopBreathing = () => {
      if (breath) { breath.cancel(); breath = null; }
      motion.style.transform = 'none';
    };

    const canBreathe = () => !reduced.matches && !document.hidden && !root?.classList.contains('is-open');

    const startBreathing = () => {
      stopBreathing();
      if (!canBreathe()) return;

      breath = motion.animate([
        { transform:'translateY(0) scaleX(1) scaleY(1)', offset:0 },
        { transform:'translateY(0.4px) scaleX(0.999) scaleY(0.998)', offset:0.22 },
        { transform:'translateY(-0.8px) scaleX(1.003) scaleY(1.007)', offset:0.52 },
        { transform:'translateY(-0.3px) scaleX(1.001) scaleY(1.003)', offset:0.76 },
        { transform:'translateY(0) scaleX(1) scaleY(1)', offset:1 }
      ], { duration:3600, iterations:Infinity, easing:'cubic-bezier(.45,0,.55,1)' });
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopBreathing(); else startBreathing();
    });

    if (root) {
      new MutationObserver(() => {
        if (root.classList.contains('is-open')) stopBreathing(); else startBreathing();
      }).observe(root, { attributes:true, attributeFilter:['class'] });
      root.dataset.mascotMode = 'breathing-only';
    }

    reduced.addEventListener?.('change', () => startBreathing());
    startBreathing();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();