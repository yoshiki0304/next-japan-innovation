(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const loader = qs('.page-loader');
  const header = qs('[data-header]');
  const progressBar = qs('.scroll-progress span');
  const menuButton = qs('[data-menu-button]');
  const mobileMenu = qs('[data-mobile-menu]');
  const backToTop = qs('[data-back-to-top]');
  const scrollCue = qs('.scroll-cue');
  const parallaxItems = qsa('[data-parallax]');
  const revealItems = qsa('.reveal, [data-image-reveal], [data-motion-heading]');
  const jobCards = qsa('.job-card');
  const transitionLayer = qs('.page-transition');

  let lastScrollY = window.scrollY;
  let ticking = false;
  let menuLastFocused = null;

  const hideLoader = () => {
    window.setTimeout(() => loader?.classList.add('is-hidden'), reducedMotion ? 0 : 260);
    document.body.classList.add('is-ready');
  };

  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader, { once: true });

  // Stagger items inside visual groups without adding inline animation code to each card.
  qsa('[data-reveal-group]').forEach((group) => {
    qsa('.reveal', group).forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${Math.min(index * 90, 360)}ms`);
    });
  });

  const updateScrollEffects = () => {
    const currentY = window.scrollY;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = clamp(currentY / maxScroll, 0, 1);

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    header?.classList.toggle('is-scrolled', currentY > 40);
    backToTop?.classList.toggle('is-visible', currentY > Math.min(720, window.innerHeight * 0.7));
    scrollCue?.classList.toggle('is-hidden', currentY > 120);

    const delta = currentY - lastScrollY;
    if (Math.abs(delta) > 7 && currentY > 160 && !document.body.classList.contains('menu-open')) {
      header?.classList.toggle('is-hidden', delta > 0);
    } else if (currentY <= 160) {
      header?.classList.remove('is-hidden');
    }

    if (!reducedMotion) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0);
        const localOffset = currentY * speed;
        item.style.setProperty('--parallax-y', `${localOffset.toFixed(2)}px`);
      });
    }

    lastScrollY = currentY;
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollEffects);
    }
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScrollEffects();

  // Scroll reveal, image mask reveal and heading entrance.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Mobile menu with keyboard support and staggered link entrance.
  const closeMenu = ({ restoreFocus = true } = {}) => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'メニューを開く');
    mobileMenu?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    header?.classList.remove('is-hidden');
    if (restoreFocus) menuLastFocused?.focus?.();
  };

  const openMenu = () => {
    menuLastFocused = document.activeElement;
    menuButton?.setAttribute('aria-expanded', 'true');
    menuButton?.setAttribute('aria-label', 'メニューを閉じる');
    mobileMenu?.classList.add('is-open');
    document.body.classList.add('menu-open');
    header?.classList.remove('is-hidden');
    window.setTimeout(() => qs('a', mobileMenu)?.focus(), reducedMotion ? 0 : 320);
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu({ restoreFocus: false });
    else openMenu();
  });

  mobileMenu?.addEventListener('click', (event) => {
    if (event.target === mobileMenu) closeMenu();
  });

  qsa('a', mobileMenu).forEach((link) => link.addEventListener('click', () => closeMenu({ restoreFocus: false })));

  document.addEventListener('keydown', (event) => {
    if (!document.body.classList.contains('menu-open')) return;
    if (event.key === 'Escape') closeMenu();

    if (event.key === 'Tab' && mobileMenu) {
      const focusable = qsa('a, button', mobileMenu).filter((node) => !node.hasAttribute('disabled'));
      focusable.push(menuButton);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  // Accessible accordion for job descriptions.
  jobCards.forEach((card) => {
    const button = qs('.job-card__head', card);
    const body = qs('.job-card__body', card);
    if (!button || !body) return;

    button.addEventListener('click', () => {
      const willOpen = !card.classList.contains('is-open');
      jobCards.forEach((other) => {
        other.classList.remove('is-open');
        qs('.job-card__head', other)?.setAttribute('aria-expanded', 'false');
      });

      if (willOpen) {
        card.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        window.setTimeout(() => {
          const top = card.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 70) - 18;
          window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
        }, reducedMotion ? 0 : 220);
      }
    });
  });

  // Automatic hero image switcher with manual dots and pause states.
  qsa('[data-image-rotator]').forEach((rotator, rotatorIndex) => {
    const images = qsa('.rotator-image', rotator);
    if (images.length < 2) return;

    const hero = rotator.closest('.hero, .page-hero');
    const intervalMs = Number(rotator.dataset.interval || 5200);
    let current = 0;
    let timer = null;
    let isVisible = true;
    let isPaused = false;

    const controls = document.createElement('div');
    controls.className = 'image-rotator__controls';
    controls.setAttribute('aria-label', 'メイン画像の切り替え');

    const buttons = images.map((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `画像 ${index + 1} を表示`);
      button.setAttribute('aria-pressed', String(index === 0));
      button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><i aria-hidden="true"></i>`;
      controls.append(button);
      return button;
    });

    hero?.append(controls);

    const show = (nextIndex, restart = true) => {
      current = (nextIndex + images.length) % images.length;
      images.forEach((image, index) => {
        const active = index === current;
        image.classList.toggle('is-active', active);
        image.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === current)));
      if (restart) start();
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (reducedMotion || isPaused || !isVisible || document.hidden) return;
      timer = window.setInterval(() => show(current + 1, false), intervalMs);
    };

    buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
    hero?.addEventListener('mouseenter', () => { isPaused = true; stop(); });
    hero?.addEventListener('mouseleave', () => { isPaused = false; start(); });
    hero?.addEventListener('focusin', () => { isPaused = true; stop(); });
    hero?.addEventListener('focusout', () => { isPaused = false; start(); });

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) start(); else stop();
      }, { threshold: 0.08 });
      visibilityObserver.observe(rotator);
    }

    document.addEventListener('visibilitychange', start);
    start();
  });

  // Pointer-driven depth on cards. Kept subtle to preserve readability.
  if (finePointer && !reducedMotion) {
    qsa('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--tilt-x', `${((0.5 - y) * 4.2).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${((x - 0.5) * 5.2).toFixed(2)}deg`);
        card.style.setProperty('--spot-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--spot-y', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--spot-x', '50%');
        card.style.setProperty('--spot-y', '50%');
      });
    });

    qsa('.hero, .page-hero').forEach((hero) => {
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        const moveX = x * 13;
        const moveY = y * 10;
        hero.style.setProperty('--mouse-x', `${moveX.toFixed(2)}px`);
        hero.style.setProperty('--mouse-y', `${moveY.toFixed(2)}px`);
        hero.style.setProperty('--mouse-x-neg', `${(-moveX).toFixed(2)}px`);
        hero.style.setProperty('--mouse-y-neg', `${(-moveY).toFixed(2)}px`);
      });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--mouse-x', '0px');
        hero.style.setProperty('--mouse-y', '0px');
        hero.style.setProperty('--mouse-x-neg', '0px');
        hero.style.setProperty('--mouse-y-neg', '0px');
      });
    });

    // Custom cursor.
    const dot = qs('.cursor-dot');
    const ring = qs('.cursor-ring');
    let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;

    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (dot) dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    const animateCursor = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      if (ring) ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    qsa('a, button, [data-tilt]').forEach((target) => {
      target.addEventListener('mouseenter', () => ring?.classList.add('is-hover'));
      target.addEventListener('mouseleave', () => ring?.classList.remove('is-hover'));
    });
  }


  // Kinetic line-and-orbit backgrounds inspired by the reference site's technical motion language.
  // The canvas is generated at runtime, so no external library or video asset is required.
  if (!reducedMotion) {
    const motionScenes = [];
    const motionTargets = [...new Set(qsa('.hero, .page-hero, .business-intro, .section--dark, .entry-cta'))];

    const seededRandom = (seed) => {
      let value = seed % 2147483647;
      if (value <= 0) value += 2147483646;
      return () => (value = value * 16807 % 2147483647) / 2147483647;
    };

    const buildNodes = (count, seed) => {
      const random = seededRandom(seed);
      return Array.from({ length: count }, () => ({
        x: random(),
        y: random(),
        phase: random() * Math.PI * 2,
        speed: .12 + random() * .22,
        amplitude: .012 + random() * .026,
        size: .8 + random() * 1.9,
      }));
    };

    const resizeScene = (scene) => {
      const rect = scene.element.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(Math.round(rect.width), 1);
      const height = Math.max(Math.round(rect.height), 1);
      scene.width = width;
      scene.height = height;
      scene.canvas.width = Math.round(width * dpr);
      scene.canvas.height = Math.round(height * dpr);
      scene.canvas.style.width = `${width}px`;
      scene.canvas.style.height = `${height}px`;
      scene.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 760 ? 8 : width < 1100 ? 12 : 17;
      scene.nodes = buildNodes(count, scene.seed);
    };

    motionTargets.forEach((element, index) => {
      const canvas = document.createElement('canvas');
      const isLight = element.classList.contains('business-intro');
      canvas.className = `motion-canvas ${isLight ? 'motion-canvas--light' : 'motion-canvas--dark'}`;
      canvas.setAttribute('aria-hidden', 'true');
      element.append(canvas);

      const scene = {
        element,
        canvas,
        context: canvas.getContext('2d', { alpha: true }),
        isLight,
        isVisible: true,
        width: 1,
        height: 1,
        pointerX: 0,
        pointerY: 0,
        targetX: 0,
        targetY: 0,
        nodes: [],
        seed: 191 + index * 97,
        index,
      };

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        scene.targetX = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
        scene.targetY = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
      }, { passive: true });
      element.addEventListener('pointerleave', () => {
        scene.targetX = 0;
        scene.targetY = 0;
      });

      if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(() => resizeScene(scene));
        observer.observe(element);
      }

      motionScenes.push(scene);
      resizeScene(scene);
    });

    if ('IntersectionObserver' in window) {
      const sceneObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const scene = motionScenes.find((item) => item.element === entry.target);
          if (scene) scene.isVisible = entry.isIntersecting;
        });
      }, { rootMargin: '15% 0px 15% 0px', threshold: 0 });
      motionScenes.forEach((scene) => sceneObserver.observe(scene.element));
    }

    const drawMotionScene = (scene, timestamp) => {
      if (!scene.isVisible || !scene.context) return;
      const { context: ctx, width, height } = scene;
      const time = timestamp * .001;
      const rect = scene.element.getBoundingClientRect();
      const viewportProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);

      scene.pointerX += (scene.targetX - scene.pointerX) * .035;
      scene.pointerY += (scene.targetY - scene.pointerY) * .035;

      const dark = !scene.isLight;
      const line = dark ? '122,169,247' : '7,93,232';
      const bright = dark ? '210,229,255' : '0,55,132';
      const shiftX = scene.pointerX * 26;
      const shiftY = scene.pointerY * 20 + (viewportProgress - .5) * 20;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(shiftX, shiftY);

      // Slow technical grid. Offset changes continuously so the background is visibly alive.
      const spacing = width < 760 ? 84 : 118;
      const offsetX = (time * 7 + scene.index * 23) % spacing;
      const offsetY = (time * 4 + scene.index * 31) % spacing;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${line},${dark ? .055 : .07})`;
      ctx.beginPath();
      for (let x = -spacing + offsetX; x < width + spacing; x += spacing) {
        ctx.moveTo(x, -40);
        ctx.lineTo(x, height + 40);
      }
      for (let y = -spacing + offsetY; y < height + spacing; y += spacing) {
        ctx.moveTo(-40, y);
        ctx.lineTo(width + 40, y);
      }
      ctx.stroke();

      // Large orbital geometry similar to engineering diagrams.
      const minSide = Math.min(width, height);
      const orbitData = [
        { x: .82, y: .42, r: .34, speed: .16, phase: .2 },
        { x: .68, y: .72, r: .19, speed: -.24, phase: 2.2 },
        { x: .18, y: .28, r: .13, speed: .31, phase: 4.1 },
      ];
      orbitData.forEach((orbit, orbitIndex) => {
        const radius = Math.max(minSide * orbit.r, 56);
        const cx = width * orbit.x + Math.sin(time * .12 + orbit.phase) * 16;
        const cy = height * orbit.y + Math.cos(time * .1 + orbit.phase) * 12;
        ctx.strokeStyle = `rgba(${line},${dark ? .13 : .11})`;
        ctx.lineWidth = orbitIndex === 0 ? 1.1 : .8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const angle = time * orbit.speed + orbit.phase + viewportProgress * .8;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        ctx.fillStyle = `rgba(${bright},${dark ? .86 : .72})`;
        ctx.shadowColor = `rgba(${line},.8)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, orbitIndex === 0 ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Floating nodes and proximity connections.
      const positions = scene.nodes.map((node) => ({
        x: node.x * width + Math.sin(time * node.speed + node.phase) * width * node.amplitude,
        y: node.y * height + Math.cos(time * node.speed * .86 + node.phase) * height * node.amplitude,
        size: node.size,
      }));

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const distance = Math.hypot(dx, dy);
          const limit = width < 760 ? 125 : 190;
          if (distance >= limit) continue;
          const alpha = (1 - distance / limit) * (dark ? .17 : .13);
          ctx.strokeStyle = `rgba(${line},${alpha})`;
          ctx.lineWidth = .75;
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }

      positions.forEach((point, pointIndex) => {
        const pulse = .55 + Math.sin(time * .9 + pointIndex) * .25;
        ctx.fillStyle = `rgba(${bright},${dark ? .34 + pulse * .28 : .24 + pulse * .2})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // A moving scan line makes the animation legible even when the pointer is still.
      const scanY = ((time * 22 + scene.index * 83) % (height + 180)) - 90;
      const gradient = ctx.createLinearGradient(0, scanY - 45, 0, scanY + 45);
      gradient.addColorStop(0, `rgba(${line},0)`);
      gradient.addColorStop(.5, `rgba(${line},${dark ? .09 : .065})`);
      gradient.addColorStop(1, `rgba(${line},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(-40, scanY - 45, width + 80, 90);

      ctx.restore();
    };

    const animateMotionBackgrounds = (timestamp) => {
      motionScenes.forEach((scene) => drawMotionScene(scene, timestamp));
      requestAnimationFrame(animateMotionBackgrounds);
    };
    requestAnimationFrame(animateMotionBackgrounds);

    window.addEventListener('resize', () => motionScenes.forEach(resizeScene), { passive: true });
  }

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  // Smooth full-page transition for local HTML navigation.
  qsa('a[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !/\.html(?:$|[?#])/.test(url.href)) return;
      if (url.pathname === window.location.pathname && url.hash) return;

      event.preventDefault();
      closeMenu({ restoreFocus: false });
      document.body.classList.add('is-leaving');
      transitionLayer?.classList.add('is-active');
      window.setTimeout(() => { window.location.href = url.href; }, reducedMotion ? 0 : 430);
    });
  });


  // Static contact form: validates fields and opens the visitor's mail application.
  const contactForm = qs('[data-contact-form]');
  if (contactForm) {
    const status = qs('[data-form-status]', contactForm);
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('category');
    const categorySelect = qs('select[name="category"]', contactForm);
    if (preset === 'agency' && categorySelect) categorySelect.value = '代理店募集について';
    if (preset === 'recruit' && categorySelect) categorySelect.value = '採用について';

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) {
        if (status) status.textContent = '未入力の必須項目をご確認ください。';
        return;
      }
      const data = new FormData(contactForm);
      const category = String(data.get('category') || 'お問い合わせ');
      const name = String(data.get('name') || '');
      const company = String(data.get('company') || '');
      const email = String(data.get('email') || '');
      const tel = String(data.get('tel') || '');
      const message = String(data.get('message') || '');
      const subject = `【Webサイト】${category}`;
      const body = [
        `お問い合わせ種別：${category}`,
        `会社名：${company}`,
        `お名前：${name}`,
        `メールアドレス：${email}`,
        `電話番号：${tel}`,
        '',
        'お問い合わせ内容：',
        message,
      ].join('\n');
      if (status) status.textContent = 'メールソフトを起動します。内容をご確認のうえ送信してください。';
      window.location.href = `mailto:info@next-ji.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

})();
