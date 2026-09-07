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

      const reduceTyping = window.matchMedia('(prefers-reduced-motion: reduce)');
      let typeQueue = Promise.resolve();

      const scrollToBottom = () => {
        chatBody.scrollTop = chatBody.scrollHeight;
      };

      const prepareStaggerItems = (container, selector) => {
        if (!container || container.dataset.staggerPrepared === '1') return [];
        container.dataset.staggerPrepared = '1';
        const items = Array.from(container.querySelectorAll(selector));
        items.forEach((item) => {
          item.style.opacity = '0';
          item.style.transform = 'translateY(10px)';
          item.style.transition = 'opacity .42s ease, transform .42s ease';
          item.style.pointerEvents = 'none';
        });
        return items;
      };

      const revealStaggerItems = (container, selector) => {
        if (!container || !container.isConnected) return;
        const items = Array.from(container.querySelectorAll(selector));
        if (!items.length) return;

        if (reduceTyping.matches) {
          items.forEach((item) => {
            item.style.opacity = '';
            item.style.transform = '';
            item.style.transition = '';
            item.style.pointerEvents = '';
          });
          scrollToBottom();
          return;
        }

        items.forEach((item, index) => {
          window.setTimeout(() => {
            if (!item.isConnected) return;
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.style.pointerEvents = '';
            scrollToBottom();
          }, index * 135);
        });
      };

      const typeBubble = (bubble, options = {}) => new Promise((resolve) => {
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
        let index = 0;

        const tick = () => {
          if (!bubble.isConnected) {
            resolve();
            return;
          }

          const ch = chars[index++];
          bubble.textContent += ch;
          scrollToBottom();

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

        if (options.initial === true) {
          bubble.textContent = '';
          bubble.setAttribute('aria-label', fullText);
          window.setTimeout(tick, 120);
          return;
        }

        const thinkingFrames = ['・', '・・', '・・・'];
        let thinkingIndex = 0;
        bubble.textContent = thinkingFrames[thinkingIndex];
        bubble.setAttribute('aria-label', '回答を作成中');
        scrollToBottom();

        const thinkingTimer = window.setInterval(() => {
          if (!bubble.isConnected) {
            window.clearInterval(thinkingTimer);
            return;
          }
          thinkingIndex = (thinkingIndex + 1) % thinkingFrames.length;
          bubble.textContent = thinkingFrames[thinkingIndex];
          scrollToBottom();
        }, 420);

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

      const gateChoices = (choices) => {
        if (!choices || choices.dataset.replyGated === '1') return;
        choices.dataset.replyGated = '1';
        prepareStaggerItems(choices, '.nji-chatbot__choice');
        const queueAtCreation = typeQueue;
        queueAtCreation.then(() => {
          if (!choices.isConnected) return;
          revealStaggerItems(choices, '.nji-chatbot__choice');
        });
      };

      const gateContactActions = (actions) => {
        if (!actions || actions.dataset.replyGated === '1') return;
        actions.dataset.replyGated = '1';
        actions.style.display = 'none';
        prepareStaggerItems(actions, '.nji-chatbot__action');

        const queueAtCreation = typeQueue;
        queueAtCreation.then(() => {
          if (!actions.isConnected) return;
          actions.style.display = '';
          requestAnimationFrame(() => {
            revealStaggerItems(actions, '.nji-chatbot__action');
          });
        });
      };

      const initialChoices = chatBody.querySelector('.nji-chatbot__choices');
      if (initialChoices) {
        initialChoices.dataset.replyGated = '1';
        prepareStaggerItems(initialChoices, '.nji-chatbot__choice');
      }

      chatBody.querySelectorAll('.nji-chatbot__row .nji-chatbot__bubble').forEach((bubble) => {
        if (bubble !== firstBubble) bubble.dataset.typewriterReady = '1';
      });

      if (firstBubble) {
        typeQueue = typeQueue.then(() => typeBubble(firstBubble, { initial: true }));
        typeQueue.then(() => {
          if (initialChoices?.isConnected) {
            revealStaggerItems(initialChoices, '.nji-chatbot__choice');
          }
        });
      }

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

            const choiceBlocks = [];
            if (node.matches('.nji-chatbot__choices')) choiceBlocks.push(node);
            node.querySelectorAll?.('.nji-chatbot__choices').forEach((choices) => choiceBlocks.push(choices));
            choiceBlocks.forEach(gateChoices);

            const actionBlocks = [];
            if (node.matches('.nji-chatbot__actions')) actionBlocks.push(node);
            node.querySelectorAll?.('.nji-chatbot__actions').forEach((actions) => actionBlocks.push(actions));
            actionBlocks.forEach(gateContactActions);
          });
        });
      });

      observer.observe(chatBody, { childList: true, subtree: true });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatBody.scrollTop = 0;
        });
      });
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