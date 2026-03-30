import './style.css';

const state = {
  theme: 'dark',
  tab: 'js',
  config: {
    particles: 32,
    trailSize: 10,
    glow: 55,
    shape: 'circle',
    color: '#4cc9f0',
  },
};

const canvas = document.querySelector('#canvas');
const output = document.querySelector('#code-output');
const copyButton = document.querySelector('#copy-code');
const controls = {
  particles: document.querySelector('#particles'),
  trailSize: document.querySelector('#trail-size'),
  glow: document.querySelector('#glow'),
  shape: document.querySelector('#shape'),
  color: document.querySelector('#color'),
};

const themeButtons = [...document.querySelectorAll('.theme-btn')];
const tabButtons = [...document.querySelectorAll('.tab-btn')];

const codeBuilders = {
  js: ({ particles, trailSize, glow, shape, color }) => `const trailConfig = {
  particles: ${particles},
  trailSize: ${trailSize},
  glow: ${glow},
  shape: "${shape}",
  color: "${color}",
};

function initTrailDesigner(config) {
  // Replace with your runtime trail implementation.
  console.log("Trail config ready", config);
}

initTrailDesigner(trailConfig);`,
  css: ({ trailSize, glow, color }) => `.trail-dot {
  width: ${trailSize * 2}px;
  height: ${trailSize * 2}px;
  background: ${color};
  filter: blur(${Math.max(0, Math.floor(glow / 12))}px);
  border-radius: 50%;
  pointer-events: none;
}`,
  html: () => `<div class="trail-canvas" id="trail-canvas"></div>`,
};

function syncControlState() {
  state.config.particles = Number(controls.particles.value);
  state.config.trailSize = Number(controls.trailSize.value);
  state.config.glow = Number(controls.glow.value);
  state.config.shape = controls.shape.value;
  state.config.color = controls.color.value;
}

function renderCode() {
  output.textContent = codeBuilders[state.tab](state.config);
}

function setTheme(theme) {
  state.theme = theme;
  canvas.classList.remove('theme-light', 'theme-grid');
  if (theme === 'light') {
    canvas.classList.add('theme-light');
  }
  if (theme === 'grid') {
    canvas.classList.add('theme-grid');
  }

  themeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.theme === theme);
  });
}

function setTab(tab) {
  state.tab = tab;
  tabButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tab);
  });
  renderCode();
}

function copyCode() {
  navigator.clipboard.writeText(output.textContent).then(() => {
    const previous = copyButton.textContent;
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyButton.textContent = previous;
    }, 1200);
  });
}

function spawnDot(x, y) {
  const dot = document.createElement('span');
  dot.className = 'trail-dot';
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  dot.style.width = `${state.config.trailSize * 2}px`;
  dot.style.height = `${state.config.trailSize * 2}px`;
  dot.style.background = state.config.color;
  dot.style.opacity = '0.8';
  dot.style.filter = `blur(${Math.max(0, Math.floor(state.config.glow / 10))}px)`;
  if (state.config.shape === 'square') {
    dot.style.borderRadius = '5px';
  } else if (state.config.shape === 'spark') {
    dot.style.borderRadius = '50% 10%';
    dot.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 180}deg)`;
  }
  canvas.append(dot);

  window.setTimeout(() => {
    dot.style.transition = 'opacity 0.35s ease';
    dot.style.opacity = '0';
  }, 1);

  window.setTimeout(() => {
    dot.remove();
  }, 360);
}

function bindEvents() {
  themeButtons.forEach((button) => {
    button.addEventListener('click', () => setTheme(button.dataset.theme));
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tab));
  });

  Object.values(controls).forEach((control) => {
    control.addEventListener('input', () => {
      syncControlState();
      renderCode();
    });
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    spawnDot(event.clientX - rect.left, event.clientY - rect.top);
  });

  copyButton.addEventListener('click', copyCode);
}

syncControlState();
setTheme(state.theme);
setTab(state.tab);
bindEvents();
