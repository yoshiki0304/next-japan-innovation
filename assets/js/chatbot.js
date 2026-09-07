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

    if (chatBody) {
      chatBody.style.overflowY = 'auto';
      chatBody.style.overscrollBehaviorY = 'contain';
      chatBody.style.webkitOverflowScrolling = 'touch';
      chatBody.style.scrollBehavior = 'auto';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatBody.scrollTop = 0;
        });
      });

      // Keep the greeting / already-rendered messages unchanged.
      chatBody.querySelectorAll('.nji-chatbot__row .nji-chatbot__bubble').forEach((bubble) => {
        bubble.dataset.typewriterReady = '1';
      });

      const reduceTyping = window.matchMedia('(prefers-reduced-motion: reduce)');
      let typeQueue = Promise.resolve();

      const typeBubble = (bubble) => new Promise((resolve) => {
        if (!bubble || bubble.dataset.typewriterReady === '1') {
          resolve();
          return;
        }

        const row = bubble.closest('.nji-chatbot__row');
        if (!row || row.classList.contains('is-user') || bubble.classList.contains('nji-chatbot__typing')) {
          bubble.dataset.typewriterReady = '1';
          resolve();
          return;
        }

        const fullText = bubble.textContent || '';
        bubble.dataset.typewriterReady = '1';
        if (!fullText || reduceTyping.matches) {
          resolve();
          return;
        }

        const chars = Array.from(fullText);
        bubble.textContent = '';
        bubble.setAttribute('aria-label', fullText);
        let index = 0;

        const tick = () => {
          if (!bubble.isConnected) {
            resolve();
            return;
          }

          const ch = chars[index++];
          bubble.textContent += ch;

          // Follow the answer as it grows so the latest text stays visible.
          chatBody.scrollTop = chatBody.scrollHeight;

          if (index >= chars.length) {
            bubble.removeAttribute('aria-label');
            resolve();
            return;
          }

          let delay = 18;
          if (ch === '、' || ch === ',') delay = 45;
          if (ch === '。' || ch === '！' || ch === '？' || ch === '!' || ch === '?' || ch === '\n') delay = 85;
          window.setTimeout(tick, delay);
        };

        // Start each chatbot reply after a natural random delay of 3-6 seconds.
        const replyDelay = 3000 + Math.random() * 3000;
        window.setTimeout(tick, replyDelay);
      });

      const hidePhoneUntilReplyFinishes = (phone) => {
        if (!phone || phone.dataset.replyGated === '1') return;
        phone.dataset.replyGated = '1';
        phone.style.visibility = 'hidden';
        phone.style.opacity = '0';
        phone.style.pointerEvents = 'none';

        const queueAtCreation = typeQueue;
        queueAtCreation.then(() => {
          if (!phone.isConnected) return;
          phone.style.visibility = '';
          phone.style.opacity = '';
          phone.style.pointerEvents = '';
          chatBody.scrollTop = chatBody.scrollHeight;
        });
      };

      const observer = new MutationObserver((mutations) => {
        // First queue every newly-added chatbot reply in this mutation batch.
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;

            const rows = [];
            if (node.matches('.nji-chatbot__row')) rows.push(node);
            node.querySelectorAll?.('.nji-chatbot__row').forEach((row) => rows.push(row));

            rows.forEach((row) => {
              if (row.classList.contains('is-user')) return;
              const bubble = row.querySelector('.nji-chatbot__bubble');
              if (!bubble || bubble.classList.contains('nji-chatbot__typing')) return;
              typeQueue = typeQueue.then(() => typeBubble(bubble));
            });
          });
        });

        // Then gate phone display so it only appears after the queued reply completes.
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;

            const phones = [];
            if (node.matches('a[href^="tel:"]')) phones.push(node);
            node.querySelectorAll?.('a[href^="tel:"]').forEach((phone) => phones.push(phone));
            phones.forEach(hidePhoneUntilReplyFinishes);
          });
        });
      });

      observer.observe(chatBody, { childList: true, subtree: true });
    }

    if (document.querySelector('script[data-nji-chatbot-mascot]')) return;

    const mascot = document.createElement('script');
    mascot.src = new URL('chatbot-mascot.js?v=5-grid-scroll', self.src).href;
    mascot.async = false;
    mascot.setAttribute('data-nji-chatbot-mascot', '');
    document.head.appendChild(mascot);
  });

  document.head.appendChild(core);
})();