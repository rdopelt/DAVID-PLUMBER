// Accessibility menu, built into the site (no outside service): text size, high contrast, underlined links,
// a plain readable font and stopping all motion. Choices are kept in this browser (localStorage) for the next visit.
(() => {
  const root = document.documentElement;
  const KEY = 'a11y';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* not kept, still applied */ } };
  let state = load();

  const host = document.querySelector('.header .wrap');
  if (!host) return;

  const wrap = document.createElement('div');
  wrap.className = 'a11y';
  wrap.innerHTML = `
    <button class="a11y__toggle" type="button" aria-expanded="false" aria-controls="a11y-panel" aria-label="תפריט נגישות">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.6" r="1.9"/><path d="M4.5 8.6c2.5.8 5 1.2 7.5 1.2s5-.4 7.5-1.2M12 9.8v4.6M8.8 21.2 12 14.4l3.2 6.8"/></svg>
    </button>
    <div class="a11y__panel" id="a11y-panel" role="dialog" aria-label="הגדרות נגישות" hidden>
      <div class="a11y__head">
        <h2 class="a11y__title">הגדרות נגישות</h2>
        <button class="a11y__close" type="button" aria-label="סגירת תפריט הנגישות" data-a11y-close>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <p class="a11y__label" id="a11y-size">גודל טקסט</p>
      <div class="a11y__sizes" role="group" aria-labelledby="a11y-size">
        <button type="button" data-a11y-text="0" aria-label="טקסט בגודל רגיל">א</button>
        <button type="button" data-a11y-text="1" aria-label="טקסט גדול"><span style="font-size:1.2em">א</span></button>
        <button type="button" data-a11y-text="2" aria-label="טקסט גדול מאוד"><span style="font-size:1.45em">א</span></button>
      </div>
      <div class="a11y__toggles">
        <button type="button" data-a11y-key="contrast"><span class="a11y__switch" aria-hidden="true"></span>ניגודיות גבוהה</button>
        <button type="button" data-a11y-key="links"><span class="a11y__switch" aria-hidden="true"></span>הדגשת קישורים</button>
        <button type="button" data-a11y-key="font"><span class="a11y__switch" aria-hidden="true"></span>גופן קריא</button>
        <button type="button" data-a11y-key="still"><span class="a11y__switch" aria-hidden="true"></span>עצירת אנימציות</button>
      </div>
      <div class="a11y__foot">
        <button type="button" class="a11y__reset" data-a11y-reset>איפוס הגדרות</button>
        <a href="accessibility.html">הצהרת נגישות</a>
      </div>
    </div>`;
  // on the home page the menu sits just before the call button; elsewhere at the end of the bar
  const callBtn = host.querySelector('.btn--call');
  host.insertBefore(wrap, callBtn || null);

  const btn = wrap.querySelector('.a11y__toggle');
  const panel = wrap.querySelector('.a11y__panel');

  // stop everything that moves, now: finish every running or waiting animation and remove the decorative stream
  const stillNow = () => {
    if (window.ScrollTrigger) ScrollTrigger.getAll().forEach((st) => { st.animation?.progress(1); st.kill(); });
    if (window.gsap) {
      gsap.globalTimeline.getChildren(true, true, false).forEach((t) => t.progress(1));
      gsap.set('[data-split-hero], .service, .work__shot, .split-word', { clearProps: 'all' });
    }
    root.classList.remove('split-wait');
  };

  const apply = () => {
    if (state.text) root.setAttribute('data-a11y-text', String(state.text)); else root.removeAttribute('data-a11y-text');
    ['contrast', 'links', 'font', 'still'].forEach((k) => root.toggleAttribute('data-a11y-' + k, !!state[k]));
    wrap.querySelectorAll('[data-a11y-text]').forEach((b) => b.setAttribute('aria-pressed', String((state.text || 0) === +b.dataset.a11yText)));
    wrap.querySelectorAll('[data-a11y-key]').forEach((b) => b.setAttribute('aria-pressed', String(!!state[b.dataset.a11yKey])));
    if (state.still) stillNow();
    if (window.ScrollTrigger && !state.still) ScrollTrigger.refresh();   // sizes changed: measure the page again
    save(state);
  };

  const open = () => {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    panel.querySelector('button').focus();
  };
  const close = (returnFocus = true) => {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus();
  };

  btn.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-a11y-close]')) { close(); return; }
    if (t.matches('[data-a11y-reset]')) { state = {}; apply(); return; }
    if (t.dataset.a11yText !== undefined) state.text = +t.dataset.a11yText;
    if (t.dataset.a11yKey) state[t.dataset.a11yKey] = !state[t.dataset.a11yKey];
    apply();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !wrap.contains(e.target)) close(false); });

  apply();
})();
