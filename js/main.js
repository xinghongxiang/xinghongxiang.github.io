/* =========================================================
   上午茶c / Cita — interactions
   Vanilla JS, no dependencies. Everything runs in the browser.
   ========================================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Local clock ---------- */
  const clocks = Array.from(document.querySelectorAll('[data-clock]'));

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  function currentTime() {
    // Keep the clock on Cita's time (UTC+8), wherever the visitor is.
    const parts = timeFormatter.formatToParts(new Date());
    const get = (type) => (parts.find((part) => part.type === type) || {}).value || '00';
    return `${get('hour')}:${get('minute')}:${get('second')}`;
  }

  function tickClock() {
    const time = currentTime();
    clocks.forEach((clock) => {
      clock.textContent = time;
    });
  }

  if (clocks.length) {
    tickClock();
    window.setInterval(tickClock, 1000);
  }

  /* ---------- Theme ---------- */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeColorMeta = document.getElementById('themeColor');
  const THEME_KEY = 'cita-theme';

  function syncThemeUI() {
    if (!themeToggle) return;
    const isNight = root.dataset.theme === 'night';
    themeToggle.setAttribute('aria-pressed', String(isNight));
    themeToggle.setAttribute('aria-label', isNight ? '切换到日间模式' : '切换到夜间模式');
    themeToggle.title = isNight ? '切换到日间模式' : '切换到夜间模式';

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isNight ? '#171410' : '#f2eadc');
    }
  }

  syncThemeUI();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'night' ? 'day' : 'night';
      root.dataset.theme = nextTheme;

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        /* localStorage may be unavailable in private mode; the toggle still works. */
      }

      syncThemeUI();
      showToast(nextTheme === 'night' ? '夜间模式 · 把灯关小一点' : '日间模式 · 上午茶时间');
    });
  }

  /* ---------- Toast ---------- */
  const toast = document.querySelector('[data-toast]');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  /* ---------- Scroll progress & header state ---------- */
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('[data-progress]');
  let scrollQueued = false;

  function updateScrollUI() {
    const scrollTop = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', scrollTop > 24);

    if (progress) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }

    scrollQueued = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    },
    { passive: true }
  );

  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  /* ---------- Active navigation ---------- */
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const watchedSections = navLinks
    .map((link) => document.getElementById(link.dataset.nav))
    .filter(Boolean);

  if ('IntersectionObserver' in window && watchedSections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const activeId = entry.target.id;
          navLinks.forEach((link) => {
            const active = link.dataset.nav === activeId;
            link.classList.toggle('is-active', active);
            if (active) {
              link.setAttribute('aria-current', 'location');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-34% 0px -56% 0px', threshold: 0 }
    );

    watchedSections.forEach((section) => navObserver.observe(section));
  }

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuLabel = menuToggle ? menuToggle.querySelector('.menu-toggle__label') : null;
  let menuOpen = false;
  let lastFocused = null;

  function openMenu() {
    if (!menuToggle || !mobileMenu) return;
    menuOpen = true;
    lastFocused = document.activeElement;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', '关闭菜单');
    if (menuLabel) menuLabel.textContent = 'CLOSE';
    mobileMenu.inert = false;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');

    window.setTimeout(() => {
      const firstLink = mobileMenu.querySelector('a[href]');
      if (firstLink) firstLink.focus();
    }, 180);
  }

  function closeMenu(returnFocus = true) {
    if (!menuToggle || !mobileMenu || !menuOpen) return;
    menuOpen = false;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '打开菜单');
    if (menuLabel) menuLabel.textContent = 'MENU';

    // Move focus out before hiding the dialog so aria-hidden never traps focus.
    if (returnFocus) {
      const focusTarget = lastFocused instanceof HTMLElement && lastFocused !== document.body
        ? lastFocused
        : menuToggle;
      focusTarget.focus();
    } else if (mobileMenu.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    document.body.classList.remove('menu-open');
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileMenu.querySelectorAll('[data-menu-link]').forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (!menuOpen) return;

      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = [menuToggle, ...Array.from(
        mobileMenu.querySelectorAll('a[href], button:not([disabled])')
      )].filter((element) => element && element.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || !mobileMenu.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960 && menuOpen) closeMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealItems = Array.from(document.querySelectorAll('.reveal'));

  if (revealItems.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -36px 0px' }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  /* ---------- Hero art tilt ---------- */
  const heroVisual = document.querySelector('[data-hero-visual]');
  const artCard = document.querySelector('[data-tilt]');

  if (heroVisual && artCard && finePointer && !reduceMotion) {
    let tiltFrame = null;

    heroVisual.addEventListener('pointermove', (event) => {
      if (tiltFrame) window.cancelAnimationFrame(tiltFrame);

      tiltFrame = window.requestAnimationFrame(() => {
        const rect = heroVisual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        artCard.style.setProperty('--tilt-x', `${(-y * 5.5).toFixed(2)}deg`);
        artCard.style.setProperty('--tilt-y', `${(x * 7.5).toFixed(2)}deg`);
      });
    });

    heroVisual.addEventListener('pointerleave', () => {
      if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
      artCard.style.setProperty('--tilt-x', '0deg');
      artCard.style.setProperty('--tilt-y', '0deg');
    });
  }

  /* ---------- Shelf filters ---------- */
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const shelfGrid = document.querySelector('[data-shelf-grid]');
  const shelfItems = Array.from(document.querySelectorAll('.shelf-item'));
  const shelfCount = document.querySelector('[data-shelf-count]');
  const totalItems = shelfItems.length;

  function filterShelf(filter) {
    if (!shelfGrid) return;

    let shown = 0;

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    shelfItems.forEach((item) => {
      const visible = filter === 'all' || item.dataset.category === filter;
      item.hidden = !visible;
      if (visible) shown += 1;
    });

    // Restart the entrance animation for the cards that remain.
    shelfGrid.classList.remove('is-filtering');
    void shelfGrid.offsetWidth;
    shelfGrid.classList.add('is-filtering');

    if (shelfCount) {
      shelfCount.textContent = `显示 ${String(shown).padStart(2, '0')} / ${String(totalItems).padStart(2, '0')}`;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => filterShelf(button.dataset.filter || 'all'));
  });

  /* ---------- Tea break idea generator ---------- */
  const ideas = [
    { type: 'WATCH', text: '重看一部五年前很喜欢的电影，这次只听配乐。' },
    { type: 'PLAY', text: '关掉攻略，在游戏里走一条没走过的路。' },
    { type: 'MAKE', text: '写一个只有自己会用、但自己一定用得到的小工具。' },
    { type: 'PAUSE', text: '泡一杯茶，什么都不做，认真发十分钟的呆。' },
    { type: 'WATCH', text: '随机点开一部片单外的电影，看完再决定喜不喜欢。' },
    { type: 'PLAY', text: '重开一个旧存档，去见一个很久没见的 NPC。' },
    { type: 'LIFE', text: '去附近没走过的街道散步，不带目的地。' },
    { type: 'MAKE', text: '翻出半途而废的小项目，只修一个 bug，然后关掉。' },
    { type: 'READ', text: '打开收藏夹里吃灰最久的那篇文章，认真读完。' },
    { type: 'TEA', text: '换一种泡法，认真比较今天的茶和昨天的有什么不同。' }
  ];

  const drawButton = document.querySelector('[data-draw]');
  const ticket = document.querySelector('[data-ticket]');
  const ideaText = document.querySelector('[data-idea]');
  const ideaType = document.querySelector('[data-idea-type]');
  const ticketNo = document.querySelector('[data-ticket-no]');
  let drawing = false;
  let lastIdea = ideaText ? ideaText.textContent.trim() : '';

  function randomTicketNumber() {
    return String(Math.floor(Math.random() * 9000) + 1000);
  }

  function commitIdea() {
    let next = ideas[Math.floor(Math.random() * ideas.length)];

    // Avoid showing the same idea twice in a row.
    if (ideas.length > 1) {
      let guard = 0;
      while (next.text === lastIdea && guard < 12) {
        next = ideas[Math.floor(Math.random() * ideas.length)];
        guard += 1;
      }
    }

    lastIdea = next.text;

    if (ideaText) ideaText.textContent = next.text;
    if (ideaType) ideaType.textContent = next.type;
    if (ticketNo) ticketNo.textContent = randomTicketNumber();

    if (ticket) ticket.classList.remove('is-drawing');
    if (drawButton) drawButton.disabled = false;
    drawing = false;
  }

  if (drawButton && ticket && ideaText) {
    drawButton.addEventListener('click', () => {
      if (drawing) return;
      drawing = true;
      drawButton.disabled = true;
      ticket.classList.add('is-drawing');

      if (reduceMotion) {
        window.setTimeout(commitIdea, 30);
      } else {
        window.setTimeout(commitIdea, 240);
      }
    });
  }

  /* ---------- Copy email ---------- */
  const emailLink = document.querySelector('[data-email-link]');
  const copyButton = document.querySelector('[data-copy-email]');

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    textarea.remove();
    return copied;
  }

  if (emailLink && copyButton) {
    copyButton.addEventListener('click', async () => {
      const email = (emailLink.getAttribute('href') || '').replace(/^mailto:/, '');
      if (!email) return;

      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }

      if (!copied) copied = fallbackCopy(email);

      showToast(copied ? `邮箱已复制 · ${email}` : '复制失败，请手动选择邮箱地址');
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
