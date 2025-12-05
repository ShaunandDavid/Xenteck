(() => {
  'use strict';

  const enforceHttps = () => {
    if (typeof window === 'undefined') return;
    const { protocol, hostname, href } = window.location;
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
    if (protocol === 'http:' && !isLocal && hostname) {
      window.location.replace(href.replace(/^http:/i, 'https:'));
    }
  };

  const onReady = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const initHeroVideo = () => {
    const heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;

    const hlsSrc = heroVideo.dataset.hlsSrc;
    const fallbackSrc = heroVideo.dataset.fallbackSrc;
    if (!hlsSrc) return;

    const attemptPlay = () => {
      const playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    if (heroVideo.canPlayType('application/vnd.apple.mpegURL')) {
      heroVideo.src = hlsSrc;
      heroVideo.addEventListener('loadedmetadata', attemptPlay, { once: true });
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ lowLatencyMode: true });
      hls.loadSource(hlsSrc);
      hls.attachMedia(heroVideo);
      heroVideo.addEventListener('canplay', attemptPlay, { once: true });
      return;
    }

    if (fallbackSrc) {
      heroVideo.src = fallbackSrc;
      heroVideo.addEventListener('loadeddata', attemptPlay, { once: true });
    }
  };

  const initScrollButton = () => {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;

    let ticking = false;
    const toggleVisibility = () => {
      const shouldShow = window.scrollY > 320;
      scrollBtn.style.display = shouldShow ? 'block' : 'none';
      scrollBtn.style.opacity = shouldShow ? '1' : '0';
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(toggleVisibility);
        ticking = true;
      }
    });

    toggleVisibility();

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const initMobileMenu = () => {
    const toggleBtn = document.querySelector('.hamburger');
    const mobilePanel = document.getElementById('mobile-panel');
    if (!toggleBtn || !mobilePanel) return;

    const setState = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
      mobilePanel.setAttribute('aria-hidden', String(!open));
    };

    const isOpen = () => document.body.classList.contains('menu-open');

    toggleBtn.addEventListener('click', () => {
      setState(!isOpen());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setState(false);
        toggleBtn.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      const path = event.composedPath ? event.composedPath() : [];
      if (path.includes(toggleBtn) || path.includes(mobilePanel)) return;
      setState(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 920 && isOpen()) {
        setState(false);
      }
    });
  };

  const initMegaAria = () => {
    document.querySelectorAll('[data-nav-trigger]').forEach((trigger) => {
      const parent = trigger.closest('.has-mega');
      if (!parent) return;
      const update = (expanded) => trigger.setAttribute('aria-expanded', String(expanded));
      parent.addEventListener('mouseenter', () => update(true));
      parent.addEventListener('mouseleave', () => update(false));
      trigger.addEventListener('focus', () => update(true));
      trigger.addEventListener('blur', () => update(false));
    });
  };

  const initContactForm = () => {
    const form = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');
    if (!form || !statusEl) return;

    const fields = {
      name: form.querySelector('#name'),
      email: form.querySelector('#email'),
      message: form.querySelector('#message')
    };

    const validators = {
      name: (value) => value.trim().length >= 2,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: (value) => value.trim().length >= 10
    };

    const messages = {
      name: 'Please share your name (2+ characters).',
      email: 'Enter a valid email address so we can reply.',
      message: 'Tell us a bit more about your project (10+ characters).'
    };

    const setFieldState = (field, isValid) => {
      if (!field) return;
      field.setAttribute('aria-invalid', String(!isValid));
    };

    const validate = () => {
      for (const [key, field] of Object.entries(fields)) {
        if (!field) continue;
        const valid = validators[key](field.value);
        setFieldState(field, valid);
        if (!valid) {
          return { valid: false, message: messages[key], field };
        }
      }
      return { valid: true };
    };

    Object.values(fields).forEach((field) => {
      if (!field) return;
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') {
          const valid = validators[field.id](field.value);
          setFieldState(field, valid);
          if (valid) {
            statusEl.textContent = '';
            statusEl.classList.remove('is-error');
          }
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = '';
      statusEl.classList.remove('is-success', 'is-error');

      const { valid, message, field } = validate();
      if (!valid) {
        statusEl.textContent = message;
        statusEl.classList.add('is-error');
        field?.focus();
        return;
      }

      const honeypot = form.querySelector('.honeypot');
      if (honeypot && honeypot.value.trim()) {
        statusEl.textContent = 'Spam detected. Please try again.';
        statusEl.classList.add('is-error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.setAttribute('disabled', 'true');
      statusEl.textContent = 'Sending...';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Formspree error: ${response.status}`);
        }

        form.reset();
        Object.values(fields).forEach((field) => field && field.setAttribute('aria-invalid', 'false'));
        statusEl.textContent = 'Thanks! We will reach out within one business day.';
        statusEl.classList.add('is-success');
      } catch (error) {
        console.error('Form submission failed', error);
        statusEl.textContent = 'Something went wrong. Email hello@xenteck.com and we will respond quickly.';
        statusEl.classList.add('is-error');
      } finally {
        submitBtn?.removeAttribute('disabled');
      }
    });
  };

  const initYearStamp = () => {
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  };

  const initGsap = () => {
    if (!(window.gsap && window.ScrollTrigger)) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.utils.toArray('.reveal').forEach((el) => {
      window.gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%'
        }
      });
    });

    window.gsap.from('.hero-inner', {
      y: 12,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      delay: .1
    });

    window.gsap.utils.toArray('.ai-stat-chip').forEach((chip) => {
      window.gsap.from(chip, {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: chip,
          start: 'top 85%'
        }
      });
    });

    window.gsap.utils.toArray('.outcome-video').forEach((card) => {
      window.gsap.from(card, {
        opacity: 0,
        y: 16,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        }
      });
    });
  };

  enforceHttps();
  onReady(() => {
    initYearStamp();
    initHeroVideo();
    initScrollButton();
    initMobileMenu();
    initMegaAria();
    initContactForm();
    initGsap();
  });
})();
