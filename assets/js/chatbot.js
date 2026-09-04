(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    if (document.querySelector('script[data-nji-chatbot-mascot]')) return;
    const mascot = document.createElement('script');
    mascot.src = new URL('chatbot-mascot.js?v=1-padded-896', self.src).href;
    mascot.async = false;
    mascot.setAttribute('data-nji-chatbot-mascot', '');
    document.head.appendChild(mascot);
  });

  document.head.appendChild(core);
})();