// Gentle motion with GSAP (SplitText + ScrollTrigger). Every piece runs once, eases out without overshoot,
// and none of it runs when the visitor's device asks for reduced motion.
//  1. The main heading (data-split-hero): revealed on load in one wipe from right to left.
//  3 + 8. Headings with data-split-scroll (services, before and after, the call band): the same, once, as they scroll in.
//  2. Before and after photos: enter one after another once their row is well inside the screen.
//  7. Service cards: enter one after another the same way.
//
// Hebrew: the words come in reading order, right to left (SplitText keeps the DOM order, which is the reading order),
// with a clear gap between them, and each word glides in slightly from the right as it rises, so the movement
// follows the direction the eye reads in.
(() => {
  const root = document.documentElement;
  const show = () => root.classList.remove('split-wait');

  if (!window.gsap || !window.SplitText || !window.ScrollTrigger) { show(); return; }
  gsap.registerPlugin(SplitText, ScrollTrigger);

  const rtl = getComputedStyle(root).direction === 'rtl';
  // soft, not bouncy: an ease-out that settles without overshoot
  const reveal = { yPercent: 100, xPercent: rtl ? 14 : -14, duration: 1, ease: 'power3.out' };
  const split = (el, onSplit) => SplitText.create(el, {
    type: 'words',          // whole words only: Hebrew letters are never pulled apart
    wordsClass: 'split-word',
    mask: 'words',          // each word comes in inside its own clip, so it appears out of its own line
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
    // 1. The main heading: revealed in one smooth wipe from right to left, the way Hebrew is written.
    //    (A clip that opens from the right edge; the extra room above and below keeps every letter whole.)
    const hero = document.querySelector('[data-split-hero]');
    if (hero) {
      gsap.set(hero, { visibility: 'visible' });
      gsap.fromTo(hero,
        { clipPath: rtl ? 'inset(-25% -4% -25% 100%)' : 'inset(-25% 100% -25% -4%)', autoAlpha: 0.2 },
        { clipPath: 'inset(-25% -4% -25% 0%)', autoAlpha: 1, duration: 1.1, ease: 'power3.inOut', delay: 0.15,
        clearProps: 'clipPath' });
    }

    // wait for the Hebrew fonts, so the words are measured in their real face
    document.fonts.ready.then(() => {
      gsap.utils.toArray('[data-split-scroll]').forEach((el) => split(el, (self) => {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.words, { ...reveal, stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      }));
      show();
    });

    // 7. service cards
    enterInTurn(gsap.utils.toArray('.service'), { stagger: 0.1 });

    // 2. before and after photos. On a computer: the grid, row by row. On a phone the jobs sit in a sideways carousel,
    //    so the photos of the jobs on screen enter in turn once the carousel is well inside the screen.
    const photos = gsap.matchMedia();
    photos.add('(min-width: 641px)', () => enterInTurn(gsap.utils.toArray('.work .work__shot')));
    photos.add('(max-width: 640px)', () => {
      const list = document.getElementById('works-list');
      if (!list) return;
      const firstShots = [...list.querySelectorAll('.work')].slice(0, 2).flatMap((w) => [...w.querySelectorAll('.work__shot')]);
      gsap.set(firstShots, { autoAlpha: 0, y: 24 });
      ScrollTrigger.create({
        trigger: list, start: 'top 82%', once: true,
        onEnter: () => gsap.to(firstShots, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.12, clearProps: 'transform' }),
      });
    });
    // the "show all" button reveals more cards: measure the page again so their photos enter the same way
    document.addEventListener('works:opened', () => ScrollTrigger.refresh());

    // The water stream: it grows from the faucet as the page scrolls, its drop at the front, and lands with one small
    // ripple at the foot of the page. Only transform and opacity change, so it costs the browser almost nothing.
    const stream = document.querySelector('[data-stream]');
    if (stream) {
      stream.hidden = false;
      const water = stream.querySelector('.stream__water');
      const drop = stream.querySelector('.stream__drop');
      const ripple = stream.querySelector('.stream__ripple');
      const fill = stream.querySelector('.stream__fill');
      let landed = false;
      // SVG parts: GSAP owns their transforms; the water fills from the bottom of the bucket, the ripple spreads from its centre
      gsap.set(fill, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(ripple, { transformOrigin: '50% 50%', autoAlpha: 0 });

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: document.documentElement, start: 'top top', end: 'bottom bottom',
          scrub: 0.6,                    // follows the scroll with a soft lag, so it flows rather than jumps
          invalidateOnRefresh: true,     // re-measure when the page height changes (e.g. "show all" jobs)
          onUpdate: (self) => {
            if (self.progress > 0.995 && !landed) {
              // the drop lands in the bucket: the water rises a little and one ripple spreads on it
              landed = true;
              gsap.to(drop, { autoAlpha: 0, duration: 0.2 });
              gsap.to(fill, { scaleY: 0.5, duration: 0.9, ease: 'power2.out', overwrite: true });
              gsap.fromTo(ripple, { scale: 0.3, autoAlpha: 0.9 }, { scale: 1.4, autoAlpha: 0, duration: 1.2, ease: 'power2.out', delay: 0.1 });
            } else if (self.progress < 0.97 && landed) {
              // scrolling back up: the bucket empties softly and the drop is back at the front of the stream
              landed = false;
              gsap.to(drop, { autoAlpha: 1, duration: 0.2 });
              gsap.to(fill, { scaleY: 0, duration: 0.6, ease: 'power2.inOut', overwrite: true });
            }
          },
        },
      })
        .fromTo(water, { scaleY: 0.012 }, { scaleY: 1 }, 0)
        .fromTo(drop, { y: () => water.offsetHeight * 0.012 }, { y: () => water.offsetHeight - 4 }, 0);
    }
  });

  // with reduced motion, nothing is split or moved
  mm.add('(prefers-reduced-motion: reduce)', show);
})();
