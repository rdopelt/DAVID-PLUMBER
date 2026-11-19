// Accessibility menu: apply the visitor's saved choices before the page paints, so it never flashes the default look.
(() => {
  try {
    const s = JSON.parse(localStorage.getItem('a11y') || '{}');
    const root = document.documentElement;
    if (s.text) root.setAttribute('data-a11y-text', String(s.text));
    ['contrast', 'links', 'font', 'still'].forEach((k) => { if (s[k]) root.setAttribute('data-a11y-' + k, ''); });
  } catch (e) { /* storage blocked: the page simply opens with the default look */ }
})();
