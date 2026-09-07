(() => {
  'use strict';

  const self = document.currentScript;
  if (!self) return;
  const baseSrc = self.src;
  let resetting = false;

  const setupAfterCoreLoad = () => {
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

    if (!document.querySelector('script[data-nji-chatbot-mascot]')) {
      const mascot = document.createElement('script');
      mascot.src = new URL('chatbot-mascot.js?v=5-grid-scroll', baseSrc).href;
      mascot.async = false;
      mascot.setAttribute('data-nji-chatbot-mascot', '');
      document.head.appendChild(mascot);
    }
  };

  const bootChatbot = () => {
    if (document.querySelector('script[data-nji-chatbot-core]') || document.querySelector('[data-nji-chatbot]')) return;

    const core = document.createElement('script');
    core.src = new URL('chatbot-core.js?v=8-white-speech-bubble', baseSrc).href;
    core.async = false;
    core.setAttribute('data-nji-chatbot-core', '');
    core.addEventListener('load', setupAfterCoreLoad, { once: true });
    document.head.appendChild(core);
  };

  const resetChatbot = () => {
    if (resetting) return;
    resetting = true;

    window.setTimeout(() => {
      document.querySelector('[data-nji-chatbot]')?.remove();
      document.querySelector('script[data-nji-chatbot-mascot]')?.remove();
      document.querySelector('script[data-nji-chatbot-core]')?.remove();
      document.querySelector('style[data-nji-chatbot-character-style]')?.remove();

      resetting = false;
      bootChatbot();
    }, 230);
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('.nji-chatbot__close')) resetChatbot();
  }, true);

  bootChatbot();
})();