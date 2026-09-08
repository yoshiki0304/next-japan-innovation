(() => {
  'use strict';

  if (document.querySelector('[data-nji-chatbot]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .nji-chatbot{--nji-bg:#07111f;--nji-panel:#0b1728;--nji-line:rgba(255,255,255,.12);--nji-text:#f7f9fc;--nji-muted:#9eacbd;--nji-accent:#4b8cff;position:fixed;right:22px;bottom:22px;z-index:10000;font-family:inherit;color:var(--nji-text)}
    .nji-chatbot *{box-sizing:border-box}
    .back-to-top{right:104px!important}
    .home-page .back-to-top{right:120px!important}
    .nji-chatbot__launcher{position:relative;width:64px;height:64px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:linear-gradient(145deg,#17345b,#07111f);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 16px 42px rgba(0,0,0,.34);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
    .nji-chatbot__launcher:hover{transform:translateY(-3px);box-shadow:0 20px 48px rgba(0,0,0,.42);border-color:rgba(111,163,255,.7)}
    .nji-chatbot__launcher svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8}
    .home-page .nji-chatbot__launcher{width:78px;height:78px}
    .home-page .nji-chatbot__launcher svg{width:33px;height:33px}
    .nji-chatbot__launcher-label{position:absolute;right:74px;white-space:nowrap;padding:9px 13px;border-radius:999px;background:#fff;color:#07111f;font-size:12px;font-weight:700;letter-spacing:.04em;box-shadow:0 10px 26px rgba(0,0,0,.16);opacity:0;transform:translateX(8px);pointer-events:none;transition:.25s ease}
    .home-page .nji-chatbot__launcher-label{right:90px;padding:10px 14px;font-size:13px}
    .nji-chatbot.is-nudged .nji-chatbot__launcher-label{opacity:1;transform:none}
    .nji-chatbot__panel{position:absolute;right:0;bottom:78px;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100vh - 118px));background:linear-gradient(180deg,#0d1d31 0%,#07111f 100%);border:1px solid rgba(255,255,255,.14);border-radius:22px;overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.46);display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(14px) scale(.985);transform-origin:bottom right;transition:opacity .2s ease,transform .2s ease,visibility .2s ease}
    .home-page .nji-chatbot__panel{bottom:92px}
    .nji-chatbot.is-open .nji-chatbot__panel{opacity:1;visibility:visible;transform:none}
    .nji-chatbot__head{display:flex;align-items:center;gap:12px;padding:18px 18px 15px;border-bottom:1px solid var(--nji-line);background:rgba(255,255,255,.025)}
    .nji-chatbot__mark{width:50px;height:50px;flex:0 0 50px;border-radius:12px;display:grid;place-items:center;background:#fff;overflow:hidden;padding:4px}
    .nji-chatbot__mark img{display:block;width:100%;height:100%;object-fit:contain}
    .nji-chatbot__head-copy{min-width:0;flex:1}
    .nji-chatbot__eyebrow{margin:0 0 3px;color:#7faeff;font-size:10px;font-weight:800;letter-spacing:.14em}
    .nji-chatbot__title{margin:0;font-size:15px;font-weight:800;letter-spacing:.02em}
    .nji-chatbot__status{display:flex;align-items:center;gap:6px;margin-top:4px;color:var(--nji-muted);font-size:10px}
    .nji-chatbot__status::before{content:'';width:6px;height:6px;border-radius:50%;background:#61d48b;box-shadow:0 0 0 3px rgba(97,212,139,.12)}
    .nji-chatbot__close{width:36px;height:36px;border:0;border-radius:10px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:20px;line-height:1}
    .nji-chatbot__body{flex:1;overflow-y:auto;padding:18px;scroll-behavior:smooth}
    .nji-chatbot__body::-webkit-scrollbar{width:6px}.nji-chatbot__body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:9px}
    .nji-chatbot__row{display:flex;margin:0 0 12px}.nji-chatbot__row.is-user{justify-content:flex-end}
    .nji-chatbot__bubble{max-width:88%;padding:11px 13px;border-radius:15px 15px 15px 4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.07);color:#eef3f9;font-size:13px;line-height:1.7;white-space:pre-line}
    .nji-chatbot__row.is-user .nji-chatbot__bubble{background:#f5f8fc;color:#10243d;border-color:#f5f8fc;border-radius:15px 15px 4px 15px}
    .nji-chatbot__typing{display:flex;align-items:center;gap:5px;min-width:56px}
    .nji-chatbot__typing i{width:6px;height:6px;border-radius:50%;background:#9eb0c5;animation:njiTyping 1.05s infinite ease-in-out}
    .nji-chatbot__typing i:nth-child(2){animation-delay:.14s}.nji-chatbot__typing i:nth-child(3){animation-delay:.28s}
    @keyframes njiTyping{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}
    .nji-chatbot__choices{display:grid;gap:8px;margin:6px 0 16px}
    .nji-chatbot__choice{width:100%;text-align:left;border:1px solid rgba(126,170,255,.26);border-radius:12px;background:rgba(75,140,255,.08);color:#f2f6fb;padding:10px 12px;cursor:pointer;font:inherit;font-size:12px;line-height:1.5;transition:background .2s ease,border-color .2s ease,transform .2s ease}
    .nji-chatbot__choice:hover{background:rgba(75,140,255,.17);border-color:rgba(126,170,255,.52);transform:translateY(-1px)}
    .nji-chatbot__choice:disabled{opacity:.55;cursor:wait;transform:none}
    .nji-chatbot__choice strong{display:block;font-size:12px;margin-bottom:1px}.nji-chatbot__choice small{display:block;color:#9eb0c5;font-size:10px}
    .nji-chatbot__actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 16px}
    .nji-chatbot__action{display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:11px;text-decoration:none!important;font-size:11px;font-weight:800;letter-spacing:.02em;border:1px solid rgba(255,255,255,.14);color:#fff!important;background:rgba(255,255,255,.06);cursor:pointer;font-family:inherit}
    .nji-chatbot__action.is-primary{background:#fff;color:#07111f!important;border-color:#fff}
    .nji-chatbot__inputbar{display:flex;gap:8px;padding:12px;border-top:1px solid var(--nji-line);background:rgba(2,8,16,.52)}
    .nji-chatbot__input{min-width:0;flex:1;height:44px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;padding:0 12px;font:inherit;font-size:12px;outline:none}
    .nji-chatbot__input::placeholder{color:#8291a4}.nji-chatbot__input:focus{border-color:rgba(126,170,255,.65);box-shadow:0 0 0 3px rgba(75,140,255,.1)}
    .nji-chatbot__input:disabled{opacity:.6;cursor:wait}
    .nji-chatbot__send{width:44px;height:44px;border:0;border-radius:12px;background:#fff;color:#07111f;display:grid;place-items:center;cursor:pointer;font-weight:900}
    .nji-chatbot__send:disabled{opacity:.55;cursor:wait}
    .nji-chatbot__foot{padding:0 14px 11px;text-align:center;color:#728196;font-size:9px;background:rgba(2,8,16,.52)}
    @media (max-width:640px){.nji-chatbot{right:14px;bottom:14px}.back-to-top{right:82px!important}.home-page .back-to-top{right:94px!important}.nji-chatbot__launcher{width:58px;height:58px}.home-page .nji-chatbot__launcher{width:66px;height:66px}.home-page .nji-chatbot__launcher svg{width:29px;height:29px}.nji-chatbot__launcher-label{display:none}.nji-chatbot__panel{position:fixed;left:10px;right:10px;bottom:82px;width:auto;height:min(620px,calc(100dvh - 100px));border-radius:18px;transform-origin:bottom center}.home-page .nji-chatbot__panel{bottom:90px}.nji-chatbot__head{padding:15px}.nji-chatbot__mark{width:46px;height:46px;flex-basis:46px}.nji-chatbot__body{padding:15px}.nji-chatbot__bubble{max-width:92%}}
    @media (prefers-reduced-motion:reduce){.nji-chatbot__launcher,.nji-chatbot__panel,.nji-chatbot__launcher-label,.nji-chatbot__choice{transition:none!important}.nji-chatbot__body{scroll-behavior:auto}.nji-chatbot__typing i{animation:none}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'nji-chatbot';
  root.setAttribute('data-nji-chatbot', '');
  root.innerHTML = `
    <section class="nji-chatbot__panel" role="dialog" aria-modal="false" aria-label="NJI・chatBOTくん" aria-hidden="true">
      <header class="nji-chatbot__head">
        <div class="nji-chatbot__mark"><img src="assets/images/company-logo.png" alt="Next Japan Innovation" /></div>
        <div class="nji-chatbot__head-copy">
          <p class="nji-chatbot__eyebrow">AI CONTACT ASSIST</p>
          <p class="nji-chatbot__title">NJI・chatBOTくん</p>
          <div class="nji-chatbot__status">AI自動案内</div>
        </div>
        <button class="nji-chatbot__close" type="button" aria-label="チャットを閉じる">×</button>
      </header>
      <div class="nji-chatbot__body" aria-live="polite"></div>
      <form class="nji-chatbot__inputbar">
        <input class="nji-chatbot__input" type="text" inputmode="text" autocomplete="off" maxlength="800" placeholder="質問を入力してください" aria-label="質問を入力" />
        <button class="nji-chatbot__send" type="submit" aria-label="送信">→</button>
      </form>
      <div class="nji-chatbot__foot">AIによる自動案内です。正式なお見積り・個別条件は担当者が確認します。</div>
    </section>
    <button class="nji-chatbot__launcher" type="button" aria-label="NJI・chatBOTくんを開く" aria-expanded="false">
      <span class="nji-chatbot__launcher-label">NJI・chatBOTくんに相談</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-5 3 1.5-4.5A7 7 0 0 1 4 15V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4z"/><path d="M8 10h8M8 14h5"/></svg>
    </button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector('.nji-chatbot__panel');
  const launcher = root.querySelector('.nji-chatbot__launcher');
  const closeBtn = root.querySelector('.nji-chatbot__close');
  const body = root.querySelector('.nji-chatbot__body');
  const form = root.querySelector('.nji-chatbot__inputbar');
  const input = root.querySelector('.nji-chatbot__input');
  const sendBtn = root.querySelector('.nji-chatbot__send');

  const aiHistory = [];
  let busy = false;

  const categoryMap = {
    web: 'ホームページ制作',
    sns: 'SNS・MEO支援',
    ai: '業務効率化システム',
    reservation: '店舗型予約ツール',
    camera: 'ネットワークカメラ',
    app: '店舗公式アプリ',
    placement: 'その他',
    recruit: '採用について',
    partner: '代理店募集について',
    other: 'その他'
  };

  const serviceItems = [
    ['placement', '有料職業紹介', '仕事を探している方・採用企業'],
    ['web', 'ホームページ制作', '制作・リニューアル・運用'],
    ['sns', 'SNS・MEO支援', 'Instagram運用・Googleマップ対策'],
    ['ai', 'AI・業務効率化', 'AIチャットボット・業務システム・自動化'],
    ['reservation', '店舗型予約ツール', '予約管理のご相談'],
    ['app', '店舗公式アプリ', '店舗向け公式アプリ'],
    ['camera', 'ネットワークカメラ', '販売・設置・運用'],
    ['recruit', '採用について', 'NJIの採用情報'],
    ['partner', '代理店募集について', '代理店・事業パートナー'],
    ['other', 'その他のお問い合わせ', '自由にご相談ください']
  ];

  const addBubble = (text, user = false) => {
    const row = document.createElement('div');
    row.className = `nji-chatbot__row${user ? ' is-user' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'nji-chatbot__bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  };

  const addTyping = () => {
    const row = document.createElement('div');
    row.className = 'nji-chatbot__row';
    const bubble = document.createElement('div');
    bubble.className = 'nji-chatbot__bubble nji-chatbot__typing';
    bubble.setAttribute('aria-label', 'AIが回答を作成中');
    bubble.innerHTML = '<i></i><i></i><i></i>';
    row.appendChild(bubble);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  };

  const addChoices = (items) => {
    const wrap = document.createElement('div');
    wrap.className = 'nji-chatbot__choices';
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nji-chatbot__choice';
      btn.innerHTML = `<strong>${item.label}</strong>${item.note ? `<small>${item.note}</small>` : ''}`;
      btn.addEventListener('click', () => item.onClick(btn));
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
    return wrap;
  };

  const goToInquiryForm = (categoryKey = 'other', seedText = '') => {
    const inquiryForm = document.getElementById('inquiry-form');
    const category = categoryMap[categoryKey] || 'その他';
    if (!inquiryForm) {
      window.location.href = `contact.html?chat=${encodeURIComponent(category)}#inquiry-form`;
      return;
    }

    const select = inquiryForm.querySelector('select[name="お問合せ種別"]');
    const textarea = inquiryForm.querySelector('textarea[name="お問合せ内容"]');
    if (select && [...select.options].some((opt) => opt.value === category)) {
      select.value = category;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (textarea && !textarea.value.trim() && seedText) {
      textarea.value = seedText;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    closeChat();
    setTimeout(() => {
      inquiryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => (textarea || select)?.focus({ preventScroll: true }), 450);
    }, 120);
  };

  const addContactActions = (categoryKey, seedText) => {
    const actions = document.createElement('div');
    actions.className = 'nji-chatbot__actions';

    const formBtn = document.createElement('button');
    formBtn.type = 'button';
    formBtn.className = 'nji-chatbot__action is-primary';
    formBtn.textContent = 'フォームへ進む';
    formBtn.addEventListener('click', () => goToInquiryForm(categoryKey, seedText));

    const phone = document.createElement('a');
    phone.className = 'nji-chatbot__action';
    phone.href = 'tel:0926003558';
    phone.textContent = '電話 092-600-3558';

    actions.append(formBtn, phone);
    body.appendChild(actions);
    body.scrollTop = body.scrollHeight;
  };

  const setBusy = (value) => {
    busy = value;
    input.disabled = value;
    sendBtn.disabled = value;
    input.placeholder = value ? 'AIが回答を作成中です…' : '質問を入力してください';
  };

  const askAI = async (rawMessage, displayText = rawMessage) => {
    const message = String(rawMessage || '').trim();
    const visible = String(displayText || message).trim();
    if (!message || busy) return;

    const previousHistory = aiHistory.slice(-16);
    addBubble(visible, true);
    aiHistory.push({ role: 'user', content: message });
    if (aiHistory.length > 18) aiHistory.splice(0, aiHistory.length - 18);

    setBusy(true);
    const typing = addTyping();

    try {
      const response = await fetch('chat-api.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: previousHistory })
      });

      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      typing.remove();

      if (!response.ok || !data || data.ok !== true || !data.answer) {
        addBubble('現在AI回答を取得できませんでした。少し時間をおいてもう一度お試しいただくか、お問い合わせフォームをご利用ください。');
        addContactActions('other', `チャットからのご相談：${visible}`);
        return;
      }

      addBubble(data.answer);
      aiHistory.push({ role: 'assistant', content: data.answer });
      if (aiHistory.length > 18) aiHistory.splice(0, aiHistory.length - 18);

      const category = Object.prototype.hasOwnProperty.call(categoryMap, data.category) ? data.category : 'other';
      if (data.suggest_contact) {
        addContactActions(category, `チャットからのご相談：${visible}\n\nAIによる事前案内：${data.answer}\n\n担当者へのご相談内容：`);
      }
    } catch (_) {
      typing.remove();
      addBubble('通信状況によりAI回答を取得できませんでした。少し時間をおいてもう一度お試しください。');
    } finally {
      setBusy(false);
      setTimeout(() => input.focus({ preventScroll: true }), 60);
    }
  };

  const showMainMenu = () => {
    addChoices(serviceItems.map(([key, label, note]) => ({
      label,
      note,
      onClick: (button) => {
        button.closest('.nji-chatbot__choices')?.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
        askAI(`${label}について案内してください。`, label);
      }
    })));
  };

  const openChat = () => {
    root.classList.add('is-open');
    root.classList.remove('is-nudged');
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus({ preventScroll: true }), 180);
  };

  const closeChat = () => {
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    launcher.focus({ preventScroll: true });
  };

  launcher.addEventListener('click', () => root.classList.contains('is-open') ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) closeChat();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    if (!value.trim() || busy) return;
    input.value = '';
    askAI(value);
  });

  addBubble('こんにちは。Next Japan InnovationのNJI・chatBOTくんです。\nメニューを選ぶか、下の入力欄から自由に質問してください。');
  showMainMenu();

  const params = new URLSearchParams(window.location.search);
  const chatCategory = params.get('chat');
  if (chatCategory) {
    const reverseKey = Object.keys(categoryMap).find((key) => categoryMap[key] === chatCategory) || 'other';
    goToInquiryForm(reverseKey, `${chatCategory}について相談したいです。\n`);
  }

  setTimeout(() => {
    if (!root.classList.contains('is-open')) {
      root.classList.add('is-nudged');
      setTimeout(() => root.classList.remove('is-nudged'), 5000);
    }
  }, 3500);
})();