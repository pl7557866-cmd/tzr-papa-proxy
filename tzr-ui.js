(function () {
  'use strict';

  const toast = (msg) => {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__tzrToast);
    window.__tzrToast = setTimeout(() => t.classList.remove('show'), 1900);
  };

  // Android keyboard: focus immediately after the page is interactive.
  const first = document.querySelector('input[autofocus]');
  if (first) {
    const focusInput = () => {
      try { first.focus({ preventScroll: true }); } catch (_) { first.focus(); }
    };
    setTimeout(focusInput, 80);
    setTimeout(focusInput, 350);
  }

  // Background music. Browsers may block unmuted autoplay. We first try
  // unmuted autoplay, then fall back to muted autoplay and unmute on the
  // user's first interaction. There is intentionally no visible music UI.
  const audio = document.getElementById('tzrMusic');
  if (audio) {
    audio.loop = true;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.volume = 0.12;

    const startMusic = async () => {
      try {
        audio.muted = false;
        await audio.play();
        window.__tzrMusicStarted = true;
      } catch (_) {
        try {
          audio.muted = true;
          await audio.play();
        } catch (__) {}
      }
    };

    startMusic();

    const unlock = async () => {
      try {
        audio.muted = false;
        audio.volume = 0.12;
        await audio.play();
      } catch (_) {}
      ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
        document.removeEventListener(ev, unlock, true)
      );
    };
    ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
      document.addEventListener(ev, unlock, true)
    );
  }

  // Short local activation/deactivation sound.
  const beep = (on) => {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const c = new C();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = on ? 880 : 420;
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.065, c.currentTime + .012);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + .17);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + .18);
      setTimeout(() => c.close().catch(() => {}), 300);
    } catch (_) {}
  };

  const setSwitch = (sw, active) => {
    sw.classList.toggle('active', active);
    sw.setAttribute('aria-checked', active ? 'true' : 'false');
  };

  // Feature toggles: use pointer/click + keyboard and a real button-like
  // interaction. The state only remains changed after the server confirms it.
  document.querySelectorAll('[data-feature]').forEach(sw => {
    setSwitch(sw, sw.classList.contains('active'));

    const toggle = async (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (sw.dataset.busy === '1') return;
      sw.dataset.busy = '1';

      const previous = sw.classList.contains('active');
      const next = !previous;
      setSwitch(sw, next);
      beep(next);
      try {
        const r = await fetch('/user/toggle-feature', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ feature: sw.dataset.feature, enabled: next })
        });
        const text = await r.text();
        let d = {};
        try { d = JSON.parse(text); } catch (_) {}
        if (!r.ok || !d.ok) throw new Error(d.error || 'Could not save setting');
        toast(next ? '✓ Activated' : '✓ Deactivated');
        sw.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.10)' }, { transform: 'scale(1)' }],
          { duration: 260, easing: 'ease-out' }
        );
      } catch (err) {
        setSwitch(sw, previous);
        beep(previous);
        toast(err.message || 'Could not save setting');
      } finally {
        sw.dataset.busy = '0';
      }
    };

    sw.addEventListener('click', toggle, { passive: false });
    sw.addEventListener('pointerup', (e) => {
      // Do not duplicate the normal click event.
      if (e.pointerType === 'keyboard') toggle(e);
    }, { passive: false });
    sw.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
    });
  });

  // Make all submit buttons visibly clickable and prevent accidental double submits.
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      const submit = form.querySelector('button[type="submit"],button:not([type])');
      if (submit) {
        submit.disabled = true;
        setTimeout(() => { submit.disabled = false; }, 1500);
      }
    });
  });
})();

// Premium glass-break tap effect. The effect lasts exactly 0.8s and never
// captures pointer events, so it cannot interfere with buttons or switches.
(function () {
  const spawnGlass = (x, y) => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.createElement('div');
    root.className = 'glass-tap';
    root.style.left = x + 'px'; root.style.top = y + 'px';
    const ring = document.createElement('span'); ring.className = 'ring'; root.appendChild(ring);
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('span'); s.className = 'shard';
      const a = (i / 9) * 360 + (Math.random() * 18 - 9);
      const d = 28 + Math.random() * 44;
      s.style.setProperty('--r', a + 'deg');
      s.style.setProperty('--d', d + 'px');
      s.style.animationDelay = (Math.random() * .035) + 's';
      root.appendChild(s);
    }
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 800);
  };
  let last = 0;
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const now = performance.now();
    if (now - last < 90) return;
    last = now;
    spawnGlass(e.clientX, e.clientY);
  }, {passive:true});
})();
