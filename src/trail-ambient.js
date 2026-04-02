/**
 * Ambient cursor trail for non-playground pages.
 * Self-contained IIFE — no Vite, no imports, no DOM dependencies.
 * Chase + lag enabled by default for maximum visual impact.
 */
(function () {
  const S = {
    colors: ['#7355e8', '#a480ff'],
    colorCount: 2,
    trailLength: 20,
    size: 12,
    fade: 0.055,
    blend: 'normal',
    glow: 8,
    // chase / lag
    chaseSpeed: 0.1,    // 0–1: how fast the ghost catches the cursor
    chaseDistance: 0,   // minimum gap to maintain
    chaseMode: 'smooth', // 'smooth' | 'elastic' | 'delayed'
    lagMs: 120,         // only used in delayed mode — milliseconds of lag
  };

  let particles = [];
  let mx = -200, my = -200;
  // ghost = lagging spawn point that trails the real cursor
  let gx = -200, gy = -200;
  let lastGhostSpawnX = -200, lastGhostSpawnY = -200;
  let posHistory = [];

  // ── colour helpers ──────────────────────────────────────────

  function lerpColor(a, b, t) {
    const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    const r = Math.round(ar + (br - ar) * t).toString(16).padStart(2, '0');
    const g = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, '0');
    const bl = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, '0');
    return '#' + r + g + bl;
  }

  function getColor(idx) {
    if (S.colorCount === 1) return S.colors[0];
    const t = S.trailLength > 1 ? idx / (S.trailLength - 1) : 0;
    const seg = (S.colorCount - 1) * t;
    const i = Math.min(Math.floor(seg), S.colorCount - 2);
    return lerpColor(S.colors[i], S.colors[i + 1], seg - i);
  }

  // ── particle lifecycle ──────────────────────────────────────

  function spawnParticle(x, y) {
    const sz = S.size;
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      `z-index:9999`,
      `left:${x}px`,
      `top:${y}px`,
      `width:${sz}px`,
      `height:${sz}px`,
      `margin-left:${-sz / 2}px`,
      `margin-top:${-sz / 2}px`,
      `mix-blend-mode:${S.blend}`,
      'transform-origin:center',
      S.glow > 0 ? `filter:drop-shadow(0 0 ${S.glow}px #fff)` : '',
    ].filter(Boolean).join(';');
    el.innerHTML = `<svg width="${sz}" height="${sz}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#fff"/></svg>`;
    document.body.appendChild(el);

    const p = {
      x, y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: 1,
      el,
    };
    particles.push(p);

    if (particles.length > S.trailLength) {
      const old = particles.shift();
      if (old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }

    // recolour whole trail so gradient always flows head→tail
    particles.forEach((p2, i) => {
      const color = getColor(i);
      p2.color = color;
      const node = p2.el && p2.el.querySelector('[fill]');
      if (node) node.setAttribute('fill', color);
      if (p2.el) p2.el.style.filter = S.glow > 0 ? `drop-shadow(0 0 ${S.glow}px ${color})` : '';
    });
  }

  // ── animation loop ──────────────────────────────────────────

  function animate() {
    requestAnimationFrame(animate);

    // ── ghost chase logic ──
    const dx = mx - gx, dy = my - gy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const gap = S.chaseDistance;

    if (dist > gap) {
      if (S.chaseMode === 'smooth') {
        const spd = Math.max(0.01, Math.min(1, S.chaseSpeed));
        gx += dx * spd;
        gy += dy * spd;

      } else if (S.chaseMode === 'elastic') {
        gx += dx * (S.chaseSpeed * 1.8);
        gy += dy * (S.chaseSpeed * 1.8);

      } else if (S.chaseMode === 'delayed') {
        const targetTime = Date.now() - S.lagMs;
        let best = null;
        for (let i = posHistory.length - 1; i >= 0; i--) {
          if (posHistory[i].t <= targetTime) { best = posHistory[i]; break; }
        }
        if (best) { gx = best.x; gy = best.y; }
        else if (posHistory.length > 0) { gx = posHistory[0].x; gy = posHistory[0].y; }
      }

      // clamp ghost so it never overshoots the gap
      if (gap > 0) {
        const ndx = mx - gx, ndy = my - gy;
        const nd = Math.sqrt(ndx * ndx + ndy * ndy);
        if (nd < gap && nd > 0.1) {
          gx = mx - ndx * (gap / nd);
          gy = my - ndy * (gap / nd);
        }
      }
    }

    // spawn when ghost has moved ≥ 2 px since last spawn
    const sdx = gx - lastGhostSpawnX, sdy = gy - lastGhostSpawnY;
    if (Math.sqrt(sdx * sdx + sdy * sdy) >= 2) {
      spawnParticle(gx, gy);
      lastGhostSpawnX = gx;
      lastGhostSpawnY = gy;
    }

    // ── update existing particles ──
    particles.forEach(p => {
      p.life -= S.fade;
      p.x += p.vx;
      p.y += p.vy;

      if (p.el) {
        const scale = Math.max(0, p.life);
        p.el.style.opacity = scale;
        p.el.style.transform = `scale(${scale})`;
        p.el.style.left = p.x + 'px';
        p.el.style.top = p.y + 'px';
        if (S.glow > 0 && p.color) {
          const bloom = S.glow * (1 + (1 - Math.max(p.life, 0)) * 2);
          p.el.style.filter = `drop-shadow(0 0 ${bloom}px ${p.color})`;
        }
      }

      if (p.life <= 0 && p.el && p.el.parentNode) {
        p.el.parentNode.removeChild(p.el);
        p.el = null;
      }
    });

    particles = particles.filter(p => p.life > 0);
  }

  // ── mouse tracking ──────────────────────────────────────────

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    // seed ghost on first move so it doesn't fly in from a corner
    if (gx === -200) {
      gx = mx; gy = my;
      lastGhostSpawnX = mx - 999;
      lastGhostSpawnY = my - 999;
    }
    posHistory.push({ x: mx, y: my, t: Date.now() });
    if (posHistory.length > 300) posHistory.shift();
  });

  animate();
})();
