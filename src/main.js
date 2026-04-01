import './style.css';

// ── STATE ──────────────────────────────────────────────
const S = {
  shape: 'circle',
  colors: ['#9b87ff','#ff6b9d','#4ecdc4'],
  colorCount: 2,
  colorMode: 'gradient',
  trailLength: 20,
  size: 14,
  fade: 0.06,
  compact: 1.0,
  spread: 0,
  rotSpeed: 0,
  gravity: 0,
  offsetY: 0,
  blend: 'normal',
  // chase / lag
  chaseEnabled: false,
  chaseSpeed: 0.12,
  chaseDistance: 0,
  chaseMode: 'smooth',  // 'smooth' | 'elastic' | 'delayed'
};

let particles = [];
let mx = -200, my = -200;
// ghost = the lagging spawn point that chases the real cursor
let gx = -200, gy = -200;
let lastGhostSpawnX = -200, lastGhostSpawnY = -200;
// delayed queue for 'delayed' chase mode
let posHistory = [];
let animId = null;
let codeTab = 'js';

// ── CURSOR TRACKING ────────────────────────────────────
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  // init ghost on first move so it doesn't fly from corner
  if (gx === -200) { gx = mx; gy = my; lastGhostSpawnX = mx - 999; lastGhostSpawnY = my - 999; }
  // push to position history for delayed mode
  posHistory.push({ x: mx, y: my, t: Date.now() });
  if (posHistory.length > 300) posHistory.shift();
  if (!S.chaseEnabled) spawnParticle(mx, my);
});

// ── PARTICLES ──────────────────────────────────────────
function getColor(idx, total) {
  if (S.colorMode === 'random') {
    const all = S.colors.slice(0, S.colorCount);
    return all[Math.floor(Math.random() * all.length)];
  }
  if (S.colorCount === 1) return S.colors[0];
  const t = total > 1 ? idx / (total - 1) : 0;
  if (S.colorMode === 'gradient') {
    const seg = (S.colorCount - 1) * t;
    const i = Math.min(Math.floor(seg), S.colorCount - 2);
    const f = seg - i;
    return lerpColor(S.colors[i], S.colors[i + 1], f);
  }
  // mixed: cycle
  return S.colors[idx % S.colorCount];
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
  const br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
  const r = Math.round(ar + (br-ar)*t).toString(16).padStart(2,'0');
  const g = Math.round(ag + (bg-ag)*t).toString(16).padStart(2,'0');
  const bl2 = Math.round(ab + (bb-ab)*t).toString(16).padStart(2,'0');
  return '#'+r+g+bl2;
}

