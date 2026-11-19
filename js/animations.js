// Gentle motion with GSAP (SplitText + ScrollTrigger). Every piece runs once, eases out without overshoot,
// and none of it runs when the visitor's device asks for reduced motion.
//  1. The main heading (data-split-hero): each word rises from below on load, a short gap between words.
//  3 + 8. Headings with data-split-scroll (services, before and after, the call band): the same, once, as they scroll in.
//  2. Before and after photos: enter one after another once their row is well inside the screen.
//  7. Service cards: enter one after another the same way.
// 11. The compare slider: its line glides aside once and back, so people see it can be dragged.
(() => {
  const root = document.documentElement;
  const show = () => root.classList.remove('split-wait');

  if (!window.gsap || !window.SplitText || !window.ScrollTrigger) { show(); return; }
  gsap.registerPlugin(SplitText, ScrollTrigger);

  // soft, not bouncy: an ease-out that settles without overshoot
  const reveal = { yPercent: 100, duration: 0.9, ease: 'power3.out', stagger: 0.09 };
  const split = (el, onSplit) => SplitText.create(el, {
    type: 'words',
    wordsClass: 'split-word',
    mask: 'words',          // each word rises inside its own clip, so it appears from below its line
    autoSplit: true,        // re-split if the line breaks change (rotation, resize)
    onSplit,
  });

  // one entrance for a group of elements: they arrive one after another, once, when well inside the screen
  const enterInTurn = (targets, { start = 'top 82%', stagger = 0.12 } = {}) => {
    if (!targets.length) return;
    // the cards' own CSS hover transition would fight the entrance: off while they enter, back afterwards
    gsap.set(targets, { autoAlpha: 0, y: 24, transition: 'none' });
    ScrollTrigger.batch(targets, {
      start,
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger, overwrite: true,
        clearProps: 'transform,transition',    // hand the cards back to CSS, so their hover lift works again
      }),
    });
  };

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // wait for the Hebrew fonts, so the words are measured in their real face
    document.fonts.ready.then(() => {
      const hero = document.querySelector('[data-split-hero]');
      if (hero) split(hero, (self) => {
        gsap.set(hero, { visibility: 'visible' });
        return gsap.from(self.words, { ...reveal, delay: 0.15 });
      });

      gsap.utils.toArray('[data-split-scroll]').forEach((el) => split(el, (self) => {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.words, { ...reveal, stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      }));
      show();
    });

    // 7. service cards
    enterInTurn(gsap.utils.toArray('.service'), { stagger: 0.1 });

    // 2. before and after photos (the featured slider is not part of this: it has its own hint below)
    enterInTurn(gsap.utils.toArray('.work .work__shot'));
    // the "show all" button reveals more cards: measure the page again so their photos enter the same way
    document.addEventListener('works:opened', () => ScrollTrigger.refresh());

    // 11. the slider's hint: once it is well inside the screen, the line glides to show more "after" and back.
    //     Skipped if the visitor already touched the slider.
    const cmp = document.querySelector('[data-compare]');
    if (cmp && cmp.compareSetPos) {
      const state = { p: 50 };
      let tl = null;
      const stop = () => { tl?.kill(); tl = null; };
      cmp.addEventListener('compare:touched', stop);
      ScrollTrigger.create({
        trigger: cmp, start: 'top 60%', once: true,
        onEnter: () => {
          tl = gsap.timeline({ delay: 0.3, onUpdate: () => cmp.compareSetPos(state.p) })
            .to(state, { p: 68, duration: 0.7, ease: 'power2.inOut' })
            .to(state, { p: 50, duration: 0.8, ease: 'power2.inOut' });
        },
      });
    }
  });

  // with reduced motion, nothing is split or moved
  mm.add('(prefers-reduced-motion: reduce)', show);
})();
