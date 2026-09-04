(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=6-character-xxl', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher) return;

    launcher.querySelector('svg')?.remove();

    if (!launcher.querySelector('.nji-chatbot__launcher-character')) {
      const img = document.createElement('img');
      img.className = 'nji-chatbot__launcher-character';
      img.alt = 'chatBOTくん';
      img.src = 'assets/images/chatbot-kun.webp';
      launcher.prepend(img);
    }

    const style = document.createElement('style');
    style.setAttribute('data-nji-chatbot-character-style', '');
    style.textContent = `
      .nji-chatbot__launcher-character{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;border-radius:50%;pointer-events:none;z-index:0}
      .nji-chatbot__launcher-label{z-index:2}
      .nji-chatbot__launcher{width:207px!important;height:207px!important;padding:0!important;border-radius:50%!important;background:#fff!important;border:4px solid rgba(255,255,255,.94)!important;box-shadow:0 26px 64px rgba(0,0,0,.4)!important;overflow:hidden!important}
      .nji-chatbot__launcher:hover{transform:translateY(-5px) scale(1.02)!important}
      .nji-chatbot__panel{bottom:225px!important}
      .nji-chatbot__launcher-label{right:222px!important}
      .back-to-top{right:252px!important}
      @media (max-width:640px){
        .nji-chatbot{right:12px!important;bottom:12px!important}
        .nji-chatbot__launcher{width:65px!important;height:65px!important;border-width:2px!important}
        .nji-chatbot__panel{bottom:87px!important}
        .back-to-top{right:93px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
