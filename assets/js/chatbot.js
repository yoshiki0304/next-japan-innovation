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
        bubble.setAttribute('aria-label', '回答を作成中');
        let index = 0;

        // Show thinking dots during the 3-6 second reply delay.
        const thinkingFrames = ['・', '・・', '・・・'];
        let thinkingIndex = 0;
        bubble.textContent = thinkingFrames[thinkingIndex];
        chatBody.scrollTop = chatBody.scrollHeight;

        const thinkingTimer = window.setInterval(() => {
          if (!bubble.isConnected) {
            window.clearInterval(thinkingTimer);
            return;
          }
          thinkingIndex = (thinkingIndex + 1) % thinkingFrames.length;
          bubble.textContent = thinkingFrames[thinkingIndex];
          chatBody.scrollTop = chatBody.scrollHeight;
        }, 420);

        const tick = () => {
          if (!bubble.isConnected) {
            resolve();
            return;
          }

          const ch = chars[index++];
          bubble.textContent += ch;
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

        const replyDelay = 3000 + Math.random() * 3000;
        window.setTimeout(() => {
          window.clearInterval(thinkingTimer);
          if (!bubble.isConnected) {
            resolve();
            return;
          }
          bubble.textContent = '';
          bubble.setAttribute('aria-label', fullText);
          tick();
        }, replyDelay);
      });

      const gateContactActions = (actions) => {
        if (!actions || actions.dataset.replyGated === '1') return;
        actions.dataset.replyGated = '1';
        actions.style.display = 'none';

        const queueAtCreation = typeQueue;
        queueAtCreation.then(() => {
          if (!actions.isConnected) return;
          actions.style.display = '';
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

        // Then hide the complete contact-actions block until that reply finishes.
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;

            const actionBlocks = [];
            if (node.matches('.nji-chatbot__actions')) actionBlocks.push(node);
            node.querySelectorAll?.('.nji-chatbot__actions').forEach((actions) => actionBlocks.push(actions));
            actionBlocks.forEach(gateContactActions);
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