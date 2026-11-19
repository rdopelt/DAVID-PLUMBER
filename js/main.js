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
