(() => {
  'use strict';

  const self = document.currentScript;
  if (!self) return;
  const baseSrc = self.src;
  let resetting = false;

  // Capture structured UI instructions returned by chat-api.php without changing
  // the stable chatbot core. The core still owns normal conversation rendering.
  if (!window.__njiChatbotFetchMetaPatched && typeof window.fetch === 'function') {
    window.__njiChatbotFetchMetaPatched = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      try {
        const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (/chat-api\.php(?:$|[?#])/i.test(requestUrl)) {
          response.clone().json().then((data) => {
            if (!data || data.ok !== true) return;
            document.dispatchEvent(new CustomEvent('nji:chatbot-ai-meta', {
              detail: {
                action: typeof data.action === 'string' ? data.action : 'none',
                pendingIntent: typeof data.pending_intent === 'string' ? data.pending_intent : ''
              }
            }));
          }).catch(() => {});
        }
      } catch (_) {}
      return response;
    };
  }

  const setupAfterCoreLoad = () => {
    const chatBody = document.querySelector('.nji-chatbot__body');
    const root = document.querySelector('[data-nji-chatbot]');
    const firstBubble = chatBody?.querySelector('.nji-chatbot__bubble');
    const initialGreeting = 'こんにちは。NJI・chatBOTくんです！\nメニューを選ぶか、下の入力欄から自由に質問してください。';

    if (firstBubble) {
      firstBubble.textContent = initialGreeting;
    }

    if (chatBody) {
      chatBody.style.overflowY = 'auto';
      chatBody.style.overscrollBehaviorY = 'contain';
      chatBody.style.webkitOverflowScrolling = 'touch';
      chatBody.style.scrollBehavior = 'auto';

      const reduceTyping = window.matchMedia('(prefers-reduced-motion: reduce)');
      let typeQueue = Promise.resolve();
      let initialSequenceStarted = false;
      let manualScrollLock = false;
      let pendingServiceIntent = '';
      let pendingServiceMenuTimer = 0;
      let lastSubmittedText = '';

      const distanceFromBottom = () => Math.max(0, chatBody.scrollHeight - chatBody.clientHeight - chatBody.scrollTop);
      const isNearBottom = () => distanceFromBottom() <= 42;

      const scrollToBottom = (force = false) => {
        if (manualScrollLock && !force) return;
        chatBody.scrollTop = chatBody.scrollHeight;
      };

      const keepAtTop = () => {
        chatBody.scrollTop = 0;
      };

      const serviceIntentItems = [
        { label: 'ホームページ制作', queryName: 'ホームページ制作' },
        { label: 'AIチャットボットくん', queryName: 'AIチャットボットくん' },
        { label: 'SNS・MEO支援', queryName: 'SNS・MEO支援' },
        { label: 'AI・業務効率化', queryName: 'AI・業務効率化' },
        { label: '店舗型予約ツール', queryName: '店舗型予約ツール' },
        { label: '店舗公式アプリ', queryName: '店舗公式アプリ' },
        { label: 'ネットワークカメラ', queryName: 'ネットワークカメラ' },
        { label: '有料職業紹介', queryName: '有料職業紹介' },
        { label: '採用について', queryName: '採用' },
        { label: '代理店募集について', queryName: '代理店募集' }
      ];

      const submitServiceIntent = (item, intent, button) => {
        const form = root?.querySelector('.nji-chatbot__inputbar');
        const input = root?.querySelector('.nji-chatbot__input');
        if (!form || !input) return;

        const wrap = button?.closest('.nji-chatbot__choices');
        if (wrap) {
          wrap.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
        }

        input.value = `${item.queryName}の${intent || '詳細'}について教えてください。`;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        // The core stores the full contextual sentence in AI history, while the
        // visible user bubble stays natural and simply shows the selected service.
        requestAnimationFrame(() => {
          const userRows = chatBody.querySelectorAll('.nji-chatbot__row.is-user');
          const lastRow = userRows[userRows.length - 1];
          const bubble = lastRow?.querySelector('.nji-chatbot__bubble');
          if (bubble) bubble.textContent = item.label;
        });
      };

      const appendServiceIntentMenu = (intent) => {
        if (!intent || !chatBody.isConnected) return;
        if (chatBody.querySelector('.nji-chatbot__choices[data-context-intent-menu="1"]')) return;

        const wrap = document.createElement('div');
        wrap.className = 'nji-chatbot__choices';
        wrap.dataset.contextIntentMenu = '1';
        wrap.dataset.intent = intent;

        serviceIntentItems.forEach((item) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'nji-chatbot__choice';
          btn.innerHTML = `<strong>${item.label}</strong>`;
          btn.addEventListener('click', () => submitServiceIntent(item, intent, btn));
          wrap.appendChild(btn);
        });

        chatBody.appendChild(wrap);
        scrollToBottom();
      };

      const removeImmediateContactActions = (row) => {
        const next = row?.nextElementSibling;
        if (next?.matches('.nji-chatbot__actions')) next.remove();
      };

      const rewriteLegacyFallback = (row, bubble) => {
        if (!row || !bubble) return;
        const current = (bubble.textContent || '').trim();
        const submitted = (lastSubmittedText || '').trim();
        if (!current || !submitted) return;

        if (current.includes('電話受付は平日10:00〜18:00')) {
          bubble.textContent = '営業時間は10:00〜19:00です。土日祝日はお休みです。電話番号は092-600-3558、メールはinfo@next-ji.jpです。';
          removeImmediateContactActions(row);
          return;
        }

        if (current.includes('固定金額はご案内できません')) {
          removeImmediateContactActions(row);

          if (/ホームページ|\bHP\b|\bWEB\b|サイト|\bLP\b/i.test(submitted)) {
            bubble.textContent = 'ホームページ制作の月額料金ですね！通常のホームページ制作は月額9,800円〜200,000円です。AIチャットボットくん付きの場合は月額30,000円〜で、ページ数や必要な機能、運用内容によって変わります。';
            return;
          }

          if (/AIチャットボット|chatBOT|チャットボット/i.test(submitted)) {
            bubble.textContent = 'AIチャットボットくんの料金ですね！ホームページにAIチャットボットくんを付ける場合は月額30,000円〜です。必要な機能や連携内容によって料金が変わります。';
            return;
          }

          const intent = /月額/.test(submitted) ? '月額料金' : '料金・見積り';
          bubble.textContent = intent === '月額料金'
            ? '月額料金ですね！どちらのサービスについてでしょうか？'
            : '料金についてですね！どちらのサービスについてでしょうか？';
          appendServiceIntentMenu(intent);
          return;
        }

        if (current.includes('制作・導入期間は内容によって異なります')) {
          removeImmediateContactActions(row);

          if (/ホームページ|\bHP\b|\bWEB\b|サイト|\bLP\b/i.test(submitted)) {
            bubble.textContent = 'ホームページ制作の期間ですね！通常はお申込みから平均20日前後です。お急ぎの場合は最短3日で対応できるケースもありますが、特急対応は追加料金が発生する場合があります。';
            return;
          }

          bubble.textContent = '導入・制作期間についてですね。どちらのサービスについてでしょうか？';
          appendServiceIntentMenu('導入・制作期間');
          return;
        }
      };

      const handleAiMeta = (event) => {
        const detail = event?.detail || {};
        if (detail.action !== 'show_service_menu') return;
        const intent = String(detail.pendingIntent || 'ご相談内容').trim();
        pendingServiceIntent = intent;
        window.clearTimeout(pendingServiceMenuTimer);
        pendingServiceMenuTimer = window.setTimeout(() => {
          if (!pendingServiceIntent) return;
          const currentIntent = pendingServiceIntent;
          pendingServiceIntent = '';
          appendServiceIntentMenu(currentIntent);
        }, 140);
      };

      document.addEventListener('nji:chatbot-ai-meta', handleAiMeta);

      const inputForm = root?.querySelector('.nji-chatbot__inputbar');
      const inputField = root?.querySelector('.nji-chatbot__input');
      inputForm?.addEventListener('submit', () => {
        lastSubmittedText = String(inputField?.value || '').trim();
      }, true);

      // If the user scrolls upward while a reply is being typed, stop automatic
      // bottom-following immediately. Resume only after they return to the bottom.
      chatBody.addEventListener('wheel', (event) => {
        if (event.ctrlKey) return;
        if (event.deltaY < 0) {
          manualScrollLock = true;
          chatBody.dataset.manualScrollLock = '1';
          return;
        }

        if (event.deltaY > 0 && manualScrollLock) {
          window.setTimeout(() => {
            if (!isNearBottom()) return;
            manualScrollLock = false;
            delete chatBody.dataset.manualScrollLock;
          }, 180);
        }
      }, { passive: true, capture: true });

      chatBody.addEventListener('scroll', () => {
        if (!manualScrollLock || !isNearBottom()) return;
        manualScrollLock = false;
        delete chatBody.dataset.manualScrollLock;
      }, { passive: true });

      // A deliberate menu/action click starts a new answer, so following the newest
      // content is wanted again even if the user had previously scrolled upward.
      chatBody.addEventListener('click', (event) => {
        const interactive = event.target.closest('.nji-chatbot__choice,.nji-chatbot__action');
        if (!interactive || !chatBody.contains(interactive)) return;
        manualScrollLock = false;
        delete chatBody.dataset.manualScrollLock;
        scrollToBottom(true);
      }, true);

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

      const revealStaggerItems = (container, selector, options = {}) => {
        if (!container || !container.isConnected) return;
        const items = Array.from(container.querySelectorAll(selector));
        if (!items.length) return;

        const updateScroll = options.keepTop === true ? keepAtTop : scrollToBottom;

        if (reduceTyping.matches) {
          items.forEach((item) => {
            item.style.opacity = '';
            item.style.transform = '';
            item.style.transition = '';
            item.style.pointerEvents = '';
          });
          updateScroll();
          return;
        }

        items.forEach((item, index) => {
          window.setTimeout(() => {
            if (!item.isConnected) return;
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.style.pointerEvents = '';
            updateScroll();
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

        const fullText = options.fullText || bubble.textContent || '';
        bubble.dataset.typewriterReady = '1';
        if (!fullText || reduceTyping.matches) {
          bubble.textContent = fullText;
          if (options.initial === true) keepAtTop();
          resolve();
          return;
        }

        const chars = Array.from(fullText);
        let index = 0;
        const updateScroll = options.initial === true ? keepAtTop : scrollToBottom;

        const tick = () => {
          if (!bubble.isConnected) {
            resolve();
            return;
          }

          const ch = chars[index++];
          bubble.textContent += ch;
          updateScroll();

          if (index >= chars.length) {
            bubble.removeAttribute('aria-label');
            updateScroll();
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
          keepAtTop();
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

      if (firstBubble && !reduceTyping.matches) {
        firstBubble.textContent = '';
        firstBubble.setAttribute('aria-label', initialGreeting);
      }

      const startInitialSequence = () => {
        if (initialSequenceStarted || !firstBubble) return;
        initialSequenceStarted = true;
        keepAtTop();

        typeQueue = typeQueue.then(() => typeBubble(firstBubble, {
          initial: true,
          fullText: initialGreeting
        }));

        typeQueue.then(() => {
          if (initialChoices?.isConnected) {
            revealStaggerItems(initialChoices, '.nji-chatbot__choice', { keepTop: true });
          }
        });
      };

      if (root) {
        if (root.classList.contains('is-open')) {
          startInitialSequence();
        } else {
          const openObserver = new MutationObserver(() => {
            if (!root.classList.contains('is-open')) return;
            openObserver.disconnect();
            keepAtTop();
            startInitialSequence();
          });
          openObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
        }
      } else {
        startInitialSequence();
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
              rewriteLegacyFallback(row, bubble);
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
    core.src = new URL('chatbot-core.js?v=9-context-aware', baseSrc).href;
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
