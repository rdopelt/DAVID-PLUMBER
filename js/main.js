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
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector('.logo')?.focus({ preventScroll: true });
  });
})();

// Tap a gallery photo to see it large. A native <dialog>: Esc closes it, focus stays inside, and it returns to the photo.
(() => {
  const box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;   // very old browsers: the photos stay as they are
  const img = box.querySelector('.lightbox__img');
  const cap = box.querySelector('.lightbox__cap');
  let opener = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.work__zoom');
    if (!btn) return;
    const small = btn.querySelector('img');
    const card = btn.closest('.work');
    const tag = btn.parentElement.querySelector('.work__tag')?.textContent.trim();
    const title = card?.querySelector('h3')?.textContent.trim() || '';
    opener = btn;
    img.src = small.currentSrc || small.src;    // the small one shows at once, the large one replaces it when loaded
    img.alt = small.alt;
    const full = new Image();
    full.onload = () => { if (opener === btn) img.src = full.src; };
    full.src = btn.dataset.full;
    cap.innerHTML = '';
    if (tag) { const b = document.createElement('b'); b.textContent = tag + ': '; cap.append(b); }
    cap.append(title);
    document.documentElement.classList.add('has-lightbox');
    box.showModal();
  });

  const close = () => box.close();
  box.addEventListener('click', (e) => {
    // a tap on the close button, the dark area or the photo itself closes it
    if (e.target === box || e.target.closest('[data-lightbox-close]') || e.target === img || e.target.closest('.lightbox__figure') === e.target) close();
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
