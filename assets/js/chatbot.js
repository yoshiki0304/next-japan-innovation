(() => {
  'use strict';

  if (document.querySelector('[data-nji-chatbot]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .nji-chatbot{--nji-bg:#07111f;--nji-panel:#0b1728;--nji-line:rgba(255,255,255,.12);--nji-text:#f7f9fc;--nji-muted:#9eacbd;--nji-accent:#4b8cff;position:fixed;right:22px;bottom:22px;z-index:10000;font-family:inherit;color:var(--nji-text)}
    .nji-chatbot *{box-sizing:border-box}
    .back-to-top{right:104px!important}
    .nji-chatbot__launcher{position:relative;width:64px;height:64px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:linear-gradient(145deg,#17345b,#07111f);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 16px 42px rgba(0,0,0,.34);transition:transform .25s ease,box-shadow .25s ease;border-color:.25s ease}
    .nji-chatbot__launcher:hover{transform:translateY(-3px);box-shadow:0 20px 48px rgba(0,0,0,.42);border-color:rgba(111,163,255,.7)}
    .nji-chatbot__launcher svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.8}
    .nji-chatbot__launcher-label{position:absolute;right:74px;white-space:nowrap;padding:9px 13px;border-radius:999px;background:#fff;color:#07111f;font-size:12px;font-weight:700;letter-spacing:.04em;box-shadow:0 10px 26px rgba(0,0,0,.16);opacity:0;transform:translateX(8px);pointer-events:none;transition:.25s ease}
    .nji-chatbot.is-nudged .nji-chatbot__launcher-label{opacity:1;transform:none}
    .nji-chatbot__panel{position:absolute;right:0;bottom:78px;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100vh - 118px));background:linear-gradient(180deg,#0d1d31 0%,#07111f 100%);border:1px solid rgba(255,255,255,.14);border-radius:22px;overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.46);display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(14px) scale(.985);transform-origin:bottom right;transition:opacity .2s ease,transform .2s ease,visibility .2s ease}
    .nji-chatbot.is-open .nji-chatbot__panel{opacity:1;visibility:visible;transform:none}
    .nji-chatbot__head{display:flex;align-items:center;gap:12px;padding:18px 18px 15px;border-bottom:1px solid var(--nji-line);background:rgba(255,255,255,.025)}
    .nji-chatbot__mark{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#fff;color:#07111f;font-weight:900;font-size:11px;letter-spacing:.08em}
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
    .nji-chatbot__choices{display:grid;gap:8px;margin:6px 0 16px}
    .nji-chatbot__choice{width:100%;text-align:left;border:1px solid rgba(126,170,255,.26);border-radius:12px;background:rgba(75,140,255,.08);color:#f2f6fb;padding:10px 12px;cursor:pointer;font:inherit;font-size:12px;line-height:1.5;transition:background .2s ease,border-color .2s ease,transform .2s ease}
    .nji-chatbot__choice:hover{background:rgba(75,140,255,.17);border-color:rgba(126,170,255,.52);transform:translateY(-1px)}
    .nji-chatbot__choice strong{display:block;font-size:12px;margin-bottom:1px}.nji-chatbot__choice small{display:block;color:#9eb0c5;font-size:10px}
    .nji-chatbot__actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .nji-chatbot__action{display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:11px;text-decoration:none!important;font-size:11px;font-weight:800;letter-spacing:.02em;border:1px solid rgba(255,255,255,.14);color:#fff!important;background:rgba(255,255,255,.06)}
    .nji-chatbot__action.is-primary{background:#fff;color:#07111f!important;border-color:#fff}
    .nji-chatbot__inputbar{display:flex;gap:8px;padding:12px;border-top:1px solid var(--nji-line);background:rgba(2,8,16,.52)}
    .nji-chatbot__input{min-width:0;flex:1;height:44px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;padding:0 12px;font:inherit;font-size:12px;outline:none}
    .nji-chatbot__input::placeholder{color:#8291a4}.nji-chatbot__input:focus{border-color:rgba(126,170,255,.65);box-shadow:0 0 0 3px rgba(75,140,255,.1)}
    .nji-chatbot__send{width:44px;height:44px;border:0;border-radius:12px;background:#fff;color:#07111f;display:grid;place-items:center;cursor:pointer;font-weight:900}
    .nji-chatbot__foot{padding:0 14px 11px;text-align:center;color:#728196;font-size:9px;background:rgba(2,8,16,.52)}
    .nji-chatbot__foot a{color:#aab7c7;text-decoration:underline}
    @media (max-width:640px){.nji-chatbot{right:14px;bottom:14px}.back-to-top{right:82px!important}.nji-chatbot__launcher{width:58px;height:58px}.nji-chatbot__launcher-label{display:none}.nji-chatbot__panel{position:fixed;left:10px;right:10px;bottom:82px;width:auto;height:min(620px,calc(100dvh - 100px));border-radius:18px;transform-origin:bottom center}.nji-chatbot__head{padding:15px}.nji-chatbot__body{padding:15px}.nji-chatbot__bubble{max-width:92%}}
    @media (prefers-reduced-motion:reduce){.nji-chatbot__launcher,.nji-chatbot__panel,.nji-chatbot__launcher-label,.nji-chatbot__choice{transition:none!important}.nji-chatbot__body{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'nji-chatbot';
  root.setAttribute('data-nji-chatbot', '');
  root.innerHTML = `
    <section class="nji-chatbot__panel" role="dialog" aria-modal="false" aria-label="Next Japan Innovation お問い合わせサポート" aria-hidden="true">
      <header class="nji-chatbot__head">
        <div class="nji-chatbot__mark">NJI</div>
        <div class="nji-chatbot__head-copy">
          <p class="nji-chatbot__eyebrow">CONTACT ASSIST</p>
          <p class="nji-chatbot__title">お問い合わせサポート</p>
          <div class="nji-chatbot__status">オンライン案内</div>
        </div>
        <button class="nji-chatbot__close" type="button" aria-label="チャットを閉じる">×</button>
      </header>
      <div class="nji-chatbot__body" aria-live="polite"></div>
      <form class="nji-chatbot__inputbar">
        <input class="nji-chatbot__input" type="text" inputmode="text" autocomplete="off" placeholder="質問を入力してください" aria-label="質問を入力" />
        <button class="nji-chatbot__send" type="submit" aria-label="送信">→</button>
      </form>
      <div class="nji-chatbot__foot">自動案内です。正式なお見積り・回答は担当者よりご案内します。</div>
    </section>
    <button class="nji-chatbot__launcher" type="button" aria-label="お問い合わせチャットを開く" aria-expanded="false">
      <span class="nji-chatbot__launcher-label">ご相談はこちら</span>
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

  const categoryMap = {
    web: 'ホームページ制作',
    sns: 'SNS・MEO支援',
    ai: '業務効率化システム',
    reservation: '店舗型予約ツール',
    camera: 'ネットワークカメラ',
    app: '店舗公式アプリ',
    recruit: '採用について',
    partner: '代理店募集について',
    other: 'その他'
  };

  const serviceNames = {
    web: 'ホームページ制作',
    sns: 'SNS・MEO支援',
    ai: 'AI・業務効率化',
    reservation: '店舗型予約ツール',
    camera: 'ネットワークカメラ',
    app: '店舗公式アプリ',
    recruit: '採用',
    partner: '代理店募集',
    other: 'その他のご相談'
  };

  const addBubble = (text, user = false) => {
    const row = document.createElement('div');
    row.className = `nji-chatbot__row${user ? ' is-user' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'nji-chatbot__bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
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

  const goToInquiryForm = (categoryKey = 'other', seedText = '') => {
    const inquiryForm = document.getElementById('inquiry-form');
    if (!inquiryForm) {
      window.location.href = `contact.html?chat=${encodeURIComponent(categoryMap[categoryKey] || 'その他')}#inquiry-form`;
      return;
    }

    const select = inquiryForm.querySelector('select[name="お問合せ種別"]');
    const textarea = inquiryForm.querySelector('textarea[name="お問合せ内容"]');
    const category = categoryMap[categoryKey] || 'その他';

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

  const showMainMenu = () => {
    addChoices([
      { label: 'ホームページ制作', note: '制作・リニューアル・運用', onClick: () => selectService('web') },
      { label: 'SNS・MEO支援', note: 'Instagram運用・Googleマップ対策', onClick: () => selectService('sns') },
      { label: 'AI・業務効率化', note: '業務システム・自動化のご相談', onClick: () => selectService('ai') },
      { label: '予約ツール・店舗アプリ', note: '予約管理・公式アプリ', onClick: () => selectService('reservation') },
      { label: 'ネットワークカメラ', note: '販売・設置・運用', onClick: () => selectService('camera') },
      { label: '採用について', onClick: () => selectService('recruit') },
      { label: '代理店募集について', onClick: () => selectService('partner') },
      { label: 'その他のお問い合わせ', onClick: () => selectService('other') }
    ]);
  };

  const selectService = (key) => {
    const name = serviceNames[key] || 'ご相談';
    addBubble(name, true);

    if (key === 'recruit') {
      addBubble('採用についてのご相談ですね。募集職種・応募方法など、内容に応じて担当者がご案内します。');
      addContactActions('recruit', '採用について相談したいです。\n');
      return;
    }
    if (key === 'partner') {
      addBubble('代理店・事業パートナーについてのご相談ですね。詳細条件は担当者からご案内します。');
      addContactActions('partner', '代理店募集について詳しく相談したいです。\n');
      return;
    }
    if (key === 'other') {
      addBubble('内容を自由にご相談いただけます。フォームへ進むと「その他」を自動で選択します。');
      addContactActions('other', '相談内容：\n');
      return;
    }

    addBubble(`${name}についてですね。知りたい内容を選んでください。`);
    addChoices([
      { label: '料金・見積りについて', onClick: () => answerPrice(key) },
      { label: '導入・制作期間について', onClick: () => answerSchedule(key) },
      { label: 'まず相談したい', onClick: () => answerConsult(key) },
      { label: '最初のメニューに戻る', onClick: () => { addBubble('最初のメニュー', true); showMainMenu(); } }
    ]);
  };

  const answerPrice = (key) => {
    addBubble('料金・見積りについて', true);
    addBubble('料金は、ご希望の内容・規模・必要な機能によって変わります。ご要望を確認したうえで、担当者から正式なお見積りをご案内します。');
    addContactActions(key, `${serviceNames[key]}の料金・見積りについて相談したいです。\n`);
  };

  const answerSchedule = (key) => {
    addBubble('導入・制作期間について', true);
    addBubble('開始時期や納期は、内容・規模・現在の進行状況によって異なります。ご希望時期がある場合は、フォームに記載いただくとスムーズです。');
    addContactActions(key, `${serviceNames[key]}の導入・制作期間について相談したいです。\n希望時期：`);
  };

  const answerConsult = (key) => {
    addBubble('まず相談したい', true);
    addBubble('サービス内容がまだ固まっていない段階でも問題ありません。現在の課題や「こうしたい」という内容をお送りください。');
    addContactActions(key, `${serviceNames[key]}について相談したいです。\n現在の課題・相談内容：`);
  };

  const answerFreeText = (raw) => {
    const text = raw.trim();
    if (!text) return;
    addBubble(text, true);

    if (/料金|費用|価格|いくら|見積/.test(text)) {
      addBubble('料金は内容や規模によって異なるため、チャット上では固定金額を案内していません。ご希望を確認後、担当者から正式なお見積りをご案内します。');
      addContactActions(detectCategory(text), `料金・見積りについて相談したいです。\nご相談内容：${text}`);
      return;
    }
    if (/期間|納期|何日|何週間|何ヶ月|いつ|開始/.test(text)) {
      addBubble('制作・導入期間は内容によって異なります。希望時期が決まっている場合は、フォームに記載してください。');
      addContactActions(detectCategory(text), `導入・制作期間について相談したいです。\nご相談内容：${text}\n希望時期：`);
      return;
    }
    if (/電話|営業時間|受付時間|連絡先/.test(text)) {
      addBubble('電話受付は平日10:00〜18:00です。電話番号は 092-600-3558 です。メールは info@next-ji.jp で受け付けています。');
      addContactActions('other', `お問い合わせ：${text}`);
      return;
    }
    if (/採用|求人|応募|仕事|働き/.test(text)) {
      addBubble('採用に関するお問い合わせですね。応募・募集内容については担当者がご案内します。');
      addContactActions('recruit', `採用について相談したいです。\nご相談内容：${text}`);
      return;
    }
    if (/代理店|パートナー|協業/.test(text)) {
      addBubble('代理店・事業パートナーに関するお問い合わせですね。詳細は担当者からご案内します。');
      addContactActions('partner', `代理店募集について相談したいです。\nご相談内容：${text}`);
      return;
    }

    const category = detectCategory(text);
    if (category !== 'other') {
      addBubble(`${serviceNames[category]}に関するご相談として承れます。詳細はフォームに引き継いで担当者へ送れます。`);
      addContactActions(category, `チャットからのご相談：${text}`);
      return;
    }

    addBubble('ありがとうございます。個別の内容は担当者が確認して回答します。フォームへ進むと、そのままお問い合わせできます。');
    addContactActions('other', `チャットからのご相談：${text}`);
  };

  const detectCategory = (text) => {
    if (/ホームページ|hp|web|サイト|lp/i.test(text)) return 'web';
    if (/sns|instagram|インスタ|meo|googleマップ|google map/i.test(text)) return 'sns';
    if (/ai|効率化|システム|自動化|dx/i.test(text)) return 'ai';
    if (/予約/.test(text)) return 'reservation';
    if (/アプリ/.test(text)) return 'app';
    if (/カメラ|防犯/.test(text)) return 'camera';
    if (/採用|求人|応募/.test(text)) return 'recruit';
    if (/代理店|パートナー|協業/.test(text)) return 'partner';
    return 'other';
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
    input.value = '';
    answerFreeText(value);
  });

  addBubble('こんにちは。Next Japan Innovationのお問い合わせサポートです。\nご相談内容を選ぶか、下の入力欄から質問してください。');
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
