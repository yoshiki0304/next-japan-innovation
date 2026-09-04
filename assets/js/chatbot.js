(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=4-character', self.src).href;
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
      .nji-chatbot__launcher{width:76px!important;height:76px!important;padding:0!important;border-radius:50%!important;background:#fff!important;border:2px solid rgba(255,255,255,.92)!important;box-shadow:0 18px 44px rgba(0,0,0,.34)!important}
      .nji-chatbot__launcher:hover{transform:translateY(-3px) scale(1.02)!important}
      .nji-chatbot__panel{bottom:92px!important}
      .nji-chatbot__launcher-label{right:88px!important}
      .back-to-top{right:118px!important}
      body.home-page .nji-chatbot__launcher{width:92px!important;height:92px!important}
      body.home-page .nji-chatbot__panel{bottom:108px!important}
      body.home-page .nji-chatbot__launcher-label{right:104px!important}
      body.home-page .back-to-top{right:138px!important}
      @media (max-width:640px){
        .nji-chatbot__launcher{width:68px!important;height:68px!important}
        .nji-chatbot__panel{bottom:92px!important}
        .back-to-top{right:94px!important}
        body.home-page .nji-chatbot__launcher{width:78px!important;height:78px!important}
        body.home-page .nji-chatbot__panel{bottom:102px!important}
        body.home-page .back-to-top{right:104px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
