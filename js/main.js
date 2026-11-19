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
