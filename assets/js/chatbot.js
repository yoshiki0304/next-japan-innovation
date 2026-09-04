(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=5-character-xl', self.src).href;
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
      .nji-chatbot__launcher{width:138px!important;height:138px!important;padding:0!important;border-radius:50%!important;background:#fff!important;border:3px solid rgba(255,255,255,.94)!important;box-shadow:0 22px 56px rgba(0,0,0,.38)!important;overflow:hidden!important}
      .nji-chatbot__launcher:hover{transform:translateY(-4px) scale(1.025)!important}
      .nji-chatbot__panel{bottom:154px!important}
      .nji-chatbot__launcher-label{right:152px!important}
      .back-to-top{right:184px!important}
      @media (max-width:640px){
        .nji-chatbot{right:14px!important;bottom:14px!important}
        .nji-chatbot__launcher{width:116px!important;height:116px!important;border-width:3px!important}
        .nji-chatbot__panel{bottom:138px!important}
        .back-to-top{right:142px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
