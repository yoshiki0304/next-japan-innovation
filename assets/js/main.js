
(() => {
  const loader = document.querySelector('.page-loader');
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const revealItems = document.querySelectorAll('.reveal');
  const parallaxItems = document.querySelectorAll('[data-parallax]');
  const jobCards = document.querySelectorAll('.job-card');

  window.addEventListener('load', () => {
    window.setTimeout(() => loader?.classList.add('is-hidden'), 280);
  });

  const onScroll = () => {
    if (!document.body.classList.contains('inner-page')) {
      header?.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0);
      item.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0) scale(1.055)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    });
  });

  jobCards.forEach((card) => {
    const button = card.querySelector('.job-card__head');
    button?.addEventListener('click', () => {
      const willOpen = !card.classList.contains('is-open');
      jobCards.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.job-card__head')?.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        card.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (window.matchMedia('(pointer: fine)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (dot) dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });
    const animate = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      if (ring) ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    animate();
    document.querySelectorAll('a, button').forEach((target) => {
      target.addEventListener('mouseenter', () => ring?.classList.add('is-hover'));
      target.addEventListener('mouseleave', () => ring?.classList.remove('is-hover'));
    });
  }
})();
