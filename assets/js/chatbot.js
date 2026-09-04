(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=7-transparent-mascot', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    const launcher = document.querySelector('.nji-chatbot__launcher');
    if (!launcher) return;

    launcher.querySelector('svg')?.remove();

    let img = launcher.querySelector('.nji-chatbot__launcher-character');
    if (!img) {
      img = document.createElement('img');
      img.className = 'nji-chatbot__launcher-character';
      img.alt = 'chatBOTくん';
      launcher.prepend(img);
    }
    img.src = 'assets/images/chatbot-kun.webp?v=2-transparent';

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
        .nji-chatbot__launcher{width:65px!important;height:65px!important}
        .nji-chatbot__launcher-character{filter:drop-shadow(0 7px 10px rgba(0,0,0,.22))}
        .nji-chatbot__panel{bottom:87px!important}
        .back-to-top{right:93px!important}
      }
    `;
    document.head.appendChild(style);
  });

  document.head.appendChild(core);
})();
