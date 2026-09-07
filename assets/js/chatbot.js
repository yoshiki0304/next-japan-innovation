(() => {
  'use strict';

  const self = document.currentScript;
  if (!self || document.querySelector('script[data-nji-chatbot-core]')) return;

  const core = document.createElement('script');
  core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', self.src).href;
  core.async = false;
  core.setAttribute('data-nji-chatbot-core', '');

  core.addEventListener('load', () => {
    const chatBody = document.querySelector('.nji-chatbot__body');
    const firstBubble = chatBody?.querySelector('.nji-chatbot__bubble');
    if (firstBubble) {
      firstBubble.textContent = 'こんにちは。NJI・chatBOTくんです！\nメニューを選ぶか、下の入力欄から自由に質問してください。';
    }

    const panel = document.querySelector('.nji-chatbot__panel');
    if (panel && chatBody && panel.dataset.chatWheelScrolling !== '2') {
      panel.dataset.chatWheelScrolling = '2';

      // Keep scrolling inside the chatbot while the pointer is over it,
      // but let the browser handle scrolling natively whenever possible.
      chatBody.style.overscrollBehavior = 'contain';
      chatBody.style.webkitOverflowScrolling = 'touch';

      panel.addEventListener('wheel', (event) => {
        if (event.ctrlKey) return;

        // If the pointer is already over the scrollable message area,
        // do nothing: native wheel / trackpad inertia handles it naturally.
        if (chatBody.contains(event.target)) return;

        // Header / input / footer: redirect the raw wheel delta to the
        // message area without modifying acceleration or easing.
        event.preventDefault();
        event.stopPropagation();

        const unit = event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? chatBody.clientHeight
            : 1;

        chatBody.scrollBy({
          top: event.deltaY * unit,
          left: 0,
          behavior: 'auto'
        });
      }, { passive: false, capture: true });
    }

    // Core appends the menu and scrolls to the bottom while initializing.
    // Restore the initial view so the greeting is visible when first opened.
    if (chatBody) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatBody.scrollTop = 0;
        });
      });
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