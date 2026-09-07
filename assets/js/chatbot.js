(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    const firstBubble = document.querySelector('.nji-chatbot__body .nji-chatbot__bubble');
    if (firstBubble) {
      firstBubble.textContent = 'こんにちは。NJI・chatBOTくんです！\nメニューを選ぶか、下の入力欄から自由に質問してください。';
    }

    // Always forward wheel / trackpad scrolling from the entire chatbot panel
    // to the main page instead of letting the chatbot consume it.
    const panel = document.querySelector('.nji-chatbot__panel');
    if (panel && panel.dataset.pageWheelForwarding !== '1') {
      panel.dataset.pageWheelForwarding = '1';
      panel.addEventListener('wheel', (event) => {
        if (event.ctrlKey) return;
        event.preventDefault();
        event.stopPropagation();

        const unit = event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
        const delta = event.deltaY * unit;
        const scrollingElement = document.scrollingElement || document.documentElement;

        if (scrollingElement) {
          scrollingElement.scrollTop += delta;
        }
      }, { passive: false, capture: true });
    }

    if (document.querySelector('script[data-nji-chatbot-mascot]')) return;
    const mascot = document.createElement('script');
    mascot.src = new URL('chatbot-mascot.js?v=3-breathing-only', self.src).href;
    mascot.async = false;
    mascot.setAttribute('data-nji-chatbot-mascot', '');
    document.head.appendChild(mascot);
  });

  document.head.appendChild(core);
})();