function spawnParticle(x, y) {
  const spread = S.spread;
  const sx = x + (Math.random()-0.5)*spread*2;
  const sy = y + S.offsetY + (Math.random()-0.5)*spread*2;

  const p = {
    x: sx, y: sy,
    vx: (Math.random()-0.5)*0.5,
    vy: (Math.random()-0.5)*0.5,
    life: 1,
    rot: S.rotSpeed !== 0 ? Math.random()*360 : 0,
    idx: particles.length,
    el: createParticleEl(sx, sy)
  };
  particles.push(p);

  // prune
  if (particles.length > S.trailLength) {
    const old = particles.shift();
    if (old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
  }

  // reindex & recolor
  particles.forEach((p2, i) => {
    p2.idx = i;
    const c = getColor(i, S.trailLength);
    applyColorToEl(p2.el, c);
  });
}

function createParticleEl(x, y) {
  const canvas = document.getElementById('canvas');
  const el = document.createElement('div');
  el.className = 'trail-particle';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.mixBlendMode = S.blend;
  const sz = S.size;
  el.style.width = sz + 'px';
  el.style.height = sz + 'px';
  el.style.marginLeft = -sz/2 + 'px';
  el.style.marginTop = -sz/2 + 'px';
  el.innerHTML = getShapeSVG(S.shape, sz, '#fff');
  document.body.appendChild(el);
  return el;
}

function applyColorToEl(el, color) {
  if (!el) return;
  const svg = el.querySelector('svg');
  if (!svg) return;
  const filled = ['circle','square','triangle','star4','star4pt','heart','diamond','hexagon','dot','spark'];
  if (filled.includes(S.shape)) {
    svg.querySelectorAll('[fill="#fff"]').forEach(n => n.setAttribute('fill', color));
  } else {
    svg.querySelectorAll('[stroke="#fff"]').forEach(n => n.setAttribute('stroke', color));
  }
}

function getShapeSVG(shape, sz, color) {
  const s = sz;
  switch(shape) {
    case 'circle':   return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="${color}"/></svg>`;
    case 'square':   return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="4" fill="${color}"/></svg>`;
    case 'triangle': return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><polygon points="20,4 38,36 2,36" fill="${color}"/></svg>`;
    case 'star4':    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><polygon points="20,3 23.5,16.5 37,17 26.5,25.5 30,39 20,31 10,39 13.5,25.5 3,17 16.5,16.5" fill="${color}"/></svg>`;
    case 'star4pt':  return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><polygon points="20,3 23,17 37,20 23,23 20,37 17,23 3,20 17,17" fill="${color}"/></svg>`;
    case 'heart':    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><path d="M20,33 C20,33 4,22 4,13 C4,7.5 8.5,4 13,5 C15.5,5.5 18,8 20,12 C22,8 24.5,5.5 27,5 C31.5,4 36,7.5 36,13 C36,22 20,33 20,33Z" fill="${color}"/></svg>`;
    case 'diamond':  return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><polygon points="20,3 37,20 20,37 3,20" fill="${color}"/></svg>`;
    case 'hexagon':  return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><polygon points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5" fill="${color}"/></svg>`;
    case 'cross':    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><path d="M20,4 L20,36 M4,20 L36,20" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`;
    case 'spark':    return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><path d="M20,4 L22.5,17.5 L36,20 L22.5,22.5 L20,36 L17.5,22.5 L4,20 L17.5,17.5Z" fill="${color}"/></svg>`;
    case 'ring':     return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="none" stroke="${color}" stroke-width="6"/></svg>`;
    case 'dot':      return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="10" fill="${color}"/></svg>`;
    default:         return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="${color}"/></svg>`;
  }
}

// ── ANIMATE ────────────────────────────────────────────
function animate() {
  animId = requestAnimationFrame(animate);

  // ── CHASE LOGIC ──
  if (S.chaseEnabled) {
    const dx = mx - gx, dy = my - gy;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Only move the ghost when the cursor is beyond the gap distance
    const gap = S.chaseDistance;
    const shouldMove = dist > gap;

    if (shouldMove) {
      if (S.chaseMode === 'smooth') {
        const spd = Math.max(0.01, Math.min(1, S.chaseSpeed));
        gx += dx * spd;
        gy += dy * spd;

      } else if (S.chaseMode === 'elastic') {
        const pull = S.chaseSpeed * 1.8;
        gx += dx * pull;
        gy += dy * pull;

      } else if (S.chaseMode === 'delayed') {
        const delayMs = (1 - S.chaseSpeed) * 600 + 40;
        const targetTime = Date.now() - delayMs;
        let best = null;
        for (let i = posHistory.length - 1; i >= 0; i--) {
          if (posHistory[i].t <= targetTime) { best = posHistory[i]; break; }
        }
        if (best) { gx = best.x; gy = best.y; }
        else if (posHistory.length > 0) { gx = posHistory[0].x; gy = posHistory[0].y; }
      }

      // After moving, if ghost overshot the gap boundary, clamp it back
      if (gap > 0) {
        const ndx = mx - gx, ndy = my - gy;
        const nd = Math.sqrt(ndx*ndx + ndy*ndy);
        if (nd < gap && nd > 0.1) {
          // ghost got too close — push it back along the cursor→ghost direction
          const sc = gap / nd;
          gx = mx - ndx * sc;
          gy = my - ndy * sc;
        }
      }
    }

    // Spawn only when ghost has moved at least ~2px since last spawn
    const spawnDx = gx - lastGhostSpawnX, spawnDy = gy - lastGhostSpawnY;
    const spawnDist = Math.sqrt(spawnDx*spawnDx + spawnDy*spawnDy);
    if (spawnDist >= 2) {
      spawnParticle(gx, gy);
      lastGhostSpawnX = gx;
      lastGhostSpawnY = gy;
    }
  } // end if (S.chaseEnabled)

  // ── PARTICLE UPDATE ──
  particles.forEach((p, i) => {
    p.life -= S.fade;
    p.vy += S.gravity * 0.05;
    p.x += p.vx * (1/S.compact);
    p.y += p.vy * (1/S.compact);
    p.rot += S.rotSpeed;

    if (p.el) {
      const scale = p.life * (i / Math.max(particles.length,1) * 0.5 + 0.5);
      p.el.style.opacity = Math.max(0, p.life);
      p.el.style.transform = `rotate(${p.rot}deg) scale(${Math.max(0,scale)})`;
      p.el.style.left = p.x + 'px';
      p.el.style.top = p.y + 'px';
    }

    if (p.life <= 0 && p.el && p.el.parentNode) {
      p.el.parentNode.removeChild(p.el);
      p.el = null;
    }
  });
  particles = particles.filter(p => p.life > 0);
}
animate();

// ── CLEAR PARTICLES ────────────────────────────────────
function clearParticles() {
  particles.forEach(p => { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); });
  particles = [];
}

// ── CONTROLS ───────────────────────────────────────────
function setShape(shape, el) {
  S.shape = shape;
  document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  setActivePresetChip('none');
  clearParticles();
  updateCode();
}

// ── ACTIVE SLOT TRACKING ───────────────────────────────
let activeColorSlot = 1;

function activateSlot(n) {
  activeColorSlot = n;
  [1,2,3].forEach(i => {
    const sw = document.getElementById('cp'+i);
    if (sw) sw.classList.toggle('active-slot', i === n);
  });
  // open the native color picker for this slot
  const inp = document.getElementById('cp'+n)?.querySelector('input[type=color]');
  if (inp) inp.click();
}

function updateColor(slot, val) {
  S.colors[slot-1] = val;
  const cp = document.getElementById('cp'+slot);
  if (cp) cp.style.background = val;
  const hex = document.getElementById('hex'+slot);
  if (hex) hex.textContent = val;
  updateColorBar();
  updateCode();
}

function updateColorBar() {
  const bar = document.getElementById('color-bar');
  if (!bar) return;
  const cols = S.colors.slice(0, S.colorCount);
  if (cols.length === 1) {
    bar.style.background = cols[0];
  } else {
    bar.style.background = `linear-gradient(to right, ${cols.join(', ')})`;
  }
  // also update mixed pill icon colors
  const spans = document.querySelectorAll('.pill-icon-mixed span');
  const allCols = S.colors.slice(0, 3);
  spans.forEach((sp, i) => { sp.style.background = allCols[i] || allCols[allCols.length-1]; });
}

function toggleColorSlot() {
  // cycle: 1→2→3→2→1  (add up to 3, remove down to 1)
  const btn = document.getElementById('color-add-btn');
  if (S.colorCount < 3) {
    setColorCount(S.colorCount + 1);
    btn.textContent = S.colorCount === 3 ? '−' : '+';
    btn.classList.toggle('remove', S.colorCount === 3);
  } else {
    setColorCount(S.colorCount - 1);
    btn.textContent = '+';
    btn.classList.remove('remove');
  }
}

function setColorCount(n) {
  S.colorCount = n;
  [1,2,3].forEach(i => {
    const slot = document.getElementById('slot'+i);
    if (slot) slot.style.display = i <= n ? '' : 'none';
  });
  // update add button state
  const btn = document.getElementById('color-add-btn');
  if (btn) {
    btn.textContent = n === 3 ? '−' : '+';
    btn.classList.toggle('remove', n === 3);
    btn.title = n === 3 ? 'Remove color' : 'Add color';
  }
  updateColorBar();
  updateCode();
}

function setColorMode(mode) {
  S.colorMode = mode;
  ['gradient','mixed','random'].forEach(m => {
    document.getElementById('mode-'+m).classList.toggle('active', m === mode);
  });
  updateCode();
}

// ── QUICK PALETTE INIT ────────────────────────────────
const PALETTE = [
  '#ff6b9d','#ff8c69','#fbbf24','#a3e635','#34d399',
  '#22d3ee','#60a5fa','#a78bfa','#f472b6','#fb7185',
  '#ffffff','#d1d5db','#6b7280','#374151','#111827',
  '#ff0080','#7c3aed','#0ea5e9','#10b981','#f59e0b',
];

function initPalette() {
  const row = document.getElementById('quick-palette');
  if (!row) return;
  PALETTE.forEach(col => {
    const sw = document.createElement('div');
    sw.className = 'pal-swatch';
    sw.style.background = col;
    sw.title = col;
    sw.onclick = () => {
      updateColor(activeColorSlot, col);
      const inp = document.getElementById('cp'+activeColorSlot)?.querySelector('input[type=color]');
      if (inp) inp.value = col;
      setActivePresetChip('none');
    };
    row.appendChild(sw);
  });
}

function setSetting(key, val, valId, suffix='') {
  S[key] = val;
  const display = typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : val;
  document.getElementById(valId).textContent = display + suffix;
  updateCode();
}

function setBlend(mode, el) {
  S.blend = mode;
  document.querySelectorAll('.blend-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  particles.forEach(p => { if (p.el) p.el.style.mixBlendMode = mode; });
  updateCode();
}

// ── CHASE CONTROLS ─────────────────────────────────────
function toggleChase(el) {
  S.chaseEnabled = !S.chaseEnabled;
  el.classList.toggle('active', S.chaseEnabled);
  el.textContent = S.chaseEnabled ? 'Chase ON' : 'Chase OFF';
  // reset ghost to cursor position when toggling on
  if (S.chaseEnabled) { gx = mx; gy = my; lastGhostSpawnX = mx - 999; lastGhostSpawnY = my - 999; posHistory = []; }
  clearParticles();
  updateCode();
}

function setChaseMode(mode, el) {
  S.chaseMode = mode;
  document.querySelectorAll('.chase-mode-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (S.chaseEnabled) { gx = mx; gy = my; lastGhostSpawnX = mx - 999; lastGhostSpawnY = my - 999; posHistory = []; }
  const descs = {
    smooth:  'Smooth — ghost lerps toward cursor at a fixed rate each frame.',
    elastic: 'Elastic — spring physics; snaps faster from far away, slows near cursor.',
    delayed: 'Delayed — trail replays your actual path from a moment in the past.',
  };
  document.getElementById('chase-desc').textContent = descs[mode] || '';
  updateCode();
}

function setCanvasBg(mode, el) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const canvas = document.getElementById('canvas');
  if (mode === 'dark') canvas.style.background = 'radial-gradient(ellipse at 30% 40%, rgba(100,80,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(80,160,200,0.04) 0%, transparent 50%), #0d0d0f';
  else if (mode === 'light') canvas.style.background = '#f5f5f7';
  else canvas.style.background = 'linear-gradient(135deg, #1a0533 0%, #0a1a3a 50%, #0d2a1a 100%)';
}

// ── PRESETS ────────────────────────────────────────────
const PRESETS = {
  galaxy: { shape:'star4pt', colors:['#a78bfa','#7dd3fc','#34d399'], colorCount:3, colorMode:'gradient', size:10, trailLength:35, fade:0.04, spread:5, rotSpeed:5, gravity:-0.3, blend:'screen' },
  fire:   { shape:'spark',   colors:['#fbbf24','#f97316','#ef4444'], colorCount:3, colorMode:'gradient', size:16, trailLength:25, fade:0.07, spread:8, rotSpeed:0, gravity:-0.5, blend:'screen' },
  candy:  { shape:'circle',  colors:['#f472b6','#a78bfa','#34d399'], colorCount:3, colorMode:'mixed',    size:18, trailLength:20, fade:0.06, spread:12, rotSpeed:0, gravity:0, blend:'normal' },
  neon:   { shape:'ring',    colors:['#00ffcc','#ff00ff','#00ffcc'], colorCount:2, colorMode:'gradient', size:20, trailLength:30, fade:0.05, spread:0, rotSpeed:3, gravity:0, blend:'screen' },
  snow:   { shape:'spark',   colors:['#e0f2fe','#bae6fd','#ffffff'], colorCount:3, colorMode:'random',   size:8,  trailLength:40, fade:0.03, spread:20, rotSpeed:10, gravity:0.2, blend:'normal' },
  gold:   { shape:'star4',   colors:['#fde68a','#f59e0b','#92400e'], colorCount:3, colorMode:'gradient', size:14, trailLength:22, fade:0.06, spread:4, rotSpeed:8, gravity:0.1, blend:'normal' },
};

const DEFAULT_STATE = {
  shape: 'circle',
  colors: ['#9b87ff','#ff6b9d','#4ecdc4'],
  colorCount: 2,
  colorMode: 'gradient',
  trailLength: 20,
  size: 14,
  fade: 0.06,
  compact: 1.0,
  spread: 0,
  rotSpeed: 0,
  gravity: 0,
  offsetY: 0,
  blend: 'normal',
};

function setActivePresetChip(name) {
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  const chip = document.getElementById('preset-' + name);
  if (chip) chip.classList.add('active');
}

function applyPreset(name) {
  if (name === 'none') {
    // reset to defaults
    Object.assign(S, DEFAULT_STATE);
    setActivePresetChip('none');
    clearParticles();
    // sync shape UI
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.shape-btn')[0].classList.add('active');
    // sync colors
    DEFAULT_STATE.colors.forEach((c, i) => {
      S.colors[i] = c;
      const cp = document.getElementById('cp'+(i+1));
      if (cp) cp.style.background = c;
      const hex = document.getElementById('hex'+(i+1));
      if (hex) hex.textContent = c;
      const inp = cp?.querySelector('input');
      if (inp) inp.value = c;
    });
    setColorCount(DEFAULT_STATE.colorCount);
    setColorMode(DEFAULT_STATE.colorMode);
    setBlend(DEFAULT_STATE.blend, document.getElementById('blend-normal'));
    updateColorBar();
    updateCode();
    return;
  }

  const p = PRESETS[name];
  if (!p) return;
  Object.assign(S, p);
  setActivePresetChip(name);
  clearParticles();
  updateCode();
  // sync shapes
  document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.shape-btn');
  const shapes = ['circle','square','triangle','star4','star4pt','heart','diamond','hexagon','cross','spark','ring','dot'];
  const idx = shapes.indexOf(p.shape);
  if (idx >= 0) btns[idx].classList.add('active');
  // sync colors
  p.colors.forEach((c, i) => {
    S.colors[i] = c;
    const cp = document.getElementById('cp'+(i+1));
    if (cp) cp.style.background = c;
    const hex = document.getElementById('hex'+(i+1));
    if (hex) hex.textContent = c;
    const inp = cp?.querySelector('input');
    if (inp) inp.value = c;
  });
  setColorCount(p.colorCount);
  setColorMode(p.colorMode);
  setBlend(p.blend, document.getElementById('blend-'+p.blend) || document.getElementById('blend-normal'));
  updateColorBar();
}

// ── CODE GENERATION ────────────────────────────────────
function setCodeTab(tab, el) {
  codeTab = tab;
  document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  updateCode();
}

function updateCode() {
  const out = document.getElementById('code-out');
  const raw = getRawCode(codeTab);
  out.innerHTML = highlight(raw, codeTab);
}

// ── RAW CODE (plain text, used for copy) ──────────────
function getRawCode(tab) {
  if (tab === 'js')      return rawJS();
  if (tab === 'css')     return rawCSS();
  if (tab === 'html')    return rawHTML();
  if (tab === 'react')   return rawReact();
  if (tab === 'vue')     return rawVue();
  if (tab === 'angular') return rawAngular();
  return '';
}

// shared config string used across frameworks
function cfgObj(indent) {
  const p = indent;
  const c = S.colors.slice(0, S.colorCount).map(x => `'${x}'`).join(', ');
  return `{
${p}  shape: '${S.shape}',
${p}  colors: [${c}],
${p}  colorMode: '${S.colorMode}',
${p}  trailLength: ${S.trailLength},
${p}  size: ${S.size},
${p}  fade: ${S.fade.toFixed(2)},
${p}  compact: ${S.compact.toFixed(1)},
${p}  spread: ${S.spread},
${p}  rotSpeed: ${S.rotSpeed},
${p}  gravity: ${S.gravity.toFixed(1)},
${p}  offsetY: ${S.offsetY},
${p}  blend: '${S.blend}',
${p}  chaseEnabled: ${S.chaseEnabled},
${p}  chaseSpeed: ${S.chaseSpeed.toFixed(2)},
${p}  chaseDistance: ${S.chaseDistance},
${p}  chaseMode: '${S.chaseMode}',
${p}}`;
}

// shared engine logic (framework-agnostic, indented)
function engineFn(indent) {
  const p = indent;
  return `
${p}function lerpColor(a, b, t) {
${p}  const hex = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
${p}  const [ar,ag,ab] = hex(a), [br,bg,bb] = hex(b);
${p}  return '#' + [ar+(br-ar)*t, ag+(bg-ag)*t, ab+(bb-ab)*t]
${p}    .map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
${p}}

${p}function getColor(cfg, idx, total) {
${p}  const cols = cfg.colors.slice(0, cfg.colors.length);
${p}  if (cfg.colorMode === 'random') return cols[Math.floor(Math.random()*cols.length)];
${p}  if (cols.length === 1) return cols[0];
${p}  const t = total > 1 ? idx / (total - 1) : 0;
${p}  if (cfg.colorMode === 'gradient') {
${p}    const seg = (cols.length-1)*t, i = Math.min(Math.floor(seg), cols.length-2);
${p}    return lerpColor(cols[i], cols[i+1], seg-i);
${p}  }
${p}  return cols[idx % cols.length];
${p}}

${p}function getShapeSVG(shape, size, color) {
${p}  const s = size;
${p}  const shapes = {
${p}    circle:   \`<circle cx="20" cy="20" r="18" fill="\${color}"/>\`,
${p}    square:   \`<rect x="4" y="4" width="32" height="32" rx="4" fill="\${color}"/>\`,
${p}    triangle: \`<polygon points="20,4 38,36 2,36" fill="\${color}"/>\`,
${p}    star4:    \`<polygon points="20,3 23.5,16.5 37,17 26.5,25.5 30,39 20,31 10,39 13.5,25.5 3,17 16.5,16.5" fill="\${color}"/>\`,
${p}    star4pt:  \`<polygon points="20,3 23,17 37,20 23,23 20,37 17,23 3,20 17,17" fill="\${color}"/>\`,
${p}    heart:    \`<path d="M20,33 C20,33 4,22 4,13 C4,7.5 8.5,4 13,5 C15.5,5.5 18,8 20,12 C22,8 24.5,5.5 27,5 C31.5,4 36,7.5 36,13 C36,22 20,33 20,33Z" fill="\${color}"/>\`,
${p}    diamond:  \`<polygon points="20,3 37,20 20,37 3,20" fill="\${color}"/>\`,
${p}    hexagon:  \`<polygon points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5" fill="\${color}"/>\`,
${p}    cross:    \`<path d="M20,4 L20,36 M4,20 L36,20" stroke="\${color}" stroke-width="6" stroke-linecap="round" fill="none"/>\`,
${p}    spark:    \`<path d="M20,4 L22.5,17.5 L36,20 L22.5,22.5 L20,36 L17.5,22.5 L4,20 L17.5,17.5Z" fill="\${color}"/>\`,
${p}    ring:     \`<circle cx="20" cy="20" r="15" fill="none" stroke="\${color}" stroke-width="6"/>\`,
${p}    dot:      \`<circle cx="20" cy="20" r="10" fill="\${color}"/>\`,
${p}  };
${p}  return \`<svg xmlns="http://www.w3.org/2000/svg" width="\${s}" height="\${s}" viewBox="0 0 40 40">\${shapes[shape]||shapes.circle}</svg>\`;
${p}}

${p}function initTrail(cfg) {
${p}  let particles = [], posHistory = [], animId;
${p}  let mx = 0, my = 0, gx = 0, gy = 0, lastGx = -999, lastGy = -999, ready = false;

${p}  function spawnAt(x, y) {
${p}    const sx = x + (Math.random()-.5)*cfg.spread*2;
${p}    const sy = y + cfg.offsetY + (Math.random()-.5)*cfg.spread*2;
${p}    const el = document.createElement('div');
${p}    el.style.cssText = \`position:fixed;pointer-events:none;z-index:9999;width:\${cfg.size}px;height:\${cfg.size}px;left:\${sx}px;top:\${sy}px;margin:\${-cfg.size/2}px 0 0 \${-cfg.size/2}px;mix-blend-mode:\${cfg.blend};\`;
${p}    el.innerHTML = getShapeSVG(cfg.shape, cfg.size, '#fff');
${p}    document.body.appendChild(el);
${p}    particles.push({ x:sx, y:sy, vy:0, life:1, rot: cfg.rotSpeed !== 0 ? Math.random()*360 : 0, el });
${p}    if (particles.length > cfg.trailLength) { const old = particles.shift(); old.el?.remove(); }
${p}    particles.forEach((p, i) => {
${p}      const c = getColor(cfg, i, cfg.trailLength);
${p}      p.el?.querySelectorAll('[fill="#fff"]').forEach(n => n.setAttribute('fill', c));
${p}      p.el?.querySelectorAll('[stroke="#fff"]').forEach(n => n.setAttribute('stroke', c));
${p}    });
${p}  }

${p}  function updateGhost() {
${p}    const dx = mx-gx, dy = my-gy, dist = Math.sqrt(dx*dx+dy*dy);
${p}    if (dist > cfg.chaseDistance) {
${p}      if (cfg.chaseMode === 'elastic') { gx += dx*cfg.chaseSpeed*1.8; gy += dy*cfg.chaseSpeed*1.8; }
${p}      else if (cfg.chaseMode === 'delayed') {
${p}        const tgt = Date.now() - (1-cfg.chaseSpeed)*600+40;
${p}        for (let i = posHistory.length-1; i>=0; i--) { if (posHistory[i].t<=tgt) { gx=posHistory[i].x; gy=posHistory[i].y; break; } }
${p}      } else { gx += dx*cfg.chaseSpeed; gy += dy*cfg.chaseSpeed; }
${p}      if (cfg.chaseDistance > 0) {
${p}        const nd = Math.sqrt((mx-gx)**2+(my-gy)**2);
${p}        if (nd < cfg.chaseDistance && nd > 0.1) { const sc=cfg.chaseDistance/nd; gx=mx-(mx-gx)*sc; gy=my-(my-gy)*sc; }
${p}      }
${p}    }
${p}  }

${p}  function loop() {
${p}    animId = requestAnimationFrame(loop);
${p}    if (cfg.chaseEnabled) {
${p}      updateGhost();
${p}      const d = Math.hypot(gx-lastGx, gy-lastGy);
${p}      if (d >= 2) { spawnAt(gx, gy); lastGx=gx; lastGy=gy; }
${p}    }
${p}    particles.forEach((p, i) => {
${p}      p.life -= cfg.fade; p.vy += cfg.gravity*0.05;
${p}      p.x += 0; p.y += p.vy/cfg.compact; p.rot += cfg.rotSpeed;
${p}      if (p.el) {
${p}        const sc = p.life*(i/Math.max(particles.length,1)*0.5+0.5);
${p}        p.el.style.opacity = Math.max(0, p.life);
${p}        p.el.style.transform = \`rotate(\${p.rot}deg) scale(\${Math.max(0,sc)})\`;
${p}        p.el.style.top = p.y + 'px';
${p}      }
${p}    });
${p}    particles = particles.filter(p => { if(p.life<=0){p.el?.remove();return false;}return true; });
${p}  }

${p}  document.addEventListener('mousemove', e => {
${p}    mx = e.clientX; my = e.clientY;
${p}    if (!ready) { gx = mx; gy = my; ready = true; }
${p}    posHistory.push({ x:mx, y:my, t:Date.now() });
${p}    if (posHistory.length > 300) posHistory.shift();
${p}    if (!cfg.chaseEnabled) spawnAt(mx, my);
${p}  });

${p}  loop();
${p}  return () => { cancelAnimationFrame(animId); particles.forEach(p => p.el?.remove()); particles = []; };
${p}}`;
}

function rawJS() {
  return `// Trail cursor effect — vanilla JS
// Drop into any JS file and call initTrail(config)

const config = ${cfgObj('')};
${engineFn('')}

// Usage:
const cleanup = initTrail(config);
// call cleanup() to remove the effect`;
}

function rawCSS() {
  const c1 = S.colors[0];
  const c2 = S.colorCount > 1 ? S.colors[1] : S.colors[0];
  const c3 = S.colorCount > 2 ? S.colors[2] : c2;
  const grad = S.colorMode === 'gradient'
    ? `linear-gradient(135deg, ${c1}, ${c2}${S.colorCount > 2 ? ', '+c3 : ''})`
    : c1;
  return `/* Trail — particle base styles */
.trail-particle {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  width: ${S.size}px;
  height: ${S.size}px;
  margin-left: -${Math.round(S.size/2)}px;
  margin-top: -${Math.round(S.size/2)}px;
  mix-blend-mode: ${S.blend};
  background: ${grad};
  animation: trailFade ${(1/S.fade).toFixed(1)}s linear forwards;
}

@keyframes trailFade {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.2) translateY(${(S.gravity*20).toFixed(0)}px); }
}

/* Per-color overrides */
.trail-c1 { background: ${c1}; }
.trail-c2 { background: ${c2}; }
${S.colorCount > 2 ? `.trail-c3 { background: ${c3}; }` : ''}`;
}

function rawHTML() {
  return `<!-- Trail cursor effect — drop before </body> -->
<script>
(function() {
  const cfg = ${cfgObj('  ')};
${engineFn('  ')}

  initTrail(cfg);
})();
<\/script>`;
}

function rawReact() {
  return `// CursorTrail.jsx — React hook component
// Usage: import CursorTrail from './CursorTrail'; then <CursorTrail /> in your app root

import { useEffect } from 'react';

const config = ${cfgObj('')};

${engineFn('')}

export default function CursorTrail() {
  useEffect(() => {
    const cleanup = initTrail(config);
    return cleanup;
  }, []);

  return null;
}`;
}

function rawVue() {
  return `<!-- CursorTrail.vue — Vue 3 composable component -->
<!-- Usage: import CursorTrail from './CursorTrail.vue'; then <CursorTrail /> in App.vue -->

<template>
  <!-- renders nothing, effect is applied to document.body -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const config = ${cfgObj('')};

${engineFn('')}

let cleanup;
onMounted(() => { cleanup = initTrail(config); });
onUnmounted(() => { cleanup?.(); });
<\/script>`;
}

function rawAngular() {
  return `// cursor-trail.directive.ts — Angular directive
// Usage: Add CursorTrailDirective to your module/standalone imports
//        then place <div cursorTrail></div> in app.component.html

import { Directive, OnInit, OnDestroy } from '@angular/core';

const config = ${cfgObj('')};

${engineFn('')}

@Directive({ selector: '[cursorTrail]', standalone: true })
export class CursorTrailDirective implements OnInit, OnDestroy {
  private cleanup?: () => void;

  ngOnInit() {
    this.cleanup = initTrail(config);
  }

  ngOnDestroy() {
    this.cleanup?.();
  }
}`;
}

// ── SYNTAX HIGHLIGHT ─────────────────────────────────
function highlight(code, tab) {
  // escape HTML first
  let s = code
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // comments
  s = s.replace(/(\/\/[^\n]*)/g,'<span class="code-comment">$1</span>');
  // strings
  s = s.replace(/(`[^`]*`|'[^']*'|"[^"]*")/g,'<span class="code-str">$1</span>');
  // keywords
  s = s.replace(/\b(const|let|var|function|return|if|else|new|import|export|default|from|null|true|false|undefined|async|await|class|extends|implements|void|readonly|private|public|protected|of|for|break|continue|this|type|interface)\b/g,
    '<span class="code-keyword">$1</span>');
  // decorators
  s = s.replace(/(@\w+)/g,'<span class="code-prop">$1</span>');
  // numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g,'<span class="code-val">$1</span>');
  return s;
}

// ── COPY ─────────────────────────────────────────────
function copyCode() {
  const raw = getRawCode(codeTab);
  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    showToast('Copied to clipboard!');
    setTimeout(() => {
      btn.textContent = 'Copy code';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // fallback for browsers that block clipboard without interaction
    const ta = document.createElement('textarea');
    ta.value = raw;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Copied!');
  });
}

function exportAll() {
  const all = ['js','css','html','react','vue','angular']
    .map(t => `/* ══ ${t.toUpperCase()} ══ */\n\n${getRawCode(t)}`)
    .join('\n\n\n');
  const blob = new Blob([all], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'trail-cursor-effect.txt';
  a.click();
  showToast('Exported all!');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (msg) t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── EXPORT TO GLOBAL SCOPE ────────────────────────────
Object.assign(window, {
  setShape,
  activateSlot,
  updateColor,
  toggleColorSlot,
  setColorMode,
  setSetting,
  setBlend,
  toggleChase,
  setChaseMode,
  setCanvasBg,
  applyPreset,
  setCodeTab,
  copyCode,
  exportAll
});

// ── INIT ──────────────────────────────────────────────
initPalette();
updateColorBar();
updateCode();
 