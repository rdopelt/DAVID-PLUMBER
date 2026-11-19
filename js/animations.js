// Word-by-word reveals with GSAP SplitText + ScrollTrigger.
// 1. The main heading (data-split-hero): each word rises from below on load, a short gap between words.
// 3. The call band heading (data-split-scroll): the same, once, when it scrolls into view.
// Reduced motion: no animation at all; the headings are shown as they are.
(() => {
  const root = document.documentElement;
  const show = () => root.classList.remove('split-wait');

  if (!window.gsap || !window.SplitText || !window.ScrollTrigger) { show(); return; }
  gsap.registerPlugin(SplitText, ScrollTrigger);

  // soft, not bouncy: an ease-out that settles without overshoot
  const reveal = { yPercent: 100, duration: 0.9, ease: 'power3.out', stagger: 0.09 };

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('[data-split-hero]');
    const band = document.querySelector('[data-split-scroll]');

    // wait for the Hebrew fonts, so the words are measured in their real face
    document.fonts.ready.then(() => {
      if (hero) {
        SplitText.create(hero, {
          type: 'words',
          wordsClass: 'split-word',
          mask: 'words',          // each word rises inside its own clip, so it appears from below its line
          autoSplit: true,        // re-split if the line breaks change (rotation, resize)
          onSplit(self) {
            gsap.set(hero, { visibility: 'visible' });
            return gsap.from(self.words, { ...reveal, delay: 0.15 });
          },
        });
      }

      if (band) {
        SplitText.create(band, {
          type: 'words',
          wordsClass: 'split-word',
          mask: 'words',
          autoSplit: true,
          onSplit(self) {
            gsap.set(band, { visibility: 'visible' });
            return gsap.from(self.words, {
              ...reveal,
              stagger: 0.07,
              scrollTrigger: { trigger: band, start: 'top 85%', once: true },
            });
          },
        });
      }
      show();
    });
  });

  // with reduced motion, nothing is split or moved
  mm.add('(prefers-reduced-motion: reduce)', show);
})();
