const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Back-to-top button: appears once the hero has scrolled away, and is out of the Tab order while hidden.
(() => {
  const btn = document.querySelector('[data-to-top]');
  const hero = document.querySelector('.hero');
  if (!btn || !hero || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    btn.toggleAttribute('data-hidden', entry.isIntersecting);
    btn.inert = entry.isIntersecting;
  }).observe(hero);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    document.querySelector('.logo')?.focus({ preventScroll: true });
  });
})();

// 4. Phone bar: call and WhatsApp at the foot of the screen, hidden while the same two buttons are already on screen
//    (so the first screen never shows them twice). It simply appears; no motion.
(() => {
  const bar = document.querySelector('[data-mbar]');
  // every place on the page that already shows the same two buttons: the hero and the line under the services
  const twins = [...document.querySelectorAll('.hero__actions, .services__actions')];
  if (!bar || !twins.length || !('IntersectionObserver' in window)) return;
  const set = (off) => { bar.toggleAttribute('data-off', off); bar.inert = off; };
  const onScreen = new Set();
  set(true);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    set(onScreen.size > 0);
  });
  twins.forEach((t) => io.observe(t));
})();

// Tap a gallery photo to see it large. A native <dialog>: Esc closes it, focus stays inside, and it returns to the photo.
// 9. It opens with a short soft fade.  10. A job with before and after switches between them (buttons, arrow keys, swipe).
(() => {
  const box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;   // very old browsers: the photos stay as they are
  const fig = box.querySelector('.lightbox__figure');
  const img = box.querySelector('.lightbox__img');
  const cap = box.querySelector('.lightbox__cap');
  const sw = box.querySelector('.lightbox__switch');
  const swBtns = [...sw.querySelectorAll('[data-lb-go]')];
  let opener = null;
  let shots = [];      // the photos of the opened job: [{ btn, tag }]
  let index = 0;
  let closing = false;

  const show = (i) => {
    index = i;
    const { btn, tag } = shots[i];
    const small = btn.querySelector('img');
    const title = btn.closest('.work')?.querySelector('h3')?.textContent.trim() || '';
    img.src = small.currentSrc || small.src;        // the small one at once, the large one when it has loaded
    img.alt = small.alt;
    const full = new Image();
    full.onload = () => { if (shots[index]?.btn === btn) img.src = full.src; };
    full.src = btn.dataset.full;
    cap.textContent = '';
    if (tag) { const b = document.createElement('b'); b.textContent = tag + ': '; cap.append(b); }
    cap.append(title);
    swBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lbGo === (index === 0 ? 'before' : 'after'))));
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.work__zoom');
    if (!btn) return;
    const card = btn.closest('.work');
    shots = [...card.querySelectorAll('.work__zoom')].map((b) => ({ btn: b, tag: b.parentElement.querySelector('.work__tag')?.textContent.trim() }));
    opener = btn;
    sw.hidden = shots.length < 2;
    show(shots.findIndex((s) => s.btn === btn));
    document.documentElement.classList.add('has-lightbox');
    box.showModal();
    if (!reduceMotion()) {
      box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease' });
      fig.animate([{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE_OUT });
    }
  });

  const close = () => {
    if (closing || !box.open) return;
    if (reduceMotion()) { box.close(); return; }
    closing = true;                                   // closing is quicker than opening
    box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'forwards' }).finished
      .then(() => { box.close(); box.getAnimations().forEach((a) => a.cancel()); closing = false; });
  };

  box.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc
  box.addEventListener('click', (e) => {
    if (e.target.closest('[data-lb-go]')) {
      const want = e.target.closest('[data-lb-go]').dataset.lbGo === 'before' ? 0 : 1;
      if (want !== index) show(want);
      return;
    }
    if (e.target === box || e.target.closest('[data-lightbox-close]') || e.target === img || e.target === fig) close();
  });

  // arrow keys follow the page: in Hebrew "before" is on the right, "after" on the left
  box.addEventListener('keydown', (e) => {
    if (shots.length < 2) return;
    if (e.key === 'ArrowLeft' && index === 0) show(1);
    if (e.key === 'ArrowRight' && index === 1) show(0);
  });

  // swipe: the photo follows the hand, so a swipe to the right brings in "after" from the left
  let sx = null, sy = null;
  fig.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  fig.addEventListener('touchend', (e) => {
    if (sx === null || shots.length < 2) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0 && index === 0) show(1);
    if (dx < 0 && index === 1) show(0);
  });

  box.addEventListener('close', () => {
    document.documentElement.classList.remove('has-lightbox');
    img.removeAttribute('src');
    opener?.focus({ preventScroll: true });
    opener = null;
  });
})();

// Before and after: six jobs first, the rest behind one button.
(() => {
  const btn = document.querySelector('[data-works-more]');
  const list = document.getElementById('works-list');
  if (!btn || !list) return;
  btn.addEventListener('click', () => {
    list.classList.add('is-open');
    btn.parentElement.hidden = true;
    // focus moves to the first newly shown job, so keyboard users continue where the button was
    const first = list.querySelector('.work--extra h3');
    if (first) { first.tabIndex = -1; first.focus({ preventScroll: true }); }
    document.dispatchEvent(new Event('works:opened'));
  });
})();

// Reviews carousel: two buttons move it by one card. It never moves on its own.
// In Hebrew the track runs right to left, so "next" scrolls toward the left.
(() => {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;
  const track = root.querySelector('.reviews');
  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');
  const rtl = getComputedStyle(track).direction === 'rtl';

  const step = () => {
    const card = track.querySelector('.review');
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16) : track.clientWidth;
  };
  const go = (dir) => track.scrollBy({ left: dir * step() * (rtl ? -1 : 1), behavior: reduceMotion() ? 'auto' : 'smooth' });

  // the buttons go grey at the two ends
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const pos = Math.abs(track.scrollLeft);           // RTL scrollLeft counts down from 0
    prev.disabled = pos <= 2;
    next.disabled = pos >= max - 2;
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
